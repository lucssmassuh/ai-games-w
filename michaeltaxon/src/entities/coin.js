// Collectible money. Covers three level entity types that all share the
// original's "credit VALOR_PESO and vanish on contact with player" logic:
//   coin            - small floating bill, pulses in place
//   aguinaldoBill    - part of the mid-year bonus stack, rains down once released
//   findeanioBill    - part of the year-end bonus stack, rains down once released
const FALL_SPEED = 96; // px/s, matches the original's slow drift

export class Coin {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.falling = false;
    this.pulseT = Math.random() * Math.PI * 2;
    this.halfW = 25;
    this.halfH = 12.5;
  }

  release() {
    this.falling = true;
  }

  update(dt) {
    if (this.collected) return;
    if (this.type === 'coin') {
      this.pulseT += dt * 2.4;
    } else if (this.falling) {
      this.y -= FALL_SPEED * dt;
    }
  }

  get scale() {
    if (this.type !== 'coin') return 1;
    // LoopEntityModifier(ScaleModifier(0.5s, 1, 1.3)) ping-ponging.
    const s = (Math.sin(this.pulseT) + 1) / 2; // 0..1
    return 1 + s * 0.3;
  }
}
