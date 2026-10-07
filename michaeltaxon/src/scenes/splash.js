export class SplashScene {
  constructor(game) {
    this.game = game;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed >= 2) {
      this.game.goToMenu();
    }
  }

  onTap() {}

  render(ctx) {
    const { images } = this.game.assets;
    const { width, height } = ctx.canvas;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const img = images.splash;
    const scale = 1.5;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, width / 2 - w / 2, height / 2 - h / 2, w, h);
  }
}
