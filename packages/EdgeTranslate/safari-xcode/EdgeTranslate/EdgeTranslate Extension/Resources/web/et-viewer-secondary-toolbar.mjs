// Secondary toolbar sizing/scroll feel and grouping utilities

export function setupSecondaryToolbarScroll(DEBUG = false) {
  const container = document.getElementById('secondaryToolbarButtonContainer');
  const menu = document.getElementById('secondaryToolbar');
  if (!container) return false;

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

  const ro = new ResizeObserver(() => scheduleUpdate());
  ro.observe(container);
  window.addEventListener('resize', scheduleUpdate, { passive: true });

  const applyGroupClasses = () => {
    container.querySelectorAll('.et-group-first, .et-group-mid, .et-group-last').forEach((el) => {
      el.classList.remove('et-group-first', 'et-group-mid', 'et-group-last');
    });
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
      if (menu) menu.style.width = `${Math.max(220, Math.floor(finalWidth))}px`;
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
}


