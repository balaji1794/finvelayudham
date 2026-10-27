const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

// Server-side auth store methods to test
const {
  registerAccount,
  verifyCredentials,
  hashPassword,
} = require('../src/lib/server-auth-store.ts');

test('Password hashing produces consistent SHA-256 signatures with email salt', () => {
  const email = 'security_trader@finvelayudham.app';
  const password = 'SuperSecretPassword#2026';

  const hash1 = hashPassword(password, email);
  const hash2 = hashPassword(password, email);
  const wrongHash = hashPassword('WrongPassword123', email);

  assert.strictEqual(hash1, hash2, 'Identical passwords must produce identical hashes');
  assert.notStrictEqual(hash1, wrongHash, 'Different passwords must produce distinct hashes');
  assert.strictEqual(hash1.length, 64, 'SHA-256 hex string must be 64 characters');
});

test('Account registration succeeds with valid email, name, and 8+ char password', () => {
  const email = `user_${Date.now()}@finvelayudham.app`;
  const password = 'StrongPassword987!';

  const regResult = registerAccount(email, 'Test User', password);
  assert.strictEqual(regResult.success, true);
  assert.ok(regResult.account);
  assert.strictEqual(regResult.account.email, email);
  assert.strictEqual(regResult.account.name, 'Test User');
  assert.strictEqual(regResult.account.passwordHash, hashPassword(password, email));
});

test('Account registration rejects password shorter than 8 characters', () => {
  const email = `short_${Date.now()}@finvelayudham.app`;
  const result = registerAccount(email, 'Short Pass', '12345');
  assert.strictEqual(result.success, false);
  assert.match(result.error, /at least 8 characters/i);
});

test('Account registration rejects duplicate email', () => {
  const email = `duplicate_${Date.now()}@finvelayudham.app`;
  const first = registerAccount(email, 'First Account', 'StrongPassword123');
  assert.strictEqual(first.success, true);

  const duplicate = registerAccount(email, 'Second Account', 'StrongPassword123');
  assert.strictEqual(duplicate.success, false);
  assert.match(duplicate.error, /already exists/i);
});

test('CRITICAL SECURITY: Login strictly REJECTS wrong password and ACCEPTS correct password', () => {
  const email = `vault_keeper_${Date.now()}@finvelayudham.app`;
  const correctPassword = 'MySecretVaultPassword#456';

  // 1. Register the account
  const registered = registerAccount(email, 'Vault Keeper', correctPassword);
  assert.strictEqual(registered.success, true);

  // 2. Attempt login with WRONG password
  const wrongAttempt = verifyCredentials(email, 'IncorrectPassword999');
  assert.strictEqual(wrongAttempt.success, false, 'WRONG PASSWORD MUST NOT LOG IN!');
  assert.strictEqual(wrongAttempt.error, 'Incorrect password. Please try again.');
  assert.strictEqual(wrongAttempt.account, undefined);

  // 3. Attempt login with empty password
  const emptyAttempt = verifyCredentials(email, '');
  assert.strictEqual(emptyAttempt.success, false);

  // 4. Attempt login with ANOTHER wrong password
  const anotherWrong = verifyCredentials(email, 'mysecretvaultpassword#456'); // Case mismatch
  assert.strictEqual(anotherWrong.success, false, 'Password must be case-sensitive');

  // 5. Attempt login with CORRECT password
  const correctAttempt = verifyCredentials(email, correctPassword);
  assert.strictEqual(correctAttempt.success, true, 'Correct password must succeed');
  assert.ok(correctAttempt.account);
  assert.strictEqual(correctAttempt.account.email, email);
});

test('Login rejects non-existent email', () => {
  const result = verifyCredentials('doesnotexist999@example.com', 'AnyPassword123');
  assert.strictEqual(result.success, false);
  assert.match(result.error, /No account found/i);
});
