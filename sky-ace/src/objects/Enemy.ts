import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 100;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'enemy');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setVelocityY(this.speed);
        this.setVelocityX(Phaser.Math.Between(-50, 50));
    }

    update() {
        // "Stick around" logic: Bounce off walls
        if (this.x < 0 || this.x > 800) {
            this.setVelocityX(-this.body!.velocity.x);
        }

        // If they go off the bottom, wrap to top? Or bounce up?
        // Let's make them bounce up if they hit the bottom, but only once or twice?
        // Or maybe just wrap around to top
        if (this.y > 600) {
            this.y = -50;
            this.x = Phaser.Math.Between(50, 750);
        }
    }
}
