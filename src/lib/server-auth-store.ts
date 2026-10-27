import crypto from 'node:crypto';

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

export interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt?: string;
  createdAt: string;
  isVerified: boolean;
}

// In-memory persistent account registry (in production with Postgres/Supabase, points to auth.users)
// Initialized with a default demo account
const globalAccounts = new Map<string, StoredAccount>();

export function hashPassword(password: string, salt: string = 'finvelayudham_secure_salt'): string {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function getAccountByEmail(email: string): StoredAccount | undefined {
  const cleanEmail = (email || '').trim().toLowerCase();
  return globalAccounts.get(cleanEmail);
}

export function saveAccount(account: StoredAccount): void {
  const cleanEmail = account.email.trim().toLowerCase();
  globalAccounts.set(cleanEmail, account);
}

export function registerAccount(email: string, name: string, password: string): { success: boolean; account?: StoredAccount; error?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const existing = globalAccounts.get(cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const id = deriveUserIdFromEmail(cleanEmail);
  const passwordHash = hashPassword(password, cleanEmail);
  const newAccount: StoredAccount = {
    id,
    email: cleanEmail,
    name: name && name.trim() ? name.trim() : 'Valued Member',
    passwordHash,
    salt: cleanEmail,
    createdAt: new Date().toISOString(),
    isVerified: true,
  };

  globalAccounts.set(cleanEmail, newAccount);
  return { success: true, account: newAccount };
}

export function verifyCredentials(email: string, password: string): { success: boolean; account?: StoredAccount; error?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const account = globalAccounts.get(cleanEmail);
  if (!account) {
    return {
      success: false,
      error: 'No account found with this email. Please check your email or create an account.',
    };
  }

  const salt = account.salt || cleanEmail;
  const computedHash = hashPassword(password, salt);
  if (computedHash !== account.passwordHash) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    };
  }

  return { success: true, account };
}

export function updateAccount(
  currentEmail: string,
  updates: { name?: string; newEmail?: string; newPassword?: string }
): { success: boolean; account?: StoredAccount; error?: string } {
  const cleanCurrentEmail = (currentEmail || '').trim().toLowerCase();
  let account = globalAccounts.get(cleanCurrentEmail);

  // If not found in memory, initialize from current profile
  if (!account) {
    const id = deriveUserIdFromEmail(cleanCurrentEmail);
    account = {
      id,
      email: cleanCurrentEmail,
      name: updates.name || 'Valued Member',
      passwordHash: updates.newPassword ? hashPassword(updates.newPassword, cleanCurrentEmail) : '',
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    globalAccounts.set(cleanCurrentEmail, account);
  }

  if (updates.name && updates.name.trim()) {
    account.name = updates.name.trim();
  }

  let finalEmail = cleanCurrentEmail;
  if (updates.newEmail && updates.newEmail.trim().toLowerCase() !== cleanCurrentEmail) {
    const cleanNewEmail = updates.newEmail.trim().toLowerCase();
    if (!cleanNewEmail.includes('@')) {
      return { success: false, error: 'Invalid new email address.' };
    }
    const existing = globalAccounts.get(cleanNewEmail);
    if (existing && existing !== account) {
      return { success: false, error: 'The requested email is already in use by another account.' };
    }
    globalAccounts.delete(cleanCurrentEmail);
    account.email = cleanNewEmail;
    account.id = deriveUserIdFromEmail(cleanNewEmail);
    finalEmail = cleanNewEmail;
    globalAccounts.set(cleanNewEmail, account);
  }

  if (updates.newPassword) {
    if (updates.newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }
    account.passwordHash = hashPassword(updates.newPassword, finalEmail);
    account.salt = finalEmail;
  }

  return { success: true, account };
}
