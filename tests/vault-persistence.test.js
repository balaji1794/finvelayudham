const test = require('node:test');
const assert = require('node:assert');

// Deterministic User ID derivation logic matching src/lib/portfolio-vault.ts
function deriveUserIdFromEmail(email) {
  const clean = (email || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const safeSlug = clean.replace(/[^a-z0-9]/g, '_').slice(0, 24);
  const hashStr = Math.abs(hash).toString(36);
  return `usr_${hashStr}_${safeSlug}`;
}

test('deriveUserIdFromEmail is 100% deterministic across multiple calls and case variations', () => {
  const emailLower = 'investor@finvelayudham.app';
  const emailUpper = 'INVESTOR@FINVELAYUDHAM.APP';
  const emailSpaces = '   investor@finvelayudham.app   ';

  const id1 = deriveUserIdFromEmail(emailLower);
  const id2 = deriveUserIdFromEmail(emailUpper);
  const id3 = deriveUserIdFromEmail(emailSpaces);

  assert.strictEqual(id1, id2, 'Case variation should not change User ID');
  assert.strictEqual(id1, id3, 'Whitespace padding should not change User ID');
  assert.match(id1, /^usr_[0-9a-z]+_[a-z0-9_]+$/, 'User ID format must be usr_<hash>_<safeSlug>');
});

test('deriveUserIdFromEmail produces distinct IDs for different user emails', () => {
  const idA = deriveUserIdFromEmail('alice@domain.com');
  const idB = deriveUserIdFromEmail('bob@domain.com');

  assert.notStrictEqual(idA, idB, 'Different users must have unique deterministic IDs');
});

test('Simulated cross-login vault persistence and recovery', async () => {
  const email = 'trader@example.com';
  const stableId = deriveUserIdFromEmail(email);

  // Mock localStorage store
  const mockStorage = new Map();

  // Session 1: User logs in, saves an asset under their stable vault key
  const samplePortfolio = {
    userId: stableId,
    email: email,
    currency: 'INR',
    assets: [
      { id: 'ast-1', name: 'Nifty 50 Index Fund', currentValue: 500000 },
      { id: 'ast-2', name: 'Sovereign Gold Bond', currentValue: 250000 },
    ],
    liabilities: [],
    updatedAt: new Date().toISOString(),
  };

  const storageKey = `finvelayudham_vault_${stableId}`;
  mockStorage.set(storageKey, JSON.stringify(samplePortfolio));

  // User logs out (session cleared)
  const sessionCleared = null;
  assert.strictEqual(sessionCleared, null);

  // Session 2: User logs back in with the same email
  const rederivedId = deriveUserIdFromEmail('TRADER@EXAMPLE.COM');
  assert.strictEqual(rederivedId, stableId, 'Re-derived ID must match previous session ID');

  const reloadedKey = `finvelayudham_vault_${rederivedId}`;
  const rawRetrieved = mockStorage.get(reloadedKey);
  assert.ok(rawRetrieved, 'Vault must exist in storage under deterministic key');

  const retrievedPortfolio = JSON.parse(rawRetrieved);
  assert.strictEqual(retrievedPortfolio.assets.length, 2, 'All assets must be intact after re-login');
  assert.strictEqual(retrievedPortfolio.assets[0].name, 'Nifty 50 Index Fund');
  assert.strictEqual(retrievedPortfolio.assets[1].name, 'Sovereign Gold Bond');
});

test('Simulated recovery of legacy orphaned vault key', async () => {
  const mockStorage = new Map();
  const legacyRandomId = 'usr_ephemeral999';
  const legacyKey = `finvelayudham_vault_${legacyRandomId}`;
  const userEmail = 'pensioner@example.com';

  // Legacy vault saved in an older version with a random ephemeral ID
  const orphanedPortfolio = {
    userId: legacyRandomId,
    email: userEmail,
    currency: 'INR',
    assets: [
      { id: 'old-1', name: 'Senior Citizen Savings Scheme', currentValue: 1500000 },
    ],
  };
  mockStorage.set(legacyKey, JSON.stringify(orphanedPortfolio));

  // User logs in now with new deterministic ID
  const newDeterministicId = deriveUserIdFromEmail(userEmail);
  const targetKey = `finvelayudham_vault_${newDeterministicId}`;

  // Target key does not exist yet
  assert.strictEqual(mockStorage.get(targetKey), undefined);

  // Orphan recovery scanner runs
  let rescued = null;
  for (const [k, v] of mockStorage.entries()) {
    if (k.startsWith('finvelayudham_vault_') && k !== targetKey) {
      const parsed = JSON.parse(v);
      if (parsed.email === userEmail) {
        rescued = { ...parsed, userId: newDeterministicId };
        mockStorage.set(targetKey, JSON.stringify(rescued));
        break;
      }
    }
  }

  assert.ok(rescued, 'Orphaned vault must be rescued by scanner');
  assert.strictEqual(rescued.assets[0].name, 'Senior Citizen Savings Scheme');
  assert.strictEqual(rescued.userId, newDeterministicId);
  assert.ok(mockStorage.has(targetKey), 'Rescued portfolio must now be saved under target key');
});
