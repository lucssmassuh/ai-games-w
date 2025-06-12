// BigOrc.js
// A stronger variant of Orc that's larger and deals double power damage.

var BigOrc = Orc.extend({
    // Override attack power (2 points per attack loop)
    attackPower: 2,
    // Scale factor for the big orc (1.5x size of regular orc)
    scaleFactor: 1.5,
    // Frame crop amount (0 means no crop for big orcs)
    frameCrop: 0,

    /**
     * Initialize with its specific texture.
     * @returns {boolean} true if initialization succeeded
     */
    init: function() {
        var texture = cc.textureCache.addImage("assets/big-orc.png");
        if (!texture) {
            console.error("Failed to load big-orc.png");
            return false;
        }
        var ok = this._super(texture);
        if (ok) {
            // Scale big orc up for larger appearance
            this.setScale(this.scaleFactor);
        }
        return ok;
    },
    
    /**
     * Override to use the big orc's frame crop setting
     */
    getBoundingBox: function() {
        var rect = this._super();
        if (this.scaleFactor !== 1.0) {
            rect.width *= this.scaleFactor;
            rect.height *= this.scaleFactor;
            rect.x -= (rect.width - this.frameWidth) / 2;
            rect.y -= (rect.height - this.frameHeight) / 2;
        }
        return rect;
    }
});

// Expose globally
window.BigOrc = BigOrc;