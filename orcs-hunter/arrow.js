// arrow.js

// Arrow class for firing arrows with variable speed based on charge time
var Arrow = cc.Sprite.extend({
    speed: 0, // Will be set when creating the arrow
    vx: 0,
    vy: 0,
    gravity: -400, // Gravity effect (pixels/second²)


    ctor: function(angleRad, pos, speed = 600) {
        this._super();
        this.speed = speed; // Set the arrow speed based on charge time
        
        // Load the texture first
        var texture = cc.textureCache.addImage("assets/arrow.png");
        if (!texture) {
            cc.error("Failed to load arrow texture");
            return;
        }
        
        // Initialize sprite with texture
        this._super(texture);
        
        
        // Use the full texture since it's a single arrow image
        this.setAnchorPoint(cc.p(0.5, 0.5)); // Center the anchor point for better rotation
        
        // Set content size to match the texture
        this.setContentSize(cc.size(texture.width, texture.height));
        
        // Set initial position and scale
        this.setPosition(pos);
        this.setScale(0.2);
        
        // Store frame for other arrows
        if (!Arrow.arrowFrame) {
            Arrow.arrowFrame = new cc.SpriteFrame(texture, cc.rect(0, 0, texture.width, texture.height));
        }
        
        // Compute initial velocity, apply gravity, and set rotation
        this.vx = this.speed * Math.cos(angleRad);
        this.vy = this.speed * Math.sin(angleRad);
        this.gravity = -400;
        this.setRotation(90 - (angleRad * 180 / Math.PI));
        this.startY = pos.y;
        this.scheduleUpdate();
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
        
        // Rotate arrow based on current velocity vector
        var rad = Math.atan2(this.vy, this.vx);
        var deg = 90 - (rad * 180 / Math.PI);
        this.setRotation(deg);
        
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