import { drawWelcome } from './welcome.js';

export class SplashScene {
  constructor(game) {
    this.game = game;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= 0.6) this.game.goToMenu();
  }

  onTap() {
    this.game.goToGame();
  }

  render(ctx) {
    drawWelcome(ctx, this.game.assets.images.poster);
  }
}
