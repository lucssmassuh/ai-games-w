// Hero.js

var Hero = cc.Sprite.extend({
    frames: [],
    moveFrames: [],
    isMoving: false,
    direction: 'down',
    keyPressed: {},

    ctor: function() {
        this._super();
        this.arrows = []; // Initialize arrows array
        this.isShooting = false; // Initialize shooting state
        this.initHero();
    },

    initHero: function() {
        // Initialize hero
        var texture = cc.textureCache.addImage("assets/hero.png");
        this.frameWidth = texture.width / 7; // 7 frames in a single row
        this.frameHeight = texture.height;

        // Load all frames
        for (var x = 0; x < 7; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * this.frameWidth, 0, this.frameWidth, this.frameHeight)
            );
            this.frames.push(frame);
        }
        
        // Create walking animation frames (only frames 1 and 2, frame 0 is for standing)
        this.walkFrames = [this.frames[1], this.frames[2]];
        // Create shooting animation frames (frames 3,4)
        this.shootFrames = [this.frames[3], this.frames[4]];

        // Set initial sprite
        this.setSpriteFrame(this.frames[0]);
        // Position hero at the left side, above the second row of castle tiles
        var startX = 50; // Position from the left edge of the screen
        var startY = 220; // Position above the second row of castle tiles (adjust if needed)
        this.setPosition(startX, startY);
        this.setAnchorPoint(0.5, 0.5);  // Center anchor point for hero
        this.setScale(1.8); // Slightly larger to be visible above the castle



        // Initialize event listeners
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);

        this.scheduleUpdate();
    },



    onKeyPressed: function(keyCode, event) {
        this.keyPressed[keyCode] = true;
        
        // Check if space bar is pressed and shoot arrow
        if (keyCode === cc.KEY.space) {
            this.shootArrow();
        }
    },

    onKeyReleased: function(keyCode, event) {
        this.keyPressed[keyCode] = false;
    },

    shootArrow: function() {
        // Don't shoot if already shooting
        if (this.isShooting) return;
        
        this.isShooting = true;
        
        // Stop current actions but save the movement state
        var wasMoving = this.isMoving;
        this.stopAllActions();
        
        // Set shooting frames (frames 3,4)
        var shootAnim = new cc.Animation(this.shootFrames, 0.1);
        var animate = cc.animate(shootAnim);
        
        // Create sequence: play shoot animation, then return to appropriate state
        var sequence = cc.sequence(
            animate,
            cc.callFunc(function() {
                // Create and fire the arrow at the end of the shooting animation
                var pos = this.getPosition();
                var arrow = new Arrow(this.direction, pos);
                this.parent.addChild(arrow);
                this.arrows.push(arrow);
                
                // Reset shooting state
                this.isShooting = false;
                
                // Return to walking animation if we were moving
                if (wasMoving) {
                    if (this.direction === 'right') {
                        this.startMoveRight();
                    } else {
                        this.startMoveLeft();
                    }
                } else {
                    // Return to standing frame if not moving
                    this.setSpriteFrame(this.frames[0]);
                }
            }, this)
        );
        
        this.runAction(sequence);
    },

    update: function(dt) {
        // Handle movement - only horizontal now
        if (this.keyPressed[cc.KEY.right]) {
            if (!this.isMoving || this.direction !== 'right') {
                this.startMoveRight();
            }
        } else if (this.keyPressed[cc.KEY.left]) {
            if (!this.isMoving || this.direction !== 'left') {
                this.startMoveLeft();
            }
        } else if (this.isMoving) {
            // No movement keys pressed but we're still moving - stop movement
            this.stopMoving();
        }
    },

    stopMoving: function() {
        this.isMoving = false;
        this.stopAllActions();
        this.setSpriteFrame(this.frames[0]); // Return to first frame
    },
    
    startWalkingAnimation: function() {
        // Stop any existing animations
        this.stopAllActions();
        
        // Create and start the walking animation loop (only between frames 1 and 2)
        var walkAnim = new cc.Animation(this.walkFrames, 0.2);
        walkAnim.setLoops(cc.REPEAT_FOREVER);
        this.walkAction = cc.animate(walkAnim);
        this.runAction(this.walkAction);
    },

    startMoveRight: function() {
        this.isMoving = true;
        this.direction = 'right';
        this.setFlippedX(false);
        
        // Start the walking animation immediately
        this.startWalkingAnimation();
        
        // Move right
        var moveAction = cc.moveBy(1, cc.p(100, 0));
        
        // Create sequence for movement
        var sequence = cc.sequence(
            moveAction,
            cc.callFunc(function() {
                this.stopMoving();
            }, this)
        );
        
        // Run movement sequence
        this.runAction(sequence);
    },

    startMoveLeft: function() {
        this.isMoving = true;
        this.direction = 'left';
        this.setFlippedX(true);
        
        // Start the walking animation immediately
        this.startWalkingAnimation();
        
        // Move left
        var moveAction = cc.moveBy(1, cc.p(-100, 0));
        
        // Create sequence for movement
        var sequence = cc.sequence(
            moveAction,
            cc.callFunc(function() {
                this.stopMoving();
            }, this)
        );
        
        // Run movement sequence
        this.runAction(sequence);
    },

    // Removed vertical movement functions as we only support horizontal movement now
});

// Register the Hero class
cc.Hero = Hero;

// Ensure the Hero class is properly initialized when the script loads
cc.Hero.prototype.initHero = Hero.prototype.initHero;