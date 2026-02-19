import { handleQRRequest } from './api.js';

/**
 * Add CORS headers to a response.
 */
function withCORS(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return withCORS(new Response(null, { status: 204 }));
    }

    // API route
    if (path === '/api/qr') {
      const response = await handleQRRequest(request);
      return withCORS(response);
    }

    // Static assets are served automatically by the [assets] config.
    // If we reach here, nothing matched.
    return withCORS(new Response('Not Found', { status: 404 }));
  },
};
