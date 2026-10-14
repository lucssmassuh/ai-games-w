import { drawWelcome } from './welcome.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
  }

  update() {}

  onTap() {
    this.game.goToGame();
  }

  render(ctx) {
    drawWelcome(ctx, this.game.assets.images.poster);
  }
}
