// Use the server (Node.js / pure-JS) build – avoids the browser path that
// requires a <canvas> element, which doesn't exist in Cloudflare Workers.
import QRCode from 'qrcode/lib/server.js';

/**
 * Generate a QR code as a PNG buffer.
 * @param {string} data - Text or URL to encode
 * @param {object} options
 * @param {number} options.size - Width/height in pixels (default 256)
 * @param {'L'|'M'|'Q'|'H'} options.errorCorrectionLevel - Error correction level (default 'M')
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function generatePNG(data, { size = 256, errorCorrectionLevel = 'M' } = {}) {
  const buffer = await QRCode.toBuffer(data, {
    width: size,
    errorCorrectionLevel,
    margin: 2,
  });
  return buffer;
}

/**
 * Generate a QR code as an SVG string.
 * @param {string} data - Text or URL to encode
 * @param {object} options
 * @param {number} options.size - Width/height in pixels (default 256)
 * @param {'L'|'M'|'Q'|'H'} options.errorCorrectionLevel - Error correction level (default 'M')
 * @returns {Promise<string>} SVG markup
 */
export async function generateSVG(data, { size = 256, errorCorrectionLevel = 'M' } = {}) {
  return QRCode.toString(data, {
    type: 'svg',
    width: size,
    errorCorrectionLevel,
    margin: 2,
  });
}
