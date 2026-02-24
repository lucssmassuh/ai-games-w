import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 400;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'bullet');
    }

    fire(x: number, y: number) {
        if (this.body) {
            this.body.reset(x, y);
        }
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityY(-this.speed);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        if (this.y <= -32) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
