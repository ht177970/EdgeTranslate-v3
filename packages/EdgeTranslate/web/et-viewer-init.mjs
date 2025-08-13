// EdgeTranslate PDF.js viewer bootstrap (MV3-safe: no inline script)
import * as PDFJS from '../build/build/pdf.mjs';
import { applyEarlyThemeFromStorageAndSystem, applyEarlyPageTheme, setupThemeToggle } from './et-viewer-theme.mjs';
import { setupSecondaryToolbarScroll } from './et-viewer-secondary-toolbar.mjs';

// Expose as global for viewer.mjs
if (!globalThis.pdfjsLib) {
  globalThis.pdfjsLib = PDFJS;
}

// Soften noisy runtime errors coming from icon downloads in some environments
try {
  const isHarmlessIconError = (val) => {
    const msg = String(val && (val.message || val));
    return msg.includes('Unable to download all specified images');
  };
  window.addEventListener('unhandledrejection', (event) => {
    if (isHarmlessIconError(event.reason)) event.preventDefault();
  });
  const origErr = console.error;
  console.error = function (...args) {
    if (args.some(isHarmlessIconError)) return;
    return origErr.apply(this, args);
  };
} catch {}

// Disable drag-and-drop open behavior inside the viewer
try {
  const block = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
  };
  window.addEventListener('dragover', block);
  window.addEventListener('drop', block);
} catch {}

  try { PDFJS.GlobalWorkerOptions.workerSrc = '../build/build/pdf.worker.mjs'; } catch {}

// Prepare URL before loading viewer.mjs, following official behavior where file param drives initial load
(async () => {
  const DEBUG = false;
  applyEarlyThemeFromStorageAndSystem();

  // Apply persisted page theme (auto|light|dark) early to avoid flicker
  applyEarlyPageTheme();
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

  // Load official viewer once URL is finalized (avoid duplicate insert)
  const ensureViewerLoaded = () => {
    if (document.getElementById('et-viewer-loader')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'viewer.mjs';
    script.id = 'et-viewer-loader';
    document.head.appendChild(script);
  };
  ensureViewerLoaded();

  // Theme toggle handled in et-viewer-theme.mjs

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    // Try immediately; if button not yet available, retry shortly
    if (!setupThemeToggle()) {
      setTimeout(setupThemeToggle, 0);
    }
  }

  // Secondary toolbar handled in et-viewer-secondary-toolbar.mjs

  const trySetupToolbar = () => { if (!setupSecondaryToolbarScroll()) setTimeout(trySetupToolbar, 50); };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', trySetupToolbar);
  } else {
    trySetupToolbar();
  }
})();



