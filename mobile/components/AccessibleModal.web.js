import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { focusVisibleContent, isVisibleFocusTarget } from '../utils/webFocus';

// A native HTML modal dialog provides background inertness, Tab containment and
// Escape support without aria-hiding a still-focused React Native Web screen.
export default function AccessibleModal({ children, visible, onRequestClose, onShow, accessibilityLabel }) {
  const dialogRef = useRef(null);
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog.showModal();
    // Start at the heading so long/destructive confirmations are read first.
    if (!focusVisibleContent(dialog)) dialog.focus({ preventScroll: true });
    onShowRef.current?.();
    return () => {
      // close() releases the browser's modal focus trap and inert background first.
      dialog.close();
      // Let the same React commit finish mounting/unhiding the destination screen.
      queueMicrotask(() => {
        const nextDialog = document.querySelector('dialog[open]');
        if (nextDialog) focusVisibleContent(nextDialog);
        else if (isVisibleFocusTarget(opener)) opener.focus({ preventScroll: true });
        else focusVisibleContent(); // The opener may have been removed by navigation.
      });
    };
  }, [visible]);

  if (!visible || typeof document === 'undefined') return null;
  return createPortal(<>
    <style>{'dialog[data-solar-modal]::backdrop { background: transparent; }'}</style>
    <dialog ref={dialogRef} data-solar-modal="true" aria-label={accessibilityLabel} aria-modal="true" tabIndex={-1}
      onCancel={(event) => { event.preventDefault(); onRequestClose?.(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const dialog = dialogRef.current;
        const targets = [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
          .filter((element) => element.tabIndex >= 0 && isVisibleFocusTarget(element));
        const first = targets[0]; const last = targets[targets.length - 1];
        // Explicit cycling also prevents Tab from escaping to browser chrome.
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !targets.includes(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      style={{ position: 'fixed', inset: 0, margin: 0, padding: 0, border: 0, width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
      {children}
    </dialog>
  </>, document.body);
}
