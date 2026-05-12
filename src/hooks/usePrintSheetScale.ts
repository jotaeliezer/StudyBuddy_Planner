import { type RefObject, useEffect } from 'react';

const MIN_SCALE = 0.55;
const MAX_SCALE = 1.12;
/** Padding vs ~@page margins + slack for print preview/chrome UI */
const VERTICAL_MARGIN_PX = 40;

/** Clears inline scaling; used when leaving print or invalidating queued work. */
function clearSheetStyles(el: HTMLElement) {
  el.style.transform = '';
  el.style.width = '';
  el.style.transformOrigin = '';
}

/**
 * Measures after a layout pass, then applies scale on the next frame so layout is stable.
 * All rAF steps check `startToken` against the live token so stale work after `afterprint` is ignored.
 */
function applyScale(
  el: HTMLElement,
  startToken: number,
  getLiveToken: () => number
) {
  clearSheetStyles(el);

  requestAnimationFrame(() => {
    if (startToken !== getLiveToken()) return;

    const contentH = el.scrollHeight;
    if (contentH <= 0) return;

    const availableH =
      typeof window.visualViewport?.height === 'number'
        ? window.visualViewport.height - VERTICAL_MARGIN_PX
        : window.innerHeight - VERTICAL_MARGIN_PX;

    let s = availableH / contentH;
    s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

    requestAnimationFrame(() => {
      if (startToken !== getLiveToken()) return;

      el.style.transformOrigin = 'top center';
      el.style.transform = `scale(${s})`;
      el.style.width = `${100 / s}%`;
    });
  });
}

export function usePrintSheetScale(sheetRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let liveToken = 0;
    const getLiveToken = () => liveToken;

    const invalidate = () => {
      liveToken++;
      const el = sheetRef.current;
      if (el) clearSheetStyles(el);
    };

    const schedule = () => {
      const startToken = liveToken;
      requestAnimationFrame(() => {
        if (startToken !== getLiveToken()) return;
        requestAnimationFrame(() => {
          if (startToken !== getLiveToken()) return;
          const sheet = sheetRef.current;
          if (!sheet) return;
          applyScale(sheet, startToken, getLiveToken);
        });
      });
    };

    const beforePrint = () => schedule();

    const mql =
      typeof window.matchMedia !== 'undefined' ? window.matchMedia('print') : null;

    const onMediaChange = () => {
      if (mql?.matches) {
        schedule();
      } else {
        invalidate();
      }
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', invalidate);

    if (mql?.addEventListener) {
      mql.addEventListener('change', onMediaChange);
    } else if (mql?.addListener) {
      mql.addListener(onMediaChange);
    }

    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', invalidate);
      if (mql?.removeEventListener) {
        mql.removeEventListener('change', onMediaChange);
      } else if (mql?.removeListener) {
        mql.removeListener(onMediaChange);
      }
      invalidate();
    };
  }, [sheetRef]);
}
