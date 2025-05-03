// robots.js

// Define a Robot class to create player-controlled robots
class Explosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        const numParticles = 20;
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 2 + 2,
                alpha: 1,
                life: Math.random() * 30 + 30
            });
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.02;
            particle.life--;
        });
        // Remove particles that have faded out
        this.particles = this.particles.filter(particle => particle.life > 0);
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

class Robot {
    constructor(color, x, y, canvasWidth, canvasHeight) {
        this.footRadius = 20;
        this.spinSpeed = -0.05;
        this.staticFoot = { x: x, y: y };
        this.dynamicFoot = { x: 0, y: 0 };
        this.rotationAngle = 0;
        this.color = color;
        this.bullets = [];
        this.bulletSpeed = 5;
        this.bulletRadius = 5;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.explosions = [];
    }

    updateDynamicFootPosition() {
        this.dynamicFoot.x = this.staticFoot.x + Math.cos(this.rotationAngle) * (this.footRadius * 3);
        this.dynamicFoot.y = this.staticFoot.y + Math.sin(this.rotationAngle) * (this.footRadius * 3);
    }

    draw(ctx) {
        // Draw static foot
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.staticFoot.x, this.staticFoot.y, this.footRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw dynamic foot with a darker shade
        ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
        ctx.beginPath();
        ctx.arc(this.dynamicFoot.x, this.dynamicFoot.y, this.footRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw bullets
        ctx.fillStyle = this.color;
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, this.bulletRadius, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw explosions
        this.explosions.forEach(explosion => explosion.draw(ctx));

        this.rotationAngle += this.spinSpeed;
    }

    toggleFeet(canvasWidth, canvasHeight) {
        // Check if the dynamic foot is within the canvas limits
        if (this.dynamicFoot.x >= 0 && this.dynamicFoot.x <=canvasWidth &&
            this.dynamicFoot.y >= 0 && this.dynamicFoot.y <= canvasHeight) {
            // Toggle feet only if the dynamic foot is within the canvas
            let temp = this.staticFoot;
            this.staticFoot = this.dynamicFoot;
            this.dynamicFoot = temp;
            this.spinSpeed = -this.spinSpeed;
            this.rotationAngle = Math.atan2(this.dynamicFoot.y - this.staticFoot.y, this.dynamicFoot.x - this.staticFoot.x);
        }
    }

    fireBullet() {
        // Create a new bullet from the dynamic foot position
        const bullet = {
            x: this.dynamicFoot.x,
            y: this.dynamicFoot.y,
            dx: Math.cos(this.rotationAngle) * this.bulletSpeed,
            dy: Math.sin(this.rotationAngle) * this.bulletSpeed
        };
        this.bullets.push(bullet);
    }

    updateBullets() {
        // Update bullet positions and remove bullets that are out of bounds
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            return bullet.x >= 0 && bullet.x <= this.canvasWidth &&
                   bullet.y >= 0 && bullet.y <= this.canvasHeight;
        });
    }

    createExplosion(x, y) {
        this.explosions.push(new Explosion(x, y, this.color));
    }

    updateExplosions() {
        this.explosions.forEach(explosion => explosion.update());
        // Remove finished explosions
        this.explosions = this.explosions.filter(explosion => explosion.particles.length > 0);
    }
}
