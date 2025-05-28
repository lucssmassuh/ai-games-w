// game.js

var GameLayer = cc.Layer.extend({
    hero: null,
    orcs: [],
    orcFrames: [],
    arrows: [],
    arrowFrame: null,

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
        
        // Initialize debug node (will be created when needed)
        this.debugNode = null;

        // Initialize tilemap
        this.tileSize = 32;
        this.map = [
            [12, 0, 7, 0, 12, 0, 7, 0, 12],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 9, 7, 7, 7, 7, 7, 9, 7],
            [7, 7, 7, 7, 1, 7, 7, 7, 7]
        ];
        // Map values now represent tile indices in the tileset (0 = no tile)

        // Load and place castle tiles
        var tileset = cc.textureCache.addImage("assets/castle-tileset.png");
        var tileSize = this.tileSize;

        for (var y = 0; y < this.map.length; y++) {
            for (var x = 0; x < this.map[y].length; x++) {
                var tileIndex = this.map[y][x];
                if (tileIndex > 0) {
                    // Calculate tile position in the tileset based on index
                    var tilesPerRow = 8; // 8 columns in the tileset
                    var tileX = ((tileIndex - 1) % tilesPerRow) * tileSize; // -1 because 0 = no tile
                    var tileY = Math.floor((tileIndex - 1) / tilesPerRow) * tileSize;
                    
                    var tile = new cc.Sprite(
                        tileset,
                        cc.rect(tileX, tileY, tileSize, tileSize)
                    );
                    
                    // Position the tile on screen with vertical offset (higher on screen)
                    var verticalOffset = 100; // Adjust this value to move the castle up/down
                    tile.setPosition(
                        x * tileSize + tileSize/2,
                        (this.map.length - y - 1) * tileSize + tileSize/2 + verticalOffset
                    );
                    this.addChild(tile, 2); // Add castle tiles at z-order 2
                }
            }
        }


        // Initialize hero
        this.hero = new Hero();
        // Add hero with z-order 0 (bottom layer)
        this.addChild(this.hero, 0);

        // Spawn orcs at the right side of the screen
        var orcTexture = cc.textureCache.addImage("assets/orc.png");
        var verticalOffset = 100; // Same as castle's vertical offset
        var orcY = verticalOffset + 16; // Align with the base of the castle (verticalOffset + tileSize/2)
        
        // Function to spawn a single orc
        var spawnOrc = function() {
            var o = new Orc(this); // Pass game layer reference to Orc
            o.init(orcTexture);
            o.setPosition(
                cc.winSize.width + 50, // Start just off-screen to the right
                orcY // Fixed Y position at the bottom of the castle
            );
            this.addChild(o, 3); // Add orcs at z-order 3 (top layer)
            this.orcs.push(o);
            
            // Schedule next orc spawn
            if (this.orcs.length < 5) {
                this.scheduleOnce(function() {
                    spawnOrc.call(this);
                }, 2.0); // Spawn a new orc every 2 seconds
            }
        }.bind(this);
        
        // Start spawning orcs
        spawnOrc();

        // Prepare arrow projectile frame (first of 10)
        var arrowTexture = cc.textureCache.addImage("assets/arrow.png");
        var arrowFrameWidth = arrowTexture.width / 10;
        this.arrowFrame = new cc.SpriteFrame(
            arrowTexture,
            cc.rect(0, 0, arrowFrameWidth, arrowTexture.height)
        );
        Arrow.arrowFrame = this.arrowFrame;
        this.arrows = [];
        
        // Set arrow z-order to be above hero but below orcs
        Arrow.zOrder = 1;

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
                
                // Skip if orc is already dying
                if (orc.isDying) continue;
                
                // Get bounding boxes in world space
                var arrowBox = arr.getBoundingBox();
                var orcBox = orc.getBoundingBox();
                
                // Draw debug rectangles (visible in browser's debug overlay)
                this.drawDebugRect(arrowBox, cc.color(255, 0, 0, 180)); // Red for arrow
                this.drawDebugRect(orcBox, cc.color(0, 255, 0, 180));   // Green for orc
                
                // Simple distance check first (faster than full rect intersection)
                var arrowCenter = cc.p(arrowBox.x + arrowBox.width/2, arrowBox.y + arrowBox.height/2);
                var orcCenter = cc.p(orcBox.x + orcBox.width/2, orcBox.y + orcBox.height/2);
                var dx = arrowCenter.x - orcCenter.x;
                var dy = arrowCenter.y - orcCenter.y;
                var distance = Math.sqrt(dx*dx + dy*dy);
                var minDistance = (arrowBox.width + orcBox.width) * 0.4; // 40% of combined sizes
                
                if (distance < minDistance) {
                    // Remove the arrow
                    arr.removeFromParent();
                    this.arrows.splice(a,1);
                    
                    // Trigger orc death animation
                    orc.die();
                    
                    // Remove the orc from the array (it will remove itself after animation)
                    this.orcs.splice(o,1);
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
        this.addChild(arrow, Arrow.zOrder || 3); // Add arrow with specified z-order
        this.arrows.push(arrow);
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.hero.direction];
        // Bow removed
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});