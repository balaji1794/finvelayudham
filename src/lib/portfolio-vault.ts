import { Asset, Liability, Snapshot, Transaction, Goal } from './types';
import { encryptPortfolioData, decryptPortfolioData } from './crypto';

export interface UserPortfolio {
  userId: string;
  email: string;
  currency: string;
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  transactions: Transaction[];
  goals?: Goal[];
  updatedAt: string;
  isEncrypted: boolean;
}

const VAULT_PREFIX = 'finvelayudham_vault_';

/**
 * Deterministically derives a stable, permanent User ID from an email address.
 * Guarantees that across all logins, logouts, re-logins, and page refreshes,
 * the user always accesses the exact same vault storage slot without key drifting.
 */
export function deriveUserIdFromEmail(email: string): string {
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

export const STARTER_GOALS: Goal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund (6 Months Expenses)',
    category: 'EMERGENCY_FUND',
    targetAmount: 500000,
    currentAmount: 150000,
    targetDate: '2027-12-31',
    monthlyContribution: 25000,
    currency: 'INR',
    notes: 'Keep in high-yield liquid funds and sweep accounts',
  },
  {
    id: 'goal-2',
    name: 'Retirement / Financial Independence',
    category: 'RETIREMENT',
    targetAmount: 30000000,
    currentAmount: 500000,
    targetDate: '2040-03-31',
    monthlyContribution: 50000,
    currency: 'INR',
    notes: 'Long-term equity index compounding target',
  },
];

/**
 * Get user-specific storage key based on deterministic user ID
 */
export function getStorageKey(userId: string): string {
  return `${VAULT_PREFIX}${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * Get email-anchored storage key for cross-session redundancy
 */
export function getEmailStorageKey(email: string): string {
  const clean = (email || '').trim().toLowerCase();
  return `${VAULT_PREFIX}email_${clean.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * Load user's private encrypted portfolio vault.
 * Automatically handles:
 * 1. Primary target storage key lookup (based on deterministic userId derived from email)
 * 2. Multi-key decryption fallback (userId, userEmail, cleanEmail)
 * 3. Automatic migration & recovery of orphaned vault keys created in previous sessions
 * 4. Server API sync fallback by userId & email
 */
export async function loadUserPortfolio(
  userId: string,
  userEmail: string,
  secretKey: string = userId
): Promise<UserPortfolio> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const defaultEmptyPortfolio: UserPortfolio = {
    userId,
    email: cleanEmail || userEmail,
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

  // Helper to decrypt raw vault string with multiple candidate secrets
  async function attemptDecryption(rawData: string, extraKeys: string[] = []): Promise<any | null> {
    const keysToTry = [secretKey, userId, cleanEmail, userEmail, ...extraKeys].filter(
      (k, idx, arr) => Boolean(k) && arr.indexOf(k) === idx
    );

    for (const key of keysToTry) {
      try {
        const decrypted = await decryptPortfolioData(rawData, key);
        if (decrypted && (Array.isArray(decrypted.assets) || Array.isArray(decrypted.liabilities))) {
          return decrypted;
        }
      } catch {
        // try next key
      }
    }

    // Try unencrypted plain JSON fallback
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && (Array.isArray(parsed.assets) || Array.isArray(parsed.liabilities))) {
        return parsed;
      }
    } catch {}

    return null;
  }

  try {
    const primaryKey = getStorageKey(userId);
    const emailKey = cleanEmail ? getEmailStorageKey(cleanEmail) : null;

    // 1. Try Primary Key (finvelayudham_vault_usr_...)
    const primaryData = localStorage.getItem(primaryKey);
    if (primaryData) {
      const decrypted = await attemptDecryption(primaryData);
      if (decrypted) {
        return {
          ...decrypted,
          userId,
          email: cleanEmail || userEmail,
          currency: decrypted.currency || 'INR',
          assets: Array.isArray(decrypted.assets) ? decrypted.assets : [],
          liabilities: Array.isArray(decrypted.liabilities) ? decrypted.liabilities : [],
          snapshots: Array.isArray(decrypted.snapshots) ? decrypted.snapshots : [],
          transactions: Array.isArray(decrypted.transactions) ? decrypted.transactions : [],
          goals: Array.isArray(decrypted.goals) ? decrypted.goals : [],
          isEncrypted: true,
        };
      }
    }

    // 2. Try Email-Indexed Mirror Key (finvelayudham_vault_email_...)
    if (emailKey) {
      const emailMirrorData = localStorage.getItem(emailKey);
      if (emailMirrorData) {
        const decrypted = await attemptDecryption(emailMirrorData);
        if (decrypted) {
          const restored: UserPortfolio = {
            ...decrypted,
            userId,
            email: cleanEmail || userEmail,
            currency: decrypted.currency || 'INR',
            assets: Array.isArray(decrypted.assets) ? decrypted.assets : [],
            liabilities: Array.isArray(decrypted.liabilities) ? decrypted.liabilities : [],
            snapshots: Array.isArray(decrypted.snapshots) ? decrypted.snapshots : [],
            transactions: Array.isArray(decrypted.transactions) ? decrypted.transactions : [],
            goals: Array.isArray(decrypted.goals) ? decrypted.goals : [],
            isEncrypted: true,
          };
          // Persist to primary deterministic slot as well
          await saveUserPortfolio(restored, secretKey);
          return restored;
        }
      }
    }

    // 3. Automatic Orphan Vault Recovery Scanner:
    // If the user previously logged in under a random ephemeral session ID (e.g. usr_xyz789),
    // find that orphaned vault, decrypt it, adopt the holdings, and migrate them forward!
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(VAULT_PREFIX) || k === primaryKey || (emailKey && k === emailKey)) {
        continue;
      }

      const orphanRaw = localStorage.getItem(k);
      if (!orphanRaw) continue;

      // The candidate key suffix was the old userId used as its secretKey!
      const candidateOldUserId = k.substring(VAULT_PREFIX.length);
      const orphanDecrypted = await attemptDecryption(orphanRaw, [candidateOldUserId]);

      if (orphanDecrypted) {
        const hasHoldings =
          (orphanDecrypted.assets && orphanDecrypted.assets.length > 0) ||
          (orphanDecrypted.liabilities && orphanDecrypted.liabilities.length > 0);
        const matchesEmail =
          orphanDecrypted.email && orphanDecrypted.email.trim().toLowerCase() === cleanEmail;

        if (matchesEmail || hasHoldings) {
          console.info(`[FinVelayudham Vault Recovery] Successfully rescued portfolio from ${k} for ${cleanEmail}`);
          const rescuedPortfolio: UserPortfolio = {
            ...orphanDecrypted,
            userId,
            email: cleanEmail || userEmail,
            currency: orphanDecrypted.currency || 'INR',
            assets: Array.isArray(orphanDecrypted.assets) ? orphanDecrypted.assets : [],
            liabilities: Array.isArray(orphanDecrypted.liabilities) ? orphanDecrypted.liabilities : [],
            snapshots: Array.isArray(orphanDecrypted.snapshots) ? orphanDecrypted.snapshots : [],
            transactions: Array.isArray(orphanDecrypted.transactions) ? orphanDecrypted.transactions : [],
            goals: Array.isArray(orphanDecrypted.goals) ? orphanDecrypted.goals : [],
            isEncrypted: true,
            updatedAt: new Date().toISOString(),
          };

          // Re-save under primary deterministic key and email mirror
          await saveUserPortfolio(rescuedPortfolio, secretKey);
          return rescuedPortfolio;
        }
      }
    }

    // 4. Server API sync fallback
    try {
      const serverUrl = `/api/portfolio?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(cleanEmail)}`;
      const res = await fetch(serverUrl);
      if (res.ok) {
        const json = await res.json();
        if (json.payload) {
          const decryptedServer = await attemptDecryption(json.payload);
          if (decryptedServer) {
            const serverRestored: UserPortfolio = {
              ...decryptedServer,
              userId,
              email: cleanEmail || userEmail,
              currency: decryptedServer.currency || 'INR',
              assets: Array.isArray(decryptedServer.assets) ? decryptedServer.assets : [],
              liabilities: Array.isArray(decryptedServer.liabilities) ? decryptedServer.liabilities : [],
              snapshots: Array.isArray(decryptedServer.snapshots) ? decryptedServer.snapshots : [],
              transactions: Array.isArray(decryptedServer.transactions) ? decryptedServer.transactions : [],
              goals: Array.isArray(decryptedServer.goals) ? decryptedServer.goals : [],
              isEncrypted: true,
            };
            // Cache locally for offline and fast retrieval
            await saveUserPortfolio(serverRestored, secretKey);
            return serverRestored;
          }
        }
      }
    } catch (err) {
      console.warn('Server vault fetch skipped or offline:', err);
    }

    return defaultEmptyPortfolio;
  } catch (err) {
    console.error('Error loading encrypted user vault:', err);
    return defaultEmptyPortfolio;
  }
}

/**
 * Save user's private encrypted portfolio vault.
 * Saves client-side in primary deterministic storage, email-indexed mirror,
 * and synchronizes with server API in the background.
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

    const cleanEmail = (portfolio.email || '').trim().toLowerCase();
    const effectiveSecretKey = secretKey || portfolio.userId || cleanEmail;

    // Encrypt client-side using AES-GCM
    const encryptedString = await encryptPortfolioData(portfolio, effectiveSecretKey);

    // 1. Save into private user localStorage slot by userId
    localStorage.setItem(getStorageKey(portfolio.userId), encryptedString);

    // 2. Also save into email-anchored mirror slot for cross-session resilience
    if (cleanEmail) {
      localStorage.setItem(getEmailStorageKey(cleanEmail), encryptedString);
    }

    // 3. Sync to backend API in background for resilience across devices
    fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: portfolio.userId,
        email: cleanEmail,
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
    goals: [...STARTER_GOALS],
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
export async function purgeUserPortfolio(userId: string, userEmail?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(userId));
    if (userEmail) {
      localStorage.removeItem(getEmailStorageKey(userEmail));
    }
    // Also remove any matching vault keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(VAULT_PREFIX) && (k.includes(userId) || (userEmail && k.includes(userEmail.replace(/[^a-zA-Z0-9_-]/g, '_'))))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  try {
    const query = new URLSearchParams({ userId, email: userEmail || '' }).toString();
    await fetch(`/api/portfolio?${query}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Server delete call error:', err);
  }
}
