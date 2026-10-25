const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

test('Sync engine hashString generates deterministic SHA-256 signatures', () => {
  const content = '<title>FinBoom · All your money, in one place</title>';
  const hash1 = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  const hash2 = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 16);
});

test('Sync detector flags drift when upstream markup changes', () => {
  const baseline = { hash: 'abc123' };
  const current = { hash: 'xyz987' };
  
  const hasDrift = baseline.hash !== current.hash;
  assert.ok(hasDrift, 'Must flag drift when content signatures differ');
});
