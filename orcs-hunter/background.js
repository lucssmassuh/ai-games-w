// background.js

var Background = cc.LayerColor.extend({
    // Background tile map pattern
    backgroundMap: [
    [2, 2, 2, 3, 1, 2, 2, 2, 2, 2,2 , 2, 2, 3, 1, 2, 2, 2, 2,3, 1, 2, 2, 3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 3, 2, 2, 3],
    [2, 2, 2, 2,2,2,2,2, 2, 2, 2,2,2, 3, 1, 2, 2, 3, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3],
    [4, 4, 12, 4, 12, 4, 12, 4, 4, 12, 12, 12, 4, 12, 4, 4, 4, 12, 12, 4, 4, 4, 12, 12, 4, 4, 12, 4, 4, 4, 12, 4, 4, 4, 12, 4, 12, 4, 4, 4, 12, 12, 12, 12, 4, 4, 4, 4, 12, 4],
    [12, 12, 12, 4, 4, 12, 4, 4, 12, 4, 12, 4, 12, 4, 12, 4, 12, 4, 4, 4, 4, 4, 12, 4, 4, 12, 4, 12, 12, 12, 12, 4, 12, 4, 12, 4, 4, 12, 12, 12, 4, 12, 4, 4, 12, 4, 12, 4, 4, 4],
    [12, 12, 12, 12, 4, 4, 4, 12, 12, 12, 12, 4, 12, 4, 4, 4, 12, 4, 4, 4, 4, 4, 12, 12, 4, 12, 12, 4, 4, 4, 4, 4, 12, 4, 12, 12, 12, 4, 4, 4, 4, 12, 4, 12, 4, 4, 4, 12, 12, 12],
    [12, 12, 12, 4, 4, 4, 4, 12, 4, 4, 12, 4, 12, 4, 12, 12, 4, 12, 12, 12, 12, 4, 4, 12, 12, 12, 12, 12, 4, 12, 12, 4, 12, 4, 4, 4, 4, 4, 12, 12, 4, 4, 12, 12, 12, 12, 4, 12, 12, 12],
    [4, 12, 4, 12, 4, 4, 4, 12, 4, 12, 4, 4, 12, 4, 4, 4, 4, 4, 4, 12, 12, 4, 4, 4, 12, 4, 12, 12, 4, 12, 4, 4, 12, 4, 4, 12, 4, 12, 4, 4, 12, 4, 4, 12, 12, 4, 12, 4, 4, 4],
    [12, 12, 12, 12, 12, 12, 4, 4, 4, 12, 12, 12, 4, 12, 4, 4, 12, 4, 4, 12, 4, 4, 12, 12, 4, 4, 12, 12, 12, 12, 12, 12, 12, 4, 12, 12, 12, 4, 4, 12, 12, 12, 4, 4, 12, 4, 12, 12, 12, 12],
    [4, 12, 12, 12, 4, 4, 12, 4, 4, 4, 4, 12, 4, 4, 4, 4, 12, 4, 4, 4, 12, 12, 4, 4, 12, 12, 12, 4, 12, 4, 12, 4, 4, 12, 12, 12, 12, 4, 4, 4, 12, 4, 12, 4, 4, 12, 12, 4, 12, 12],
    [4, 12, 4, 12, 4, 12, 12, 4, 4, 4, 4, 12, 12, 4, 12, 12, 4, 12, 12, 4, 4, 4, 4, 4, 12, 12, 12, 12, 4, 4, 4, 12, 12, 12, 12, 4, 4, 12, 12, 4, 12, 4, 4, 12, 4, 4, 12, 4, 12, 4]
    ],
    ctor: function() {
        // Initialize with a solid color first
        this._super(cc.color(100, 149, 237, 255)); // Cornflower blue
        
        // Set the content size to match the screen
        this.setContentSize(cc.winSize);
        
        // Position at the bottom of the screen
        this.setPosition(0, 0);
        
        // Add a simple debug text
        var debugText = new cc.LabelTTF("Background Loaded - Tileset not found", "Arial", 20);
        debugText.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        debugText.setColor(cc.color(255, 255, 0)); // Yellow text
        this.addChild(debugText);
        
        console.log("Background initialized with solid color");
        
        // Try to load the tileset asynchronously
        this.scheduleOnce(this.tryLoadTileset, 0.1);
    },
    
    tryLoadTileset: function() {
        var self = this;
        cc.textureCache.addImage("assets/bg-tileset.png", function(texture) {
            if (texture) {
                console.log("Tileset loaded successfully, creating tiles...");
                self.createTiledBackground(texture);
            } else {
                console.error("Failed to load tileset, check the path and console for errors");
                // List all loaded textures for debugging
                console.log("Loaded textures:", cc.textureCache._textures.keys());
            }
        });
    },
    
    createTiledBackground: function(texture) {
        // Clear the solid color
        this.removeAllChildren();
        
        var tileSize = 16; // Each tile is 16x16 pixels
        var gridWidth = this.backgroundMap[0].length;
        var gridHeight = this.backgroundMap.length;
        
        // Draw background from top-left corner to cover entire canvas
        var offsetX = 0;
        var offsetY = 0;
        
        for (var y = 0; y < gridHeight; y++) {
            for (var x = 0; x < gridWidth; x++) {
                // Flip y-coordinate to render first row at the bottom
                var mapY = gridHeight - 1 - y;
                var tileValue = this.backgroundMap[mapY] ? (this.backgroundMap[mapY][x] || 0) : 0;
                if (tileValue === 0) continue; // Skip empty tiles
                
                var frameIndex = tileValue - 1; // Convert to 0-based index if needed
                var frameX = (frameIndex % 5) * tileSize;
                var frameY = Math.floor(frameIndex / 5) * tileSize;
                
                var sprite = new cc.Sprite(texture, 
                    cc.rect(frameX, frameY, tileSize, tileSize));
                sprite.setPosition(offsetX + x * tileSize + tileSize/2, 
                                 offsetY + y * tileSize + tileSize/2);
                this.addChild(sprite);
            }
        }
        
        this.setPosition(0, 0);
        
        console.log("Tiled background created with frames 0 and 4");
    }
});

// Register the Background class
cc.Background = Background;
