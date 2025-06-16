// Death.js
// A variant of Orc that is similar to BigOrc but uses the death sprite.

var Death = Orc.extend({
    // Override movement speed (double speed)
    WALK_SPEED: 40,

    // Override attack power (2 points per attack loop)
    attackPower: 2,

    // Override health for death enemies (HP points)
    maxHealth: 6,
    health: 6,

    /**
     * Initialize with its specific texture.
     * @returns {boolean} true if initialization succeeded
     */
    init: function() {
        var texture = cc.textureCache.addImage("assets/death.png");
        if (!texture) {
            console.error("Failed to load death.png");
            return false;
        }
        return this._super(texture);
    }
});

// Expose globally
window.Death = Death;