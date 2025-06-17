// arrow.js

// Arrow class for firing arrows with variable speed based on charge time
var Arrow = cc.Sprite.extend({
    speed: 0, // Will be set when creating the arrow
    vx: 0,
    vy: 0,
    gravity: -400, // Gravity effect (pixels/second²)
    landed: false, // Track if arrow has landed
    explosive: false, // Whether this is an explosive arrow
    explosionRadius: 0, // Radius of explosion effect


    ctor: function(angleRad, pos, speed) {
        // Load the arrow texture and initialize sprite
        var texture = cc.textureCache.addImage("assets/arrow.png");
        if (!texture) {
            cc.error("Failed to load arrow texture");
            return;
        }
        this._super(texture);
        // Set arrow speed (default 600 if unspecified)
        this.speed = (typeof speed !== 'undefined') ? speed : 600;
        this.setAnchorPoint(0.5, 0.5);
        this.setContentSize(cc.size(texture.width, texture.height));
        this.setScale(0.2);
        this.setPosition(pos);
        // Compute initial velocity and rotation
        this.vx = this.speed * Math.cos(angleRad);
        this.vy = this.speed * Math.sin(angleRad);
        this.gravity = -400;
        this.setRotation(90 - (angleRad * 180 / Math.PI));
        this.startY = pos.y;
        // Schedule update for motion and collision
        this.scheduleUpdate();
    },
    

    update: function(dt) {
        // If arrow has landed, don't update position/rotation
        if (this.landed) return;
        
        // Update position with velocity and gravity
        if (this.gravity) {
            this.vy += this.gravity * dt;
        }
        
        // Calculate new position
        var pos = this.getPosition();
        var newY = pos.y + this.vy * dt;
        
        // Check if arrow hits the ground at the bottom of the castle
        // Using a lower value to match the visual bottom of the castle
        var groundLevel = 150; // Adjusted to be lower than the previous 224
        if (newY <= groundLevel) {
            this.landed = true;
            this.setPosition(pos.x, groundLevel);
            this.vx = 0;
            this.vy = 0;
            
            if (this.explosive) {
                this.explode();
            } else {
                // Fade out and remove normal arrows
                var fadeOut = cc.fadeOut(1.0);
                var remove = cc.callFunc(this.removeFromParent, this);
                this.runAction(cc.sequence(fadeOut, remove));
            }
            return;
        }
        
        // Update position if not landed
        pos.x += this.vx * dt;
        pos.y = newY;
        this.setPosition(pos);
        
        // Rotate arrow based on current velocity vector
        if (this.vx !== 0 || this.vy !== 0) {
            var rad = Math.atan2(this.vy, this.vx);
            var deg = 90 - (rad * 180 / Math.PI);
            this.setRotation(deg);
        }
        
        // Update collision box
        this.updateCollisionBox();
        
        // Remove arrow when completely off-screen
        var margin = 100; // Extra margin before removing
        if (pos.x < -margin || pos.x > cc.winSize.width + margin ||
            pos.y < -margin || pos.y > cc.winSize.height + margin) {
            this.removeFromParent();
        }
    },
    
    // Update collision box based on current rotation and position
    updateCollisionBox: function() {
        // Get the size of the arrow (accounting for scale)
        var width = this.getContentSize().width * this.getScaleX();
        var height = this.getContentSize().height * this.getScaleY();
        
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
    },
    
    // Create explosion effect for explosive arrows
    explode: function() {
        // Create explosion sprite or particle effect
        var explosion = new cc.Sprite("assets/explosion.png"); // Make sure you have this asset
        if (explosion) {
            explosion.setPosition(this.getPosition());
            explosion.setScale(0.5);
            this.getParent().addChild(explosion, 10);
            
            // Fade and remove explosion
            var fadeOut = cc.fadeOut(0.5);
            var remove = cc.callFunc(explosion.removeFromParent, explosion);
            explosion.runAction(cc.sequence(fadeOut, remove));
        }
        
        // Add damage logic here if needed
        // For now, just remove the arrow
        this.removeFromParent();
    }
});

cc.Arrow = Arrow;