(() => {
  'use strict';

  const form = document.getElementById('qr-form');
  const typeSelect = document.getElementById('type-select');
  const dataInput = document.getElementById('data-input');
  const sizeSelect = document.getElementById('size-select');
  const formatSelect = document.getElementById('format-select');
  const eclSelect = document.getElementById('ecl-select');
  const generateBtn = document.getElementById('generate-btn');
  const previewSection = document.getElementById('preview-section');
  const qrPreview = document.getElementById('qr-preview');
  const downloadBtn = document.getElementById('download-btn');
  const copyBtn = document.getElementById('copy-btn');
  const shareBtn = document.getElementById('share-btn');
  const errorSection = document.getElementById('error-section');
  const errorMessage = document.getElementById('error-message');
  const themeToggle = document.getElementById('theme-toggle');

  // Advanced options
  const colorDarkInput = document.getElementById('color-dark');
  const colorLightInput = document.getElementById('color-light');
  const colorDarkHex = document.getElementById('color-dark-hex');
  const colorLightHex = document.getElementById('color-light-hex');
  const transparentBg = document.getElementById('transparent-bg');
  const marginSlider = document.getElementById('margin-slider');
  const marginValue = document.getElementById('margin-value');

  // ── Dark‑mode toggle ─────────────────────────────────────

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
  }

  // Initialise: stored preference → system preference → light
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    applyTheme(storedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Advanced option controls ──────────────────────────────

  colorDarkInput.addEventListener('input', () => {
    colorDarkHex.textContent = colorDarkInput.value;
  });

  colorLightInput.addEventListener('input', () => {
    colorLightHex.textContent = colorLightInput.value;
  });

  transparentBg.addEventListener('change', () => {
    colorLightInput.disabled = transparentBg.checked;
    if (transparentBg.checked) {
      colorLightHex.textContent = 'transparent';
    } else {
      colorLightHex.textContent = colorLightInput.value;
    }
  });

  marginSlider.addEventListener('input', () => {
    marginValue.textContent = marginSlider.value;
  });

  // ── Type‑field switching ──────────────────────────────────

  const allFieldSections = document.querySelectorAll('.type-fields');

  function showFieldsForType(type) {
    allFieldSections.forEach((el) => el.classList.add('hidden'));
    const target = document.getElementById(`fields-${type}`);
    if (target) target.classList.remove('hidden');
  }

  typeSelect.addEventListener('change', () => {
    showFieldsForType(typeSelect.value);
  });

  // ── Data builders ─────────────────────────────────────────

  function buildVCard() {
    const fn = document.getElementById('vcard-fn').value.trim();
    const ln = document.getElementById('vcard-ln').value.trim();
    const org = document.getElementById('vcard-org').value.trim();
    const phone = document.getElementById('vcard-phone').value.trim();
    const email = document.getElementById('vcard-email').value.trim();
    const url = document.getElementById('vcard-url').value.trim();

    if (!fn && !ln) return null;

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${ln};${fn};;;`,
      `FN:${fn} ${ln}`.trim(),
    ];
    if (org) lines.push(`ORG:${org}`);
    if (phone) lines.push(`TEL:${phone}`);
    if (email) lines.push(`EMAIL:${email}`);
    if (url) lines.push(`URL:${url}`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }

  function buildWiFi() {
    const ssid = document.getElementById('wifi-ssid').value.trim();
    const enc = document.getElementById('wifi-enc').value;
    const pass = document.getElementById('wifi-pass').value;
    const hidden = document.getElementById('wifi-hidden').checked;

    if (!ssid) return null;

    // Escape special chars in SSID and password
    const esc = (s) => s.replace(/([\\;,":])/g, '\\$1');
    let str = `WIFI:T:${enc};S:${esc(ssid)};`;
    if (enc !== 'nopass' && pass) str += `P:${esc(pass)};`;
    if (hidden) str += 'H:true;';
    str += ';';
    return str;
  }

  function buildEmail() {
    const to = document.getElementById('email-to').value.trim();
    if (!to) return null;
    const subject = document.getElementById('email-subject').value.trim();
    const body = document.getElementById('email-body').value.trim();
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return qs ? `mailto:${to}?${qs}` : `mailto:${to}`;
  }

  function buildSMS() {
    const number = document.getElementById('sms-number').value.trim();
    if (!number) return null;
    const body = document.getElementById('sms-body').value.trim();
    return body ? `sms:${number}?body=${encodeURIComponent(body)}` : `sms:${number}`;
  }

  function buildGeo() {
    const lat = document.getElementById('geo-lat').value.trim();
    const lng = document.getElementById('geo-lng').value.trim();
    if (!lat || !lng) return null;
    return `geo:${lat},${lng}`;
  }

  function getQRData() {
    const type = typeSelect.value;
    if (type === 'vcard') return buildVCard();
    if (type === 'wifi') return buildWiFi();
    if (type === 'email') return buildEmail();
    if (type === 'sms') return buildSMS();
    if (type === 'geo') return buildGeo();
    return dataInput.value.trim() || null;
  }

  // ── Smart filename ────────────────────────────────────────

  function buildFilename(data, format) {
    let slug = '';
    const type = typeSelect.value;

    try {
      if (type === 'text' && /^https?:\/\//i.test(data)) {
        slug = new URL(data).hostname.replace(/^www\./, '');
      } else if (type === 'vcard') {
        const fn = document.getElementById('vcard-fn').value.trim();
        const ln = document.getElementById('vcard-ln').value.trim();
        slug = `${fn}-${ln}`.trim().replace(/^-|-$/g, '');
      } else if (type === 'wifi') {
        slug = `wifi-${document.getElementById('wifi-ssid').value.trim()}`;
      } else if (type === 'email') {
        slug = `email-${document.getElementById('email-to').value.trim().split('@')[0]}`;
      } else if (type === 'sms') {
        slug = `sms-${document.getElementById('sms-number').value.trim()}`;
      } else if (type === 'geo') {
        slug = `geo-${document.getElementById('geo-lat').value.trim()}_${document.getElementById('geo-lng').value.trim()}`;
      } else {
        slug = data.substring(0, 30);
      }
    } catch {
      slug = data.substring(0, 30);
    }

    slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40) || 'qrcode';
    return `qr-${slug}.${format}`;
  }

  // ── API call ──────────────────────────────────────────────

  function buildApiUrl(data) {
    const params = new URLSearchParams({
      data,
      size: sizeSelect.value,
      format: formatSelect.value,
      errorCorrectionLevel: eclSelect.value,
      margin: marginSlider.value,
    });

    // Colors
    const dark = colorDarkInput.value + 'ff';          // #RRGGBB → #RRGGBBff
    const light = transparentBg.checked
      ? '#00000000'
      : colorLightInput.value + 'ff';

    if (dark !== '#000000ff') params.set('colorDark', dark);
    if (light !== '#ffffffff') params.set('colorLight', light);

    return `/api/qr?${params.toString()}`;
  }

  function showError(msg) {
    previewSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    errorMessage.textContent = msg;
  }

  function clearError() {
    errorSection.classList.add('hidden');
    errorMessage.textContent = '';
  }

  // Track last generated state for copy / share
  let lastBlob = null;
  let lastFormat = null;
  let lastApiUrl = null;

  async function generateQR() {
    const data = getQRData();
    if (!data) {
      showError('Please fill in the required fields.');
      return;
    }

    clearError();
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating…';

    const url = buildApiUrl(data);
    const format = formatSelect.value;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || `Server error (${response.status})`);
      }

      const filename = buildFilename(data, format);

      if (format === 'svg') {
        const svgText = await response.text();
        qrPreview.innerHTML = svgText;

        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = filename;
        lastBlob = blob;
      } else {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const img = document.createElement('img');
        img.src = objectUrl;
        img.alt = 'Generated QR Code';
        qrPreview.innerHTML = '';
        qrPreview.appendChild(img);

        downloadBtn.href = objectUrl;
        downloadBtn.download = filename;
        lastBlob = blob;
      }

      lastFormat = format;
      lastApiUrl = url;

      // Toggle transparent preview background
      if (transparentBg.checked) {
        qrPreview.classList.add('transparent-preview');
      } else {
        qrPreview.classList.remove('transparent-preview');
      }

      previewSection.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
      lastBlob = null;
      lastFormat = null;
      lastApiUrl = null;
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate QR Code';
    }
  }

  // ── Copy to clipboard ─────────────────────────────────────

  copyBtn.addEventListener('click', async () => {
    if (!lastBlob) return;

    try {
      if (lastFormat === 'svg') {
        const text = await lastBlob.text();
        await navigator.clipboard.writeText(text);
      } else {
        // PNG — use ClipboardItem
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': lastBlob }),
        ]);
      }
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    } catch {
      // Fallback: copy the API URL
      await navigator.clipboard.writeText(window.location.origin + lastApiUrl);
      copyBtn.textContent = 'Link copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    }
  });

  // ── Share link ────────────────────────────────────────────

  shareBtn.addEventListener('click', async () => {
    const params = new URLSearchParams();
    params.set('type', typeSelect.value);
    params.set('size', sizeSelect.value);
    params.set('format', formatSelect.value);
    params.set('ecl', eclSelect.value);
    params.set('margin', marginSlider.value);
    params.set('colorDark', colorDarkInput.value);
    params.set('colorLight', transparentBg.checked ? 'transparent' : colorLightInput.value);

    // Encode the relevant data fields
    const type = typeSelect.value;
    if (type === 'text') {
      params.set('data', dataInput.value);
    } else if (type === 'vcard') {
      params.set('vcard-fn', document.getElementById('vcard-fn').value);
      params.set('vcard-ln', document.getElementById('vcard-ln').value);
      params.set('vcard-org', document.getElementById('vcard-org').value);
      params.set('vcard-phone', document.getElementById('vcard-phone').value);
      params.set('vcard-email', document.getElementById('vcard-email').value);
      params.set('vcard-url', document.getElementById('vcard-url').value);
    } else if (type === 'wifi') {
      params.set('wifi-ssid', document.getElementById('wifi-ssid').value);
      params.set('wifi-enc', document.getElementById('wifi-enc').value);
      params.set('wifi-pass', document.getElementById('wifi-pass').value);
      params.set('wifi-hidden', document.getElementById('wifi-hidden').checked);
    } else if (type === 'email') {
      params.set('email-to', document.getElementById('email-to').value);
      params.set('email-subject', document.getElementById('email-subject').value);
      params.set('email-body', document.getElementById('email-body').value);
    } else if (type === 'sms') {
      params.set('sms-number', document.getElementById('sms-number').value);
      params.set('sms-body', document.getElementById('sms-body').value);
    } else if (type === 'geo') {
      params.set('geo-lat', document.getElementById('geo-lat').value);
      params.set('geo-lng', document.getElementById('geo-lng').value);
    }

    const shareUrl = `${window.location.origin}/?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      const orig = shareBtn.textContent;
      shareBtn.textContent = 'Copied!';
      setTimeout(() => { shareBtn.textContent = orig; }, 1500);
    } catch {
      // Fallback: select-all prompt
      window.prompt('Copy this link:', shareUrl);
    }
  });

  // ── Restore from share link ───────────────────────────────

  function restoreFromURL() {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('type')) return;

    typeSelect.value = p.get('type') || 'text';
    showFieldsForType(typeSelect.value);

    if (p.has('size')) sizeSelect.value = p.get('size');
    if (p.has('format')) formatSelect.value = p.get('format');
    if (p.has('ecl')) eclSelect.value = p.get('ecl');
    if (p.has('margin')) { marginSlider.value = p.get('margin'); marginValue.textContent = p.get('margin'); }
    if (p.has('colorDark')) { colorDarkInput.value = p.get('colorDark'); colorDarkHex.textContent = p.get('colorDark'); }

    if (p.get('colorLight') === 'transparent') {
      transparentBg.checked = true;
      colorLightInput.disabled = true;
      colorLightHex.textContent = 'transparent';
    } else if (p.has('colorLight')) {
      colorLightInput.value = p.get('colorLight');
      colorLightHex.textContent = p.get('colorLight');
    }

    const type = typeSelect.value;
    if (type === 'text' && p.has('data')) {
      dataInput.value = p.get('data');
    } else if (type === 'vcard') {
      ['vcard-fn', 'vcard-ln', 'vcard-org', 'vcard-phone', 'vcard-email', 'vcard-url'].forEach((k) => {
        if (p.has(k)) document.getElementById(k).value = p.get(k);
      });
    } else if (type === 'wifi') {
      ['wifi-ssid', 'wifi-enc', 'wifi-pass'].forEach((k) => {
        if (p.has(k)) document.getElementById(k).value = p.get(k);
      });
      if (p.get('wifi-hidden') === 'true') document.getElementById('wifi-hidden').checked = true;
    } else if (type === 'email') {
      ['email-to', 'email-subject', 'email-body'].forEach((k) => {
        if (p.has(k)) document.getElementById(k).value = p.get(k);
      });
    } else if (type === 'sms') {
      ['sms-number', 'sms-body'].forEach((k) => {
        if (p.has(k)) document.getElementById(k).value = p.get(k);
      });
    } else if (type === 'geo') {
      ['geo-lat', 'geo-lng'].forEach((k) => {
        if (p.has(k)) document.getElementById(k).value = p.get(k);
      });
    }

    // Open advanced panel if non-default values
    if (p.has('colorDark') || p.has('colorLight') || (p.has('margin') && p.get('margin') !== '2')) {
      document.getElementById('advanced-options').open = true;
    }
  }

  restoreFromURL();

  // ── Dirty state ───────────────────────────────────────────

  let dirty = false;

  function markDirty() {
    if (!dirty) {
      dirty = true;
      generateBtn.classList.add('dirty');
    }
  }

  function clearDirty() {
    dirty = false;
    generateBtn.classList.remove('dirty');
  }

  // ── Events ────────────────────────────────────────────────

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateQR();
    clearDirty();
  });

  // Mark the button as dirty when any input changes
  document.querySelectorAll('#qr-form input, #qr-form select').forEach((el) => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
  });
})();
