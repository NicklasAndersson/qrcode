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
  const errorSection = document.getElementById('error-section');
  const errorMessage = document.getElementById('error-message');
  const themeToggle = document.getElementById('theme-toggle');

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

  function getQRData() {
    const type = typeSelect.value;
    if (type === 'vcard') return buildVCard();
    if (type === 'wifi') return buildWiFi();
    return dataInput.value.trim() || null;
  }

  // ── API call ──────────────────────────────────────────────

  function buildApiUrl(data) {
    const params = new URLSearchParams({
      data,
      size: sizeSelect.value,
      format: formatSelect.value,
      errorCorrectionLevel: eclSelect.value,
    });
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

      if (format === 'svg') {
        const svgText = await response.text();
        qrPreview.innerHTML = svgText;

        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = 'qrcode.svg';
      } else {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const img = document.createElement('img');
        img.src = objectUrl;
        img.alt = 'Generated QR Code';
        qrPreview.innerHTML = '';
        qrPreview.appendChild(img);

        downloadBtn.href = objectUrl;
        downloadBtn.download = 'qrcode.png';
      }

      previewSection.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate QR Code';
    }
  }

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
