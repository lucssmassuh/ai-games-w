// Blood.js
// Blood splash effect: red droplets with simple physics and fade-out (50% initial alpha).

var Blood = cc.Node.extend({
    ctor: function() {
        this._super();
        this.life = 0.5; // total duration in seconds
        this.elapsed = 0;
        this.dots = [];
        for (var i = 0; i < 6; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 200 + 100; // px/sec
            var vx = Math.cos(angle) * speed;
            var vy = Math.sin(angle) * speed;
            // smaller drops (radius 1-3 px)
            var radius = Math.random() * 2 + 1;
            this.dots.push({ pos: cc.p(0, 0), vel: cc.p(vx, vy), radius: radius });
        }
        this.drawNode = new cc.DrawNode();
        this.addChild(this.drawNode);
        this.scheduleUpdate();
        return true;
    },

    update: function(dt) {
        this.elapsed += dt;
        var t = Math.max(0, (this.life - this.elapsed) / this.life);
        this.drawNode.clear();
        for (var i = 0; i < this.dots.length; i++) {
            var d = this.dots[i];
            // gravity
            d.vel.y -= 400 * dt;
            // apply velocity
            d.pos.x += d.vel.x * dt;
            d.pos.y += d.vel.y * dt;
            // draw with full initial alpha fading out
            var alpha = 255 * t;
            var color = cc.color(255, 0, 0, alpha);
            this.drawNode.drawDot(d.pos, d.radius, color);
        }
        if (this.elapsed >= this.life) {
            this.removeFromParent();
        }
    }
});

window.Blood = Blood;