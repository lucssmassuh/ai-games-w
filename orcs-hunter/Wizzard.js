// Wizzard.js
// A stronger variant of Orc that deals double power damage, using the wizard sprite.

var Wizzard = Orc.extend({
    // Override movement speed (triple speed)
    WALK_SPEED: 60,

    // Override attack power (2 points per attack loop)
    attackPower: 2,

    // Override health for wizard enemies (HP points)
    maxHealth: 4,
    health: 4,

    /**
     * Initialize with its specific texture.
     * @returns {boolean} true if initialization succeeded
     */
    init: function() {
        var texture = cc.textureCache.addImage("assets/wizzard.png");
        if (!texture) {
            console.error("Failed to load wizzard.png");
            return false;
        }
        return this._super(texture);
    }
});

// Expose globally
window.Wizzard = Wizzard;