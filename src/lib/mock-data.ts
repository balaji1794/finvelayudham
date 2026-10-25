// Mock & Demo Portfolio Data for FinVelayudham

export interface Asset {
  id: string;
  name: string;
  productType: string;
  category: 'EQUITY' | 'DEBT' | 'COMMODITY' | 'REAL_ESTATE' | 'CASH' | 'CRYPTO';
  subClass: string | null;
  currentValue: number;
  currentCurrency: string;
  investedAmount: number;
  geographyTag: 'DOMESTIC' | 'INTERNATIONAL';
  ticker?: string;
}

export interface Liability {
  id: string;
  name: string;
  liabilityType: 'HOME_LOAN' | 'AUTO_LOAN' | 'PERSONAL_LOAN' | 'CREDIT_CARD';
  outstandingAmount: number;
  currency: string;
  interestRate: number;
  monthlyEmi: number;
  lender: string;
}

export interface Snapshot {
  id: string;
  takenAt: string;
  label: string | null;
  totalAssetsBase: number;
  totalLiabilitiesBase: number;
  netWorthBase: number;
  baseCurrency: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  amountBase: number;
  date: string;
  isRecurring: boolean;
  description: string;
}

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'a-nifty',
    name: 'UTI Nifty 50 Index Fund',
    productType: 'MUTUAL_FUND',
    category: 'EQUITY',
    subClass: 'Large Cap Index',
    currentValue: 862000,
    currentCurrency: 'INR',
    investedAmount: 610000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-ppfc',
    name: 'Parag Parikh Flexi Cap Fund',
    productType: 'EQUITY_MUTUAL_FUND',
    category: 'EQUITY',
    subClass: 'Flexi Cap',
    currentValue: 634000,
    currentCurrency: 'INR',
    investedAmount: 500000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-hdfc',
    name: 'HDFC Bank (250 shares)',
    productType: 'DIRECT_STOCK',
    category: 'EQUITY',
    subClass: 'Banking',
    currentValue: 242000,
    currentCurrency: 'INR',
    investedAmount: 181000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-nasdaq',
    name: 'Motilal Oswal Nasdaq 100 FoF',
    productType: 'EQUITY_MUTUAL_FUND',
    category: 'EQUITY',
    subClass: 'US Tech',
    currentValue: 420000,
    currentCurrency: 'INR',
    investedAmount: 310000,
    geographyTag: 'INTERNATIONAL',
  },
  {
    id: 'a-vested',
    name: 'US Stocks (Vested Portfolio)',
    productType: 'DIRECT_STOCK',
    category: 'EQUITY',
    subClass: 'Global Equities',
    currentValue: 265000,
    currentCurrency: 'INR',
    investedAmount: 210000,
    geographyTag: 'INTERNATIONAL',
  },
  {
    id: 'a-epf',
    name: 'EPF / VPF (Employees Provident Fund)',
    productType: 'EPF_VPF',
    category: 'DEBT',
    subClass: 'Retirement Debt',
    currentValue: 781000,
    currentCurrency: 'INR',
    investedAmount: 781000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-ppf',
    name: 'PPF (SBI Account)',
    productType: 'PPF',
    category: 'DEBT',
    subClass: 'Tax Free Govt Debt',
    currentValue: 523000,
    currentCurrency: 'INR',
    investedAmount: 523000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-sgb',
    name: 'Sovereign Gold Bond (RBI Tranche)',
    productType: 'SGB',
    category: 'COMMODITY',
    subClass: 'Gold',
    currentValue: 318000,
    currentCurrency: 'INR',
    investedAmount: 250000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-fd',
    name: 'HDFC Bank Fixed Deposit',
    productType: 'BANK_FD',
    category: 'DEBT',
    subClass: 'Term Deposit (7.25%)',
    currentValue: 500000,
    currentCurrency: 'INR',
    investedAmount: 500000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-flat',
    name: '2BHK Apartment, Whitefield',
    productType: 'PROPERTY',
    category: 'REAL_ESTATE',
    subClass: 'Residential Property',
    currentValue: 6500000,
    currentCurrency: 'INR',
    investedAmount: 5000000,
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'a-savings',
    name: 'HDFC Savings & Liquid Account',
    productType: 'CASH',
    category: 'CASH',
    subClass: 'Emergency Liquid Cash',
    currentValue: 352000,
    currentCurrency: 'INR',
    investedAmount: 352000,
    geographyTag: 'DOMESTIC',
  },
];

export const INITIAL_LIABILITIES: Liability[] = [
  {
    id: 'l-home',
    name: 'HDFC Home Loan (Whitefield Apartment)',
    liabilityType: 'HOME_LOAN',
    outstandingAmount: 4300000,
    currency: 'INR',
    interestRate: 8.5,
    monthlyEmi: 41200,
    lender: 'HDFC Bank',
  },
  {
    id: 'l-car',
    name: 'ICICI Auto Loan',
    liabilityType: 'AUTO_LOAN',
    outstandingAmount: 320000,
    currency: 'INR',
    interestRate: 8.9,
    monthlyEmi: 12400,
    lender: 'ICICI Bank',
  },
];

export const INITIAL_SNAPSHOTS: Snapshot[] = [
  {
    id: 's-0',
    takenAt: '2026-02-01T00:00:00.000Z',
    label: 'Year start',
    totalAssetsBase: 9280000,
    totalLiabilitiesBase: 4460000,
    netWorthBase: 4820000,
    baseCurrency: 'INR',
  },
  {
    id: 's-1',
    takenAt: '2026-03-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 9450000,
    totalLiabilitiesBase: 4440000,
    netWorthBase: 5010000,
    baseCurrency: 'INR',
  },
  {
    id: 's-2',
    takenAt: '2026-04-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 9610000,
    totalLiabilitiesBase: 4420000,
    netWorthBase: 5190000,
    baseCurrency: 'INR',
  },
  {
    id: 's-3',
    takenAt: '2026-05-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 9780000,
    totalLiabilitiesBase: 4400000,
    netWorthBase: 5380000,
    baseCurrency: 'INR',
  },
  {
    id: 's-4',
    takenAt: '2026-06-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 9960000,
    totalLiabilitiesBase: 4380000,
    netWorthBase: 5580000,
    baseCurrency: 'INR',
  },
  {
    id: 's-5',
    takenAt: '2026-07-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 10120000,
    totalLiabilitiesBase: 4360000,
    netWorthBase: 5760000,
    baseCurrency: 'INR',
  },
  {
    id: 's-6',
    takenAt: '2026-08-01T00:00:00.000Z',
    label: 'Bonus received',
    totalAssetsBase: 10380000,
    totalLiabilitiesBase: 4340000,
    netWorthBase: 6040000,
    baseCurrency: 'INR',
  },
  {
    id: 's-7',
    takenAt: '2026-09-01T00:00:00.000Z',
    label: null,
    totalAssetsBase: 10560000,
    totalLiabilitiesBase: 4320000,
    netWorthBase: 6240000,
    baseCurrency: 'INR',
  },
  {
    id: 's-8',
    takenAt: '2026-10-01T00:00:00.000Z',
    label: 'Current Month',
    totalAssetsBase: 11045000,
    totalLiabilitiesBase: 4620000,
    netWorthBase: 6425000,
    baseCurrency: 'INR',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    category: 'SALARY',
    amountBase: 175000,
    date: '2026-10-01',
    isRecurring: true,
    description: 'Monthly Salary (Software Eng)',
  },
  {
    id: 'tx-2',
    type: 'INCOME',
    category: 'DIVIDEND',
    amountBase: 3800,
    date: '2026-10-09',
    isRecurring: false,
    description: 'TCS & HDFC Dividend payout',
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    category: 'INVESTMENT',
    amountBase: 50000,
    date: '2026-10-05',
    isRecurring: true,
    description: 'Index Fund SIP (Nifty 50 + PPFC)',
  },
  {
    id: 'tx-4',
    type: 'EXPENSE',
    category: 'EMI',
    amountBase: 53600,
    date: '2026-10-07',
    isRecurring: true,
    description: 'Home Loan & Auto Loan EMI',
  },
  {
    id: 'tx-5',
    type: 'EXPENSE',
    category: 'GROCERIES',
    amountBase: 14200,
    date: '2026-10-12',
    isRecurring: false,
    description: 'BigBasket & DMart Monthly supplies',
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    category: 'UTILITIES',
    amountBase: 4800,
    date: '2026-10-10',
    isRecurring: true,
    description: 'Bescom Power & Airtel Broadband',
  },
  {
    id: 'tx-7',
    type: 'EXPENSE',
    category: 'FOOD_DINING',
    amountBase: 8400,
    date: '2026-10-15',
    isRecurring: false,
    description: 'Swiggy, Zomato & Weekend Dinners',
  },
  {
    id: 'tx-8',
    type: 'EXPENSE',
    category: 'TRANSPORT',
    amountBase: 5600,
    date: '2026-10-18',
    isRecurring: false,
    description: 'Uber Commute & Fuel',
  },
];
