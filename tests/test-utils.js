let resolvedBaseUrl = null;

async function checkUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function getAvailableBaseUrl() {
  if (resolvedBaseUrl !== null) return resolvedBaseUrl;

  const candidates = [
    process.env.TEST_BASE_URL,
    'http://127.0.0.1:3005',
    'http://localhost:3005',
    'http://localhost:3000',
    'https://finvelayudham.vercel.app',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const isAlive = await checkUrl(candidate);
    if (isAlive) {
      resolvedBaseUrl = candidate;
      return candidate;
    }
  }

  resolvedBaseUrl = false;
  return false;
}

module.exports = { getAvailableBaseUrl };
