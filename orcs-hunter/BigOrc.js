// BigOrc.js
// A stronger variant of Orc that deals double power damage.

var BigOrc = Orc.extend({
    // Override attack power (2 points per attack loop)
    attackPower: 2,

    // Override health for big orc enemies (HP points)
    maxHealth: 4,
    health: 4,

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
        return this._super(texture);
    }
});

// Expose globally
window.BigOrc = BigOrc;