const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Function to resize canvas to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initial resize
resizeCanvas();

// Add resize event listener
window.addEventListener('resize', resizeCanvas);

// Game objects
const leftCastle = {
    x: 0,
    y: 0,
    width: 140,
    height: 150,
    stones: [
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1]
    ],
    health: 100
};

const rightCastle = {
    x: 0,
    y: 0,
    width: 140,
    height: 150,
    stones: [
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1]
    ],
    health: 100
};

const leftCatapult = {
    x: 0,
    y: 0,
    angle: -45,
    power: 0,
    maxPower: 150,
    charging: false,
    chargeStart: 0
};

const rightCatapult = {
    x: 0,
    y: 0,
    angle: 225,
    power: 0,
    maxPower: 150,
    charging: false,
    chargeStart: 0
};

let projectiles = [];
let currentPlayer = 'left';
let leftScore = 0;
let rightScore = 0;
let canShoot = true;
let currentRound = 1;
let explosions = []; // Array to store active explosions
let fallingStones = []; // Array to store stones that are falling
let muzzleFlashes = []; // Array to store active muzzle flashes
let cannonSmoke = []; // Array to store lingering cannon smoke
let projectileTrails = []; // Array to store smoke trails behind cannonballs

// Get the cannon sound element
const cannonSound = document.getElementById('cannonSound');
const impactSound = document.getElementById('impactSound');
const explosionSound = document.getElementById('explosionSound');

// Function to update positions based on canvas size
function updatePositions() {
    // Update castle positions - placing them closer to the edges
    leftCastle.x = canvas.width * 0.02;
    leftCastle.y = canvas.height * 0.65;
    rightCastle.x = canvas.width * 0.88;
    rightCastle.y = canvas.height * 0.65;

    // Update castle sizes - making them 50% bigger
    const baseSize = Math.min(canvas.width, canvas.height) * 0.22;
    leftCastle.width = baseSize;
    leftCastle.height = baseSize * 1.2;
    rightCastle.width = baseSize;
    rightCastle.height = baseSize * 1.2;

    // Calculate position 9% from the bottom of the screen
    const bottomPosition = canvas.height * 0.91; // Changed from 0.93 to 0.91 for 9% from bottom

    // Update catapult positions - placing them in front of each castle
    leftCatapult.x = leftCastle.x + leftCastle.width + 20; // 20 pixels in front of left castle
    leftCatapult.y = bottomPosition;
    rightCatapult.x = rightCastle.x - 20; // 20 pixels in front of right castle
    rightCatapult.y = bottomPosition;
}

// Explosion particle class
class ExplosionParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= 0.02;
        this.size *= 0.98;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(128, 128, 128, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Falling stone class
class FallingStone {
    constructor(castle, row, col, targetY) {
        this.castle = castle;
        this.row = row;
        this.col = col;
        this.x = castle.x + col * (castle.width / 7);
        this.y = castle.y + row * (castle.height / 4);
        this.targetY = targetY;
        this.vy = 0; // Initial vertical velocity
        this.gravity = 0.2; // Gravity acceleration
        this.delay = (row - 1) * 200; // Delay based on row position
        this.startTime = Date.now();
        this.exploded = false;
    }

    update() {
        // Check if delay has passed
        if (Date.now() - this.startTime < this.delay) {
            return false; // Still in delay
        }

        if (this.y < this.targetY) {
            this.vy += this.gravity; // Apply gravity
            this.y += this.vy; // Update position based on velocity
            
            // Add a slight horizontal wobble
            this.x += (Math.random() - 0.5) * 0.5;
            
            return false; // Still falling
        }
        return true; // Reached target
    }

    draw(ctx) {
        const stoneWidth = this.castle.width / 7;
        const stoneHeight = this.castle.height / 4;
        
        ctx.fillStyle = '#808080';
        ctx.fillRect(this.x, this.y, stoneWidth, stoneHeight);
        
        ctx.strokeStyle = '#606060';
        ctx.strokeRect(this.x, this.y, stoneWidth, stoneHeight);
    }
}

// Add cloud class
class Cloud {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 0.2;
    }

    update() {
        this.x += this.speed;
        if (this.x > canvas.width + 100) {
            this.x = -100;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        // Draw cloud parts
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size, this.y - this.size/2, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 2, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size, this.y + this.size/2, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create more and bigger clouds
const clouds = [
    new Cloud(100, 50, 30),
    new Cloud(300, 80, 35),
    new Cloud(500, 40, 40),
    new Cloud(700, 70, 32),
    new Cloud(200, 120, 25),
    new Cloud(400, 90, 28),
    new Cloud(600, 60, 38),
    new Cloud(800, 100, 30)
];

// Draw functions
function drawCastle(castle) {
    const stoneWidth = castle.width / 7;
    const stoneHeight = castle.height / 4;
    
    // Draw stones
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 7; col++) {
            if (castle.stones[row][col]) {
                ctx.fillStyle = '#808080';
                ctx.fillRect(
                    castle.x + col * stoneWidth,
                    castle.y + row * stoneHeight,
                    stoneWidth,
                    stoneHeight
                );
                
                ctx.strokeStyle = '#606060';
                ctx.strokeRect(
                    castle.x + col * stoneWidth,
                    castle.y + row * stoneHeight,
                    stoneWidth,
                    stoneHeight
                );
            }
        }
    }
}

function drawCatapult(catapult) {
    // Draw wheels
    const backWheelRadius = 12;
    const frontWheelRadius = 24;
    const floorY = catapult.y;
    const backWheelY = floorY - backWheelRadius;
    const frontWheelY = floorY - frontWheelRadius;

    const isRightCatapult = catapult === rightCatapult;
    const backWheelX = catapult.x + (isRightCatapult ? 10 : -10);
    const frontWheelX = catapult.x + (isRightCatapult ? -10 : 10);

    // Draw wooden wheel with metal rim - back wheel
    ctx.fillStyle = '#8B4513'; // Wood color
    ctx.beginPath();
    ctx.arc(backWheelX, backWheelY, backWheelRadius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2F2F2F';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;

    // Draw back wheel spokes
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(backWheelX, backWheelY);
        ctx.lineTo(backWheelX + Math.cos(angle) * (backWheelRadius - 2), backWheelY + Math.sin(angle) * (backWheelRadius - 2));
        ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Draw wooden carriage/base
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(backWheelX - 35, backWheelY);
    ctx.lineTo(backWheelX + 35, backWheelY);
    ctx.lineTo(backWheelX + 30, backWheelY - 15);
    ctx.lineTo(backWheelX - 30, backWheelY - 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4A3728';
    ctx.stroke();

    // Calculate recoil offset
    let recoilOffset = 0;
    let postFireRecoil = 0;
    if (catapult.charging) {
        const currentPower = Math.min((Date.now() - catapult.chargeStart) / 10, catapult.maxPower);
        recoilOffset = (currentPower / catapult.maxPower) * 15;
    }
    // Post-fire recoil animation
    if (catapult.fireTime && Date.now() - catapult.fireTime < 200) {
        const elapsed = Date.now() - catapult.fireTime;
        postFireRecoil = Math.sin(elapsed / 200 * Math.PI) * 8;
    }

    // Draw cannon body with recoil
    ctx.save();
    ctx.translate(backWheelX, backWheelY - 10);
    ctx.rotate(catapult.angle * Math.PI / 180);

    // Draw cannon barrel - tapered shape
    const barrelLength = 65;
    const baseWidth = 14;
    const tipWidth = 10;

    // Main barrel gradient (bronze/iron look)
    const barrelGradient = ctx.createLinearGradient(0, -baseWidth/2, 0, baseWidth/2);
    barrelGradient.addColorStop(0, '#4A4A4A');
    barrelGradient.addColorStop(0.3, '#6B6B6B');
    barrelGradient.addColorStop(0.5, '#5A5A5A');
    barrelGradient.addColorStop(0.7, '#3A3A3A');
    barrelGradient.addColorStop(1, '#2A2A2A');

    // Draw tapered barrel
    ctx.fillStyle = barrelGradient;
    ctx.beginPath();
    ctx.moveTo(-recoilOffset - postFireRecoil - 5, -baseWidth/2);
    ctx.lineTo(barrelLength - recoilOffset - postFireRecoil, -tipWidth/2);
    ctx.lineTo(barrelLength - recoilOffset - postFireRecoil, tipWidth/2);
    ctx.lineTo(-recoilOffset - postFireRecoil - 5, baseWidth/2);
    ctx.closePath();
    ctx.fill();

    // Barrel outline
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Metal reinforcement bands
    ctx.fillStyle = '#3D3D3D';
    const bandPositions = [5, 20, 35, 50];
    for (const pos of bandPositions) {
        const bandX = pos - recoilOffset - postFireRecoil;
        const widthAtPos = baseWidth - (baseWidth - tipWidth) * (pos / barrelLength);
        ctx.fillRect(bandX, -widthAtPos/2 - 1, 4, widthAtPos + 2);
        // Band highlight
        ctx.fillStyle = '#5A5A5A';
        ctx.fillRect(bandX, -widthAtPos/2 - 1, 1, widthAtPos + 2);
        ctx.fillStyle = '#3D3D3D';
    }

    // Muzzle ring (thicker ring at the tip)
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.arc(barrelLength - recoilOffset - postFireRecoil + 2, 0, tipWidth/2 + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.arc(barrelLength - recoilOffset - postFireRecoil + 2, 0, tipWidth/2, 0, Math.PI * 2);
    ctx.fill();

    // Barrel bore (black hole at the tip)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(barrelLength - recoilOffset - postFireRecoil + 3, 0, tipWidth/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Cascabel (round knob at the back)
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.arc(-recoilOffset - postFireRecoil - 8, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2A2A2A';
    ctx.stroke();

    // Touch hole (fuse hole on top)
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(10 - recoilOffset - postFireRecoil, -baseWidth/2 + 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Front wheel (larger) - wooden with metal rim
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(frontWheelX, frontWheelY, frontWheelRadius - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2F2F2F';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 1;

    // Hub
    ctx.fillStyle = '#2F2F2F';
    ctx.beginPath();
    ctx.arc(frontWheelX, frontWheelY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw front wheel spokes
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(frontWheelX, frontWheelY);
        ctx.lineTo(frontWheelX + Math.cos(angle) * (frontWheelRadius - 3), frontWheelY + Math.sin(angle) * (frontWheelRadius - 3));
        ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Draw power meter and trajectory prediction only when charging
    if (catapult.charging) {
        const currentPower = Math.min((Date.now() - catapult.chargeStart) / 10, catapult.maxPower);

        // Draw power meter
        ctx.fillStyle = 'red';
        ctx.fillRect(backWheelX - 20, backWheelY - 40, 40, 10);
        ctx.fillStyle = 'green';
        ctx.fillRect(backWheelX - 20, backWheelY - 40, 40 * (currentPower / catapult.maxPower), 10);

        // Draw power text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Power: ${Math.round(currentPower)}`, backWheelX, backWheelY - 45);

        // Draw trajectory prediction
        const angle = catapult.angle * Math.PI / 180;
        const startX = backWheelX + Math.cos(angle) * (65 - recoilOffset);
        const startY = backWheelY - 10 + Math.sin(angle) * (65 - recoilOffset);
        const power = currentPower / 5;

        let x = startX;
        let y = startY;
        let vx = Math.cos(angle) * power;
        let vy = Math.sin(angle) * power;
        const gravity = 0.2;
        const screenMiddle = canvas.width / 2;
        const fadeStartDistance = 200;
        const dotSpacing = 20;
        let distanceTraveled = 0;

        for (let t = 0; t < 60; t++) {
            x += vx;
            y += vy;
            vy += gravity;
            distanceTraveled += Math.sqrt(vx * vx + vy * vy);

            if (y > floorY) break;

            if (distanceTraveled >= dotSpacing) {
                let opacity = 1;
                if (currentPlayer === 'left' && x > screenMiddle - fadeStartDistance) {
                    opacity = Math.max(0, 1 - (x - (screenMiddle - fadeStartDistance)) / 150);
                } else if (currentPlayer === 'right' && x < screenMiddle + fadeStartDistance) {
                    opacity = Math.max(0, 1 - ((screenMiddle + fadeStartDistance) - x) / 150);
                }

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
                ctx.fill();

                distanceTraveled = 0;
            }
        }
    }
}

function drawProjectile(projectile) {
    // Add trail particles
    if (Math.random() < 0.5) {
        projectileTrails.push(new TrailParticle(projectile.x, projectile.y));
    }

    // Draw cannonball with shading
    const gradient = ctx.createRadialGradient(
        projectile.x - 2, projectile.y - 2, 0,
        projectile.x, projectile.y, 6
    );
    gradient.addColorStop(0, '#4A4A4A');
    gradient.addColorStop(0.5, '#2A2A2A');
    gradient.addColorStop(1, '#000');

    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(projectile.x - 2, projectile.y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

function calculateCastleHealth(castle) {
    let totalStones = 0;
    let remainingStones = 0;
    
    // Count total stones and remaining stones
    for (let row = 0; row < castle.stones.length; row++) {
        for (let col = 0; col < castle.stones[row].length; col++) {
            if (castle.stones[row][col]) {
                totalStones++;
                remainingStones++;
            }
        }
    }
    
    // Calculate health percentage based on remaining stones
    return totalStones > 0 ? (remainingStones / totalStones) * 100 : 0;
}

function drawScore() {
    ctx.fillStyle = '#00008B';
    ctx.font = `${Math.min(canvas.width, canvas.height) * 0.02}px Arial`;
    ctx.textAlign = 'center';
    
    // Always show round indicator
    ctx.fillText(`Round ${currentRound}`, canvas.width / 2, canvas.height * 0.1);
    
    // Draw left player score and stones
    ctx.fillText(`Player 1: ${leftScore}`, canvas.width * 0.2, canvas.height * 0.1);
    
    // Draw stone indicators for left player
    const stoneSize = Math.min(canvas.width, canvas.height) * 0.008;
    const stoneSpacing = stoneSize * 0.3;
    const startY = canvas.height * 0.12;
    
    // Count total stones for left player
    let totalLeftStones = 0;
    for (let row = 0; row < leftCastle.stones.length; row++) {
        for (let col = 0; col < leftCastle.stones[row].length; col++) {
            if (leftCastle.stones[row][col]) {
                totalLeftStones++;
            }
        }
    }
    
    // Calculate total width of stone indicators
    const totalWidth = (totalLeftStones * stoneSize) + ((totalLeftStones - 1) * stoneSpacing);
    const startX = canvas.width * 0.2 - (totalWidth / 2);
    
    // Draw stones in a single row for left player
    for (let i = 0; i < totalLeftStones; i++) {
        const x = startX + i * (stoneSize + stoneSpacing);
        ctx.fillStyle = '#006400';
        ctx.fillRect(x, startY, stoneSize, stoneSize);
    }
    
    // Draw right player score and stones
    ctx.fillStyle = '#00008B';
    ctx.fillText(`Player 2: ${rightScore}`, canvas.width * 0.8, canvas.height * 0.1);
    
    // Count total stones for right player
    let totalRightStones = 0;
    for (let row = 0; row < rightCastle.stones.length; row++) {
        for (let col = 0; col < rightCastle.stones[row].length; col++) {
            if (rightCastle.stones[row][col]) {
                totalRightStones++;
            }
        }
    }
    
    // Calculate total width of stone indicators
    const totalRightWidth = (totalRightStones * stoneSize) + ((totalRightStones - 1) * stoneSpacing);
    const rightStartX = canvas.width * 0.8 - (totalRightWidth / 2);
    
    // Draw stones in a single row for right player
    for (let i = 0; i < totalRightStones; i++) {
        const x = rightStartX + i * (stoneSize + stoneSpacing);
        ctx.fillStyle = '#006400';
        ctx.fillRect(x, startY, stoneSize, stoneSize);
    }
}

// Physics
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity

        // Check collision with castles
        const checkCastleCollision = (castle, isLeftCastle) => {
            const stoneWidth = castle.width / 7;
            const stoneHeight = castle.height / 4;
            
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 7; col++) {
                    if (castle.stones[row][col]) {
                        const stoneX = castle.x + col * stoneWidth;
                        const stoneY = castle.y + row * stoneHeight;
                        
                        if (p.x > stoneX && p.x < stoneX + stoneWidth &&
                            p.y > stoneY && p.y < stoneY + stoneHeight) {
                            // Create explosion for the hit stone
                            createExplosion(stoneX + stoneWidth/2, stoneY + stoneHeight/2);
                            castle.stones[row][col] = 0;
                            castle.health -= 5;
                            
                            // Check and explode stones above with delay
                            for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                                if (castle.stones[aboveRow][col]) {
                                    const aboveStoneX = castle.x + col * stoneWidth;
                                    const aboveStoneY = castle.y + aboveRow * stoneHeight;
                                    const targetY = castle.y + row * stoneHeight;
                                    
                                    // Add falling stone
                                    fallingStones.push(new FallingStone(castle, aboveRow, col, targetY));
                                    
                                    // Remove the stone from the castle
                                    castle.stones[aboveRow][col] = 0;
                                    castle.health -= 5;
                                } else {
                                    break; // Stop if we hit an empty space
                                }
                            }
                            
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        // Only check collision with the opponent's castle based on who fired the projectile
        if (p.firedBy === 'left') {
            // Left player's projectile - only check right castle
            if (checkCastleCollision(rightCastle, false)) {
                leftScore += 5;
                projectiles.splice(i, 1);
            }
        } else {
            // Right player's projectile - only check left castle
            if (checkCastleCollision(leftCastle, true)) {
                rightScore += 5;
                projectiles.splice(i, 1);
            }
        }

        // Remove if out of bounds
        if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }
}

// Update explosions
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        if (explosions[i].life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// Helper function to create explosion
function createExplosion(x, y) {
    for (let j = 0; j < 15; j++) {
        explosions.push(new ExplosionParticle(x, y));
    }
}

// Update falling stones
function updateFallingStones() {
    for (let i = fallingStones.length - 1; i >= 0; i--) {
        const stone = fallingStones[i];
        if (stone.update()) {
            // Stone has reached its target, create explosion
            const stoneWidth = stone.castle.width / 7;
            const stoneHeight = stone.castle.height / 4;
            createExplosion(stone.x + stoneWidth/2, stone.y + stoneHeight/2);
            fallingStones.splice(i, 1);
        }
    }
}

// Cannon smoke particle class (lingering smoke after firing)
class CannonSmokeParticle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        // Drift upward and slightly in the firing direction
        this.vx = Math.cos(angle) * (Math.random() * 0.5) + (Math.random() - 0.5) * 0.3;
        this.vy = -Math.random() * 0.8 - 0.3; // Drift upward
        this.life = 1.0;
        this.size = Math.random() * 15 + 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy -= 0.005; // Slowly accelerate upward
        this.life -= 0.008;
        this.size += 0.3; // Expand as it rises
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = `rgba(150, 150, 150, ${this.life * 0.4})`;
        ctx.beginPath();
        // Draw irregular smoke shape
        ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Projectile trail particle class
class TrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5 - 0.2; // Slight upward drift
        this.life = 1.0;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = `rgba(120, 120, 120, ${this.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Spark particle class
class SparkParticle {
    constructor(x, y, angle) {
        const spread = (Math.random() - 0.5) * 0.8;
        const speed = Math.random() * 8 + 4;
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle + spread) * speed;
        this.vy = Math.sin(angle + spread) * speed;
        this.life = 1.0;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravity
        this.vx *= 0.98; // Air resistance
        this.life -= 0.05;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const brightness = Math.floor(255 * this.life);
        ctx.fillStyle = `rgb(${brightness}, ${Math.floor(brightness * 0.6)}, 0)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Muzzle flash class
class MuzzleFlash {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.life = 1.0;
        this.size = 30;
        this.sparks = [];
        // Create sparks
        const angleRad = angle * Math.PI / 180;
        for (let i = 0; i < 12; i++) {
            this.sparks.push(new SparkParticle(x, y, angleRad));
        }
    }

    update() {
        this.life -= 0.12;
        this.size *= 0.85;
        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.sparks[i].update();
            if (this.sparks[i].life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw sparks first (behind flash)
        this.sparks.forEach(spark => spark.draw(ctx));

        if (this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);

        // Draw bright white core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.3);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${this.life})`);
        coreGradient.addColorStop(1, `rgba(255, 255, 200, ${this.life * 0.5})`);
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw main flash
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(255, 200, 50, ${this.life * 0.9})`);
        gradient.addColorStop(0.3, `rgba(255, 150, 0, ${this.life * 0.7})`);
        gradient.addColorStop(0.6, `rgba(255, 100, 0, ${this.life * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw directional blast cone
        ctx.fillStyle = `rgba(255, 200, 100, ${this.life * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.size * 1.5, -this.size * 0.4);
        ctx.lineTo(this.size * 1.5, this.size * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// Update muzzle flashes
function updateMuzzleFlashes() {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].update();
        if (muzzleFlashes[i].life <= 0 && muzzleFlashes[i].sparks.length === 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

// Update cannon smoke
function updateCannonSmoke() {
    for (let i = cannonSmoke.length - 1; i >= 0; i--) {
        cannonSmoke[i].update();
        if (cannonSmoke[i].life <= 0) {
            cannonSmoke.splice(i, 1);
        }
    }
}

// Update projectile trails
function updateProjectileTrails() {
    for (let i = projectileTrails.length - 1; i >= 0; i--) {
        projectileTrails[i].update();
        if (projectileTrails[i].life <= 0) {
            projectileTrails.splice(i, 1);
        }
    }
}

// Add sun drawing function
function drawSun() {
    const sunX = canvas.width * 0.8;
    const sunY = canvas.height * 0.2;
    const sunRadius = 50;
    
    // Sun glow
    const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
}

// Update drawMountain function for bigger mountains
function drawMountain(x, width, height) {
    const gradient = ctx.createLinearGradient(x, canvas.height * 0.6, x + width, canvas.height * 0.6);
    gradient.addColorStop(0, '#509050');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(x, canvas.height * 0.6);
    ctx.lineTo(x + width/2, canvas.height * 0.6 - height);
    ctx.lineTo(x + width, canvas.height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Add snow cap
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(x + width/2 - width * 0.1, canvas.height * 0.6 - height + height * 0.15);
    ctx.lineTo(x + width/2, canvas.height * 0.6 - height);
    ctx.lineTo(x + width/2 + width * 0.1, canvas.height * 0.6 - height + height * 0.15);
    ctx.closePath();
    ctx.fill();
}

// Update the shouldStoneFall function to play explosion sound
function shouldStoneFall(castle, index) {
    const row = Math.floor(index / castle.stonesPerRow);
    const col = index % castle.stonesPerRow;
    
    // Bottom row stones always have support
    if (row === castle.rows - 1) return false;
    
    // Check if stone below exists
    const stoneBelow = castle.stones[index + castle.stonesPerRow];
    if (!stoneBelow) {
        // Play explosion sound when stone should fall
        explosionSound.currentTime = 0;
        explosionSound.play();
        return true;
    }
    
    return false;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update positions based on current canvas size
    updatePositions();
    
    // Draw sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sun
    drawSun();
    
    // Draw clouds
    clouds.forEach(cloud => {
        cloud.update();
        cloud.draw(ctx);
    });

    // Draw ground layers with bigger areas
    // Brown ground (bigger)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height * 0.85, canvas.width, canvas.height * 0.15);
    
    // Green grass (extended to mountains)
    const grassGradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height * 0.85);
    grassGradient.addColorStop(0, '#228B22');
    grassGradient.addColorStop(1, '#006400');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.45);
    
    // Draw more and bigger mountains
    drawMountain(canvas.width * 0.05, canvas.width * 0.25, canvas.height * 0.35);
    drawMountain(canvas.width * 0.75, canvas.width * 0.25, canvas.height * 0.35);
    drawMountain(canvas.width * 0.2, canvas.width * 0.2, canvas.height * 0.3);
    drawMountain(canvas.width * 0.6, canvas.width * 0.2, canvas.height * 0.3);
    
    drawScore();
    drawCastle(leftCastle);
    drawCastle(rightCastle);
    drawCatapult(leftCatapult);
    drawCatapult(rightCatapult);
    
    updateProjectiles();
    updateExplosions();
    updateFallingStones();
    updateMuzzleFlashes();
    updateCannonSmoke();
    updateProjectileTrails();

    // Draw smoke behind everything else
    cannonSmoke.forEach(smoke => smoke.draw(ctx));
    projectileTrails.forEach(trail => trail.draw(ctx));

    projectiles.forEach(drawProjectile);
    explosions.forEach(particle => particle.draw(ctx));
    fallingStones.forEach(stone => stone.draw(ctx));
    muzzleFlashes.forEach(flash => flash.draw(ctx));
    
    // Check game over - all stones must be destroyed
    let leftStonesRemaining = 0;
    let rightStonesRemaining = 0;
    
    // Count remaining stones in left castle
    for (let row = 0; row < leftCastle.stones.length; row++) {
        for (let col = 0; col < leftCastle.stones[row].length; col++) {
            if (leftCastle.stones[row][col]) {
                leftStonesRemaining++;
            }
        }
    }
    
    // Count remaining stones in right castle
    for (let row = 0; row < rightCastle.stones.length; row++) {
        for (let col = 0; col < rightCastle.stones[row].length; col++) {
            if (rightCastle.stones[row][col]) {
                rightStonesRemaining++;
            }
        }
    }
    
    // Only check for game over if there are no falling stones
    if (fallingStones.length === 0 && (leftStonesRemaining === 0 || rightStonesRemaining === 0)) {
        // Create and show banner
        const banner = document.createElement('div');
        banner.style.position = 'fixed';
        banner.style.top = '50%';
        banner.style.left = '50%';
        banner.style.transform = 'translate(-50%, -50%)';
        banner.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        banner.style.padding = '20px';
        banner.style.borderRadius = '10px';
        banner.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        banner.style.zIndex = '1000';
        banner.style.textAlign = 'center';
        banner.style.fontFamily = 'Arial, sans-serif';
        banner.style.fontSize = '16px';
        banner.style.color = '#00008B';
        banner.style.cursor = 'pointer';
        
        const winner = leftStonesRemaining === 0 ? 'Player 2' : 'Player 1';
        banner.innerHTML = `
            <h2 style="margin: 0 0 10px 0; font-size: 24px; color: #00008B;">Game Over!</h2>
            <p style="margin: 0 0 5px 0;">${winner} wins!</p>
            <p style="margin: 0 0 5px 0;">Final Score:</p>
            <p style="margin: 0 0 5px 0;">Player 1: ${leftScore}</p>
            <p style="margin: 0 0 5px 0;">Player 2: ${rightScore}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Click anywhere to restart</p>
        `;
        
        document.body.appendChild(banner);
        
        // Add click event listener to the banner
        banner.addEventListener('click', () => {
            banner.remove();
            // Reset all game state
            leftCastle.stones = [
                [1,0,1,0,1,0,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ];
            rightCastle.stones = [
                [1,0,1,0,1,0,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ];
            leftCastle.health = 100;
            rightCastle.health = 100;
            leftScore = 0;
            rightScore = 0;
            currentPlayer = 'left';
            currentRound = 1;
            projectiles = [];
            explosions = [];
            fallingStones = [];
            muzzleFlashes = [];
            cannonSmoke = [];
            projectileTrails = [];
            canShoot = true;
        });
    }
    
    requestAnimationFrame(gameLoop);
}

// Controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'q':
            if (currentPlayer === 'left') {
                leftCatapult.angle = Math.max(leftCatapult.angle - 5, -85); // Decrease angle (point down)
            }
            break;
        case 'a':
            if (currentPlayer === 'left') {
                leftCatapult.angle = Math.min(leftCatapult.angle + 5, 0); // Increase angle (point up)
            }
            break;
        case 'o':
            if (currentPlayer === 'right') {
                rightCatapult.angle = Math.min(rightCatapult.angle + 5, 265);
            }
            break;
        case 'l':
            if (currentPlayer === 'right') {
                rightCatapult.angle = Math.max(rightCatapult.angle - 5, 180);
            }
            break;
        case ' ':
            const currentCatapult = currentPlayer === 'left' ? leftCatapult : rightCatapult;
            if (!currentCatapult.charging) {
                currentCatapult.charging = true;
                currentCatapult.chargeStart = Date.now();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        const currentCatapult = currentPlayer === 'left' ? leftCatapult : rightCatapult;
        if (currentCatapult.charging) {
            const chargeTime = Date.now() - currentCatapult.chargeStart;
            currentCatapult.power = Math.min(chargeTime / 10, currentCatapult.maxPower);
            currentCatapult.charging = false;
            
            // Play cannon sound
            cannonSound.currentTime = 0;
            cannonSound.play();

            // Set fire time for recoil animation
            currentCatapult.fireTime = Date.now();

            // Calculate position at the tip of the cannon barrel
            const angle = currentCatapult.angle * Math.PI / 180;
            const barrelLength = 65;
            const floorY = currentCatapult.y;
            const backWheelRadius = 12;
            const cannonBaseY = floorY - backWheelRadius - 10;
            const backWheelX = currentCatapult.x + (currentCatapult === rightCatapult ? 10 : -10);

            // Calculate the position of the cannon tip
            const flashX = backWheelX + Math.cos(angle) * (barrelLength + 5);
            const flashY = cannonBaseY + Math.sin(angle) * (barrelLength + 5);

            // Create muzzle flash at the tip
            muzzleFlashes.push(new MuzzleFlash(flashX, flashY, currentCatapult.angle));

            // Create lingering smoke cloud
            for (let i = 0; i < 8; i++) {
                cannonSmoke.push(new CannonSmokeParticle(flashX, flashY, angle));
            }
            
            const power = currentCatapult.power / 5;
            
            // Launch projectile from the tip
            projectiles.push({
                x: flashX,
                y: flashY,
                vx: Math.cos(angle) * power,
                vy: Math.sin(angle) * power,
                firedBy: currentPlayer // Track which player fired the projectile
            });
            
            canShoot = false;
            currentPlayer = currentPlayer === 'left' ? 'right' : 'left';
            currentRound++;
            setTimeout(() => {
                canShoot = true;
            }, 1000);
        }
    }
});

// Start game
gameLoop(); 