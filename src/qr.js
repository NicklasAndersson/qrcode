// Use the server (Node.js / pure-JS) build – avoids the browser path that
// requires a <canvas> element, which doesn't exist in Cloudflare Workers.
import QRCode from 'qrcode/lib/server.js';

/**
 * Generate a QR code as a PNG buffer.
 * @param {string} data - Text or URL to encode
 * @param {object} options
 * @param {number}  options.size      - Width/height in pixels (default 256)
 * @param {'L'|'M'|'Q'|'H'} options.errorCorrectionLevel
 * @param {number}  options.margin    - Quiet-zone modules (default 2)
 * @param {string}  options.colorDark - Foreground hex colour (default '#000000ff')
 * @param {string}  options.colorLight- Background hex colour (default '#ffffffff')
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function generatePNG(data, {
  size = 256,
  errorCorrectionLevel = 'M',
  margin = 2,
  colorDark = '#000000ff',
  colorLight = '#ffffffff',
} = {}) {
  return QRCode.toBuffer(data, {
    width: size,
    errorCorrectionLevel,
    margin,
    color: { dark: colorDark, light: colorLight },
  });
}

/**
 * Generate a QR code as an SVG string.
 * @param {string} data - Text or URL to encode
 * @param {object} options
 * @param {number}  options.size      - Width/height in pixels (default 256)
 * @param {'L'|'M'|'Q'|'H'} options.errorCorrectionLevel
 * @param {number}  options.margin    - Quiet-zone modules (default 2)
 * @param {string}  options.colorDark - Foreground hex colour (default '#000000ff')
 * @param {string}  options.colorLight- Background hex colour (default '#ffffffff')
 * @returns {Promise<string>} SVG markup
 */
export async function generateSVG(data, {
  size = 256,
  errorCorrectionLevel = 'M',
  margin = 2,
  colorDark = '#000000ff',
  colorLight = '#ffffffff',
} = {}) {
  return QRCode.toString(data, {
    type: 'svg',
    width: size,
    errorCorrectionLevel,
    margin,
    color: { dark: colorDark, light: colorLight },
  });
}
