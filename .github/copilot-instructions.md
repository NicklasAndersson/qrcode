# QR Code Generator — Copilot Project Context

## Overview

A QR code generator running on **Cloudflare Workers** with a REST API and web UI.

- **Live URL:** https://qr.wwn.se (custom domain) / https://qrcode-generator.wwn.workers.dev
- **Cloudflare account:** nicklas@wwn.se
- **Stack:** Cloudflare Workers (Wrangler 4), `qrcode` npm package, vanilla HTML/CSS/JS
- **Module system:** ESM (`"type": "module"` in package.json)

## Critical: qrcode Import

The `qrcode` package **must** be imported as:

```js
import QRCode from 'qrcode/lib/server.js';
```

**Not** `import QRCode from 'qrcode'` — the default import triggers a browser code path that requires a `<canvas>` element, which doesn't exist in Workers. This causes the error: _"You need to specify a canvas element"_.

Similarly, use `QRCode.toBuffer()` (not `toDataURL()`) for PNG generation.

## Project Structure

```
src/
  index.js       Worker entry point, routing, Cache API + ETag, CORS
  api.js         /api/qr handler, param validation (data, size, format, ecl, colorDark, colorLight, margin)
  qr.js          QR generation via qrcode/lib/server.js (PNG via toBuffer, SVG via toString)
public/
  index.html     Web UI — form with 6 QR types, advanced options panel, preview + actions
  app.js         Frontend logic — type switching, data builders, color/margin, copy, share, smart filenames
  styles.css     Light + dark themes, responsive, advanced panel, checkerboard transparent preview
  docs.html      API documentation page
test/
  api.test.js    23 integration tests (Node.js test runner, requires dev server on :8787)
```

## API: GET /api/qr

| Parameter              | Default      | Validation                                     |
| ---------------------- | ------------ | ---------------------------------------------- |
| `data` (required)      | —            | Max 4296 chars                                 |
| `size`                 | `256`        | Integer 32–2048                                |
| `format`               | `png`        | `png` or `svg`                                 |
| `errorCorrectionLevel` | `M`          | `L`, `M`, `Q`, `H`                             |
| `colorDark`            | `#000000ff`  | Hex: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`   |
| `colorLight`           | `#ffffffff`  | Same hex format. `#00000000` = transparent      |
| `margin`               | `2`          | Integer 0–10                                   |

## Features (implemented)

1. **6 QR types:** Text/URL, vCard, WiFi, Email (`mailto:`), SMS (`sms:`), Geo (`geo:lat,lng`)
2. **Advanced options panel:** Collapsible `<details>` with color pickers, transparent toggle, margin slider
3. **Custom colors:** `color.dark`/`color.light` passed as hex RGBA to qrcode lib
4. **Transparent background:** Checkbox sets `colorLight=#00000000`, shows checkerboard preview
5. **Margin control:** Slider 0–8 in UI (API allows 0–10)
6. **Copy to clipboard:** PNG via `ClipboardItem`, SVG via `writeText`, fallback copies API URL
7. **Share link:** Encodes full form state into URL query params, auto-restores on page load
8. **Smart filenames:** Downloads named `qr-{slug}.{format}` based on content type (hostname, contact name, etc.)
9. **Edge caching:** Cache API with ETag (SHA-256), `s-maxage=604800`, conditional requests (304)
10. **Dark mode:** Manual toggle + system preference detection, `data-theme` attribute

## Commands

```bash
npm install          # install deps
npm run dev          # wrangler dev on :8787
npm test             # node --test (requires dev server running)
npm run deploy       # wrangler deploy
```

## Docker

A standalone `server.js` (plain Node.js HTTP server) serves both the API and static files for container deployments.

```bash
docker build -t qrcode-generator .
docker run -p 8080:8080 qrcode-generator
```

The GitHub Actions workflow (`.github/workflows/docker.yml`) builds and pushes to `ghcr.io/nicklasandersson/qrcode` on every push to `main`.

## Testing

Tests run against `http://localhost:8787` (override with `TEST_BASE_URL` env var).
Start the dev server first in a separate terminal: `npm run dev`
Then: `node --test test/api.test.js`

**23 tests** across 3 suites: happy path (13), CORS preflight (1), static assets (4), validation errors (5).

## Style / Conventions

- No frameworks — vanilla JS with IIFE in app.js
- CSS custom properties for theming (`--color-bg`, `--color-surface`, `--color-primary`, etc.)
- `Set`-based lookups for validation constants
- Pre-built CORS preflight response (cloned per request)
- Dirty-state tracking on generate button (amber color `#f59e0b`)
- All form inputs trigger `markDirty()` on change

## Deployment

```bash
npx wrangler login   # one-time auth
npm run deploy       # deploys to qrcode-generator.wwn.workers.dev
```

Custom domain `qr.wwn.se` is configured via Cloudflare DNS.

## Known Patterns

- `buildCacheKey()` normalises all params (including colors/margin) for cache deduplication
- `digestHex()` uses first 16 hex chars of SHA-256 for ETag
- `withCORS()` clones response with CORS headers without cloning the body
- Frontend `restoreFromURL()` reads query params to pre-fill form from share links
- Color pickers send 6-digit hex + `ff` suffix to match qrcode lib's RGBA format
