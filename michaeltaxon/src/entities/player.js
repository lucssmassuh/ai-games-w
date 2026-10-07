import { Animator } from '../engine/sprite.js';
import { GRAVITY } from '../physics.js';

// Port of object/Player.java. Animation frame ranges match the original
// mw2.png tile layout (19 tiles, 1 row):
//   0-7  moonwalk cycle
//   8-14 run cycle
//   16-18 jump
const ANIM = {
  run: { first: 8, last: 14, durations: [100, 100, 100, 100, 100, 100, 100] },
  moonwalk: { first: 0, last: 7, durations: [100, 100, 100, 100, 100, 100, 100, 100] },
  jump: { first: 16, last: 18, durations: [150, 1000, 1000] },
  idle: { first: 0, last: 7, durations: [100, 100, 100, 100, 100, 100, 100, 100] },
};

const RUN_SPEED = 220;
const JUMP_VY = 620;

export class Player {
  constructor(x, y, sheet) {
    this.sheet = sheet;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.halfW = sheet.tileW / 2;
    this.halfH = sheet.tileH / 2;
    this.flipped = false;
    this.directionRight = true;
    this.running = false;
    this.jumping = false;
    this.moonwalking = false;
    this.dead = false;
    this.animator = new Animator(sheet, ANIM.idle.durations, ANIM.idle.first, ANIM.idle.last, true);
  }

  _play(anim, loop) {
    this.animator = new Animator(this.sheet, anim.durations, anim.first, anim.last, loop);
  }

  startRunning() {
    if (this.running || this.dead) return;
    this.jumping = false;
    this.running = true;
    this.moonwalking = false;
    this._play(ANIM.run, true);
    this.vx = RUN_SPEED;
    this.directionRight = true;
    this.flipped = false;
  }

  startMoonwalking() {
    if (this.moonwalking || this.dead) return;
    this.jumping = false;
    this.running = false;
    this.moonwalking = true;
    this._play(ANIM.moonwalk, true);
    this.vx = RUN_SPEED;
    this.directionRight = true;
    this.flipped = false;
  }

  startJumping() {
    if (this.jumping || this.dead) return;
    this.jumping = true;
    this.running = false;
    this.moonwalking = false;
    this.vy = JUMP_VY;
    this._play(ANIM.jump, false);
  }

  moonwalkTurn() {
    if (!this.moonwalking) return;
    this.directionRight = !this.directionRight;
    this.flipped = !this.directionRight;
    this.vx = this.directionRight ? RUN_SPEED : -RUN_SPEED;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
    this.running = false;
    this.jumping = false;
    this.moonwalking = false;
    this._play(ANIM.idle, true);
  }

  onLanded() {
    if (this.jumping) {
      this.jumping = false;
      if (this.moonwalking) this._play(ANIM.moonwalk, true);
      else this._play(ANIM.run, true);
    }
  }

  update(dt) {
    if (this.dead) return;
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.animator.update(dt * 1000);
    if (this.y <= 0) {
      this.dead = true;
      this.vx = 0;
      this.vy = 0;
    }
  }
}
