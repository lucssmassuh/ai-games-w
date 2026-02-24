import Phaser from 'phaser';
import Player from '../objects/Player';
import Bullet from '../objects/Bullet';
import Enemy from '../objects/Enemy';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private background!: Phaser.GameObjects.TileSprite;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private enemySpawnTimer: number = 0;

    constructor() {
        super('GameScene');
    }

    create() {
        // Create scrolling background
        this.background = this.add.tileSprite(400, 300, 800, 600, 'background');

        // Create bullet group
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        // Create enemy group
        this.enemies = this.physics.add.group({
            classType: Enemy,
            maxSize: 20,
            runChildUpdate: true
        });

        // Create player
        this.player = new Player(this, 400, 500, this.bullets);

        // Setup input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
    }

    update(_time: number, delta: number) {
        // Scroll background
        this.background.tilePositionY -= 2;

        this.player.update(this.cursors);

        // Spawn enemies
        this.enemySpawnTimer += delta;
        if (this.enemySpawnTimer > 1000) {
            const enemy = this.enemies.get(Phaser.Math.Between(50, 750), -50);
            if (enemy) {
                enemy.setActive(true);
                enemy.setVisible(true);
                enemy.body.reset(Phaser.Math.Between(50, 750), -50);
                enemy.setVelocityY(100);
                enemy.setVelocityX(Phaser.Math.Between(-50, 50));
            }
            this.enemySpawnTimer = 0;
        }
    }

    private handleBulletEnemyCollision(obj1: any, obj2: any) {
        const bullet = obj1 as Bullet;
        const enemy = obj2 as Enemy;

        bullet.setActive(false);
        bullet.setVisible(false);

        enemy.setActive(false);
        enemy.setVisible(false);
        if (enemy.body) {
            enemy.body.reset(-100, -100); // Move off screen
        }
    }

    private handlePlayerEnemyCollision(_obj1: any, _obj2: any) {
        // Game Over logic here
        this.scene.restart();
    }
}
