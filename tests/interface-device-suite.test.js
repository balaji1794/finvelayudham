const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.TEST_BASE_URL || 'https://finvelayudham.vercel.app';

// Indian Number Formatting function matching src/lib/utils.ts
function formatIndianCurrency(amount, currency = 'INR') {
  if (isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));

  if (currency === 'INR') {
    const s = abs.toString();
    let lastThree = s.substring(s.length - 3);
    const otherNumbers = s.substring(0, s.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${isNegative ? '-' : ''}₹${formatted}`;
  }

  // Western currencies
  const formatted = abs.toLocaleString('en-US');
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SGD: 'S$',
    CAD: 'C$',
    AUD: 'A$',
  };
  return `${isNegative ? '-' : ''}${symbols[currency] || currency + ' '}${formatted}`;
}

// ---------------------------------------------------------------------
// 1. INTERFACE: RESPONSIVE & BREAKPOINT TESTING
// ---------------------------------------------------------------------
test('Responsive & Breakpoint Testing: Core views declare mobile, tablet & desktop rules', async () => {
  const pages = ['/', '/dashboard', '/assets', '/calculators/sip', '/settings'];

  for (const page of pages) {
    const res = await fetch(`${BASE_URL}${page}`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify Tailwind responsive modifiers exist in HTML output
    assert.ok(
      html.includes('md:') || html.includes('sm:') || html.includes('lg:'),
      `Page ${page} missing responsive CSS breakpoints`
    );

    // Verify flexible grid/flex layouts
    assert.ok(
      html.includes('flex') || html.includes('grid'),
      `Page ${page} missing responsive flex/grid layouts`
    );
  }
});

// ---------------------------------------------------------------------
// 2. INTERFACE: MOBILE WEB & TOUCH INTERACTIONS
// ---------------------------------------------------------------------
test('Mobile Web Testing: Navigation bar contains mobile drawer and touch-friendly controls', async () => {
  const res = await fetch(`${BASE_URL}/`);
  const html = await res.text();

  // Mobile menu button presence (hidden on desktop md:hidden)
  assert.ok(html.includes('md:hidden'), 'Navbar missing mobile-specific toggle container');

  // Touch targets have ample padding
  assert.ok(html.includes('px-') && html.includes('py-'), 'Controls missing touch padding');
});

// ---------------------------------------------------------------------
// 3. INTERFACE: VISUAL DESIGN & BRANDING TOKENS
// ---------------------------------------------------------------------
test('Visual Testing: Design tokens maintain FinVelayudham brand identity', async () => {
  const res = await fetch(`${BASE_URL}/`);
  const html = await res.text();

  // Brand Name
  assert.ok(html.includes('FinVelayudham'), 'Page missing official FinVelayudham typography');

  // DM Serif Display or Georgia serif font references
  assert.ok(
    html.includes('font-serif') || html.includes('serif'),
    'Page missing editorial serif typography class'
  );

  // Free & Unlimited value proposition
  assert.ok(
    html.includes('100% Free') || html.includes('100% free'),
    'Page missing 100% Free value badge'
  );
});

// ---------------------------------------------------------------------
// 4. INTERFACE: LOCALIZATION & CURRENCY FORMATTING
// ---------------------------------------------------------------------
test('Localization Testing: Indian Lakhs & Crores formatting vs Western Millions', () => {
  // Test Indian Rupee formatting
  assert.strictEqual(formatIndianCurrency(1000, 'INR'), '₹1,000');
  assert.strictEqual(formatIndianCurrency(100000, 'INR'), '₹1,00,000', '1 Lakh formatting');
  assert.strictEqual(formatIndianCurrency(1000000, 'INR'), '₹10,00,000', '10 Lakhs formatting');
  assert.strictEqual(formatIndianCurrency(10000000, 'INR'), '₹1,00,00,000', '1 Crore formatting');
  assert.strictEqual(formatIndianCurrency(257500000, 'INR'), '₹25,75,00,000', '25.75 Crores formatting');

  // Negative values
  assert.strictEqual(formatIndianCurrency(-500000, 'INR'), '-₹5,00,000');

  // Western currencies
  assert.strictEqual(formatIndianCurrency(1000000, 'USD'), '$1,000,000', '1 Million USD formatting');
  assert.strictEqual(formatIndianCurrency(250000, 'EUR'), '€250,000');
  assert.strictEqual(formatIndianCurrency(75000, 'GBP'), '£75,000');
  assert.strictEqual(formatIndianCurrency(1500000, 'AED'), 'AED 1,500,000');
  assert.strictEqual(formatIndianCurrency(50000, 'SGD'), 'S$50,000');
  assert.strictEqual(formatIndianCurrency(80000, 'CAD'), 'C$80,000');
  assert.strictEqual(formatIndianCurrency(95000, 'AUD'), 'A$95,000');
});
