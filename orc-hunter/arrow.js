// arrow.js


// Arrow class for firing arrows. Sprite sheet contains 10 arrows aligned horizontally.
var Arrow = cc.Sprite.extend({
    direction: null,
    speed: 300,

    ctor: function(direction, pos) {
        this._super();
        if (!Arrow.arrowFrame) {
            cc.loader.load({ url: "assets/arrow.png", type: "png" }, function(err, texture) {
                if (err) {
                    cc.error("Failed to load arrow texture:", err);
                    return;
                }
                var frameWidth = texture.width / 10;
                Arrow.arrowFrame = new cc.SpriteFrame(texture, cc.rect(0, 0, frameWidth, texture.height));
                this.setTexture(Arrow.arrowFrame.getTexture());
                this.setTextureRect(Arrow.arrowFrame.getRect());
            }.bind(this));
        } else {
            this.setTexture(Arrow.arrowFrame.getTexture());
            this.setTextureRect(Arrow.arrowFrame.getRect());
        }
        this.direction = direction;
        this.setPosition(pos);
        this.scheduleUpdate();
    },

    update: function(dt) {
        var dx = 0, dy = 0;
        switch (this.direction) {
            case 'up':    dy = this.speed * dt; break;
            case 'right': dx = this.speed * dt; break;
            case 'down':  dy = -this.speed * dt; break;
            case 'left':  dx = -this.speed * dt; break;
        }
        var pos = this.getPosition();
        pos.x += dx;
        pos.y += dy;
        this.setPosition(pos);

        // Remove arrow when off-screen
        if (pos.x < 0 || pos.x > cc.winSize.width ||
            pos.y < 0 || pos.y > cc.winSize.height) {
            this.removeFromParent();
        }
    }
});

cc.Arrow = Arrow;