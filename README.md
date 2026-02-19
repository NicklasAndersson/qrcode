# QR Code Generator

A fast, globally distributed QR code generator running on [Cloudflare Workers](https://workers.cloudflare.com). Provides a REST API and a web interface for generating QR codes in PNG or SVG format.

**Live:** <https://qrcode-generator.wwn.workers.dev>

## Features

- **REST API** — `GET /api/qr` returns a QR code image with configurable size, format, and error correction
- **Web UI** — responsive form with live preview and one-click download
- **Multiple QR types** — plain text/URL, vCard (contact), and WiFi network
- **PNG & SVG** output
- **Dark mode** — toggle or auto-detect from system preference
- **CORS enabled** — use the API from any origin

## Quick Start

```bash
npm install
npm run dev      # http://localhost:8787
```

## API

### `GET /api/qr`

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data` | yes | — | Text, URL, vCard, or WiFi string to encode (max 4 296 chars) |
| `size` | no | `256` | Width & height in pixels (32–2 048) |
| `format` | no | `png` | `png` or `svg` |
| `errorCorrectionLevel` | no | `M` | `L`, `M`, `Q`, or `H` |

**Examples:**

```bash
# PNG
curl "https://qrcode-generator.wwn.workers.dev/api/qr?data=https://example.com&size=512" -o qr.png

# SVG
curl "https://qrcode-generator.wwn.workers.dev/api/qr?data=Hello+World&format=svg" -o qr.svg
```

```javascript
const img = document.createElement('img');
img.src = 'https://qrcode-generator.wwn.workers.dev/api/qr?data=Hello&size=300';
document.body.appendChild(img);
```

Errors return JSON: `{ "error": "..." }` with an appropriate HTTP status.

Full interactive docs are available at [`/docs.html`](https://qrcode-generator.wwn.workers.dev/docs.html).

## Development

### Prerequisites

- Node.js ≥ 18
- npm

### Commands

```bash
npm install          # install dependencies
npm run dev          # start local dev server (port 8787)
npm test             # run test suite (requires dev server in another terminal)
npm run deploy       # deploy to Cloudflare Workers
```

### Deployment

```bash
npx wrangler login   # authenticate once
npm run deploy       # ship it
```

## Project Structure

```
src/
  index.js       Worker entry point & routing
  api.js         /api/qr request handler & validation
  qr.js          QR code generation (PNG & SVG)
public/
  index.html     Web UI
  app.js         Frontend logic
  styles.css     Styling (light + dark)
  docs.html      API documentation page
test/
  api.test.js    Integration tests (Node.js test runner)
wrangler.toml    Cloudflare Workers config
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com) + [Wrangler 4](https://developers.cloudflare.com/workers/wrangler/)
- [`qrcode`](https://www.npmjs.com/package/qrcode) npm package
- Vanilla HTML / CSS / JavaScript

## License

MIT
