import { handleQRRequest } from './api.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Pre-built preflight response (re-used across requests)
const PREFLIGHT = new Response(null, { status: 204, headers: CORS_HEADERS });

/**
 * Append CORS headers to a response without cloning the body.
 */
function withCORS(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight — fast path
    if (request.method === 'OPTIONS') {
      return PREFLIGHT.clone();
    }

    // API route
    if (path === '/api/qr') {
      // --- Cache API: check edge cache first ---
      const cache = caches.default;
      const cacheKey = buildCacheKey(url);

      let cached = await cache.match(cacheKey);
      if (cached) {
        // Handle conditional requests (If-None-Match)
        const ifNoneMatch = request.headers.get('If-None-Match');
        const etag = cached.headers.get('ETag');
        if (ifNoneMatch && etag && ifNoneMatch === etag) {
          return new Response(null, { status: 304, headers: cached.headers });
        }
        return cached;
      }

      // Generate fresh response
      const response = await handleQRRequest(request);
      const corsResponse = withCORS(response);

      // Only cache successful responses
      if (corsResponse.status === 200) {
        // Clone so we can read body for ETag and still return it
        const body = await corsResponse.arrayBuffer();
        const etag = `"${await digestHex(body)}"`;

        const headers = new Headers(corsResponse.headers);
        headers.set('ETag', etag);
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        headers.set('Vary', 'Accept');

        const cachedResponse = new Response(body, {
          status: 200,
          headers,
        });

        // Store in edge cache (non-blocking)
        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));

        // Handle conditional request on first miss
        const ifNoneMatch = request.headers.get('If-None-Match');
        if (ifNoneMatch && ifNoneMatch === etag) {
          return new Response(null, { status: 304, headers });
        }

        return cachedResponse;
      }

      return corsResponse;
    }

    // Static assets are served automatically by the [assets] config.
    return withCORS(new Response('Not Found', { status: 404 }));
  },
};

/**
 * Build a normalised cache key so that default-valued params
 * hit the same cache entry (e.g. omitting size vs size=256).
 */
function buildCacheKey(url) {
  const data = url.searchParams.get('data') || '';
  const size = url.searchParams.get('size') || '256';
  const format = (url.searchParams.get('format') || 'png').toLowerCase();
  const ecl = (url.searchParams.get('errorCorrectionLevel') || 'M').toUpperCase();
  const colorDark = (url.searchParams.get('colorDark') || '#000000ff').toLowerCase();
  const colorLight = (url.searchParams.get('colorLight') || '#ffffffff').toLowerCase();
  const margin = url.searchParams.get('margin') || '2';

  const norm = new URL(url.origin + '/api/qr');
  norm.searchParams.set('data', data);
  norm.searchParams.set('size', size);
  norm.searchParams.set('format', format);
  norm.searchParams.set('errorCorrectionLevel', ecl);
  norm.searchParams.set('colorDark', colorDark);
  norm.searchParams.set('colorLight', colorLight);
  norm.searchParams.set('margin', margin);
  return new Request(norm.toString(), { method: 'GET' });
}

/**
 * SHA-256 hex digest (first 16 chars) for ETag generation.
 */
async function digestHex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}
