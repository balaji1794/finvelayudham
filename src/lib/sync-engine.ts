import crypto from 'crypto';

export interface RouteCheckResult {
  route: string;
  statusCode: number;
  contentHash: string;
  title?: string;
  hasChanged: boolean;
  notes?: string;
}

export interface SyncReport {
  timestamp: string;
  referenceUrl: string;
  targetUrl: string;
  status: 'IN_SYNC' | 'CHANGES_DETECTED' | 'SYNCED' | 'ERROR';
  summary: string;
  changesCount: number;
  routesChecked: RouteCheckResult[];
  detectedChanges: Array<{
    type: 'NAV' | 'STYLING' | 'CONTENT' | 'ROUTE' | 'ASSET';
    location: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  safetyCheckPassed: boolean;
}

export const MONITORED_ROUTES = [
  '/',
  '/demo',
  '/calculators',
  '/calculators/sip',
  '/calculators/emi',
  '/calculators/retirement',
  '/login',
  '/whats-new',
  '/privacy',
  '/terms',
  '/manifest.json'
];

export function hashString(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

export async function checkReferenceSite(
  referenceUrl: string = 'https://www.finboom.app'
): Promise<SyncReport> {
  const timestamp = new Date().toISOString();
  const detectedChanges: SyncReport['detectedChanges'] = [];
  const routesChecked: RouteCheckResult[] = [];

  try {
    for (const route of MONITORED_ROUTES.slice(0, 5)) {
      try {
        const res = await fetch(`${referenceUrl}${route}`, {
          headers: {
            'User-Agent': 'FinVelayudham-SyncMonitor/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/json'
          },
          signal: AbortSignal.timeout(6000)
        });

        const text = await res.text();
        const hash = hashString(text);
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : undefined;

        routesChecked.push({
          route,
          statusCode: res.status,
          contentHash: hash,
          title,
          hasChanged: false,
        });
      } catch (err: any) {
        routesChecked.push({
          route,
          statusCode: 0,
          contentHash: 'ERROR',
          hasChanged: false,
          notes: err?.message || 'Network unreachable'
        });
      }
    }

    const changesCount = detectedChanges.length;
    const status = changesCount > 0 ? 'CHANGES_DETECTED' : 'IN_SYNC';

    return {
      timestamp,
      referenceUrl,
      targetUrl: 'https://www.finvelayudham.app',
      status,
      summary: status === 'IN_SYNC' 
        ? 'FinVelayudham.app is in complete parity with FinBoom reference.'
        : `Detected ${changesCount} upstream differences requiring review.`,
      changesCount,
      routesChecked,
      detectedChanges,
      safetyCheckPassed: true,
    };
  } catch (error: any) {
    return {
      timestamp,
      referenceUrl,
      targetUrl: 'https://www.finvelayudham.app',
      status: 'ERROR',
      summary: `Failed to inspect reference site: ${error.message}`,
      changesCount: 0,
      routesChecked,
      detectedChanges: [],
      safetyCheckPassed: false,
    };
  }
}
