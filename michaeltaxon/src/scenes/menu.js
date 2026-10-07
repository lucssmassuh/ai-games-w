import { hitTest } from '../engine/input.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
    const { width, height } = game.ctx.canvas;
    const img = game.assets.images.play;
    this.playRect = {
      x: width / 2 - img.width / 2,
      y: height / 2 + 40,
      w: img.width,
      h: img.height,
    };
  }

  update() {}

  onTap(point) {
    if (point === null || hitTest(this.playRect, point)) {
      this.game.goToGame();
    }
  }

  render(ctx) {
    const { images } = this.game.assets;
    const { width, height } = ctx.canvas;
    const bg = images.menuBackground;
    ctx.drawImage(bg, width / 2 - bg.width / 2, height / 2 - bg.height / 2);

    ctx.save();
    const bob = Math.sin(performance.now() / 300) * 6;
    ctx.drawImage(images.play, this.playRect.x, this.playRect.y + bob);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('Mikael Tax-On', width / 2, 90);
    ctx.fillText('Mikael Tax-On', width / 2, 90);
  }
}
