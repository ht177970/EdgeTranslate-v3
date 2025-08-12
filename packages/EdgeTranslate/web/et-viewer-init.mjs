// EdgeTranslate PDF.js viewer bootstrap (MV3-safe: no inline script)
import * as PDFJS from '../build/build/pdf.mjs';

// Expose as global for viewer.mjs
if (!globalThis.pdfjsLib) {
  globalThis.pdfjsLib = PDFJS;
}

// Soften noisy runtime errors coming from icon downloads in some environments
try {
  // Filter a known, harmless rejection thrown by icon preloads
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason && (event.reason.message || event.reason))
    if (msg && msg.includes('Unable to download all specified images')) {
      event.preventDefault();
    }
  });
  // Optional: suppress console error spam for the same case
  const origErr = console.error;
  console.error = function (...args) {
    const text = args.map((v) => (typeof v === 'string' ? v : (v && v.message) || '')).join(' ');
    if (text && text.includes('Unable to download all specified images')) return;
    return origErr.apply(this, args);
  };
} catch {}

try {
  PDFJS.GlobalWorkerOptions.workerSrc = '../build/build/pdf.worker.mjs';
} catch {}

// Prepare URL before loading viewer.mjs, following official behavior where file param drives initial load
(async () => {
  // Apply persisted theme early to avoid FOUC
  try {
    const saved = localStorage.getItem('et_viewer_theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch {}
  const urlObj = new URL(location.href);
  const params = urlObj.searchParams;
  const fileParam = params.get('file');

  if (fileParam) {
    // Decode and normalize target URL
    let rawUrl = fileParam;
    try { rawUrl = decodeURIComponent(fileParam); } catch {}

    let target;
    try { target = new URL(rawUrl, location.href); } catch { target = null; }

    const isBlobUrl = typeof rawUrl === 'string' && rawUrl.startsWith('blob:');
    const sourceParam = params.get('source');

    // If we're reloading with a blob: URL, rehydrate it from original source when available
    if (isBlobUrl && sourceParam) {
      try {
        const original = decodeURIComponent(sourceParam);
        const res = await fetch(original);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        params.set('file', encodeURIComponent(blobUrl));
        history.replaceState(null, '', urlObj.pathname + '?' + params.toString() + urlObj.hash);
      } catch (e) {
        console.warn('[EdgeTranslate] PDF blob rehydration failed:', e);
      }
    } else if (target && target.origin !== location.origin && !isBlobUrl) {
      // Cross-origin: preload then point file param at same-origin blob URL before viewer runs
      try {
        const res = await fetch(target.href);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        // Preserve original URL for refresh recovery
        params.set('source', encodeURIComponent(target.href));
        params.set('file', encodeURIComponent(blobUrl));
        history.replaceState(null, '', urlObj.pathname + '?' + params.toString() + urlObj.hash);
      } catch (e) {
        console.warn('[EdgeTranslate] PDF preload failed:', e);
        // keep original param; viewer will likely fail, but we proceed
      }
    }
  }

  // Load official viewer once URL is finalized
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'viewer.mjs';
  document.head.appendChild(script);

  // Setup theme toggle (robust to readyState)
  const setupThemeToggle = () => {
    const btn = document.getElementById('etThemeToggle');
    if (!btn) return false;

    const applyTheme = (mode) => {
      document.documentElement.setAttribute('data-theme', mode);
      try { localStorage.setItem('et_viewer_theme', mode); } catch {}
      btn.setAttribute('aria-pressed', String(mode === 'dark'));
      btn.classList.toggle('toggled', mode === 'dark');
    };

    let current = document.documentElement.getAttribute('data-theme');
    if (current !== 'dark' && current !== 'light') {
      current = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(current);
    } else {
      applyTheme(current);
    }

    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
    return true;
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    // Try immediately; if button not yet available, retry shortly
    if (!setupThemeToggle()) {
      setTimeout(setupThemeToggle, 0);
    }
  }
})();


