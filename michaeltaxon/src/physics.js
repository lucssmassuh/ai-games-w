// Simplified arcade physics replacing the original's Box2D world.
// Coordinates are in world pixels, Y-up (0 = ground/death line).

export const GRAVITY = -1500; // px/s^2 (tuned to feel like the original jump arcs)

export function integrate(body, dt) {
  body.vy += GRAVITY * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;
}

/** AABB overlap test for two centered rects {x,y,halfW,halfH}. */
export function overlaps(a, b) {
  return (
    Math.abs(a.x - b.x) < a.halfW + b.halfW &&
    Math.abs(a.y - b.y) < a.halfH + b.halfH
  );
}

/**
 * Resolve landing on a list of static platforms. A platform is
 * {x, y, halfW, halfH}; the body lands on top when falling onto it.
 * Returns the platform landed on, or null.
 */
export function resolvePlatforms(body, platforms) {
  if (body.vy > 0) return null; // only land while falling/level
  const bodyBottom = body.y - body.halfH;
  for (const p of platforms) {
    const platformTop = p.y + p.halfH;
    const withinX = Math.abs(body.x - p.x) < p.halfW + body.halfW * 0.6;
    const closeToTop = bodyBottom <= platformTop && bodyBottom >= platformTop - 40;
    if (withinX && closeToTop) {
      body.y = platformTop + body.halfH;
      body.vy = 0;
      return p;
    }
  }
  return null;
}
