import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePNG, generateSVG } from './src/qr.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const VALID_ERROR_LEVELS = new Set(['L', 'M', 'Q', 'H']);
const VALID_FORMATS = new Set(['png', 'svg']);
const HEX_COLOR_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function jsonError(res, message, status) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ error: message }));
}

async function handleQR(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const data = url.searchParams.get('data');
  const sizeParam = url.searchParams.get('size');
  const format = (url.searchParams.get('format') || 'png').toLowerCase();
  const ecl = (url.searchParams.get('errorCorrectionLevel') || 'M').toUpperCase();
  const colorDark = url.searchParams.get('colorDark') || '#000000ff';
  const colorLight = url.searchParams.get('colorLight') || '#ffffffff';
  const marginParam = url.searchParams.get('margin');

  if (!data) return jsonError(res, 'Missing required parameter: data', 400);
  if (data.length > 4296) return jsonError(res, 'Data too long. Maximum length is 4296 characters.', 400);

  const size = sizeParam ? parseInt(sizeParam, 10) : 256;
  if (isNaN(size) || size < 32 || size > 2048) return jsonError(res, 'Invalid size. Must be between 32 and 2048.', 400);
  if (!VALID_FORMATS.has(format)) return jsonError(res, 'Invalid format. Supported formats: png, svg', 400);
  if (!VALID_ERROR_LEVELS.has(ecl)) return jsonError(res, 'Invalid errorCorrectionLevel. Must be L, M, Q, or H.', 400);
  if (!HEX_COLOR_RE.test(colorDark)) return jsonError(res, 'Invalid colorDark. Must be a hex color (e.g. #000000 or #000000ff).', 400);
  if (!HEX_COLOR_RE.test(colorLight)) return jsonError(res, 'Invalid colorLight. Must be a hex color (e.g. #ffffff or #ffffff00).', 400);

  const margin = marginParam != null ? parseInt(marginParam, 10) : 2;
  if (isNaN(margin) || margin < 0 || margin > 10) return jsonError(res, 'Invalid margin. Must be between 0 and 10.', 400);

  try {
    const opts = { size, errorCorrectionLevel: ecl, margin, colorDark, colorLight };
    if (format === 'svg') {
      const svg = await generateSVG(data, opts);
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(svg);
    } else {
      const buf = await generatePNG(data, opts);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(buf);
    }
  } catch (err) {
    jsonError(res, `QR code generation failed: ${err.message}`, 500);
  }
}

async function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';

  const ext = extname(filePath);
  const fullPath = join(__dirname, 'public', filePath);

  try {
    const content = await readFile(fullPath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/qr') {
    return handleQR(req, res);
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`QR Code Generator listening on http://localhost:${PORT}`);
});
