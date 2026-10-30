/**
 * FinVelayudham Trusted Device Security Service
 * Remembers verified browsers so users do not have to re-enter email verification codes on trusted devices.
 */

const DEVICE_ID_KEY = 'finvelayudham_device_id';
const TRUSTED_DEVICES_KEY = 'finvelayudham_trusted_devices';

interface TrustRecord {
  deviceId: string;
  email: string;
  trustedAt: number;
  deviceName?: string;
}

// Generate or retrieve persistent browser device identifier
export function getDeviceId(): string {
  const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  if (!storage) return 'server_device';

  try {
    let id = storage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      storage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    const nav = typeof navigator !== 'undefined' ? navigator : (typeof window !== 'undefined' ? window.navigator : null);
    return 'fallback_device_' + ((nav && nav.userAgent) || '').slice(0, 20);
  }
}

// Detect simple friendly device label (e.g. "Chrome on Windows", "Brave on macOS")
export function getDeviceLabel(customUa?: string): string {
  const ua = customUa || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  let browser = 'Browser';
  if (typeof navigator !== 'undefined' && (navigator as any).brave) browser = 'Brave';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let os = 'Device';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

// Check if current browser is registered as a trusted device for the given email
export function isDeviceTrusted(email: string): boolean {
  if (!email) return false;
  const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const cleanEmail = email.trim().toLowerCase();
  const currentDeviceId = getDeviceId();

  if (storage) {
    try {
      const raw = storage.getItem(TRUSTED_DEVICES_KEY);
      if (raw) {
        const records: Record<string, TrustRecord> = JSON.parse(raw);
        const record = records[cleanEmail];
        if (record && record.deviceId === currentDeviceId) {
          return true;
        }
      }
    } catch (err) {
      console.warn('Error reading trusted devices storage:', err);
    }
  }

  // Cookie backup fallback
  const doc = typeof document !== 'undefined' ? document : (typeof window !== 'undefined' ? window.document : null);
  if (doc && doc.cookie) {
    try {
      const base64Email = typeof btoa !== 'undefined'
        ? btoa(cleanEmail).replace(/=/g, '')
        : Buffer.from(cleanEmail).toString('base64').replace(/=/g, '');
      const cookieName = `fv_trust_${base64Email}`;
      if (doc.cookie.includes(`${cookieName}=${currentDeviceId}`)) {
        return true;
      }
    } catch {}
  }

  return false;
}

// Mark device as trusted or untrusted
export function setDeviceTrusted(email: string, trusted: boolean): void {
  if (!email) return;
  const storage = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const cleanEmail = email.trim().toLowerCase();
  const currentDeviceId = getDeviceId();
  const deviceLabel = getDeviceLabel();

  if (storage) {
    try {
      const raw = storage.getItem(TRUSTED_DEVICES_KEY);
      const records: Record<string, TrustRecord> = raw ? JSON.parse(raw) : {};

      if (trusted) {
        records[cleanEmail] = {
          deviceId: currentDeviceId,
          email: cleanEmail,
          trustedAt: Date.now(),
          deviceName: deviceLabel,
        };
        storage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(records));
      } else {
        delete records[cleanEmail];
        storage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(records));
      }
    } catch (err) {
      console.warn('Error saving trusted device state:', err);
    }
  }

  const doc = typeof document !== 'undefined' ? document : (typeof window !== 'undefined' ? window.document : null);
  if (doc) {
    try {
      const base64Email = typeof btoa !== 'undefined'
        ? btoa(cleanEmail).replace(/=/g, '')
        : Buffer.from(cleanEmail).toString('base64').replace(/=/g, '');
      const cookieName = `fv_trust_${base64Email}`;

      if (trusted) {
        doc.cookie = `${cookieName}=${currentDeviceId}; path=/; max-age=7776000; SameSite=Lax`;
      } else {
        doc.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
      }
    } catch (err) {
      console.warn('Error saving cookie fallback:', err);
    }
  }
}
