import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:8787';

describe('GET /api/qr', () => {
  // ── Happy path ──────────────────────────────────────────

  it('returns a PNG image for a valid request', async () => {
    const res = await fetch(`${BASE}/api/qr?data=hello`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
    const buf = await res.arrayBuffer();
    assert.ok(buf.byteLength > 100, 'PNG should have content');
    // PNG magic bytes: 0x89 P N G
    const header = new Uint8Array(buf.slice(0, 4));
    assert.deepEqual([...header], [0x89, 0x50, 0x4e, 0x47]);
  });

  it('returns an SVG for format=svg', async () => {
    const res = await fetch(`${BASE}/api/qr?data=hello&format=svg`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/svg+xml');
    const text = await res.text();
    assert.ok(text.includes('<svg'), 'Should contain <svg tag');
  });

  it('respects custom size and error correction level', async () => {
    const res = await fetch(`${BASE}/api/qr?data=test&size=512&errorCorrectionLevel=H`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
  });

  it('includes CORS headers', async () => {
    const res = await fetch(`${BASE}/api/qr?data=cors-test`);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  it('includes cache-control header', async () => {
    const res = await fetch(`${BASE}/api/qr?data=cache-test`);
    assert.ok(res.headers.get('cache-control')?.includes('max-age'));
  });

  // ── Color & margin ──────────────────────────────────────

  it('accepts custom colorDark and colorLight', async () => {
    const res = await fetch(`${BASE}/api/qr?data=color-test&colorDark=%233b82f6ff&colorLight=%23f0f0f0ff`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
  });

  it('accepts transparent background (colorLight=#00000000)', async () => {
    const res = await fetch(`${BASE}/api/qr?data=transparent&colorLight=%2300000000`);
    assert.equal(res.status, 200);
  });

  it('returns 400 for invalid colorDark hex', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&colorDark=notacolor`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('colorDark'));
  });

  it('returns 400 for invalid colorLight hex', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&colorLight=zzz`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('colorLight'));
  });

  it('accepts margin=0', async () => {
    const res = await fetch(`${BASE}/api/qr?data=margin-test&margin=0`);
    assert.equal(res.status, 200);
  });

  it('accepts margin=8', async () => {
    const res = await fetch(`${BASE}/api/qr?data=margin-test&margin=8`);
    assert.equal(res.status, 200);
  });

  it('returns 400 for margin=11', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&margin=11`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('margin'));
  });

  it('accepts colors with SVG format', async () => {
    const res = await fetch(`${BASE}/api/qr?data=svg-color&format=svg&colorDark=%23ff0000ff&colorLight=%230000ffff`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/svg+xml');
    const svg = await res.text();
    assert.ok(svg.includes('<svg'));
  });

  // ── Validation errors ───────────────────────────────────

  it('returns 400 when data is missing', async () => {
    const res = await fetch(`${BASE}/api/qr`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('data'));
  });

  it('returns 400 for invalid size (too small)', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&size=1`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('size') || json.error.includes('Size'));
  });

  it('returns 400 for invalid size (too large)', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&size=9999`);
    assert.equal(res.status, 400);
  });

  it('returns 400 for invalid format', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&format=gif`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('format'));
  });

  it('returns 400 for invalid error correction level', async () => {
    const res = await fetch(`${BASE}/api/qr?data=x&errorCorrectionLevel=Z`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes('errorCorrectionLevel'));
  });
});

describe('CORS preflight', () => {
  it('responds to OPTIONS with 204 and CORS headers', async () => {
    const res = await fetch(`${BASE}/api/qr`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    assert.ok(res.headers.get('access-control-allow-methods')?.includes('GET'));
  });
});

describe('Static assets', () => {
  it('serves the homepage (index.html) at /', async () => {
    const res = await fetch(`${BASE}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('QR Code Generator'), 'Should contain app title');
  });

  it('serves styles.css', async () => {
    const res = await fetch(`${BASE}/styles.css`);
    assert.equal(res.status, 200);
  });

  it('serves app.js', async () => {
    const res = await fetch(`${BASE}/app.js`);
    assert.equal(res.status, 200);
  });

  it('serves the docs page', async () => {
    const res = await fetch(`${BASE}/docs.html`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('API Documentation'));
  });
});
