import { generatePNG, generateSVG } from './qr.js';

const VALID_ERROR_LEVELS = ['L', 'M', 'Q', 'H'];
const MAX_SIZE = 2048;
const MIN_SIZE = 32;
const MAX_DATA_LENGTH = 4296;

/**
 * Handle GET /api/qr requests.
 * Query params: data (required), size, format, errorCorrectionLevel
 */
export async function handleQRRequest(request) {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');
  const sizeParam = url.searchParams.get('size');
  const format = (url.searchParams.get('format') || 'png').toLowerCase();
  const errorCorrectionLevel = (url.searchParams.get('errorCorrectionLevel') || 'M').toUpperCase();

  // Validation
  if (!data) {
    return jsonError('Missing required parameter: data', 400);
  }

  if (data.length > MAX_DATA_LENGTH) {
    return jsonError(`Data too long. Maximum length is ${MAX_DATA_LENGTH} characters.`, 400);
  }

  const size = sizeParam ? parseInt(sizeParam, 10) : 256;
  if (isNaN(size) || size < MIN_SIZE || size > MAX_SIZE) {
    return jsonError(`Invalid size. Must be between ${MIN_SIZE} and ${MAX_SIZE}.`, 400);
  }

  if (!['png', 'svg'].includes(format)) {
    return jsonError('Invalid format. Supported formats: png, svg', 400);
  }

  if (!VALID_ERROR_LEVELS.includes(errorCorrectionLevel)) {
    return jsonError('Invalid errorCorrectionLevel. Must be L, M, Q, or H.', 400);
  }

  try {
    const options = { size, errorCorrectionLevel };

    if (format === 'svg') {
      const svg = await generateSVG(data, options);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const pngBuffer = await generatePNG(data, options);
    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return jsonError(`QR code generation failed: ${err.message}`, 500);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
