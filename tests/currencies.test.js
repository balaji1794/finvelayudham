const test = require('node:test');
const assert = require('node:assert/strict');

test('Currency conversion handles INR base rate properly', () => {
  const usdRate = 84.5;
  const inrAmount = 84500;
  const inUsd = inrAmount / usdRate;
  
  assert.equal(inUsd, 1000);
});

test('Indian Rupee formatting with Lakhs and Crores', () => {
  function formatINR(val, compact = false) {
    if (compact) {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }

  assert.equal(formatINR(6500000, true), '₹65.00 L');
  assert.equal(formatINR(25000000, true), '₹2.50 Cr');
  assert.equal(formatINR(50000), '₹50,000');
});
