var Orc = cc.Sprite.extend({
    // Directions
    DIRECTIONS: {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3
    },

    // Animation properties
    ANIMATION_SPEED: 0.2, // 0.2 seconds per frame
    WALK_SPEED: 100, // pixels per second
    DIRECTION_CHANGE_INTERVAL: 1.0, // Change direction every 1 second

    // Constructor
    ctor: function() {
        this._super();
        this.frames = [];
        this.currentDirection = this.DIRECTIONS.DOWN;
        this.schedule(this.changeDirection, this.DIRECTION_CHANGE_INTERVAL);
        this.scheduleUpdate();
    },

    // Update method with debug
    update: function(dt) {
        // Debug current frame
        var currentFrame = this.getCurrentFrameIndex();
        cc.log('Current frame: ' + currentFrame);

        // Update position based on direction
        var dx = 0, dy = 0;
        
        switch (this.currentDirection) {
            case this.DIRECTIONS.UP:
                dy = this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.RIGHT:
                dx = this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.DOWN:
                dy = -this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.LEFT:
                dx = -this.WALK_SPEED * dt;
                break;
        }

        // Update position
        var pos = this.getPosition();
        pos.x += dx;
        pos.y += dy;
        this.setPosition(pos);
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

        // Create frames for each direction
        for (var row = 0; row < 4; row++) {
            var directionFrames = [];
            for (var col = 0; col < 3; col++) {
                // Calculate frame position
                var x = col * frameWidth;
                var y = (3 - row) * frameHeight;
                
                // Create frame with proper dimensions
                var frame = cc.SpriteFrame.create(
                    texture,
                    cc.rect(x, y, frameWidth, frameHeight)
                );
                
                // Debug logging to verify frame creation
                cc.log('Frame ' + row + ',' + col + ': ' + 
                       x + ',' + y + ' -> ' + 
                       (x + frameWidth) + ',' + (y + frameHeight));
                
                directionFrames.push(frame);
            }
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

    // Start animation for current direction
    startAnimation: function() {
        // Create animation
        var frames = this.frames[this.currentDirection];
        var animation = new cc.Animation(frames, this.ANIMATION_SPEED);
        
        // Create and run action
        var animate = new cc.Animate(animation);
        var repeat = new cc.RepeatForever(animate);
        
        // Set initial frame
        this.setSpriteFrame(frames[0]);
        
        // Run action with tag
        this.stopAllActions();
        this.runAction(repeat.clone(), 1); // Tag the action with 1
    },

    // Change direction randomly
    changeDirection: function() {
        // Get new direction (0-3)
        this.currentDirection = Math.floor(Math.random() * 4);
        
        // Start new animation
        this.startAnimation();
    },

    // Update position based on direction
    update: function(dt) {
        // Debug current frame
        var currentFrame = this.getCurrentFrameIndex();
        cc.log('Current frame: ' + currentFrame);

        var dx = 0, dy = 0;
        
        // Calculate movement based on direction
        switch (this.currentDirection) {
            case this.DIRECTIONS.UP:
                dy = this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.RIGHT:
                dx = this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.DOWN:
                dy = -this.WALK_SPEED * dt;
                break;
            case this.DIRECTIONS.LEFT:
                dx = -this.WALK_SPEED * dt;
                break;
        }

        // Update position
        var pos = this.getPosition();
        pos.x += dx;
        pos.y += dy;
        this.setPosition(pos);
    }
});

// Make Orc globally available
window.Orc = Orc;
