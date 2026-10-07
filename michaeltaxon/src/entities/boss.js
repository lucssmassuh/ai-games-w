import { Animator } from '../engine/sprite.js';

// Shared implementation for Boss.java and Boss2.java: a flying enemy that
// patrols between [xMin, xMax], turning around at the edges.
export class Boss {
  constructor(x, y, sheet, { frames, xMin, xMax, speed }) {
    this.sheet = sheet;
    this.x = x;
    this.y = y;
    this.halfW = sheet.tileW / 2;
    this.halfH = sheet.tileH / 2;
    this.xMin = xMin;
    this.xMax = xMax;
    this.speed = speed;
    this.frames = frames;
    this.flying = false;
    this.visible = false;
    this.directionRight = true;
    this.flipped = false;
    this.vx = 0;
    this.animator = new Animator(sheet, frames.durations, frames.first, frames.last, true);
  }

  startFlying() {
    if (this.flying) return;
    this.visible = true;
    this.flying = true;
    this.vx = this.speed;
    this.directionRight = true;
    this.flipped = false;
  }

  stop() {
    this.flying = false;
    this.vx = 0;
    this.visible = false;
  }

  update(dt) {
    if (!this.flying) return;
    this.x += this.vx * dt;
    if (this.x >= this.xMax && this.directionRight) this._turn();
    if (this.x <= this.xMin && !this.directionRight) this._turn();
    this.animator.update(dt * 1000);
  }

  _turn() {
    this.directionRight = !this.directionRight;
    this.flipped = !this.directionRight;
    this.vx = this.directionRight ? this.speed : -this.speed;
  }
}
