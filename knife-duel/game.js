// game.js

var GameLayer = cc.Layer.extend({
    sprite: null,
    frames: [],
    moveFrames: [],
    isMoving: false,
    keyPressed: {},
    knifeSprite: null,
    hasKnife: false,

    ctor: function () {
        this._super();

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
        this.sprite = new cc.Sprite(this.frames[0]);
        this.sprite.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        this.addChild(this.sprite);

        // Initialize knife
        this.initKnife();

        this.scheduleUpdate();

        // Add keyboard listener
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);

        return true;

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
        this.sprite = new cc.Sprite(this.frames[0]);
        this.sprite.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        this.addChild(this.sprite);

        this.scheduleUpdate();

        // Add keyboard listener
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);

        return true;
    },

    onKeyPressed: function (keyCode, event) {
        this.keyPressed[keyCode] = true;
        
        // Check if space bar is pressed and we have a knife
        if (keyCode === cc.KEY.space && this.knifeSprite) {
            this.pickUpKnife();
        }
    },

    onKeyReleased: function (keyCode, event) {
        this.keyPressed[keyCode] = false;
    },

    update: function (dt) {
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

        // Check if hero is near the knife
        if (this.knifeSprite && !this.hasKnife) {
            var heroPos = this.sprite.getPosition();
            var knifePos = this.knifeSprite.getPosition();
            var distance = cc.pDistance(heroPos, knifePos);
            
            if (distance < 50) { // Adjust this value to change pickup range
                this.knifeSprite.setVisible(true);
            }
        }
    },

    startMoveRight: function () {
        this.isMoving = true;

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
        moveAnim.setRestoreOriginalFrame(false);
        var moveAnimate = new cc.Animate(moveAnim);

        var moveAction = cc.moveBy(0.1, cc.p(5, 0));

        var spawnActions = cc.spawn(moveAnimate, cc.repeat(moveAction, 4));

        var sequence = cc.sequence(
            spawnActions,
            cc.callFunc(function () {
                this.isMoving = false;
            }, this)
        );

        this.sprite.stopAllActions();
        this.sprite.setFlippedX(false);
        this.sprite.runAction(sequence);
    },

    startMoveLeft: function () {
        this.isMoving = true;

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
        moveAnim.setRestoreOriginalFrame(false);
        var moveAnimate = new cc.Animate(moveAnim);

        var moveAction = cc.moveBy(0.1, cc.p(-5, 0));

        var spawnActions = cc.spawn(moveAnimate, cc.repeat(moveAction, 4));

        var sequence = cc.sequence(
            spawnActions,
            cc.callFunc(function () {
                this.isMoving = false;
            }, this)
        );

        this.sprite.stopAllActions();
        this.sprite.setFlippedX(false);
        this.sprite.runAction(sequence);
    },

    startMoveUp: function () {
        this.isMoving = true;

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
        moveAnim.setRestoreOriginalFrame(false);
        var moveAnimate = new cc.Animate(moveAnim);

        var moveAction = cc.moveBy(0.1, cc.p(0, 5));

        var spawnActions = cc.spawn(moveAnimate, cc.repeat(moveAction, 4));

        var sequence = cc.sequence(
            spawnActions,
            cc.callFunc(function () {
                this.isMoving = false;
                // Return to first frame of row 2 after movement
                this.sprite.setSpriteFrame(this.frames[4]); // First frame of row 2
            }, this)
        );

        this.sprite.stopAllActions();
        this.sprite.setFlippedX(false);
        this.sprite.runAction(sequence);
    },

    startMoveDown: function () {
        this.isMoving = true;

        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
    },

    initKnife: function () {
        // Create knife sprite
        this.knifeSprite = new cc.Sprite("assets/knife.gif");
        this.knifeSprite.setScale(0.5); // Adjust scale as needed
        
        // Position knife randomly on the screen
        var randomX = Math.random() * (cc.winSize.width - 100) + 50;
        var randomY = Math.random() * (cc.winSize.height - 100) + 50;
        this.knifeSprite.setPosition(randomX, randomY);
        
        // Add knife to scene
        this.addChild(this.knifeSprite);
        
        // Make knife invisible until hero is close
        this.knifeSprite.setVisible(false);
    },

    pickUpKnife: function () {
        if (!this.hasKnife) {
            // Remove knife from scene
            this.knifeSprite.removeFromParent();
            this.knifeSprite = null;
            
            // Update game state
            this.hasKnife = true;
            
            // Add visual feedback (optional)
            this.sprite.runAction(
                cc.sequence(
                    cc.scaleTo(0.1, 1.2),
                    cc.scaleTo(0.1, 1.0)
                )
            );
        }
    }

    var row = 0; // 1st row (index 0)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        moveAnim.setRestoreOriginalFrame(false);
        var moveAnimate = new cc.Animate(moveAnim);

        var moveAction = cc.moveBy(0.1, cc.p(0, -5));

        var spawnActions = cc.spawn(moveAnimate, cc.repeat(moveAction, 4));

        var sequence = cc.sequence(
            spawnActions,
            cc.callFunc(function () {
                this.isMoving = false;
                // Return to first frame of row 1 after movement
                this.sprite.setSpriteFrame(this.frames[0]); // First frame of row 1
            }, this)
        );

        this.sprite.stopAllActions();
        this.sprite.setFlippedX(false);
        this.sprite.runAction(sequence);
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});