// Let keyboard navigation work immediately, while preserving normal Tab access
// to the collection navigation. The original deck owns its slide interactions.
const deckFrame = document.getElementById('deck');
const navigationKeys = new Set(['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
window.addEventListener('keydown', (event) => {
  if (!navigationKeys.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('a, button, input, select, textarea')) return;
  const deckWindow = deckFrame.contentWindow;
  if (!deckWindow) return;
  event.preventDefault();
  deckWindow.focus();
  deckWindow.document.dispatchEvent(new KeyboardEvent('keydown', {
    key: event.key, code: event.code, bubbles: true, cancelable: true
  }));
});
