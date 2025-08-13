// EdgeTranslate PDF.js viewer bootstrap (MV3-safe: no inline script)
import * as PDFJS from '../build/build/pdf.mjs';

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

  try {
    // Safari 리소스 경로 보정: viewer.html과 동일 디렉터리의 viewer.mjs가 pdf.worker 경로를 상대해 로드하도록 설정
    PDFJS.GlobalWorkerOptions.workerSrc = 'viewer.mjs';
  } catch {}

// Prepare URL before loading viewer.mjs, following official behavior where file param drives initial load
(async () => {
  const DEBUG = false;
  // Apply persisted theme early to avoid FOUC
  try {
    // Determine desired mode from our own preference or system
    let saved = localStorage.getItem('et_viewer_theme');
    if (saved !== 'dark' && saved !== 'light') {
      saved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      localStorage.setItem('et_viewer_theme', saved);
    }

    // Persist into PDF.js preferences so built-in theme is used
    const prefsRaw = localStorage.getItem('pdfjs.preferences');
    let prefsObj = {};
    try { prefsObj = prefsRaw ? JSON.parse(prefsRaw) : {}; } catch {}
    prefsObj.viewerCssTheme = saved === 'dark' ? 2 : 1; // 1: light, 2: dark
    localStorage.setItem('pdfjs.preferences', JSON.stringify(prefsObj));

    // Apply immediately so UI paints correctly before viewer init
    document.documentElement.style.colorScheme = saved;
    document.documentElement.setAttribute('data-theme', saved);
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

  // Setup theme toggle (robust to readyState)
  const setupThemeToggle = () => {
    const btn = document.getElementById('etThemeToggle');
    if (!btn) return false;

    const applyTheme = (mode) => {
      // Update document styles
      document.documentElement.style.colorScheme = mode;
      document.documentElement.setAttribute('data-theme', mode);
      // Persist in both our storage and PDF.js preferences
      try {
        localStorage.setItem('et_viewer_theme', mode);
        const prefsRaw = localStorage.getItem('pdfjs.preferences');
        let prefsObj = {};
        try { prefsObj = prefsRaw ? JSON.parse(prefsRaw) : {}; } catch {}
        prefsObj.viewerCssTheme = mode === 'dark' ? 2 : 1;
        localStorage.setItem('pdfjs.preferences', JSON.stringify(prefsObj));
      } catch {}
      btn.setAttribute('aria-pressed', String(mode === 'dark'));
      btn.classList.toggle('toggled', mode === 'dark');
    };

    let current = document.documentElement.getAttribute('data-theme');
    if (current !== 'dark' && current !== 'light') {
      current = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(current);

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

  // After viewer UI mounts, manage secondaryToolbar scroll state and feel
  const setupSecondaryToolbarScroll = () => {
    const container = document.getElementById('secondaryToolbarButtonContainer');
    const menu = document.getElementById('secondaryToolbar');
    if (!container) return false;
    // Debounced ResizeObserver update to avoid mutation-loops
    let roFramePending = false;
    let lastDesiredNoScroll = null;
    let lastMenuWidth = 0;
    const measureAndMutate = () => {
      roFramePending = false;
      const needsScroll = container.scrollHeight > container.clientHeight + 1;
      const desiredNoScroll = !needsScroll;
      if (lastDesiredNoScroll !== desiredNoScroll) {
        lastDesiredNoScroll = desiredNoScroll;
        container.classList.toggle('no-scroll', desiredNoScroll);
      }
    };
    const scheduleUpdate = () => {
      if (roFramePending) return;
      roFramePending = true;
      requestAnimationFrame(measureAndMutate);
    };
    scheduleUpdate();
    // Observe size changes (menu open/close, window resize, localization)
    const ro = new ResizeObserver(() => scheduleUpdate());
    ro.observe(container);
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    // Restore: only assign grouping classes, do not render background cards
    const applyGroupClasses = () => {
      // Clear all previous
      container.querySelectorAll('.et-group-first, .et-group-mid, .et-group-last').forEach((el) => {
        el.classList.remove('et-group-first', 'et-group-mid', 'et-group-last');
      });
      // Build a flattened, in-order list of items/separators (unwrap .visibleMediumView)
      const children = [];
      for (const node of Array.from(container.children)) {
        if (node.classList.contains('visibleMediumView')) {
          for (const sub of Array.from(node.children)) {
            if (sub.matches('button.toolbarButton, a.toolbarButton')) children.push(sub);
          }
        } else {
          children.push(node);
        }
      }

      // Build groups separated by horizontalToolbarSeparator
      let run = [];
      const flushRun = () => {
        if (!run.length) return;
        if (run.length === 1) {
          run[0].classList.add('et-group-first', 'et-group-last');
        } else {
          run[0].classList.add('et-group-first');
          for (let i = 1; i < run.length - 1; i++) run[i].classList.add('et-group-mid');
          run[run.length - 1].classList.add('et-group-last');
        }
        run = [];
      };
      for (const el of children) {
        if (el.classList.contains('horizontalToolbarSeparator')) {
          flushRun();
        } else if (el.matches('button.toolbarButton, a.toolbarButton')) {
          run.push(el);
        }
      }
      flushRun();
    };
    // Initial and on mutations (structure might change due to localization/visibility)
    let groupFramePending = false;
    const scheduleGroupApply = () => {
      if (groupFramePending) return;
      groupFramePending = true;
      requestAnimationFrame(() => {
        groupFramePending = false;
        applyGroupClasses();
        scheduleUpdate();
      });
    };
    scheduleGroupApply();
    const mo = new MutationObserver(() => scheduleGroupApply());
    mo.observe(container, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });

    // Diagnose elements that overflow horizontally (for fixing right-side hover bleed)
    const diagnoseOverflow = DEBUG ? () => {
      const containerRect = container.getBoundingClientRect();
      const cs = getComputedStyle(container);
      const limit = containerRect.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) + 0.5;
      container.querySelectorAll('.et-overflow').forEach(n => n.classList.remove('et-overflow'));
      const rows = [];
      for (const el of Array.from(container.children)) {
        if (!(el.matches && el.matches('button.toolbarButton, a.toolbarButton, .horizontalToolbarSeparator, .visibleMediumView')))
          continue;
        const m = getComputedStyle(el);
        const margin = (parseFloat(m.marginLeft) || 0) + (parseFloat(m.marginRight) || 0);
        const width = el.scrollWidth + margin;
        if (width > limit) {
          el.classList.add('et-overflow');
          rows.push({ id: el.id || (el.className || '').toString(), width: Math.round(width), limit: Math.round(limit) });
        }
      }
      if (rows.length) { try { console.table(rows); } catch { console.log(rows); } }
    } : () => {};

    // Run when the menu is opened and size it to the longest visible item
    const computeMenuWidth = () => {
      let maxWidth = 0;
      const list = Array.from(container.children);
      for (const el of list) {
        if (!el.matches || !el.matches('button.toolbarButton, a.toolbarButton, .visibleMediumView > button.toolbarButton')) continue;
        const rect = el.getBoundingClientRect();
        maxWidth = Math.max(maxWidth, rect.width);
      }
      if (maxWidth > 0) {
        const vw = document.documentElement.clientWidth;
        const finalWidth = Math.min(maxWidth + 16, vw - 16);
        menu.style.width = `${Math.max(220, Math.floor(finalWidth))}px`;
      }
    };

    const openedCheck = () => {
      if (menu && !menu.classList.contains('hidden')) {
        requestAnimationFrame(() => {
          diagnoseOverflow();
          try {
            const before = lastMenuWidth;
            computeMenuWidth();
            const after = parseFloat(menu.style.width) || 0;
            if (after && Math.abs(after - before) <= 1) return;
            lastMenuWidth = after || lastMenuWidth;
          } catch {}
        });
      }
    };
    const menuObs = new MutationObserver(openedCheck);
    if (menu) menuObs.observe(menu, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('resize', openedCheck, { passive: true });

    return true;
  };

  const trySetupToolbar = () => {
    if (!setupSecondaryToolbarScroll()) {
      setTimeout(trySetupToolbar, 50);
    }
  };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', trySetupToolbar);
  } else {
    trySetupToolbar();
  }
})();



