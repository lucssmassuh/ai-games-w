// Translates pointer/touch/click input on the canvas into a single
// `onTap({x, y})` callback in canvas-pixel coordinates, mirroring the
// original's single-finger touch handling.
export function bindTap(canvas, onTap) {
  const toLocal = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onTap(toLocal(e.clientX, e.clientY));
  });

  // Keyboard equivalent of a tap: Space, Up Arrow or Enter. A key press has
  // no x/y, so it's reported as `null` — scenes that need a point for hit
  // testing (e.g. the menu's Play button) treat `null` as "activate".
  const TAP_KEYS = new Set(['Space', 'ArrowUp', 'Enter']);
  window.addEventListener('keydown', (e) => {
    if (!TAP_KEYS.has(e.code)) return;
    e.preventDefault();
    onTap(null);
  });
}

export function hitTest(rect, point) {
  return (
    point.x >= rect.x && point.x <= rect.x + rect.w &&
    point.y >= rect.y && point.y <= rect.y + rect.h
  );
}
