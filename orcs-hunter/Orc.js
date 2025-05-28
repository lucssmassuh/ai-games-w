var Orc = cc.Sprite.extend({
    // Animation properties
    ANIMATION_SPEED: 0.2, // 0.2 seconds per frame
    WALK_SPEED: 100, // pixels per second

    // Constructor
    ctor: function(gameLayer) {
        this._super();
        this.gameLayer = gameLayer; // Store reference to game layer
        this.frames = [];
        this.scheduleUpdate();
    },

    // Update position - always move left
    update: function(dt) {
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
        
        // Set scale
        this.setScale(1.5);

        // Create frames from sprite sheet
        var frameWidth = texture.width / 3;
        var frameHeight = texture.height / 4;

        // Only use the first row (top row) of the sprite sheet
        var row = 3; // First row from the bottom (since y=0 is at the bottom)
        var directionFrames = [];
        
        for (var col = 0; col < 3; col++) {
            // Calculate frame position
            var x = col * frameWidth;
            var y = row * frameHeight;
            
            // Create frame with proper dimensions
            var frame = cc.SpriteFrame.create(
                texture,
                cc.rect(x, y, frameWidth, frameHeight)
            );
            
            // Debug logging to verify frame creation
            cc.log('Frame ' + col + ': ' + 
                   x + ',' + y + ' -> ' + 
                   (x + frameWidth) + ',' + (y + frameHeight));
            
            directionFrames.push(frame);
        }
        
        // Use the same frames for all directions since we only have one row
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
