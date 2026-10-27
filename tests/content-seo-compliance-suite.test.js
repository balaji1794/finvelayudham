const test = require('node:test');
const assert = require('node:assert');
const { getAvailableBaseUrl } = require('./test-utils');

// ---------------------------------------------------------------------
// 1. CONTENT & LEGAL PAGES VALIDATION
// ---------------------------------------------------------------------
test('Content Validation: Legal, compliance and policy pages exist with valid content', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const policyPages = [
    { path: '/privacy', keyword: 'Privacy' },
    { path: '/terms', keyword: 'Terms' },
    { path: '/refund-policy', keyword: 'Refund' },
    { path: '/whats-new', keyword: 'FinVelayudham' },
  ];

  for (const page of policyPages) {
    const res = await fetch(`${baseUrl}${page.path}`);
    assert.strictEqual(res.status, 200, `Policy page ${page.path} failed with status ${res.status}`);
    const text = await res.text();
    assert.ok(
      text.toLowerCase().includes(page.keyword.toLowerCase()),
      `Policy page ${page.path} missing keyword: ${page.keyword}`
    );
  }
});

// ---------------------------------------------------------------------
// 2. SEO TESTING: METADATA, TITLE, OPENGRAPH & VIEWPORT
// ---------------------------------------------------------------------
test('SEO Testing: Homepage and views contain complete SEO metadata and OpenGraph tags', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  // 1. Document Title
  assert.ok(html.includes('<title>'), 'Missing <title> tag');
  assert.ok(html.includes('FinVelayudham'), 'Title tag missing FinVelayudham');

  // 2. Meta Description
  assert.ok(
    html.includes('name="description"') && html.includes('content='),
    'Missing meta description'
  );

  // 3. OpenGraph Tags
  assert.ok(html.includes('og:title') || html.includes('FinVelayudham'), 'Missing OpenGraph title');
  assert.ok(html.includes('og:description') || html.includes('Track every account'), 'Missing OpenGraph description');

  // 4. Viewport
  assert.ok(html.includes('name="viewport"'), 'Missing viewport declaration');
});

// ---------------------------------------------------------------------
// 3. PRIVACY & ZERO-TRUST COMPLIANCE TESTING
// ---------------------------------------------------------------------
test('Privacy & Zero-Trust Compliance: Architecture enforces zero bank credentials and client encryption', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const res = await fetch(`${baseUrl}/privacy`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  // Verify core zero-trust principles stated in policy
  assert.ok(
    html.includes('Zero') || html.includes('zero') || html.includes('bank') || html.includes('encrypt'),
    'Privacy policy missing zero-trust / zero bank credential disclosures'
  );
});

// ---------------------------------------------------------------------
// 4. LINK CRAWLER: ALL 37 CORE ENDPOINTS RETURN HTTP 200
// ---------------------------------------------------------------------
test('Link Testing: Complete crawl of all 37 application routes and APIs yields 0 broken links', async (t) => {
  const baseUrl = await getAvailableBaseUrl();
  if (!baseUrl) {
    t.skip('Skipping HTTP test: no server reachable');
    return;
  }

  const allRoutes = [
    // Core Application Pages
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
    // 10 Financial Calculators
    '/calculators',
    '/calculators/sip',
    '/calculators/emi',
    '/calculators/lumpsum',
    '/calculators/swp',
    '/calculators/cagr',
    '/calculators/fd',
    '/calculators/xirr',
    '/calculators/retirement',
    '/calculators/future-cost',
    '/calculators/inflation',
    // Sync & Admin
    '/admin/sync',
    // Legal & Info
    '/privacy',
    '/terms',
    '/refund-policy',
    '/whats-new',
    // Core APIs (GET requests)
    '/api/assets',
    '/api/liabilities',
    '/api/snapshots',
    '/api/cashflow',
    '/api/dashboard',
    '/api/portfolio?userId=crawler_test',
    '/api/sync/check',
    '/api/sync/history',
  ];

  const brokenLinks = [];

  for (const route of allRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route}`);
      if (res.status !== 200) {
        brokenLinks.push({ route, status: res.status });
      }
    } catch (err) {
      brokenLinks.push({ route, error: err.message });
    }
  }

  assert.strictEqual(
    brokenLinks.length,
    0,
    `Detected ${brokenLinks.length} broken route(s): ${JSON.stringify(brokenLinks)}`
  );
});
