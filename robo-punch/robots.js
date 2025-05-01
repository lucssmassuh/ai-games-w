// robots.js

// Define a Robot class to create player-controlled robots
class Robot {
    constructor(color, x, y) {
        this.footRadius = 20;
        this.spinSpeed = -0.05; // Initial spin direction can be adjusted per player if desired
        this.staticFoot = { x: x, y: y }; // Initial positions are passed during creation
        this.dynamicFoot = { x: 0, y: 0 }; // Set based on static foot in game setup
        this.rotationAngle = 0;
        this.color = color; // Unique color for each player's robot
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
        ctx.fillStyle = `rgba(0, 0, 0, 0.5)`; // Using a shadow effect for dynamic feet
        ctx.beginPath();
        ctx.arc(this.dynamicFoot.x, this.dynamicFoot.y, this.footRadius, 0, 2 * Math.PI);
        ctx.fill();

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
}
