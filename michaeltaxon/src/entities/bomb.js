import { Animator } from '../engine/sprite.js';
import { GRAVITY } from '../physics.js';

// Port of object/Bomb.java. A single bomb instance is reused for every drop,
// exactly like the original (only one "bomb" entity exists in the level).
const FALLING = { first: 0, last: 2, durations: [100, 300, 400] };
const EXPLODING = { first: 3, last: 6, durations: [100, 100, 100, 100] };
const GROUND_Y = 160; // roughly the aguinaldo/fin-de-año platform height

export class Bomb {
  constructor(sheet) {
    this.sheet = sheet;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.halfW = sheet.tileW / 2;
    this.halfH = sheet.tileH / 2;
    this.visible = false;
    this.falling = false;
    this.exploding = false;
    this.animator = null;
  }

  startFalling(x, y) {
    if (this.falling || this.exploding) return;
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.visible = true;
    this.falling = true;
    this.animator = new Animator(
      this.sheet, FALLING.durations, FALLING.first, FALLING.last, false,
      () => this.startExploding(),
    );
  }

  startExploding() {
    if (this.exploding) return;
    this.falling = false;
    this.exploding = true;
    this.animator = new Animator(
      this.sheet, EXPLODING.durations, EXPLODING.first, EXPLODING.last, false,
      () => this.reload(),
    );
  }

  reload() {
    this.visible = false;
    this.exploding = false;
    this.falling = false;
  }

  update(dt) {
    if (this.falling) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= GROUND_Y) this.startExploding();
    }
    if (this.animator) this.animator.update(dt * 1000);
  }
}
