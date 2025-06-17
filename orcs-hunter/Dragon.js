// Dragon.js

var Dragon = cc.Sprite.extend({
    // Horizontal speed in pixels per second
    speed: 100,
    // Vertical oscillation amplitude in pixels
    amplitude: 60,
    // Oscillation frequency in radians per second
    frequency: 2,
    // Time accumulator for sine movement
    timeElapsed: 0,
    // Track if dragon is dying (should fall)
    isDying: false,
    // Track if dragon is in attacking state
    isAttacking: false,
    // Points of castle power drained per attack loop
    attackPower: 8,
    // Attack zone relative to left edge (px)
    ATTACK_ZONE_MIN_X: 120,
    ATTACK_ZONE_MAX_X: 160,
    // Speed at which dragon falls when dying (pixels/sec)
    fallSpeed: 200,

    // Health properties for dragon enemies (HP points)
    maxHealth: 3,
    health: 3,

    ctor: function(gameLayer) {
        // Initialize frames arrays
        this.frames = [];
        this.deathFrames = [];
        
        // Load the dragon sprite sheet (4 rows × 3 columns)
        var texture = cc.textureCache.addImage("assets/dragon-red.png");
        if (!texture) {
            cc.error("Failed to load dragon-red.png");
            return;
        }
        this._super(texture);
        this.gameLayer = gameLayer;

        // Sprite sheet dimensions (cols × rows)
        var cols = 3;
        var rows = 4;
        // Store texture and frame dimensions for animations
        this.texture = texture;
        this.frameWidth = texture.width / cols;
        this.frameHeight = texture.height / rows;
        // Extract flapping (flying) animation frames from top row (last row)
        var y = (rows - 1) * this.frameHeight;
        for (var i = 0; i < cols; i++) {
            this.frames.push(
                new cc.SpriteFrame(
                    this.texture,
                    cc.rect(i * this.frameWidth, y, this.frameWidth, this.frameHeight)
                )
            );
        }

        // Initialize with the first frame and set up appearance
        this.setSpriteFrame(this.frames[0]);
        this.setAnchorPoint(0.5, 0.5);
        this.setContentSize(cc.size(this.frameWidth, this.frameHeight));

        // Prepare death animation frames from bottom row (first row)
        var deathY = 0;
        for (var j = 0; j < cols; j++) {
            this.deathFrames.push(
                new cc.SpriteFrame(
                    this.texture,
                    cc.rect(j * this.frameWidth, deathY, this.frameWidth, this.frameHeight)
                )
            );
        }

        // Start off-screen on the right, a bit lower than center
        var startX = cc.winSize.width + this.frameWidth / 2;
        var startY = cc.winSize.height / 2 - 20;
        this.setPosition(startX, startY);
        this.startY = startY;
        
        // Scale down the dragon
        this.setScale(0.5);
        // Randomize the exact stop position within the attack zone
        this.attackX = this.ATTACK_ZONE_MIN_X +
                      Math.random() * (this.ATTACK_ZONE_MAX_X - this.ATTACK_ZONE_MIN_X);

        // Run flapping animation loop
        var animation = new cc.Animation(this.frames, 0.15);
        animation.setLoops(cc.REPEAT_FOREVER);
        this.runAction(cc.animate(animation));

        // Schedule update for movement
        this.scheduleUpdate();
    },

    update: function(dt) {
        // If dying, let the dragon fall until off-screen, then clean up
        if (this.isDying) {
            var pos = this.getPosition();
            pos.y -= this.fallSpeed * dt;
            this.setPosition(pos);
            if (pos.y < -this.getContentSize().height * this.getScaleY()) {
                this.removeFromParent();
                // Remove from game layer tracking
                if (this.gameLayer && this.gameLayer.dragons) {
                    var idx = this.gameLayer.dragons.indexOf(this);
                    if (idx > -1) {
                        this.gameLayer.dragons.splice(idx, 1);
                    }
                }
            }
            return;
        }

        if (this.isAttacking) {
            return;
        }
        // Normal flight: sine-wave vertical movement and leftward motion
        this.timeElapsed += dt;
        var pos = this.getPosition();
        pos.x -= this.speed * dt;
        pos.y = this.startY + this.amplitude * Math.sin(this.frequency * this.timeElapsed);
        this.setPosition(pos);

        // Start attacking when reaching attack zone
        if (!this.isAttacking && this.attackX !== undefined && pos.x <= this.attackX) {
            this.startAttack();
            return;
        }

        // Remove when fully off-screen to the left
        if (pos.x < -this.getContentSize().width / 2) {
            this.removeFromParent();
        }
    },

    // Trigger death animation and start falling
    die: function() {
        if (this.isDying) return;
        this.isDying = true;
        this.stopAllActions();
        // Play death animation loop from first-row frames
        var deathAnim = new cc.Animation(this.deathFrames, 0.15);
        deathAnim.setLoops(cc.REPEAT_FOREVER);
        this.runAction(cc.animate(deathAnim));
    },

    /**
     * Apply damage to the dragon: subtract health by amount, die if health <= 0.
     * @param {number} amount - Damage amount
     */
    takeDamage: function(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
        }
    },

    /**
     * Enter attacking state: play attack animation and drain castle power.
     */
    startAttack: function() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.stopAllActions();
        if (this.gameLayer && this.gameLayer.hero) {
            var hero = this.gameLayer.hero;
            var heroTop = hero.getPosition().y + hero.getContentSize().height * hero.getScaleY() / 2;
            this.setPosition(this.attackX, heroTop - 10);
        }
        var attackFrames = [];
        var attackRow = 2;
        for (var i = 0; i < 3; i++) {
            attackFrames.push(
                new cc.SpriteFrame(
                    this.texture,
                    cc.rect(i * this.frameWidth, attackRow * this.frameHeight,
                            this.frameWidth, this.frameHeight)
                )
            );
        }
        var attackAnimate = new cc.Animate(new cc.Animation(attackFrames, 0.15));
        var attackSequence = cc.sequence(
            attackAnimate,
            cc.callFunc(function() {
                if (this.gameLayer && typeof this.gameLayer.decrementCastlePower === 'function') {
                    for (var j = 0; j < this.attackPower; j++) {
                        this.gameLayer.decrementCastlePower();
                    }
                }
            }, this)
        );
        this.runAction(new cc.RepeatForever(attackSequence));
    },

    /**
     * Override getBoundingBox to shrink dragon collision box by 50%.
     */
    getBoundingBox: function() {
        var rect = this._super();
        var width = rect.width * 0.5;
        var height = rect.height * 0.5;
        return cc.rect(
            rect.x + (rect.width - width) / 2,
            rect.y + (rect.height - height) / 2,
            width,
            height
        );
    }
});

cc.Dragon = Dragon;