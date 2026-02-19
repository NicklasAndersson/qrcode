# QR Code Generator

A fast, globally distributed QR code generator running on [Cloudflare Workers](https://workers.cloudflare.com). Provides a REST API and a web interface for generating QR codes in PNG or SVG format.

**Live:** <https://qr.wwn.se>

## Features

- **REST API** — `GET /api/qr` returns a QR code image with configurable size, format, error correction, colours, and margin
- **Web UI** — responsive form with live preview, download, copy-to-clipboard, and shareable links
- **Multiple QR types** — plain text/URL, vCard (contact), WiFi network, Email, SMS, and Geo location
- **Custom colours** — foreground & background colour pickers with transparent background support
- **Margin control** — adjustable quiet zone (0–8 modules)
- **PNG & SVG** output
- **Smart filenames** — downloads are auto-named based on content (e.g. `qr-example-com.png`)
- **Edge caching** — Cache API with ETag, conditional requests (304), `s-maxage=604800`
- **Dark mode** — toggle or auto-detect from system preference
- **CORS enabled** — use the API from any origin
- **Docker support** — standalone Node.js server for container deployments

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
| `colorDark` | no | `#000000ff` | Foreground hex colour (`#RGB`, `#RRGGBB`, or `#RRGGBBAA`) |
| `colorLight` | no | `#ffffffff` | Background hex colour (use `#00000000` for transparent) |
| `margin` | no | `2` | Quiet zone in modules (0–10) |

**Examples:**

```bash
# PNG
curl "https://qr.wwn.se/api/qr?data=https://example.com&size=512" -o qr.png

# SVG
curl "https://qr.wwn.se/api/qr?data=Hello+World&format=svg" -o qr.svg
```

```bash
# Custom colours & transparent background
curl "https://qr.wwn.se/api/qr?data=hello&colorDark=%233b82f6ff&colorLight=%2300000000&margin=0" \
  -o qr-blue-transparent.png
```

```javascript
const img = document.createElement('img');
img.src = 'https://qr.wwn.se/api/qr?data=Hello&size=300';
document.body.appendChild(img);
```

Errors return JSON: `{ "error": "..." }` with an appropriate HTTP status.

Full interactive docs are available at [`/docs.html`](https://qr.wwn.se/docs.html).

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

## Docker

A standalone `server.js` (plain Node.js HTTP server) serves both the API and static files for container deployments.

```bash
docker build -t qrcode-generator .
docker run -p 8080:8080 qrcode-generator
```

The image is also published to GitHub Container Registry on every push to `main`:

```bash
docker pull ghcr.io/nicklasandersson/qrcode:latest
docker run -p 8080:8080 ghcr.io/nicklasandersson/qrcode
```

## Project Structure

```
src/
  index.js       Worker entry point, routing, Cache API + ETag, CORS
  api.js         /api/qr request handler & validation
  qr.js          QR code generation (PNG & SVG)
public/
  index.html     Web UI (6 QR types, advanced options, preview + actions)
  app.js         Frontend logic (type switching, color/margin, copy, share, smart filenames)
  styles.css     Styling (light + dark themes, responsive, advanced panel)
  docs.html      API documentation page
test/
  api.test.js    23 integration tests (Node.js test runner)
server.js        Standalone Node.js server (for Docker)
Dockerfile       Multi-stage Docker build
wrangler.toml    Cloudflare Workers config
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com) + [Wrangler 4](https://developers.cloudflare.com/workers/wrangler/)
- [`qrcode`](https://www.npmjs.com/package/qrcode) npm package
- Vanilla HTML / CSS / JavaScript
- [Docker](https://www.docker.com/) + [GitHub Actions](https://github.com/features/actions) for container CI/CD

## License

MIT
