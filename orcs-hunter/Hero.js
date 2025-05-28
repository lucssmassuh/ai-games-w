// Hero.js

var Hero = cc.Sprite.extend({
    frames: [],
    moveFrames: [],
    isMoving: false,
    direction: 'down',
    keyPressed: {},

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
        // Position hero on top of the castle but behind it
        this.setPosition(cc.winSize.width / 2, 250); // Adjust Y position to be on top of castle
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
        var pos = this.getPosition();
        var arrow = new Arrow(this.direction, pos);
        this.parent.addChild(arrow);
        this.arrows.push(arrow);
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.direction];
        // Bow removed
    },

    update: function(dt) {

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

    },

    startMoveRight: function() {
        this.isMoving = true;
        this.direction = 'right';
        // Bow removed
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
        // Bow removed
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
        // Bow removed
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
        // Bow removed
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