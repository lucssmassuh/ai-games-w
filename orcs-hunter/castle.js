// castle.js

var Castle = cc.Node.extend({
    map: null,
    tileSize: 32,
    verticalOffset: 350,

    ctor: function() {
        this._super();
        console.log("Creating Castle instance...");
        
        // Castle tile map (0 = no tile)
        this.map = [
            [12, 0, 7, 0, 12, 0, 7, 0, 12],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 9, 7, 9, 7, 9, 7, 9, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 11, 7, 11, 7, 11, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 1, 7, 7, 7, 7]
        ];
        
        this.init();
        console.log("Castle initialization complete");
    },
    
    init: function() {
        // Load and place castle tiles
        console.log("Loading castle tileset...");
        var tileset = cc.textureCache.addImage("assets/castle-tileset.png");
        if (!tileset) {
            console.error("Failed to load castle-tileset.png");
            return;
        }
        console.log("Castle tileset loaded successfully");
        var tileSize = this.tileSize;
        
        // Scale down the entire castle
        this.setScale(0.4);

        for (var y = 0; y < this.map.length; y++) {
            for (var x = 0; x < this.map[y].length; x++) {
                var tileIndex = this.map[y][x];
                if (tileIndex > 0) {
                    // Calculate tile position in the tileset based on index
                    var tilesPerRow = 8; // 8 columns in the tileset
                    var tileX = ((tileIndex - 1) % tilesPerRow) * tileSize;
                    var tileY = Math.floor((tileIndex - 1) / tilesPerRow) * tileSize;
                    
                    var tile = new cc.Sprite(
                        tileset,
                        cc.rect(tileX, tileY, tileSize, tileSize)
                    );
                    
                    // Position the tile on screen with vertical offset
                    tile.setPosition(
                        x * tileSize + tileSize/2,
                        (this.map.length - y - 1) * tileSize + tileSize/2 + this.verticalOffset
                    );
                    this.addChild(tile, 2); // Add castle tiles at z-order 2
                }
            }
        }
    },
    
    // Get the vertical offset used for positioning the castle
    getVerticalOffset: function() {
        return this.verticalOffset;
    },
    
    // Get the base Y position where the orcs should walk
    getOrcBaseY: function() {
        // Position orcs at 25% from the bottom of the canvas
        return cc.winSize.height * 0.25;
    }
});

cc.Castle = Castle;
console.log("Castle class registered with Cocos2d-js");
