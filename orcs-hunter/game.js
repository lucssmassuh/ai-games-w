// game.js

var GameLayer = cc.Layer.extend({
    hero: null,
    orcs: [],
    orcFrames: [],
    arrows: [],
    arrowFrame: null,
    bowSprite: null,

    ctor: function () {
        this._super();

        // Initialize hero
        this.hero = new Hero();
        this.addChild(this.hero);

        // Spawn 5 orcs using the Orc class
        var orcTexture = cc.textureCache.addImage("assets/orc.png");
        for (var i = 0; i < 5; i++) {
            var o = new Orc();
            o.init(orcTexture);
            o.setPosition(
                Math.random() * cc.winSize.width,
                Math.random() * cc.winSize.height
            );
            this.addChild(o);
            this.orcs.push(o);
        }

        // Prepare arrow projectile frame (first of 10)
        var arrowTexture = cc.textureCache.addImage("assets/arrow.png");
        var arrowFrameWidth = arrowTexture.width / 10;
        this.arrowFrame = new cc.SpriteFrame(
            arrowTexture,
            cc.rect(0, 0, arrowFrameWidth, arrowTexture.height)
        );
        Arrow.arrowFrame = this.arrowFrame;
        this.arrows = [];

        this.scheduleUpdate();

        return true;
    },

    update: function (dt) {

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
            if (apos.x < 0 || apos.x > cc.winSize.width || apos.y < 0 || apos.y > cc.winSize.height) {
                arr.removeFromParent(); this.arrows.splice(a,1);
                continue;
            }
            // Check collision with orcs
            for (var o = this.orcs.length - 1; o >= 0; o--) {
                var orc = this.orcs[o];
                if (cc.rectIntersectsRect(arr.getBoundingBox(), orc.getBoundingBox())) {
                    // remove orc and arrow
                    orc.removeFromParent(); this.orcs.splice(o,1);
                    arr.removeFromParent(); this.arrows.splice(a,1);
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
        // Create arrow sprite
        var arrow = new cc.Sprite(this.arrowFrame);
        arrow.direction = this.direction;
        arrow.speed = 300;
        var pos = this.sprite.getPosition();
        arrow.setPosition(pos.x, pos.y);
        this.addChild(arrow);
        this.arrows.push(arrow);
        // Rotate bow to face firing direction
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.direction];
        this.bowSprite.setRotation(angle);
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});