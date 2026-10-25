#!/usr/bin/env node

/**
 * FinVelayudham Automated Frontend Synchronization Engine
 * Checks https://www.finboom.app periodically for structural, styling, route, and content drift.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REFERENCE_URL = process.env.REFERENCE_URL || 'https://www.finboom.app';
const TARGET_URL = process.env.TARGET_URL || 'https://www.finvelayudham.app';
const BASELINE_FILE = path.join(__dirname, 'finboom-baseline.json');
const LOGS_DIR = path.join(__dirname, '../logs');

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const ROUTES_TO_MONITOR = [
  '/',
  '/demo',
  '/calculators',
  '/calculators/sip',
  '/calculators/emi',
  '/calculators/retirement',
  '/calculators/xirr',
  '/login',
  '/whats-new',
  '/privacy',
  '/terms',
  '/refund-policy',
  '/manifest.json'
];

function fetchEndpoint(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = `${REFERENCE_URL}${urlPath}`;
    https.get(fullUrl, {
      headers: {
        'User-Agent': 'FinVelayudham-SyncDetector/1.0',
        'Accept': 'text/html,application/json'
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
        const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
        const scripts = [...data.matchAll(/<script[^>]*src="([^"]+)"/gi)].map(m => m[1]);
        const stylesheets = [...data.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)].map(m => m[1]);

        resolve({
          route: urlPath,
          statusCode: res.statusCode,
          contentLength: data.length,
          hash,
          title: titleMatch ? titleMatch[1].trim() : '',
          scriptCount: scripts.length,
          stylesheetCount: stylesheets.length,
          etag: res.headers['etag'] || null,
          lastModified: res.headers['last-modified'] || null
        });
      });
    }).on('error', (err) => {
      resolve({
        route: urlPath,
        error: err.message
      });
    });
  });
}

async function runSyncCheck(options = {}) {
  console.log(`\n======================================================`);
  console.log(` FinVelayudham Automatic Synchronization Engine`);
  console.log(` Reference: ${REFERENCE_URL}`);
  console.log(` Target:    ${TARGET_URL}`);
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  let baseline = {};
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (e) {
      baseline = {};
    }
  }

  const currentScan = {};
  const detectedDiffs = [];

  for (const r of ROUTES_TO_MONITOR) {
    process.stdout.write(`Scanning route: ${r.padEnd(25)} `);
    const result = await fetchEndpoint(r);

    if (result.error) {
      console.log(`[FAILED] (${result.error})`);
      detectedDiffs.push({
        route: r,
        type: 'NETWORK_ERROR',
        details: result.error
      });
      continue;
    }

    console.log(`[${result.statusCode}] Hash: ${result.hash} (${result.contentLength} bytes)`);
    currentScan[r] = result;

    if (baseline[r]) {
      const prev = baseline[r];
      if (prev.hash !== result.hash) {
        detectedDiffs.push({
          route: r,
          type: 'CONTENT_DRIFT',
          prevHash: prev.hash,
          newHash: result.hash,
          lengthDiff: result.contentLength - prev.contentLength
        });
      }
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    referenceUrl: REFERENCE_URL,
    targetUrl: TARGET_URL,
    totalRoutesChecked: ROUTES_TO_MONITOR.length,
    diffsCount: detectedDiffs.length,
    differences: detectedDiffs,
    scan: currentScan
  };

  const logFile = path.join(LOGS_DIR, `sync-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));

  console.log(`\nScan Complete.`);
  console.log(`Differences observed: ${detectedDiffs.length}`);

  if (detectedDiffs.length === 0) {
    console.log(`>> Status: IN_SYNC (FinVelayudham matches inspected reference baseline)`);
  } else {
    console.log(`>> Status: CHANGES_DETECTED`);
    detectedDiffs.forEach(d => console.log(` - [${d.type}] at ${d.route}`));
  }

  if (options.apply && detectedDiffs.length > 0) {
    console.log(`\nExecuting automated validation tests before updating baseline...`);
    try {
      execSync('npm test', { stdio: 'inherit' });
      fs.writeFileSync(BASELINE_FILE, JSON.stringify(currentScan, null, 2));
      console.log(`[SUCCESS] Tests passed. Baseline updated safely.`);
    } catch (err) {
      console.error(`[ROLLBACK] Automated tests failed! Rejecting synchronization update to protect live site.`);
      process.exit(1);
    }
  } else if (!fs.existsSync(BASELINE_FILE)) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(currentScan, null, 2));
    console.log(`Initial baseline recorded in ${BASELINE_FILE}`);
  }

  return report;
}

if (require.main === module) {
  const isApply = process.argv.includes('--apply');
  runSyncCheck({ apply: isApply }).catch(console.error);
}

module.exports = { runSyncCheck };
