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
    // Speed at which dragon falls when dying (pixels/sec)
    fallSpeed: 200,

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

        var cols = 3;
        var rows = 4;
        var frameWidth = texture.width / cols;
        var frameHeight = texture.height / rows;
        // Extract only the last row for flapping animation
        var y = (rows - 1) * frameHeight;
        for (var i = 0; i < cols; i++) {
            this.frames.push(
                new cc.SpriteFrame(texture,
                    cc.rect(i * frameWidth, y, frameWidth, frameHeight)
                )
            );
        }

        // Initialize with the first frame and set up appearance
        this.setSpriteFrame(this.frames[0]);
        this.setAnchorPoint(0.5, 0.5);
        this.setContentSize(cc.size(frameWidth, frameHeight));

        // Prepare death animation frames from first row
        var deathY = 0;
        for (var j = 0; j < cols; j++) {
            this.deathFrames.push(
                new cc.SpriteFrame(
                    texture,
                    cc.rect(j * frameWidth, deathY, frameWidth, frameHeight)
                )
            );
        }

        // Start off-screen on the right, vertically centered
        var startX = cc.winSize.width + frameWidth / 2;
        var startY = cc.winSize.height / 2;
        this.setPosition(startX, startY);
        this.startY = startY;
        
        // Scale down the dragon
        this.setScale(0.5);

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

        // Normal flight: sine-wave vertical movement and leftward motion
        this.timeElapsed += dt;
        var pos = this.getPosition();
        pos.x -= this.speed * dt;
        pos.y = this.startY + this.amplitude * Math.sin(this.frequency * this.timeElapsed);
        this.setPosition(pos);

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
    }
});

cc.Dragon = Dragon;