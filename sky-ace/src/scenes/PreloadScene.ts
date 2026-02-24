import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Player placeholder (Green Triangle)
        const playerGraphics = this.make.graphics({ x: 0, y: 0 });
        playerGraphics.fillStyle(0x00ff00, 1);
        playerGraphics.beginPath();
        playerGraphics.moveTo(0, 0);
        playerGraphics.lineTo(15, 30);
        playerGraphics.lineTo(-15, 30);
        playerGraphics.closePath();
        playerGraphics.fillPath();
        playerGraphics.generateTexture('player', 30, 30);

        // Bullet placeholder (Yellow Rectangle)
        const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
        bulletGraphics.fillStyle(0xffff00, 1);
        bulletGraphics.fillRect(0, 0, 5, 10);
        bulletGraphics.generateTexture('bullet', 5, 10);

        // Enemy placeholder (Red Square)
        const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
        enemyGraphics.fillStyle(0xff0000, 1);
        enemyGraphics.fillRect(0, 0, 30, 30);
        enemyGraphics.generateTexture('enemy', 30, 30);

        // Background placeholder (Starfield-ish)
        const bgGraphics = this.make.graphics({ x: 0, y: 0 });
        bgGraphics.fillStyle(0x000000, 1);
        bgGraphics.fillRect(0, 0, 800, 600);
        bgGraphics.fillStyle(0xffffff, 1);
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            bgGraphics.fillCircle(x, y, 1);
        }
        bgGraphics.generateTexture('background', 800, 600);
    }

    create() {
        this.scene.start('GameScene');
    }
}
