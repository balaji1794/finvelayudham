const test = require('node:test');
const assert = require('node:assert');
const { getAvailableBaseUrl } = require('./test-utils');

// Helper for HTTP requests
async function fetchApi(path, options = {}) {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) throw new Error('SERVER_OFFLINE');
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, body: json, text };
}

// ---------------------------------------------------------------------
// 1. FUNCTIONAL TESTING: SMOKE TESTING
// ---------------------------------------------------------------------
test('Smoke Testing: Critical routes respond with HTTP 200', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const criticalRoutes = [
    '/',
    '/dashboard',
    '/assets',
    '/liabilities',
    '/goals',
    '/snapshots',
    '/allocation',
    '/import',
    '/settings',
    '/login',
    '/demo',
    '/calculators',
    '/calculators/sip',
    '/calculators/emi',
  ];

  for (const route of criticalRoutes) {
    const res = await fetch(`${baseUrl}${route}`);
    assert.strictEqual(
      res.status,
      200,
      `Smoke test failed: ${route} returned status ${res.status}`
    );
    const html = await res.text();
    assert.ok(html.includes('FinVelayudham') || html.includes('<!DOCTYPE html>'), `${route} missing core HTML markup`);
  }
});

// ---------------------------------------------------------------------
// 2. FUNCTIONAL TESTING: SANITY TESTING (Data Persistence Across Logins)
// ---------------------------------------------------------------------
test('Sanity Testing: Deterministic User ID & Vault Isolation', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const testEmail = 'sanity_investor@finvelayudham.app';

  // Derive stable ID (re-derivation function test)
  let hash = 0;
  for (let i = 0; i < testEmail.length; i++) {
    hash = (hash << 5) - hash + testEmail.charCodeAt(i);
    hash |= 0;
  }
  const expectedId = `usr_${Math.abs(hash).toString(36)}_${testEmail.replace(/[^a-z0-9]/g, '_').slice(0, 24)}`;

  // Save vault via API
  const saveRes = await fetchApi('/api/portfolio', {
    method: 'POST',
    body: JSON.stringify({
      userId: expectedId,
      email: testEmail,
      payload: JSON.stringify({ v: 1, mockData: 'sanitized_portfolio_holdings' }),
    }),
  });
  assert.strictEqual(saveRes.status, 200);
  assert.strictEqual(saveRes.body.success, true);

  // Retrieve by UserId
  const getByIdRes = await fetchApi(`/api/portfolio?userId=${expectedId}`);
  assert.strictEqual(getByIdRes.status, 200);
  assert.strictEqual(getByIdRes.body.found, true);
  assert.strictEqual(getByIdRes.body.userId, expectedId);

  // Retrieve by Email (Cross-session sanity test)
  const getByEmailRes = await fetchApi(`/api/portfolio?email=${testEmail}`);
  assert.strictEqual(getByEmailRes.status, 200);
  assert.strictEqual(getByEmailRes.body.found, true);
  assert.strictEqual(getByEmailRes.body.email, testEmail);
});

// ---------------------------------------------------------------------
// 3. FUNCTIONAL TESTING: SYSTEM & ALL 10 APIS TESTING
// ---------------------------------------------------------------------
test('API Testing: All 10 API endpoints fulfill contract specifications', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }
  // 1. /api/dashboard
  const dashRes = await fetchApi('/api/dashboard');
  assert.strictEqual(dashRes.status, 200);
  assert.ok(typeof dashRes.body.netWorth === 'number');
  assert.strictEqual(dashRes.body.baseCurrency, 'INR');

  // 2. /api/assets
  const assetsRes = await fetchApi('/api/assets');
  assert.strictEqual(assetsRes.status, 200);
  assert.ok(Array.isArray(assetsRes.body.assets));

  const addAssetRes = await fetchApi('/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Kotak Bluechip Equity Fund',
      currentValue: 125000,
      category: 'EQUITY',
    }),
  });
  assert.strictEqual(addAssetRes.status, 200);
  assert.strictEqual(addAssetRes.body.success, true);
  assert.strictEqual(addAssetRes.body.asset.name, 'Kotak Bluechip Equity Fund');

  // 3. /api/liabilities
  const liabRes = await fetchApi('/api/liabilities');
  assert.strictEqual(liabRes.status, 200);
  assert.ok(Array.isArray(liabRes.body.liabilities));

  const addLiabRes = await fetchApi('/api/liabilities', {
    method: 'POST',
    body: JSON.stringify({
      name: 'SBI Housing Loan',
      outstandingAmount: 2400000,
      interestRate: 8.5,
    }),
  });
  assert.strictEqual(addLiabRes.status, 200);
  assert.strictEqual(addLiabRes.body.success, true);

  // 4. /api/snapshots
  const snapRes = await fetchApi('/api/snapshots');
  assert.strictEqual(snapRes.status, 200);
  assert.ok(Array.isArray(snapRes.body.snapshots));

  // 5. /api/cashflow
  const cashRes = await fetchApi('/api/cashflow');
  assert.strictEqual(cashRes.status, 200);

  // 6. /api/portfolio
  const portGet = await fetchApi('/api/portfolio?email=nonexistent@example.com');
  assert.strictEqual(portGet.status, 200);
  assert.strictEqual(portGet.body.found, false);

  // 7. /api/auth/verify (send-code)
  const verifySend = await fetchApi('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      action: 'send-code',
      email: 'unit_tester@finvelayudham.app',
      name: 'Unit Tester',
    }),
  });
  assert.strictEqual(verifySend.status, 200);
  assert.strictEqual(verifySend.body.success, true);
  assert.ok(verifySend.body.token, 'Must return signed verification token');

  // 8. /api/auth/verify (confirm-code with sandboxCode or token)
  if (verifySend.body.sandboxCode) {
    const verifyConfirm = await fetchApi('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        action: 'confirm-code',
        email: 'unit_tester@finvelayudham.app',
        code: verifySend.body.sandboxCode,
        verifyToken: verifySend.body.token,
      }),
    });
    assert.strictEqual(verifyConfirm.status, 200);
    assert.strictEqual(verifyConfirm.body.verified, true);
  }

  // 9. /api/auth/send-welcome
  const welcomeRes = await fetchApi('/api/auth/send-welcome', {
    method: 'POST',
    body: JSON.stringify({
      email: 'welcome_test@finvelayudham.app',
      name: 'Welcome Tester',
      type: 'welcome',
    }),
  });
  assert.strictEqual(welcomeRes.status, 200);
  assert.ok(welcomeRes.body.success === true || welcomeRes.body.simulated === true);

  // 10. /api/sync/check and /api/sync/history
  const syncHist = await fetchApi('/api/sync/history');
  assert.strictEqual(syncHist.status, 200);
  assert.ok(Array.isArray(syncHist.body.history));
  assert.ok(syncHist.body.history.length > 0);
});

// ---------------------------------------------------------------------
// 4. FUNCTIONAL TESTING: NEGATIVE TESTING (Input validation & Error handling)
// ---------------------------------------------------------------------
test('Negative Testing: API gracefully rejects malformed or invalid payloads', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }
  // Missing email in /api/auth/verify
  const badVerify = await fetchApi('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ action: 'send-code' }),
  });
  assert.strictEqual(badVerify.status, 400);
  assert.ok(badVerify.body.error);

  // Invalid verification code in /api/auth/verify
  const wrongCode = await fetchApi('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      action: 'confirm-code',
      email: 'test@example.com',
      code: '000000',
    }),
  });
  assert.strictEqual(wrongCode.status, 400);
  assert.ok(wrongCode.body.error);

  // Missing asset fields in /api/assets
  const badAsset = await fetchApi('/api/assets', {
    method: 'POST',
    body: JSON.stringify({ invalidField: 123 }),
  });
  assert.strictEqual(badAsset.status, 400);

  // Missing liability fields in /api/liabilities
  const badLiab = await fetchApi('/api/liabilities', {
    method: 'POST',
    body: JSON.stringify({ note: 'incomplete' }),
  });
  assert.strictEqual(badLiab.status, 400);

  // Missing identifier in /api/portfolio GET
  const badPortGet = await fetchApi('/api/portfolio');
  assert.strictEqual(badPortGet.status, 400);

  // Missing payload in /api/portfolio POST
  const badPortPost = await fetchApi('/api/portfolio', {
    method: 'POST',
    body: JSON.stringify({ userId: 'usr_123' }),
  });
  assert.strictEqual(badPortPost.status, 400);

  // Missing identifier in /api/portfolio DELETE
  const badPortDel = await fetchApi('/api/portfolio', {
    method: 'DELETE',
  });
  assert.strictEqual(badPortDel.status, 400);
});

// ---------------------------------------------------------------------
// 5. FUNCTIONAL TESTING: INTEGRATION & E2E JOURNEY
// ---------------------------------------------------------------------
test('End-to-End User Journey: Registration -> Save Portfolio -> Retrieve -> Delete', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }
  const journeyEmail = `journey_${Date.now()}@finvelayudham.app`;
  const journeyUserId = `usr_journey_${Date.now()}`;

  // Step 1: Request verification code
  const step1 = await fetchApi('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      action: 'send-code',
      email: journeyEmail,
      name: 'Journey User',
    }),
  });
  assert.strictEqual(step1.status, 200);

  // Step 2: Save encrypted portfolio vault
  const mockEncryptedPayload = JSON.stringify({
    v: 1,
    alg: 'AES-GCM-256',
    data: 'ciphertext_base64_stream_data_test',
  });

  const step2 = await fetchApi('/api/portfolio', {
    method: 'POST',
    body: JSON.stringify({
      userId: journeyUserId,
      email: journeyEmail,
      payload: mockEncryptedPayload,
      updatedAt: new Date().toISOString(),
    }),
  });
  assert.strictEqual(step2.status, 200);

  // Step 3: Re-fetch user portfolio by deterministic email
  const step3 = await fetchApi(`/api/portfolio?email=${journeyEmail}`);
  assert.strictEqual(step3.status, 200);
  assert.strictEqual(step3.body.found, true);
  assert.strictEqual(step3.body.payload, mockEncryptedPayload);

  // Step 4: GDPR deletion / account erasure
  const step4 = await fetchApi(`/api/portfolio?userId=${journeyUserId}&email=${journeyEmail}`, {
    method: 'DELETE',
  });
  assert.strictEqual(step4.status, 200);
  assert.strictEqual(step4.body.success, true);

  // Step 5: Verify portfolio is purged
  const step5 = await fetchApi(`/api/portfolio?email=${journeyEmail}`);
  assert.strictEqual(step5.status, 200);
  assert.strictEqual(step5.body.found, false);
});
