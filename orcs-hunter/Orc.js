var Orc = cc.Sprite.extend({
    // Animation properties
    ANIMATION_SPEED: 0.13, // seconds per frame
    WALK_SPEED: 15, // pixels per second
    // Sprite rows (0-indexed from bottom)
    WALK_ROW: 2,      // Third row from bottom for walking animation
    ATTACK_ROW: 3,    // Fourth row from bottom for attack animation
    DYING_ROW: 4,     // Top row for death animation frames
    isDying: false,   // Track if orc is in dying state
    isAttacking: false, // Track if orc is in attacking state
    attackPower: 1,     // Points of castle power drained per attack loop
    // Attack zone relative to left edge (px)
    ATTACK_ZONE_MIN_X: 120,
    ATTACK_ZONE_MAX_X: 160,

    // Constructor
    ctor: function(gameLayer) {
        this._super();
        this.gameLayer = gameLayer; // Store reference to game layer
        this.frames = [];
        this.scheduleUpdate();
    },

    // Update position - always move left
    update: function(dt) {
        // Don't update position if dying or attacking
        if (this.isDying || this.isAttacking) return;

        // Move left
        var pos = this.getPosition();
        pos.x -= this.WALK_SPEED * dt;
        this.setPosition(pos);

        // Start attacking when reaching this orc's chosen attackX
        if (!this.isAttacking && this.attackX !== undefined && pos.x <= this.attackX) {
            this.startAttack();
            return;
        }

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

    // Scale factor for the orc (1.0 for regular orcs, can be overridden by subclasses)
    scaleFactor: 1.0,
    // Frame crop amount (5px for regular orcs, 0 for big orcs)
    frameCrop: 5,

    // Initialize with texture
    init: function(texture) {
        // Initialize sprite
        this.initWithTexture(texture);
        
        // Store texture and frame dimensions for death animation
        this.texture = texture;
        this.frameWidth = texture.width / 10; // 10 columns
        this.frameHeight = texture.height / 5; // 5 rows
        
        // Set scale
        this.setScale(this.scaleFactor);


        // Create frames from sprite sheet (10 columns x 5 rows)
        var frameWidth = this.frameWidth;
        var frameHeight = this.frameHeight;

        // Use the WALK_ROW'th row from the bottom for walking animation
        var row = this.WALK_ROW;
        var directionFrames = [];
        
        // Create frames from the sprite sheet
        for (var col = 0; col < 10; col++) {
            // Calculate frame position with crop
            var x = col * frameWidth + (this.frameCrop / 2);
            var y = row * frameHeight + (this.frameCrop / 2);
            var width = frameWidth - this.frameCrop;
            var height = frameHeight - this.frameCrop;
            var frame = cc.SpriteFrame.create(
                texture,
                cc.rect(x, y, width, height)
            );
            frame.setOffset(cc.p(0, crop));
            
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

        // Randomize the exact stop position within the attack zone
        this.attackX = this.ATTACK_ZONE_MIN_X +
                      Math.random() * (this.ATTACK_ZONE_MAX_X - this.ATTACK_ZONE_MIN_X);
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
        var width = rect.width * 0.3;  // 80% of original width
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
            // Regular orcs crop attack/death, big orcs no crop
            var crop = this.attackPower > 1 ? 0 : 5;
            var frame = cc.SpriteFrame.create(
                this.texture,
                cc.rect(col * this.frameWidth, rowY, this.frameWidth, this.frameHeight - crop)
            );
            frame.setOffset(cc.p(0, crop));
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

    /**
     * Enter attacking state: play attack animation in place.
     */
    startAttack: function() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.stopAllActions();
        var attackFrames = [];
        // Build attack frames (reverse order) for correct direction
        for (var col = 9; col >= 0; col--) {
            // Regular orcs crop attack frames by 5px; big orcs don't crop
            var crop = this.attackPower > 1 ? 0 : 5;
            var frame = cc.SpriteFrame.create(
                this.texture,
                cc.rect(
                    col * this.frameWidth,
                    this.ATTACK_ROW * this.frameHeight,
                    this.frameWidth,
                    this.frameHeight - crop
                )
            );
            frame.setOffset(cc.p(0, crop));
            attackFrames.push(frame);
        }
        var attackAnim = new cc.Animation(attackFrames, this.ANIMATION_SPEED);
        var attackAnimate = new cc.Animate(attackAnim);
        // Repeat forever: play animation then deduct attackPower points
        var attackSequence = cc.sequence(
            attackAnimate,
            cc.callFunc(function() {
                if (this.gameLayer && typeof this.gameLayer.decrementCastlePower === 'function') {
                    for (var i = 0; i < this.attackPower; i++) {
                        this.gameLayer.decrementCastlePower();
                    }
                }
            }, this)
        );
        var repeat = new cc.RepeatForever(attackSequence);
        this.runAction(repeat, 2);
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
