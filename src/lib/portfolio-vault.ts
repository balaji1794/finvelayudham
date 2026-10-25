import { Asset, Liability, Snapshot, Transaction } from './types';
import { encryptPortfolioData, decryptPortfolioData } from './crypto';

export interface UserPortfolio {
  userId: string;
  email: string;
  currency: string;
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  transactions: Transaction[];
  updatedAt: string;
  isEncrypted: boolean;
}

const VAULT_PREFIX = 'finvelayudham_vault_';

// Clean starter assets for new users who want a kickstart
export const STARTER_ASSETS: Asset[] = [
  {
    id: 'starter-1',
    name: 'Emergency Savings Fund',
    productType: 'Savings Account',
    category: 'CASH',
    subClass: 'Liquid Cash',
    currentValue: 150000,
    investedAmount: 150000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'starter-2',
    name: 'Broad Market Equity Index',
    productType: 'Mutual Fund',
    category: 'EQUITY',
    subClass: 'Nifty 50 Index',
    currentValue: 300000,
    investedAmount: 240000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
  {
    id: 'starter-3',
    name: 'Public Provident Fund (PPF)',
    productType: 'Government Scheme',
    category: 'DEBT',
    subClass: 'PPF (80C)',
    currentValue: 200000,
    investedAmount: 180000,
    currentCurrency: 'INR',
    geographyTag: 'DOMESTIC',
  },
];

export const STARTER_LIABILITIES: Liability[] = [];

/**
 * Get user-specific storage key
 */
function getStorageKey(userId: string): string {
  return `${VAULT_PREFIX}${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * Load user's private encrypted portfolio vault
 */
export async function loadUserPortfolio(
  userId: string,
  userEmail: string,
  secretKey: string = userId
): Promise<UserPortfolio> {
  const defaultEmptyPortfolio: UserPortfolio = {
    userId,
    email: userEmail,
    currency: 'INR',
    assets: [],
    liabilities: [],
    snapshots: [],
    transactions: [],
    updatedAt: new Date().toISOString(),
    isEncrypted: true,
  };

  if (typeof window === 'undefined') {
    return defaultEmptyPortfolio;
  }

  try {
    const rawData = localStorage.getItem(getStorageKey(userId));
    if (!rawData) {
      // Also check server API if local cache is empty
      try {
        const res = await fetch(`/api/portfolio?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.payload) {
            const decryptedServer = await decryptPortfolioData(json.payload, secretKey);
            if (decryptedServer && Array.isArray(decryptedServer.assets)) {
              return {
                ...decryptedServer,
                userId,
                email: userEmail,
                isEncrypted: true,
              };
            }
          }
        }
      } catch (err) {
        console.warn('Server vault fetch skipped or offline');
      }
      return defaultEmptyPortfolio;
    }

    // Attempt decryption
    const decrypted = await decryptPortfolioData(rawData, secretKey);
    if (decrypted && Array.isArray(decrypted.assets)) {
      return {
        ...decrypted,
        userId,
        email: userEmail,
        isEncrypted: true,
      };
    }

    return defaultEmptyPortfolio;
  } catch (err) {
    console.error('Error loading encrypted user vault:', err);
    return defaultEmptyPortfolio;
  }
}

/**
 * Save user's private encrypted portfolio vault
 */
export async function saveUserPortfolio(
  portfolio: UserPortfolio,
  secretKey: string = portfolio.userId
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'SSR environment' };
  }

  try {
    portfolio.updatedAt = new Date().toISOString();
    portfolio.isEncrypted = true;

    // Encrypt client-side using AES-GCM
    const encryptedString = await encryptPortfolioData(portfolio, secretKey);

    // Save into private user localStorage slot
    localStorage.setItem(getStorageKey(portfolio.userId), encryptedString);

    // Sync to backend API in background for resilience
    fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: portfolio.userId,
        email: portfolio.email,
        payload: encryptedString,
        updatedAt: portfolio.updatedAt,
      }),
    }).catch((err) => console.warn('Background server vault sync warning:', err));

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save encrypted vault:', err);
    return { success: false, error: err.message || 'Vault encryption error' };
  }
}

/**
 * Populate with a starter set of assets for users who don't want to start from scratch
 */
export async function loadStarterTemplate(
  userId: string,
  userEmail: string,
  secretKey: string = userId
): Promise<UserPortfolio> {
  const starterPortfolio: UserPortfolio = {
    userId,
    email: userEmail,
    currency: 'INR',
    assets: [...STARTER_ASSETS],
    liabilities: [...STARTER_LIABILITIES],
    snapshots: [
      {
        id: 'snap-starter',
        takenAt: new Date().toISOString().slice(0, 7),
        label: 'Initial Vault Setup',
        netWorthBase: 650000,
        totalAssetsBase: 650000,
        totalLiabilitiesBase: 0,
        baseCurrency: 'INR',
      },
    ],
    transactions: [],
    updatedAt: new Date().toISOString(),
    isEncrypted: true,
  };

  await saveUserPortfolio(starterPortfolio, secretKey);
  return starterPortfolio;
}

/**
 * Permanently purge user portfolio data (GDPR / Right to erasure)
 */
export async function purgeUserPortfolio(userId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(userId));
  }

  try {
    await fetch(`/api/portfolio?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Server delete call error:', err);
  }
}
