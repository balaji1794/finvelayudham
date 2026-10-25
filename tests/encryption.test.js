const test = require('node:test');
const assert = require('node:assert');

const crypto = globalThis.crypto;

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToBuffer(base64) {
  const binary = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(secret, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

test('AES-GCM 256-bit encryption and decryption of financial portfolio data', async () => {
  const samplePortfolio = {
    userId: 'usr_test_123',
    email: 'sharma@example.com',
    netWorth: 5000000,
    assets: [
      { id: '1', name: 'HDFC Bank FD', currentValue: 2000000 },
      { id: '2', name: 'Nifty 50 Index', currentValue: 3000000 },
    ],
  };

  const userSecret = 'my_super_secure_vault_password_987';

  // 1. Encrypt
  const enc = new TextEncoder();
  const rawBytes = enc.encode(JSON.stringify(samplePortfolio));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(userSecret, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, rawBytes);

  const payload = {
    alg: 'AES-GCM-256',
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(ciphertextBuffer),
  };

  const encryptedString = JSON.stringify(payload);

  // Assert ciphertext does NOT contain plain text asset names or numbers
  assert.strictEqual(encryptedString.includes('HDFC Bank FD'), false, 'Plaintext name leaked into ciphertext!');
  assert.strictEqual(encryptedString.includes('5000000'), false, 'Net worth leaked into ciphertext!');

  // 2. Decrypt with correct secret
  const parsed = JSON.parse(encryptedString);
  const decKey = await deriveKey(userSecret, new Uint8Array(base64ToBuffer(parsed.salt)));
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(parsed.iv)) },
    decKey,
    base64ToBuffer(parsed.data)
  );

  const decrypted = JSON.parse(new TextDecoder().decode(decryptedBuf));

  // Assert exact recovery
  assert.strictEqual(decrypted.userId, samplePortfolio.userId);
  assert.strictEqual(decrypted.netWorth, 5000000);
  assert.strictEqual(decrypted.assets[0].name, 'HDFC Bank FD');
  assert.strictEqual(decrypted.assets.length, 2);
});

test('Decryption with incorrect secret key fails cleanly without exposing data', async () => {
  const enc = new TextEncoder();
  const rawBytes = enc.encode(JSON.stringify({ secretAsset: 'Private Vault Gold' }));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const correctKey = await deriveKey('correct_password', salt);
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, correctKey, rawBytes);

  // Attempt decryption with wrong key
  const wrongKey = await deriveKey('wrong_password_attacker', salt);

  await assert.rejects(
    async () => {
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrongKey, ciphertextBuffer);
    },
    /operation failed|tag mismatch|OperationError/i
  );
});
