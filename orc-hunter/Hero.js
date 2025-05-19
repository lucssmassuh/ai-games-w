// Hero.js

var Hero = cc.Sprite.extend({
    frames: [],
    moveFrames: [],
    isMoving: false,
    direction: 'down',
    bowSprite: null,
    keyPressed: {},
    arrows: [],
    arrowFrame: null,

    ctor: function() {
        this._super();
        this.initHero();
    },

    initHero: function() {
        // Initialize hero
        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        // Load all frames
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
                var frame = new cc.SpriteFrame(
                    texture,
                    cc.rect(x * frameWidth, y * frameHeight, frameWidth, frameHeight)
                );
                this.frames.push(frame);
            }
        }

        // Set initial sprite
        this.setSpriteFrame(this.frames[0]);
        this.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        this.setAnchorPoint(0.5, 0.5);  // Center anchor point for hero
        this.setScale(1.5);

        // Initialize bow sprite
        this.initBowSprite();

        // Position bow at center of hero sprite
        // this.scheduleOnce(function() {
        //     if (this.bowSprite) {
        //         this.bowSprite.setPosition(
        //             this.getContentSize().width / 2,
        //             this.getContentSize().height / 2
        //         );
        //     }
        // }.bind(this), 0.1);

        // Prepare arrow projectile frame (first of 10)
        var arrowTexture = cc.textureCache.addImage("assets/arrow.png");
        var arrowFrameWidth = arrowTexture.width / 10;
        var arrowFrameHeight = arrowTexture.height;
        var arrowRect = cc.rect(0, 0, arrowFrameWidth, arrowFrameHeight);
        this.arrowFrame = new cc.SpriteFrame(arrowTexture, arrowRect);

        // Initialize event listeners
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);

        this.scheduleUpdate();
    },

    initBowSprite: function() {
        // Create sprite frame for the first frame of bow.png
        var bowTexture = cc.textureCache.addImage("assets/bow.png");
        var bowFrameWidth = 55;  // Each frame is 55 pixels wide
        var bowFrameHeight = 95;  // Fixed height
        var bowRect = cc.rect(0, 0, bowFrameWidth, bowFrameHeight);

        // Create sprite frame from texture
        var bowFrame = new cc.SpriteFrame(bowTexture, bowRect);
        
        // Create sprite from frame
        this.bowSprite = new cc.Sprite(bowFrame);
        this.bowSprite.setScale(0.5);
        // Set anchor point to center of first frame (x=27.5, y=47.5)
        this.bowSprite.setAnchorPoint(27.5 / bowFrameWidth, 47.5 / bowFrameHeight);
        this.addChild(this.bowSprite, 1);
        this.bowSprite.setPosition(
            this.getContentSize().width / 2,
            this.getContentSize().height / 2
        );
        this.bowSprite.setVisible(true);

        // Debug logging
        console.log('Bow sprite initialized with frame:', bowRect);
        console.log('Frame size:', bowFrame.getRect());
        console.log('Anchor point:', this.bowSprite.getAnchorPoint());
        console.log('Initial position:', this.bowSprite.getPosition());



        // Ensure bow stays centered when rotating
        this.bowSprite.setRotation(0);
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
        // Create arrow sprite
        var arrow = new cc.Sprite(this.arrowFrame);
        arrow.direction = this.direction;
        arrow.speed = 300;
        var pos = this.getPosition();
        arrow.setPosition(pos.x, pos.y);
        this.parent.addChild(arrow);
        this.arrows.push(arrow);
        
        // Rotate bow to face firing direction
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.direction];
        this.bowSprite.setRotation(angle);
    },

    update: function(dt) {
        // Keep bow aligned to hero
        
        // Handle movement
        if (this.keyPressed[cc.KEY.right] && !this.isMoving) {
            this.startMoveRight();
        }
        if (this.keyPressed[cc.KEY.left] && !this.isMoving) {
            this.startMoveLeft();
        }
        if (this.keyPressed[cc.KEY.up] && !this.isMoving) {
            this.startMoveUp();
        }
        if (this.keyPressed[cc.KEY.down] && !this.isMoving) {
            this.startMoveDown();
        }

        if (this.isMoving) {
            // Log hero position
            console.log('Hero position:', {
                x: this.getPosition().x,
                y: this.getPosition().y
            });
        }

        // Update arrows
        for (var a = this.arrows.length - 1; a >= 0; a--) {
            var arr = this.arrows[a];
            var dx = 0, dy = 0;
            switch (arr.direction) {
                case 'up':    dy = arr.speed * dt; break;
                case 'right': dx = arr.speed * dt; break;
                case 'down':  dy = -arr.speed * dt; break;
                case 'left':  dx = -arr.speed * dt; break;
            }
            var apos = arr.getPosition();
            apos.x += dx; apos.y += dy;
            arr.setPosition(apos);
            
            // Remove off-screen
            if (apos.x < 0 || apos.x > cc.winSize.width || 
                apos.y < 0 || apos.y > cc.winSize.height) {
                arr.removeFromParent(); 
                this.arrows.splice(a, 1);
                continue;
            }
        }
    },

    startMoveRight: function() {
        this.isMoving = true;
        this.direction = 'right';
        this.bowSprite.setRotation(0);
        this.bowSprite.setLocalZOrder(1);
        // Stop any current actions
        this.stopAllActions();
        
        // Create movement animation
        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
        var row = 3; // 4th row (index 3)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        var animate = cc.animate(moveAnim);
        
        // Create movement action
        var moveAction = cc.moveBy(0.5, cc.p(50, 0));
        
        // Create sequence that moves and animates
        var sequence = cc.sequence(
            cc.spawn(animate, moveAction),
            cc.callFunc(function() {
                this.isMoving = false;
            }, this)
        );
        
        this.runAction(sequence);
    },

    startMoveLeft: function() {
        this.isMoving = true;
        this.direction = 'left';
        this.bowSprite.setRotation(180);
        this.bowSprite.setLocalZOrder(1);
        // Stop any current actions
        this.stopAllActions();
        
        // Create movement animation
        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
        var row = 2; // 3rd row (index 2)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        var animate = cc.animate(moveAnim);
        
        // Create movement action
        var moveAction = cc.moveBy(0.5, cc.p(-50, 0));
        
        // Create sequence that moves and animates
        var sequence = cc.sequence(
            cc.spawn(animate, moveAction),
            cc.callFunc(function() {
                this.isMoving = false;
            }, this)
        );
        
        this.runAction(sequence);
    },

    startMoveUp: function() {
        this.isMoving = true;
        this.direction = 'up';
        this.bowSprite.setRotation(-90);
        this.bowSprite.setLocalZOrder(-1);
        // Stop any current actions
        this.stopAllActions();
        
        // Create movement animation
        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
        var row = 1; // 2nd row (index 1)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        var animate = cc.animate(moveAnim);
        
        // Create movement action
        var moveAction = cc.moveBy(0.5, cc.p(0, 50));
        
        // Create sequence that moves and animates
        var sequence = cc.sequence(
            cc.spawn(animate, moveAction),
            cc.callFunc(function() {
                this.isMoving = false;
            }, this)
        );
        
        this.runAction(sequence);
    },

    startMoveDown: function() {
        this.isMoving = true;
        this.direction = 'down';
        this.bowSprite.setRotation(90);
        this.bowSprite.setLocalZOrder(1);
        // Stop any current actions
        this.stopAllActions();
        
        // Create movement animation
        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
        var row = 0; // 1st row (index 0)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        var animate = cc.animate(moveAnim);
        
        // Create movement action
        var moveAction = cc.moveBy(0.5, cc.p(0, -50));
        
        // Create sequence that moves and animates
        var sequence = cc.sequence(
            cc.spawn(animate, moveAction),
            cc.callFunc(function() {
                this.isMoving = false;
            }, this)
        );
        
        this.runAction(sequence);
    }
});

// Register the Hero class
cc.Hero = Hero;

// Ensure the Hero class is properly initialized when the script loads
cc.Hero.prototype.initHero = Hero.prototype.initHero;