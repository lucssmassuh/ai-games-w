// arrow.js


// Arrow class for firing arrows. Sprite sheet contains 10 arrows aligned horizontally.
var Arrow = cc.Sprite.extend({
    direction: null,
    speed: 600,

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
        // Rotate arrow so its tip (default up) points along firing direction
        switch (direction) {
            case 'up':
                this.setRotation(0);
                break;
            case 'right':
                this.setRotation(90);
                break;
            case 'down':
                this.setRotation(180);
                break;
            case 'left':
                this.setRotation(270);
                break;
        }
        this.direction = direction;
        this.setPosition(pos);
        this.scheduleUpdate();

        // Record launch height and initialize parabolic motion for horizontal shots
        this.startY = pos.y;
        if (direction === 'right' || direction === 'left') {
            this.vx = this.speed * 0.7 * (direction === 'right' ? 1 : -1);
            this.vy = this.speed * 0.5;      // initial upward lift
            this.gravity = -500;             // gravity acceleration (pixels/sec²)
        } else {
            this.vx = 0;
            this.vy = (direction === 'up' ? this.speed : -this.speed);
            this.gravity = 0;
        }
    },

    update: function(dt) {
        // Update position with velocity and gravity
        if (this.gravity) {
            this.vy += this.gravity * dt;
        }
        var pos = this.getPosition();
        pos.x += this.vx * dt;
        pos.y += this.vy * dt;
        this.setPosition(pos);

        // Remove horizontal arrows once below launch height
        if ((this.direction === 'right' || this.direction === 'left') && pos.y < this.startY) {
            this.removeFromParent();
            return;
        }

        // Remove arrow when off-screen
        if (pos.x < 0 || pos.x > cc.winSize.width ||
            pos.y < 0 || pos.y > cc.winSize.height) {
            this.removeFromParent();
        }
    }
});

cc.Arrow = Arrow;