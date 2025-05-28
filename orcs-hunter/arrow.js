// arrow.js


// Arrow class for firing arrows. Sprite sheet contains 10 arrows aligned horizontally.
var Arrow = cc.Sprite.extend({
    direction: null,
    speed: 600,

    ctor: function(direction, pos) {
        // Load the texture first
        var texture = cc.textureCache.addImage("assets/arrow.png");
        if (!texture) {
            cc.error("Failed to load arrow texture");
            return;
        }
        
        // Initialize sprite with texture
        this._super(texture);
        
        // Store direction and position
        this.direction = direction;
        
        // Calculate frame dimensions (assuming 10 frames in a row)
        var frameWidth = texture.width / 10;
        var frameHeight = texture.height;
        
        // Set texture rect for the first frame
        this.setTextureRect(cc.rect(0, 0, frameWidth, frameHeight));
        this.setAnchorPoint(cc.p(0.5, 0.5)); // Center the anchor point for better rotation
        
        // Set content size explicitly
        this.setContentSize(cc.size(frameWidth, frameHeight));
        
        // Set initial position and scale
        this.setPosition(pos);
        this.setScale(1.0);
        
        // Store frame for other arrows
        if (!Arrow.arrowFrame) {
            Arrow.arrowFrame = new cc.SpriteFrame(texture, cc.rect(0, 0, frameWidth, frameHeight));
        }
        
        // Set initial rotation based on direction
        this.setRotation(this.getRotationForDirection(direction));
        this.direction = direction;
        this.setPosition(pos);
        this.scheduleUpdate();

        // Record launch height and initialize motion
        this.startY = pos.y;
        this.initMotion(direction);
    },
    
    // Get rotation angle for a given direction
    getRotationForDirection: function(direction) {
        switch (direction) {
            case 'up': return 0;
            case 'right': return 90;
            case 'down': return 180;
            case 'left': return 270;
            default: return 0;
        }
    },
    
    // Initialize motion based on direction
    initMotion: function(direction) {
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
        
        // Calculate new position
        var pos = this.getPosition();
        pos.x += this.vx * dt;
        pos.y += this.vy * dt;
        this.setPosition(pos);
        
        // Update rotation based on velocity for horizontal shots
        if (this.direction === 'right' || this.direction === 'left') {
            var rad = Math.atan2(this.vy, this.vx);
            // Map vector angle to sprite rotation: default up at 0, positive cw
            var deg = 90 - (rad * 180 / Math.PI);
            this.setRotation(deg);
        }
        
        // Update collision box
        this.updateCollisionBox();
        

        // Remove arrow when completely off-screen
        var margin = 100; // Extra margin before removing
        var arrowWidth = this.width * this.getScaleX();
        var arrowHeight = this.height * this.getScaleY();
        
        if (pos.x < -margin || pos.x > cc.winSize.width + margin ||
            pos.y < -margin || pos.y > cc.winSize.height + margin) {
            this.removeFromParent();
        }
    },
    
    // Update collision box based on current rotation and position
    updateCollisionBox: function() {
        // Get the size of the arrow (accounting for scale)
        var width = this.width * this.getScaleX();
        var height = this.height * this.getScaleY();
        
        // Create a smaller collision box (70% of actual size for better feel)
        var collisionWidth = width * 0.7;
        var collisionHeight = height * 0.7;
        
        // Calculate the collision box position (centered on arrow)
        var pos = this.getPosition();
        this._collisionBox = cc.rect(
            pos.x - collisionWidth/2,
            pos.y - collisionHeight/2,
            collisionWidth,
            collisionHeight
        );
    },
    
    // Override getBoundingBox to use our custom collision box
    getBoundingBox: function() {
        if (!this._collisionBox) {
            this.updateCollisionBox();
        }
        return this._collisionBox;
    }
});

cc.Arrow = Arrow;