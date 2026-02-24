import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 300;
    private bullets: Phaser.Physics.Arcade.Group;
    private lastFired: number = 0;
    private fireDelay: number = 200;

    constructor(scene: Phaser.Scene, x: number, y: number, bullets: Phaser.Physics.Arcade.Group) {
        super(scene, x, y, 'player'); // 'player' key will be loaded in PreloadScene

        this.bullets = bullets;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set collide world bounds
        this.setCollideWorldBounds(true);
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        if (!cursors) return;

        this.setVelocity(0);

        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
        }

        if (cursors.up.isDown) {
            this.setVelocityY(-this.speed);
        } else if (cursors.down.isDown) {
            this.setVelocityY(this.speed);
        }

        if (cursors.space.isDown) {
            this.shoot();
        }
    }

    private shoot() {
        const time = this.scene.time.now;
        if (time > this.lastFired) {
            const bullet = this.bullets.get(this.x, this.y - 20);
            if (bullet) {
                bullet.fire(this.x, this.y - 20);
                this.lastFired = time + this.fireDelay;
            }
        }
    }
}
