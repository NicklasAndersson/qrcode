<<<<<<< HEAD
# QR Code Generator

A QR code generator built with Cloudflare Workers that provides both an API and a web interface for generating QR codes.

## Features

- 🚀 **API-First Design**: RESTful API for programmatic QR code generation
- 🎨 **Web Interface**: User-friendly frontend for interactive QR code creation
- ⚡ **Cloudflare Workers**: Fast, globally distributed edge computing
- 📦 **Multiple Formats**: Support for PNG, SVG, and other image formats
- 🎯 **Customizable**: Adjust size, error correction, and styling options

## Project Status

This project is currently under development. See the TODO checklist below for progress.

## TODO Checklist

### Phase 1: Project Setup ✅
- [x] Create project README with TODO checklist
- [ ] Initialize project structure
- [ ] Set up package.json with dependencies
- [ ] Configure Cloudflare Workers development environment
- [ ] Create .gitignore file

### Phase 2: API Backend 🚧
- [ ] Install QR code generation library (qrcode or similar)
- [ ] Create API endpoint: `GET /api/qr` - Generate QR code
  - [ ] Support query parameters: `data`, `size`, `format`, `errorCorrectionLevel`
  - [ ] Return QR code as image (PNG/SVG)
- [ ] Add error handling and validation
- [ ] Implement CORS support for cross-origin requests
- [ ] Add rate limiting (optional)

### Phase 3: Frontend Interface 📱
- [ ] Create HTML structure for QR code generator UI
- [ ] Add CSS styling for responsive design
- [ ] Implement JavaScript for:
  - [ ] Form input handling
  - [ ] API integration
  - [ ] Real-time QR code preview
  - [ ] Download functionality
- [ ] Add configuration options:
  - [ ] Text/URL input
  - [ ] Size selector
  - [ ] Format selector (PNG/SVG)
  - [ ] Error correction level selector

### Phase 4: API Documentation 📚
- [ ] Create API documentation page
- [ ] Document all endpoints and parameters
- [ ] Add usage examples
- [ ] Include cURL examples
- [ ] Add response format specifications

### Phase 5: Testing & Deployment 🧪
- [ ] Test API endpoints
- [ ] Test frontend functionality
- [ ] Verify cross-browser compatibility
- [ ] Deploy to Cloudflare Workers
- [ ] Update README with deployment instructions

### Phase 6: Enhancement (Optional) ✨
- [ ] Add support for vCard QR codes
- [ ] Add support for WiFi QR codes
- [ ] Implement QR code history/favorites
- [ ] Add dark mode toggle
- [ ] Analytics integration

## API Documentation

### Base URL
```
https://your-worker.workers.dev
```
*Note: Replace `your-worker` with your actual Cloudflare Workers project name.*

### Endpoints

#### Generate QR Code
```
GET /api/qr
```

**Query Parameters:**
- `data` (required): The text or URL to encode in the QR code
- `size` (optional): Size in pixels (default: 256)
- `format` (optional): Output format - `png` or `svg` (default: png)
- `errorCorrectionLevel` (optional): `L`, `M`, `Q`, or `H` (default: M)

**Example:**
```bash
curl "https://your-worker.workers.dev/api/qr?data=https://example.com&size=512&format=png"
```

**Response:**
- Content-Type: `image/png` or `image/svg+xml`
- Binary image data

## Usage Examples

### API Usage

#### JavaScript/Fetch
```javascript
const qrCodeUrl = 'https://your-worker.workers.dev/api/qr?data=Hello%20World&size=300';
const img = document.createElement('img');
img.src = qrCodeUrl;
document.body.appendChild(img);
```

#### Python
```python
import requests

url = 'https://your-worker.workers.dev/api/qr'
params = {
    'data': 'https://example.com',
    'size': 256,
    'format': 'png'
}

response = requests.get(url, params=params)
with open('qrcode.png', 'wb') as f:
    f.write(response.content)
```

#### cURL
```bash
curl "https://your-worker.workers.dev/api/qr?data=https://example.com&size=256" -o qrcode.png
```

### Frontend Usage

Simply visit the web interface at `https://your-worker.workers.dev` (*replace with your actual worker URL*) and use the form to:
1. Enter your text or URL
2. Customize the QR code settings
3. Preview the generated QR code
4. Download in your preferred format

## Development

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Cloudflare Workers account (for deployment)

### Local Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

## Project Structure
```
qrcode/
├── src/
│   ├── index.js          # Main worker entry point
│   ├── api.js            # API route handlers
│   └── qr.js             # QR code generation logic
├── public/
│   ├── index.html        # Frontend interface
│   ├── styles.css        # Styling
│   └── app.js            # Frontend JavaScript
├── wrangler.toml         # Cloudflare Workers config
├── package.json
└── README.md
```

## Technologies

- **Cloudflare Workers**: Serverless platform
- **QR Code Library**: QR code generation (e.g., `qrcode` npm package)
- **HTML/CSS/JavaScript**: Frontend interface

## References

- [Cloudflare Workers QR Code Tutorial](https://developers.cloudflare.com/workers/tutorials/build-a-qr-code-generator/)
- [goQR.me API Documentation](https://goqr.me/api/doc/create-qr-code/)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
=======
# qrcode
>>>>>>> origin/main
