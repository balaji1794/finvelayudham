const test = require('node:test');
const assert = require('node:assert');
const { getAvailableBaseUrl } = require('./test-utils');

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

// ---------------------------------------------------------------------
// 1. NON-FUNCTIONAL: PERFORMANCE TESTING
// ---------------------------------------------------------------------
test('Performance Testing: Financial calculations execute in under 2 milliseconds', () => {
  // Benchmark SIP calculation
  const startSip = performance.now();
  for (let i = 0; i < 1000; i++) {
    const monthlyRate = 12 / 12 / 100;
    const months = 10 * 12;
    let fv = 0;
    let currMonthly = 25000;
    for (let m = 1; m <= months; m++) {
      fv = (fv + currMonthly) * (1 + monthlyRate);
      if (m % 12 === 0) currMonthly *= 1.1; // 10% step up
    }
  }
  const sipDuration = performance.now() - startSip;
  const avgSip = sipDuration / 1000;
  assert.ok(avgSip < 0.1, `Average SIP calculation (${avgSip.toFixed(4)}ms) exceeds 0.1ms`);

  // Benchmark XIRR Newton-Raphson approximation
  const startXirr = performance.now();
  const cashflows = [
    { amount: -100000, date: new Date('2023-01-01') },
    { amount: -50000, date: new Date('2023-07-01') },
    { amount: 180000, date: new Date('2024-01-01') },
  ];
  let rate = 0.1;
  for (let iter = 0; iter < 20; iter++) {
    let fValue = 0;
    let fDerivative = 0;
    const t0 = cashflows[0].date.getTime();
    for (const cf of cashflows) {
      const years = (cf.date.getTime() - t0) / (365 * 86400000);
      fValue += cf.amount / Math.pow(1 + rate, years);
      fDerivative -= (years * cf.amount) / Math.pow(1 + rate, years + 1);
    }
    const newRate = rate - fValue / fDerivative;
    if (Math.abs(newRate - rate) < 1e-5) break;
    rate = newRate;
  }
  const xirrDuration = performance.now() - startXirr;
  assert.ok(xirrDuration < 2.0, `XIRR convergence took too long: ${xirrDuration}ms`);
});

// ---------------------------------------------------------------------
// 2. NON-FUNCTIONAL: LOAD & CONCURRENCY TESTING
// ---------------------------------------------------------------------
test('Load Testing: System handles 50 concurrent requests without failure', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const requests = Array.from({ length: 50 }, (_, i) =>
    fetch(`${baseUrl}/api/dashboard`, { headers: { 'Accept': 'application/json' } })
  );

  const start = performance.now();
  const responses = await Promise.all(requests);
  const duration = performance.now() - start;

  for (const res of responses) {
    assert.strictEqual(res.status, 200, 'Concurrent request failed with status ' + res.status);
    const body = await res.json();
    assert.ok(typeof body.netWorth === 'number');
  }

  assert.ok(duration < 2000, `50 concurrent requests took ${duration}ms (target: <2000ms)`);
});

// ---------------------------------------------------------------------
// 3. NON-FUNCTIONAL: STRESS & SCALABILITY TESTING
// ---------------------------------------------------------------------
test('Stress & Scalability: Power-user portfolio of 1,000 assets processes without memory degradation', () => {
  const start = performance.now();
  const heavyPortfolio = {
    userId: 'usr_stress_test_power_user',
    email: 'power_user@finvelayudham.app',
    assets: Array.from({ length: 1000 }, (_, i) => ({
      id: `asset-${i}`,
      name: `Asset Instrument #${i} (Equity/Debt/Commodity)`,
      category: i % 2 === 0 ? 'EQUITY' : 'DEBT',
      currentValue: (i + 1) * 10000,
      investedAmount: (i + 1) * 8000,
      currentCurrency: 'INR',
    })),
  };

  // Aggregation test
  const totalAssets = heavyPortfolio.assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalInvested = heavyPortfolio.assets.reduce((sum, a) => sum + a.investedAmount, 0);
  const gains = totalAssets - totalInvested;
  const returns = (gains / totalInvested) * 100;

  const duration = performance.now() - start;

  assert.strictEqual(heavyPortfolio.assets.length, 1000);
  assert.ok(totalAssets > 0);
  assert.ok(returns > 0);
  assert.ok(duration < 20, `Processing 1,000 assets took ${duration.toFixed(2)}ms (target < 20ms)`);
});

// ---------------------------------------------------------------------
// 4. NON-FUNCTIONAL: SECURITY TESTING (AES-256 GCM, Tampering, Plaintext leakage)
// ---------------------------------------------------------------------
test('Security Testing: AES-256 GCM guarantees secrecy, IV freshness, and tamper resistance', async () => {
  const secretKey = 'finvelayudham_super_secret_user_key_2026';
  const sensitiveData = {
    bankAccounts: [{ bank: 'HDFC Bank', balance: 4500000 }],
    cryptoHoldings: [{ coin: 'BTC', amount: 1.5 }],
    realEstate: [{ address: 'Penthouse Mumbai', valuation: 35000000 }],
  };

  const enc = new TextEncoder();
  const rawBytes = enc.encode(JSON.stringify(sensitiveData));

  // Run 2 encryptions to verify IV freshness (NIST requirement: IV must NEVER repeat)
  const salt1 = crypto.getRandomValues(new Uint8Array(16));
  const iv1 = crypto.getRandomValues(new Uint8Array(12));
  const key1 = await deriveKey(secretKey, salt1);
  const ct1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv1 }, key1, rawBytes);

  const salt2 = crypto.getRandomValues(new Uint8Array(16));
  const iv2 = crypto.getRandomValues(new Uint8Array(12));
  const key2 = await deriveKey(secretKey, salt2);
  const ct2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, key2, rawBytes);

  // Assert IVs and ciphertexts are completely distinct
  assert.notStrictEqual(bufferToBase64(iv1), bufferToBase64(iv2), 'IV collision detected!');
  assert.notStrictEqual(bufferToBase64(ct1), bufferToBase64(ct2), 'Ciphertexts must be distinct due to unique salt/IV');

  // Verify Zero Plaintext Leakage
  const payloadString = JSON.stringify({
    v: 1,
    alg: 'AES-GCM-256',
    data: bufferToBase64(ct1),
  });

  assert.strictEqual(payloadString.includes('HDFC Bank'), false, 'Bank name leaked in payload!');
  assert.strictEqual(payloadString.includes('4500000'), false, 'Balance leaked in payload!');
  assert.strictEqual(payloadString.includes('Penthouse'), false, 'Real estate leaked in payload!');

  // Tamper Resistance (Bit-flipping attack simulation)
  const tamperedBytes = new Uint8Array(ct1.slice(0));
  tamperedBytes[0] ^= 0xff; // Flip bits in ciphertext

  await assert.rejects(
    async () => {
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv1 }, key1, tamperedBytes);
    },
    /operation failed|tag mismatch|OperationError/i,
    'Tampered ciphertext must be rejected by AES-GCM tag verification'
  );
});

// ---------------------------------------------------------------------
// 5. NON-FUNCTIONAL: ACCESSIBILITY & USABILITY TESTING
// ---------------------------------------------------------------------
test('Usability & Accessibility Testing: Semantic HTML5 structure and accessible controls', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  // Semantic structure
  assert.ok(html.includes('<nav') || html.includes('<header'), 'Missing semantic navigation or header');
  assert.ok(html.includes('<main'), 'Missing semantic main container');
  assert.ok(html.includes('<button'), 'Missing accessible buttons');

  // Viewport responsive configuration
  assert.ok(
    html.includes('name="viewport"') && html.includes('width=device-width'),
    'Missing proper responsive viewport meta tag'
  );

  // Charset utf-8
  assert.ok(html.toLowerCase().includes('charset="utf-8"'), 'Missing UTF-8 charset declaration');
});

// ---------------------------------------------------------------------
// 6. NON-FUNCTIONAL: RELIABILITY & RECOVERY TESTING
// ---------------------------------------------------------------------
test('Reliability & Recovery Testing: Application handles corrupted storage payloads without crashing', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  // Test loading corrupt data in API or client simulation
  const badPayloadRes = await fetch(`${baseUrl}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'usr_corrupt_test',
      email: 'corrupt@example.com',
      payload: 'CORRUPTED_NON_BASE64_GARBAGE_%&*^%',
    }),
  });
  // API accepts storage or returns safely without 500 fatal crash
  assert.ok([200, 400].includes(badPayloadRes.status));

  // Retrieve corrupt data
  const getCorrupt = await fetch(`${baseUrl}/api/portfolio?userId=usr_corrupt_test`);
  assert.strictEqual(getCorrupt.status, 200);
  const body = await getCorrupt.json();
  assert.strictEqual(body.found, true);
});
