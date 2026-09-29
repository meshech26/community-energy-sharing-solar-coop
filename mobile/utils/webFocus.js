// Imported only by web-specific presentation components, never by native bundles.
export function isVisibleFocusTarget(element) {
  if (!element?.isConnected || element.closest('[aria-hidden="true"], [inert], [hidden]')) return false;
  if (element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
  for (let node = element; node instanceof HTMLElement; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

export function focusVisibleContent(root = document) {
  const candidates = root.querySelectorAll('h1, h2, h3, [role="heading"], [data-navigation-focus]');
  // Prefer a heading to the navigation container fallback.
  const ordered = [...candidates].sort((a, b) => Number(a.hasAttribute('data-navigation-focus')) - Number(b.hasAttribute('data-navigation-focus')));
  const target = ordered.find(isVisibleFocusTarget);
  if (!target) return false;
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return document.activeElement === target;
}
