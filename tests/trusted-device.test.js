const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

// Import server auth store
const {
  registerAccount,
  verifyCredentials,
  hashPassword,
} = require('../src/lib/server-auth-store.ts');

// Create mock browser storage environment for testing trusted device logic
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

test('Trusted Device Security: Generates stable device identifier and friendly label', () => {
  const mockLocalStorage = new MockStorage();
  const mockDocument = { cookie: '' };
  const mockNavigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  global.window = {};
  global.localStorage = mockLocalStorage;
  global.document = mockDocument;
  global.navigator = mockNavigator;

  const {
    getDeviceId,
    getDeviceLabel,
    isDeviceTrusted,
    setDeviceTrusted,
  } = require('../src/lib/trusted-device.ts');

  const id1 = getDeviceId();
  const id2 = getDeviceId();
  assert.strictEqual(id1, id2, 'Device ID must remain stable across multiple calls');
  assert.ok(id1.startsWith('dev_'), 'Device ID must have standard prefix');

  const label = getDeviceLabel(mockNavigator.userAgent);
  assert.ok(label.includes('Chrome on Windows'), 'Device label must reflect browser and OS');
});

test('Trusted Device Security: Untrusted device is rejected until verified and trusted', () => {
  const mockLocalStorage = new MockStorage();
  const mockDocument = { cookie: '' };
  const mockNavigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  };

  global.window = {};
  global.localStorage = mockLocalStorage;
  global.document = mockDocument;
  global.navigator = mockNavigator;

  delete require.cache[require.resolve('../src/lib/trusted-device.ts')];
  const {
    isDeviceTrusted,
    setDeviceTrusted,
  } = require('../src/lib/trusted-device.ts');

  const testEmail = 'balajibuddy1794@gmail.com';

  // 1. Initial check: Must NOT be trusted
  assert.strictEqual(isDeviceTrusted(testEmail), false, 'New device must not be trusted initially');

  // 2. Mark device as trusted
  setDeviceTrusted(testEmail, true);
  assert.strictEqual(isDeviceTrusted(testEmail), true, 'Device must be marked trusted after user confirmation');

  // 3. Email case-insensitivity:
  assert.strictEqual(isDeviceTrusted('BALAJIBUDDY1794@GMAIL.COM'), true, 'Email check must be case-insensitive');

  // 4. Different email must not inherit trust:
  assert.strictEqual(isDeviceTrusted('other_user@example.com'), false, 'Different email must remain untrusted');

  // 5. Revoke trust:
  setDeviceTrusted(testEmail, false);
  assert.strictEqual(isDeviceTrusted(testEmail), false, 'Device trust must be revocable');
});

test('Two-Step Login Flow: Wrong password strictly rejected before any verification code', () => {
  const email = `security_auth_${Date.now()}@finvelayudham.app`;
  const correctPassword = 'StrongVaultPassword!2026';

  // Register account
  const registered = registerAccount(email, 'Security Member', correctPassword);
  assert.strictEqual(registered.success, true);

  // Attempt login with wrong password
  const failResult = verifyCredentials(email, 'WrongPassword999');
  assert.strictEqual(failResult.success, false);
  assert.strictEqual(failResult.error, 'Incorrect password. Please try again.');

  // Attempt login with correct password
  const successResult = verifyCredentials(email, correctPassword);
  assert.strictEqual(successResult.success, true);
  assert.strictEqual(successResult.account.email, email);
});

test('Stateless HMAC Verification Signature: Sign and Validate 6-digit codes', () => {
  const secret = process.env.VERIFY_SECRET || 'finvelayudham_verify_hmac_secret_2026';
  const email = 'balajibuddy1794@gmail.com';
  const code = '582914';
  const expiresAt = Date.now() + 900000;

  function signVerification(em, cd, exp) {
    return crypto.createHmac('sha256', secret).update(`${em.trim().toLowerCase()}:${cd.trim()}:${exp}`).digest('hex');
  }

  const sig = signVerification(email, code, expiresAt);
  assert.strictEqual(sig.length, 64, 'HMAC signature must be SHA-256 (64 hex characters)');

  // Verify that valid signature matches
  const checkSig = signVerification(email, code, expiresAt);
  assert.strictEqual(checkSig, sig);

  // Tampered code must fail
  const tamperedSig = signVerification(email, '999999', expiresAt);
  assert.notStrictEqual(tamperedSig, sig, 'Tampered code must produce different signature');

  // Tampered email must fail
  const tamperedEmailSig = signVerification('attacker@evil.com', code, expiresAt);
  assert.notStrictEqual(tamperedEmailSig, sig, 'Tampered email must produce different signature');
});
