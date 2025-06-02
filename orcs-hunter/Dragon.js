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
    // Frames for wing-flapping animation
    frames: [],

    ctor: function() {
        this._super();
        // Load the dragon sprite sheet (4 rows × 3 columns)
        var texture = cc.textureCache.addImage("assets/dragon-red.png");
        if (!texture) {
            cc.error("Failed to load dragon-red.png");
            return;
        }
        this._super(texture);

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
        this.timeElapsed += dt;
        var pos = this.getPosition();
        // Move left
        pos.x -= this.speed * dt;
        // Apply sinusoidal vertical movement around startY
        pos.y = this.startY + this.amplitude * Math.sin(this.frequency * this.timeElapsed);
        this.setPosition(pos);

        // Remove when off-screen to the left
        if (pos.x < -this.getContentSize().width / 2) {
            this.removeFromParent();
        }
    }
});

cc.Dragon = Dragon;