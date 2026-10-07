# Mikael Tax-On — Web Edition

A browser port of the original Android game **"Mikael Tax-On"** (built with
AndEngine + Box2D), a side-scrolling runner where you dash across the months
of the year collecting pesos while Argentine payroll taxes nibble away at
your paycheck.

This port is a dependency-free, vanilla JS/Canvas2D game (ES modules, no
build step). See [`PORTING_NOTES.md`](PORTING_NOTES.md) for why it isn't
literally running on the cocos2d engine, and what was faithfully kept vs.
adapted from the original Java source.

## Running it

Browsers block `fetch()` of local files from `file://`, so serve the folder
over HTTP:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Controls

Tap/click, or press **Space**, **↑**, or **Enter** — all do the same thing:

- **Tap / click** once the run starts: jump over gaps.
- During the Aguinaldo (mid-year bonus) and Fin de Año (year-end) sections,
  tap to turn around while "moonwalking" to dodge bombs and catch falling
  bills.
- Reach the end-of-year star to see your gross pay broken down by
  Pension Fund (SIPA), Healthcare (Obra Social), Social Services (PAMI)
  and Income Tax (Ganancias) down to a final score.

## Project layout

```
index.html / style.css   canvas shell
src/main.js              boot + game loop
src/engine/              tiny canvas engine (assets, sprite sheets, camera, input)
src/physics.js           simplified arcade gravity/platform physics
src/tax.js               payroll-tax calculation (ported from GameScene#calculateSalary)
src/level.js             .lvl (XML) level loader, same format as the original
src/entities/            Player, Boss, Bomb, Coin
src/scenes/              Splash, Menu, Game scenes
assets/                  original sprite sheets, font and level XML, copied as-is
```
