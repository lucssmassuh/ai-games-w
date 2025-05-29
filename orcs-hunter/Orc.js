var Orc = cc.Sprite.extend({
    // Animation properties
    ANIMATION_SPEED: 0.1, // 0.2 seconds per frame
    WALK_SPEED: 20, // pixels per second
    DYING_ROW: 4, // Top row (0-indexed) for death animation frames
    isDying: false, // Track if orc is in dying state

    // Constructor
    ctor: function(gameLayer) {
        this._super();
        this.gameLayer = gameLayer; // Store reference to game layer
        this.frames = [];
        this.scheduleUpdate();
    },

    // Update position - always move left
    update: function(dt) {
        // Don't update position if dying
        if (this.isDying) return;

        // Move left
        var pos = this.getPosition();
        pos.x -= this.WALK_SPEED * dt;
        this.setPosition(pos);

        // Remove orc if it goes off screen to the left
        if (pos.x < -this.width) {
            this.removeFromParent();
            if (this.gameLayer && this.gameLayer.orcs) {
                var index = this.gameLayer.orcs.indexOf(this);
                if (index > -1) {
                    this.gameLayer.orcs.splice(index, 1);
                }
            }
        }
    },

    // Initialize with texture
    init: function(texture) {
        // Initialize sprite
        this.initWithTexture(texture);
        
        // Store texture and frame dimensions for death animation
        this.texture = texture;
        this.frameWidth = texture.width / 10; // 10 columns
        this.frameHeight = texture.height / 5; // 5 rows
        
        // Set scale to maintain original size
        this.setScale(1);

        // Create frames from sprite sheet (10 columns x 5 rows)
        var frameWidth = this.frameWidth;
        var frameHeight = this.frameHeight;

        // Use the 3rd row from the bottom (which is row index 2 since y=0 is bottom)
        var row = 2; // 3rd from bottom (rows: 4=bottom, 3, 2, 1, 0=top)
        var directionFrames = [];
        
        // Use first 3 frames from the selected row for walking animation
        for (var col = 0; col < 10; col++) {
            // Calculate frame position
            var x = col * frameWidth;
            var y = row * frameHeight;
            
            // Create frame with proper dimensions, cropping 5 pixels from bottom
            var frame = cc.SpriteFrame.create(
                texture,
                cc.rect(x, y, frameWidth, frameHeight - 5) // Crop 5 pixels from bottom
            );
            frame.setOffset(cc.p(0, 5)); // Adjust offset to compensate for the crop
            
            // Debug logging to verify frame creation
            cc.log('Frame ' + col + ': ' + 
                   x + ',' + y + ' -> ' + 
                   (x + frameWidth) + ',' + (y + frameHeight));
            
            directionFrames.push(frame);
        }
        
        // Use the same frames for all directions since we only have one row of animation
        for (var i = 0; i < 4; i++) {
            this.frames.push(directionFrames);
        }

        // Set initial frame
        this.setSpriteFrame(this.frames[0][0]);

        // Start initial animation
        this.startAnimation();

        return true;
    },

    // Get current frame index
    getCurrentFrameIndex: function() {
        // Get the current action
        var action = this.getActionByTag(1);
        if (action) {
            var animation = action.getAnimation();
            if (animation) {
                var elapsed = action.getElapsed();
                var frameCount = animation.getFrames().length;
                return Math.floor(elapsed / this.ANIMATION_SPEED) % frameCount;
            }
        }
        return 0;
    },

    checkCollisionWith: function(sprite) {
        return cc.rectIntersectsRect(this.getBoundingBox(), sprite.getBoundingBox());
    },



    checkCollisionWith: function(sprite) {
        return cc.rectIntersectsRect(this.getBoundingBox(), sprite.getBoundingBox());
    },
    // Override getBoundingBox to return a smaller collision box (80% of width, 70% of height)
    getBoundingBox: function() {
        var rect = this._super();
        var width = rect.width * 0.6;  // 80% of original width
        var height = rect.height * 0.5; // 70% of original height
        return cc.rect(
            rect.x + (rect.width - width) / 2,  // Center horizontally
            rect.y + (rect.height - height) / 4, // Slightly lower center vertically
            width,
            height
        );
    },
    
    // Play death animation
    die: function() {
        if (this.isDying) return;
        
        this.isDying = true;
        this.stopAllActions();
        
        // Move the orc down by 10 pixels when dying starts
        var moveDown = cc.moveBy(0.1, cc.p(0, -8));
        this.runAction(moveDown);
        
        // Create death animation frames using the specified row in reverse order
        var deathFrames = [];
        var rowY = this.DYING_ROW * this.frameHeight;
        // Loop from last column to first (9 to 0)
        for (var col = 9; col >= 0; col--) {
            var frame = cc.SpriteFrame.create(
                this.texture,
                cc.rect(col * this.frameWidth, rowY, this.frameWidth, this.frameHeight - 5)
            );
            frame.setOffset(cc.p(0, 5));
            deathFrames.push(frame);
        }
        
        // Create and run death animation
        var deathAnim = new cc.Animation(deathFrames, 0.1, 1);
        var deathAnimate = new cc.Animate(deathAnim);
        
        // After animation completes, remove the orc
        var sequence = cc.sequence(
            deathAnimate,
            cc.callFunc(function() {
                this.removeFromParent();
                if (this.gameLayer && this.gameLayer.orcs) {
                    var index = this.gameLayer.orcs.indexOf(this);
                    if (index > -1) {
                        this.gameLayer.orcs.splice(index, 1);
                    }
                }
            }, this)
        );
        
        this.runAction(sequence);
    },
    
    // Start animation for walking left
    startAnimation: function() {
        // Create animation using the first row of frames (left movement)
        var frames = this.frames[0]; // First row is for left movement
        var animation = new cc.Animation(frames, this.ANIMATION_SPEED);
        
        // Create and run action
        var animate = new cc.Animate(animation);
        var repeat = new cc.RepeatForever(animate);
        
        // Set initial frame
        this.setSpriteFrame(frames[0]);
        
        // Run action with tag
        this.stopAllActions();
        this.runAction(repeat, 1); // Tag the action with 1
    }
});

// Make Orc globally available
window.Orc = Orc;
