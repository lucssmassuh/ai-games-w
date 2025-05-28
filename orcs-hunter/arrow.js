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

        // Rotate arrow to match trajectory tangent (only for left/right shots)
        if (this.direction === 'right' || this.direction === 'left') {
            var rad = Math.atan2(this.vy, this.vx);
            // Map vector angle to sprite rotation: default up at 0, positive cw
            var deg = 90 - (rad * 180 / Math.PI);
            this.setRotation(deg);
        }

        // Remove arrow when completely off-screen
        var arrowWidth = this.getBoundingBox().width;
        var arrowHeight = this.getBoundingBox().height;
        if (pos.x < -arrowWidth || pos.x > cc.winSize.width + arrowWidth ||
            pos.y < -arrowHeight || pos.y > cc.winSize.height + arrowHeight) {
            this.removeFromParent();
        }
    }
});

cc.Arrow = Arrow;