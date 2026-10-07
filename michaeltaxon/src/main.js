import { loadAll } from './engine/assets.js';
import { bindTap } from './engine/input.js';
import { loadLevel } from './level.js';
import { SplashScene } from './scenes/splash.js';
import { MenuScene } from './scenes/menu.js';
import { GameScene } from './scenes/game.js';

const MANIFEST = {
  splash: 'assets/gfx/splash.png',
  menuBackground: 'assets/gfx/menu/menu_background2.png',
  play: 'assets/gfx/menu/play.png',
  calendar: 'assets/gfx/game/calendar.png',
  aguinaldo: 'assets/gfx/game/aguinaldo.png',
  bill: 'assets/gfx/game/bill.png',
  player: 'assets/gfx/game/mw2.png',
  boss: 'assets/gfx/game/boss.png',
  boss2: 'assets/gfx/game/kris.png',
  bomb: 'assets/gfx/game/bomb.png',
  star: 'assets/gfx/game/star.png',
  levelCompleteWindow: 'assets/gfx/game/levelCompleteWindow.png',
};

class Game {
  constructor(canvas, assets, level) {
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.level = level;
    this.scene = new SplashScene(this);
    bindTap(canvas, (point) => this.scene.onTap(point));
  }

  goToMenu() {
    this.scene = new MenuScene(this);
  }

  goToGame() {
    this.scene = new GameScene(this, this.level);
  }

  update(dt) {
    this.scene.update(dt);
  }

  render() {
    this.scene.render(this.ctx);
  }
}

async function boot() {
  const canvas = document.getElementById('game-canvas');
  const [assets, level] = await Promise.all([
    loadAll(MANIFEST),
    loadLevel('assets/level/level2.xml'),
  ]);

  const game = new Game(canvas, { images: assets }, level);

  // Driven by setInterval rather than requestAnimationFrame: rAF is tied to
  // compositor paint timing, which some embedded/background browser
  // contexts never schedule, silently stalling the whole game loop.
  // setInterval runs regardless and is plenty precise for a 2D game like
  // this one.
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt);
    game.render();
  }, 1000 / 60);
}

boot().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:red">${err.stack || err}</pre>`;
});
