// World coordinates are Y-up (0 = ground/death line), matching the original
// AndEngine/Box2D world. Screen coordinates are the usual Y-down canvas space.
// The camera converts between the two and clamps to level bounds, like
// AndEngine's BoundCamera.

export class Camera {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.centerX = viewW / 2;
    this.centerY = viewH / 2;
    this.bounds = { x: 0, y: 0, width: viewW, height: viewH };
  }

  setBounds(x, y, width, height) {
    this.bounds = { x, y, width, height };
  }

  chase(x, y) {
    const { bounds, viewW, viewH } = this;
    const minCX = bounds.x + viewW / 2;
    const maxCX = Math.max(minCX, bounds.x + bounds.width - viewW / 2);
    const minCY = bounds.y + viewH / 2;
    const maxCY = Math.max(minCY, bounds.y + bounds.height - viewH / 2);
    this.centerX = Math.min(maxCX, Math.max(minCX, x));
    this.centerY = Math.min(maxCY, Math.max(minCY, y));
  }

  worldToScreen(x, y) {
    return {
      x: x - this.centerX + this.viewW / 2,
      y: this.viewH / 2 - (y - this.centerY),
    };
  }
}
