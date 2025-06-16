// Wizzard.js
// A powerful variant of Orc that deals triple power damage, using the wizard sprite.

var Wizzard = Orc.extend({
    // Override movement speed (triple speed)
    WALK_SPEED: 60,

    // Override attack power (3 points per attack loop)
    attackPower: 3,

    // Override health for wizard enemies (HP points)
    maxHealth: 6,
    health: 6,

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