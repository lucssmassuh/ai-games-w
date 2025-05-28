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
        this.chargeStartTime = 0; // When charging started
        this.isCharging = false; // If currently charging a shot
        this.maxChargeTime = 1.5; // Maximum charge time in seconds
        this.minArrowSpeed = 300; // Minimum arrow speed
        this.maxArrowSpeed = 1000; // Maximum arrow speed
        
        // Charge bar properties
        this.chargeBar = {
            width: 40,  // 2x smaller (was 80)
            height: 3,  // Slightly thinner (was 5)
            padding: 1, // Smaller padding (was 2)
            bgColor: cc.color(100, 100, 100, 200),
            fillColor: cc.color(255, 255, 255, 255)
        };
        
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
        
        // Create charge bar
        this.createChargeBar();

        // Initialize event listeners
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);

        this.scheduleUpdate();
    },
    
    createChargeBar: function() {
        // Create background of the charge bar
        this.chargeBar.bg = new cc.DrawNode();
        this.chargeBar.fill = new cc.DrawNode();
        
        // Position the bar above the hero's head
        var yOffset = this.frameHeight * 0.5 + 20; // 20 pixels above the hero's head (was 10)
        this.chargeBar.bg.setAnchorPoint(0.5, 0.5);
        this.chargeBar.fill.setAnchorPoint(0, 0.5); // Left-aligned fill with center Y
        
        // Position the bar to the right of the hero's center
        var xOffset = this.frameWidth * 0.3; // Move right by 30% of hero's width
        this.chargeBar.bg.setPosition(xOffset, yOffset);
        this.chargeBar.fill.setPosition(xOffset - this.chargeBar.width/2, yOffset); // Keep fill aligned with background
        
        // Add to hero
        this.addChild(this.chargeBar.bg);
        this.addChild(this.chargeBar.fill);
        
        // Initially hide the charge bar
        this.chargeBar.bg.setVisible(false);
        this.chargeBar.fill.setVisible(false);
    },
    
    updateChargeBar: function(progress) {
        // Show bar when charging starts
        if (!this.chargeBar.bg.isVisible()) {
            this.chargeBar.bg.setVisible(true);
            this.chargeBar.fill.setVisible(true);
        }
        
        // Clear previous drawings
        this.chargeBar.bg.clear();
        this.chargeBar.fill.clear();
        
        // Draw background
        var bgX = -this.chargeBar.width / 2;
        var bgY = 0;
        this.chargeBar.bg.drawRect(
            cc.p(bgX, bgY),
            cc.p(bgX + this.chargeBar.width, bgY + this.chargeBar.height),
            this.chargeBar.bgColor, 1, this.chargeBar.bgColor
        );
        
        // Draw fill based on progress (0 to 1)
        var fillWidth = Math.max(0, (this.chargeBar.width - this.chargeBar.padding * 2) * progress);
        if (fillWidth > 0) {
            var fillX = bgX + this.chargeBar.padding;
            var fillY = bgY + this.chargeBar.padding;
            this.chargeBar.fill.drawRect(
                cc.p(fillX, fillY),
                cc.p(fillX + fillWidth, fillY + (this.chargeBar.height - this.chargeBar.padding * 2)),
                this.chargeBar.fillColor, 1, this.chargeBar.fillColor
            );
        }
    },
    
    hideChargeBar: function() {
        this.chargeBar.bg.setVisible(false);
        this.chargeBar.fill.setVisible(false);
    },

    onKeyPressed: function(keyCode, event) {
        this.keyPressed[keyCode] = true;
        
        // Start charging when space is pressed
        if (keyCode === cc.KEY.space && !this.isShooting && !this.isCharging) {
            this.startCharging();
        }
    },
    
    onKeyReleased: function(keyCode, event) {
        this.keyPressed[keyCode] = false;
        
        // Shoot when space is released if we were charging
        if (keyCode === cc.KEY.space && this.isCharging) {
            this.releaseArrow();
        }
    },
    
    startCharging: function() {
        if (this.isShooting) return;
        
        this.isCharging = true;
        this.chargeStartTime = Date.now() / 1000; // Store start time in seconds
        
        // Set to frame 3 for charging
        this.setSpriteFrame(this.frames[3]);
        
        // Show and reset charge bar
        this.updateChargeBar(0);
    },
    
    releaseArrow: function() {
        if (!this.isCharging) return;
        
        // Calculate charge duration (0 to maxChargeTime)
        var chargeTime = (Date.now() / 1000) - this.chargeStartTime;
        chargeTime = Math.min(Math.max(0, chargeTime), this.maxChargeTime);
        
        // Calculate speed based on charge time (ease-out curve)
        var t = chargeTime / this.maxChargeTime;
        var speed = this.minArrowSpeed + (this.maxArrowSpeed - this.minArrowSpeed) * t * t;
        
        // Shoot with calculated speed
        this.shootArrow(speed);
        
        // Reset charging state
        this.isCharging = false;
        this.hideChargeBar();
        this.setScale(1.8); // Reset scale
        this.setSpriteFrame(this.frames[0]); // Return to standing frame
    },
    
    shootArrow: function(speed) {
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
                // Create and fire the arrow with calculated speed
                var pos = this.getPosition();
                var arrow = new Arrow(this.direction, pos, speed);
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
        } else if (this.isMoving && !this.isCharging) {  // Don't stop moving if charging
            // No movement keys pressed but we're still moving - stop movement
            this.stopMoving();
        }
        
        // Update charge bar if charging
        if (this.isCharging) {
            var chargeTime = (Date.now() / 1000) - this.chargeStartTime;
            var progress = Math.min(chargeTime / this.maxChargeTime, 1);
            this.updateChargeBar(progress);
            
            // Set frame 3 while charging
            if (this.getSpriteFrame() !== this.frames[3]) {
                this.setSpriteFrame(this.frames[3]);
            }
            // Maintain scale without pulsing
            this.setScale(1.8);
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
        
        this.runAction(sequence);
    }
});

// Register the Hero class
cc.js.setClassName('Hero', Hero);
