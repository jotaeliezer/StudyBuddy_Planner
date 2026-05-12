import { type RefObject, useEffect } from 'react';

const MIN_SCALE = 0.55;
const MAX_SCALE = 1.12;
/** Padding vs ~@page margins + slack for print preview/chrome UI */
const VERTICAL_MARGIN_PX = 40;

function applyScale(el: HTMLElement) {
  el.style.transform = '';
  el.style.width = '';

  requestAnimationFrame(() => {
    const contentH = el.scrollHeight;
    if (contentH <= 0) return;

    const availableH =
      typeof window.visualViewport?.height === 'number'
        ? window.visualViewport.height - VERTICAL_MARGIN_PX
        : window.innerHeight - VERTICAL_MARGIN_PX;

    let s = availableH / contentH;
    s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

    el.style.transformOrigin = 'top center';
    el.style.transform = `scale(${s})`;
    el.style.width = `${100 / s}%`;
  });
}

export function usePrintSheetScale(sheetRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let pending = false;

    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pending = false;
          const sheet = sheetRef.current;
          if (sheet) applyScale(sheet);
        });
      });
    };

    const clear = () => {
      const el = sheetRef.current;
      if (!el) return;
      el.style.transform = '';
      el.style.width = '';
    };

    const beforePrint = () => schedule();

    const mql =
      typeof window.matchMedia !== 'undefined' ? window.matchMedia('print') : null;

    const onMediaChange = () => {
      if (mql?.matches) schedule();
      else clear();
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', clear);

    if (mql?.addEventListener) {
      mql.addEventListener('change', onMediaChange);
    } else if (mql?.addListener) {
      mql.addListener(onMediaChange);
    }

    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', clear);
      if (mql?.removeEventListener) {
        mql.removeEventListener('change', onMediaChange);
      } else if (mql?.removeListener) {
        mql.removeListener(onMediaChange);
      }
      clear();
    };
  }, [sheetRef]);
}
