export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateToInr: number; // 1 unit in INR
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToInr: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToInr: 84.5 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToInr: 91.2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToInr: 109.8 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToInr: 63.8 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToInr: 23.0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToInr: 55.4 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToInr: 61.2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToInr: 0.55 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToInr: 96.5 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', rateToInr: 2.45 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rateToInr: 19.3 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rateToInr: 50.8 },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', rateToInr: 22.5 },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', rateToInr: 23.2 },
  KWD: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', rateToInr: 275.0 },
  BHD: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', rateToInr: 224.5 },
  OMR: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', rateToInr: 219.5 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rateToInr: 10.8 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rateToInr: 0.061 }
};

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = SUPPORTED_CURRENCIES[fromCurrency]?.rateToInr || 1;
  const toRate = SUPPORTED_CURRENCIES[toCurrency]?.rateToInr || 1;
  const amountInInr = amount * fromRate;
  return amountInInr / toRate;
}

export function formatCurrency(amount: number, currencyCode: string = 'INR', compact: boolean = false): string {
  const info = SUPPORTED_CURRENCIES[currencyCode] || { symbol: currencyCode + ' ', rateToInr: 1 };
  
  if (currencyCode === 'INR') {
    if (compact) {
      const abs = Math.abs(amount);
      if (abs >= 10000000) {
        return `${info.symbol}${(amount / 10000000).toFixed(2)} Cr`;
      }
      if (abs >= 100000) {
        return `${info.symbol}${(amount / 100000).toFixed(2)} L`;
      }
      if (abs >= 1000) {
        return `${info.symbol}${(amount / 1000).toFixed(1)}k`;
      }
    }
    return `${info.symbol}${Math.round(amount).toLocaleString('en-IN')}`;
  }

  // International formatting
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1e9) return `${info.symbol}${(amount / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${info.symbol}${(amount / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${info.symbol}${(amount / 1e3).toFixed(1)}K`;
  }
  
  return `${info.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
