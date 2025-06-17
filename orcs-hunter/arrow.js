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


    ctor: function(angleRad, pos, speed, options) {
        console.log('Creating arrow with options:', options);
        // Load the arrow texture and initialize sprite
        var texture = cc.textureCache.addImage("assets/arrow.png");
        if (!texture) {
            cc.error("Failed to load arrow texture");
            return;
        }
        this._super(texture);
        
        // Initialize properties
        this.explosive = false;
        this.explosionRadius = 30;
        this._exploding = false;
        
        // Apply options if provided
        if (options) {
            console.log('Applying arrow options:', options);
            if (options.explosive !== undefined) {
                console.log('Setting explosive to', options.explosive);
                this.explosive = options.explosive;
            }
            if (options.explosionRadius !== undefined) {
                console.log('Setting explosion radius to', options.explosionRadius);
                this.explosionRadius = options.explosionRadius;
            }
        }
        
        console.log('Arrow created. Explosive:', this.explosive, 'Radius:', this.explosionRadius);
        
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
        this.landed = false;
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
        console.log('Arrow position:', pos.x, newY, 'Ground level:', groundLevel, 'Explosive:', this.explosive);
        if (newY <= groundLevel) {
            console.log('Arrow hit ground. Explosive?', this.explosive);
            this.landed = true;
            this.setPosition(pos.x, groundLevel);
            this.vx = 0;
            this.vy = 0;
            
            if (this.explosive) {
                console.log('Triggering explosion for arrow');
                // For explosive arrows, explode and then remove
                this.explode();
                // Don't remove here - let explode() handle removal
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
        console.log('=== EXPLODE METHOD START ===');
        console.log('Explode called for arrow');
        console.log('Arrow properties:', {
            explosive: this.explosive,
            exploding: this._exploding,
            position: this.getPosition(),
            parent: this.getParent() ? 'has parent' : 'no parent'
        });
        
        // Make sure we're not already exploding or removed
        if (this._exploding) return;
        this._exploding = true;
        
        // Stop any movement
        this.vx = 0;
        this.vy = 0;
        
        // Get the game layer to access spawnExplosion
        var gameLayer = this.getParent();
        if (gameLayer && gameLayer.spawnExplosion) {
            // Use the game's spawnExplosion method for consistent effect
            gameLayer.spawnExplosion(this.getPosition());
        } else {
            // Fallback in case we can't access game layer
            var explosion = new cc.DrawNode();
            explosion.drawDot(cc.p(0, 0), 30, cc.color(255, 150, 0, 128));
            this.getParent().addChild(explosion, 10);
            explosion.setPosition(this.getPosition());
            explosion.runAction(cc.sequence(
                cc.fadeOut(0.5),
                cc.callFunc(explosion.removeFromParent, explosion)
            ));
        }
        
        // Add damage logic here if needed
        // Damage or affect nearby enemies
        this.damageInRadius(this.explosionRadius);
        
        // Remove the arrow after a short delay to ensure explosion is visible
        this.runAction(cc.sequence(
            cc.delayTime(0.1),
            cc.callFunc(this.removeFromParent, this)
        ));
    },
    
    // Damage enemies within explosion radius
    damageInRadius: function(radius) {
        // Get all enemies from the game layer
        var gameLayer = this.getParent();
        if (!gameLayer || !gameLayer.enemies) return;
        
        var explosionPos = this.getPosition();
        var radiusSq = radius * radius;
        
        // Check each enemy if it's within explosion radius
        for (var i = 0; i < gameLayer.enemies.length; i++) {
            var enemy = gameLayer.enemies[i];
            if (!enemy || enemy._disposed) continue;
            
            var enemyPos = enemy.getPosition();
            var dx = explosionPos.x - enemyPos.x;
            var dy = explosionPos.y - enemyPos.y;
            var distanceSq = dx * dx + dy * dy;
            
            if (distanceSq <= radiusSq) {
                // Enemy is within explosion radius
                if (enemy.onHit) {
                    enemy.onHit(10); // Deal 10 damage (adjust as needed)
                }
            }
        }
    }
});

cc.Arrow = Arrow;