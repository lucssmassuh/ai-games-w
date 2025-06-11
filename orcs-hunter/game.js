// game.js

var GameLayer = cc.Layer.extend({
    hero: null,
    orcs: [],
    orcFrames: [],
    dragons: [],
    arrows: [],
    arrowFrame: null,
    castle: null,
    background: null,

    // Draw debug rectangle for collision visualization
    drawDebugRect: function(rect, color) {
        if (!this.debugNode) {
            this.debugNode = new cc.DrawNode();
            this.addChild(this.debugNode, 999); // Add on top of everything
        }
        
        // Draw rectangle border
        this.debugNode.drawRect(
            cc.p(rect.x, rect.y),
            cc.p(rect.x + rect.width, rect.y + rect.height),
            color,
            1,
            color
        );
    },

    ctor: function () {
        this._super();
        
        // Initialize arrays and variables
        this.orcs = [];
        this.arrows = [];
        this.keys = {};
        this.debugNode = null;

        // Add background (z-order: -1 to be behind everything)
        console.log("Creating background...");
        this.background = new cc.Background();
        if (this.background) {
            console.log("Background created, adding to scene...");
            this.background.setPosition(0, 0);
            this.background.setAnchorPoint(0, 0);
            this.addChild(this.background, -1);
            console.log("Background added to scene");
        } else {
            console.error("Failed to create background!");
        }

        // Create and add castle
        console.log("Creating castle instance...");
        this.castle = new cc.Castle();
        console.log("Adding castle to scene...");
        this.castle.setPosition(20, 0); // Move castle 20 pixels to the right
        this.addChild(this.castle);
        console.log("Castle added to scene, position:", this.castle.getPosition());


        // Load the orc texture
        this.orcTexture = cc.textureCache.addImage("assets/orc.png");
        if (!this.orcTexture) {
            console.error("Failed to load orc.png");
            return;
        }

        // Initialize hero
        this.hero = new Hero();
        // Add hero with z-order 0 (bottom layer)
        this.addChild(this.hero, 0);


        // Prepare arrow projectile frame (first of 10)
        var arrowTexture = cc.textureCache.addImage("assets/arrow.png");
        var arrowFrameWidth = arrowTexture.width / 10;
        this.arrowFrame = new cc.SpriteFrame(
            arrowTexture,
            cc.rect(0, 0, arrowFrameWidth, arrowTexture.height)
        );
        Arrow.arrowFrame = this.arrowFrame;
        this.arrows = [];
        this.hero.arrows = this.arrows;
        this.dragons = [];
        

        // Set arrow z-order to be above hero but below orcs
        Arrow.zOrder = 1;

        // Load waves configuration and start the waves
        var wavesConfig = cc.loader.getRes("waves.json");
        this.waves = (wavesConfig && wavesConfig.waves) || [];
        this.currentWaveIndex = 0;
        this.startNextWave();

        this.scheduleUpdate();

        return true;
    },

    update: function (dt) {

        // Update arrows with motion, including gravity, rotation, and removal handled by Arrow.update
        for (var a = this.arrows.length - 1; a >= 0; a--) {
            var arr = this.arrows[a];
            arr.update(dt);
            // Remove arrow from tracking if it was removed from the scene
            if (!arr.getParent()) {
                this.arrows.splice(a, 1);
                continue;
            }
            // Check collision with orcs
            for (var o = this.orcs.length - 1; o >= 0; o--) {
                var orc = this.orcs[o];
                if (orc.isDying) continue;
                var collision = typeof orc.checkCollisionWith === 'function'
                                ? orc.checkCollisionWith(arr)
                                : cc.rectIntersectsRect(
                                    orc.getBoundingBox(),
                                    arr.getBoundingBox()
                                  );
                if (collision) {
                    cc.log(
                        'Collision detected: Arrow at (' + arr.getPosition().x + ',' + arr.getPosition().y +
                        ') hit Orc at (' + orc.getPosition().x + ',' + orc.getPosition().y + ')'
                    );
                    arr.removeFromParent();
                    this.arrows.splice(a, 1);
                    orc.die();
                    break;
                }
            }
            // Check collision with dragons
            for (var d = this.dragons.length - 1; d >= 0; d--) {
                var dragon = this.dragons[d];
                if (dragon.isDying) continue;
                if (cc.rectIntersectsRect(
                        dragon.getBoundingBox(),
                        arr.getBoundingBox()
                    )) {
                    arr.removeFromParent();
                    this.arrows.splice(a, 1);
                    dragon.die();
                    break;
                }
            }
        }
    },

    startMoveDown: function () {
        this.isMoving = true;
        this.direction = 'down';

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
    },

    shootArrow: function() {
        var arrow = new Arrow(this.hero.direction, this.hero.getPosition());
        this.addChild(arrow, Arrow.zOrder || 3);
        this.arrows.push(arrow);
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.hero.direction];
    },
    spawnOrc: function() {
        var baseY = this.castle.getOrcBaseY();
        var baseX = cc.winSize.width + 50;
        var o = new Orc(this);
        o.init(this.orcTexture);
        var jitterX = baseX + (Math.random() * 40 - 20);
        var jitterY = baseY + (Math.random() * 20 - 10);
        o.setPosition(jitterX, jitterY);
        this.addChild(o, 3);
        this.orcs.push(o);
    },
    spawnDragon: function() {
        var d = new cc.Dragon(this);
        var pos = d.getPosition();
        var jitterX = pos.x + (Math.random() * 40 - 20);
        var jitterY = pos.y + (Math.random() * 40 - 20);
        d.setPosition(jitterX, jitterY);
        this.addChild(d, 2);
        this.dragons.push(d);
    },
    startNextWave: function() {
        if (this.currentWaveIndex >= this.waves.length) {
            var label = new cc.LabelTTF("All waves complete!", "Arial", 36);
            label.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
            this.addChild(label, 1000);
            return;
        }
        var wave = this.waves[this.currentWaveIndex];
        var announcement = new cc.LabelTTF(wave.name, "Arial", 40);
        announcement.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        announcement.setColor(cc.color(255, 0, 0));
        this.addChild(announcement, 1000);
        announcement.runAction(cc.sequence(
            cc.delayTime(2),
            cc.fadeOut(1),
            cc.callFunc(function() { this.removeChild(announcement); }, this)
        ));
        var lastTime = 0;
        this.spawnScheduleComplete = false;
        wave.events.forEach(function(evt) {
            lastTime = Math.max(lastTime, evt.time);
            this.scheduleOnce(function() {
                for (var i = 0; i < evt.count; i++) {
                    if (evt.type === "orc") {
                        this.spawnOrc();
                    } else if (evt.type === "dragon") {
                        this.spawnDragon();
                    }
                }
            }, evt.time / 1000);
        }, this);
        this.scheduleOnce(function() {
            this.spawnScheduleComplete = true;
        }, lastTime / 1000);
        var checkWaveDone = function() {
            if (this.spawnScheduleComplete && this.orcs.length === 0 && this.dragons.length === 0) {
                this.currentWaveIndex++;
                this.startNextWave();
                this.unschedule(checkWaveDone);
            }
        }.bind(this);
        this.schedule(checkWaveDone, 0.5);
    }
});

// Add keyboard input handling methods to GameLayer
GameLayer.onKeyPressed = function(keyCode, event) {
    this.keys[keyCode] = true;
};

GameLayer.onKeyReleased = function(keyCode, event) {
    this.keys[keyCode] = false;
};

GameLayer.onEnter = function() {
    this._super();
    
    // Enable keyboard input
    cc.eventManager.addListener({
        event: cc.EventListener.KEYBOARD,
        onKeyPressed: this.onKeyPressed.bind(this),
        onKeyReleased: this.onKeyReleased.bind(this)
    }, this);
    
    this.scheduleUpdate();
};

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});