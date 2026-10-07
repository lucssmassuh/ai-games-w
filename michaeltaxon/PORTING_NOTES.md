# Porting notes

## About "use cocos2d"

The original ask was to port the game using cocos2d. I looked into it before
writing any game code:

- **Cocos2d-HTML5** (the only `cocos2d-*` package on npm) is a raw,
  test-harness-oriented source tree from ~2014. It has no single bundled
  file for a `<script>` tag — it boots via a synchronous XHR module loader
  (`lib/cc.js`) that pulls in dozens of individual source files and expects
  a specific test-runner project layout. It's unmaintained and not meant to
  be dropped into a plain static site.
- **Cocos2d-JS** (the version with a real `cocos2d-js-min.js` bundle used by
  old tutorials) was merged into Cocos2d-x at v3.7 and is no longer
  published or distributed as a standalone web bundle; what you can get
  today is Cocos Creator, which needs its own editor/build pipeline, not a
  single HTML file.

Given that, I built the port as a small, dependency-free Canvas2D engine
instead, organized the same way a cocos2d game would be (Scene classes, a
camera, tiled sprite sheets, a simple animator) so the structure should feel
familiar — just without a defunct dependency. If you'd rather I wire this
into a real engine (Phaser and PixiJS are both actively maintained and have
real CDN bundles), that's a quick follow-up — just ask.

## What's faithfully ported vs. adapted

Ported 1:1 from the Java source:

- Level layout, all entity positions (`assets/level/level2.xml`, copied
  verbatim from `assets/level/2.lvl`).
- Game flow: run → jump over gaps → Aguinaldo (bonus) event → moonwalk +
  raining bills + flying boss dropping bombs → Fin de Año (year-end) event,
  same pattern → level-complete marker → salary summary.
- Tax formula and rates: Pension Fund/SIPA 11%, Healthcare/Obra Social 3%,
  Social Services/PAMI 3% — all flat on gross (no monthly cap modeled; none
  was specified for this game's numbers) — plus Income Tax (Ganancias) on
  the excess above a non-taxable minimum of `15000 * 13` (see `src/tax.js`,
  matches `GameScene#calculateSalary`; the original's Spanish labels were
  "Ley 19.032", "Jubilación" and "Obra Social" for the same three). Income
  Tax was upgraded from the original's flat 35% to the real progressive
  AFIP bracket schedule (5%→35% across 9 brackets) at the user's request —
  note the brackets are denominated in millions of pesos while in-game
  earnings top out in the hundreds of thousands, so in
  practice a full playthrough lands entirely in the 5% bottom bracket.
- Reward/penalty amounts: +$8000 per bill, -$1500 per bomb hit.
- The single reusable `Bomb` instance and its fall → explode → reload cycle
  and timing.
- The level-complete screen always shows 2 of 3 stars — that's hardcoded in
  the original (`StarsCount.TWO`) and kept as-is rather than "fixed".

Adapted (physics/engine differences, not gameplay differences):

- Box2D was replaced with simple gravity + AABB platform landing
  (`src/physics.js`). Speeds/gravity were re-tuned in pixel units to match
  the feel of the original jump arcs over the platform gaps, since the
  original tuned its Box2D world in meters via a pixel-to-meter ratio that
  doesn't carry over directly.
- The salary breakdown text in the original has a float-formatting quirk
  (Java operator-precedence bug: `(int)ingresoBruto * rate` casts only the
  bruto, not the product, so two of the four deduction lines print
  undisplayed decimals). The web version truncates all four deductions
  consistently instead of reproducing that display bug.
- Bomb-vs-ground contact (originally "touches the aguinaldo/fin-de-año
  platform body") is approximated as "falls below y=160", since there's no
  Box2D contact listener here.
