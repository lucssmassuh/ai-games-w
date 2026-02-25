// ─── Canvas / geometry ───────────────────────────────────────────────────────
const GW = 800;
const GH = 600;

const PADDLE_W = 110;
const PADDLE_H = 14;
const PADDLE_Y = GH - 55;
const BALL_R   = 9;

const BRICK_COLS = 8;
const BRICK_W    = 80;
const BRICK_H    = 24;
const BRICK_PAD  = 10;
const BRICK_LEFT = (GW - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_PAD)) / 2;
const BRICK_TOP  = 65;
const ALL_ROW_HUES = [280, 240, 200, 170, 130, 80, 40, 10]; // up to 8 rows

const POWERUP_R = BALL_R * 2;  // twice the ball radius (per spec)

const BULLET_SPEED   = 13;
const SHOOT_INTERVAL = 1000;   // ms between auto-volleys
const SHOOT_DURATION = 10000;  // ms
const FIREBALL_DURATION = 8000;// ms

// ─── Level configuration ──────────────────────────────────────────────────────
//  ballSpeed    – pixels/frame for new balls
//  powerupChance– probability each destroyed brick drops a power-up
//  rows         – number of brick rows
const LEVEL_CONFIG = [
    { ballSpeed:  5.0, powerupChance: 0.40, rows: 3 }, // 1 – easy warm-up
    { ballSpeed:  6.2, powerupChance: 0.30, rows: 4 }, // 2
    { ballSpeed:  7.4, powerupChance: 0.22, rows: 5 }, // 3
    { ballSpeed:  8.6, powerupChance: 0.14, rows: 6 }, // 4
    { ballSpeed:  9.8, powerupChance: 0.08, rows: 7 }, // 5
    { ballSpeed: 11.2, powerupChance: 0.04, rows: 7 }, // 6
    { ballSpeed: 12.8, powerupChance: 0.015,rows: 8 }, // 7 – brutal
];
const MAX_LEVEL = LEVEL_CONFIG.length;

// Human-readable labels used on the level-clear screen (index = level-1)
const SPEED_LABELS   = ['Normal','Faster','Quick','Rapid','Blazing','Frantic','INSANE'];
const POWERUP_LABELS = ['Generous','Common','Occasional','Rare','Very Rare','Almost None','Legendary'];

// ─── Runtime level state ──────────────────────────────────────────────────────
let currentLevel     = 1;
let lvBallSpeed      = LEVEL_CONFIG[0].ballSpeed;
let lvPowerupChance  = LEVEL_CONFIG[0].powerupChance;
let lvBrickRows      = LEVEL_CONFIG[0].rows;

// ─── Global state ─────────────────────────────────────────────────────────────
let canvas, ctx, video, handposeModel;
let videoWidth = 640, videoHeight = 480;

let handNormX  = null;
let mouseNormX = null;

let gameState = 'loading'; // loading|start|playing|levelup|gameover|win
let score = 0;
let lives = 3;

let particles = [];
let bricks    = [];
let balls     = [];
let powerups  = [];
let bullets   = [];

let paddle = { x: GW / 2 - PADDLE_W / 2 };

let shootEnabled    = false;
let shootEndTime    = 0;
let lastShotTime    = 0;
let fireballEnabled = false;
let fireballEndTime = 0;

// ─── Level loading ────────────────────────────────────────────────────────────
function loadLevel(n) {
    const cfg    = LEVEL_CONFIG[n - 1];
    lvBallSpeed  = cfg.ballSpeed;
    lvPowerupChance = cfg.powerupChance;
    lvBrickRows  = cfg.rows;
    initBricks();
    resetBalls();
}

function nextLevel() {
    currentLevel++;
    powerups        = [];
    bullets         = [];
    shootEnabled    = false;
    fireballEnabled = false;
    loadLevel(currentLevel);
    gameState = 'playing';
}

// ─── Brick helpers ────────────────────────────────────────────────────────────
function initBricks() {
    bricks = [];
    for (let r = 0; r < lvBrickRows; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
                y: BRICK_TOP  + r * (BRICK_H  + BRICK_PAD),
                w: BRICK_W, h: BRICK_H,
                hue: ALL_ROW_HUES[r % ALL_ROW_HUES.length],
                alive: true,
            });
        }
    }
}

function resetBalls() {
    const angle = (Math.random() - 0.5) * 0.8;
    balls = [{
        x: GW / 2,
        y: PADDLE_Y - 40,
        vx: Math.sin(angle) * lvBallSpeed,
        vy: -Math.cos(angle) * lvBallSpeed,
    }];
}

// ─── Power-up helpers ─────────────────────────────────────────────────────────
const POWERUP_TYPES = ['triple', 'shoot', 'fireball'];
const POWERUP_META  = {
    triple:   { hue: 185, label: '×3', glowColor: '#00ffff' },
    shoot:    { hue: 50,  label: '⚡', glowColor: '#ffdd00' },
    fireball: { hue: 18,  label: '🔥', glowColor: '#ff6600' },
};

function spawnPowerup(x, y) {
    if (Math.random() > lvPowerupChance) return;
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    // speed = 2× current ball speed, per spec
    powerups.push({ x, y, type, vy: lvBallSpeed * 2 });
}

function activatePowerup(type) {
    if (type === 'triple') {
        const src = balls[0] ?? { x: GW / 2, y: PADDLE_Y - 40, vx: 0, vy: -lvBallSpeed };
        const spd = Math.hypot(src.vx, src.vy);
        [-0.6, 0.6].forEach(offset => {
            const a = Math.atan2(src.vy, src.vx) + offset;
            balls.push({ x: src.x, y: src.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd });
        });
    } else if (type === 'shoot') {
        shootEnabled = true;
        shootEndTime = Date.now() + SHOOT_DURATION;
    } else if (type === 'fireball') {
        fireballEnabled = true;
        fireballEndTime = Date.now() + FIREBALL_DURATION;
    }
}

// ─── Particle helpers ─────────────────────────────────────────────────────────
function spawnParticles(x, y, hue, count = 14) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2.5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3,
            hue, alpha: 1,
        });
    }
}

function spawnTrail(x, y, isFireball) {
    particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 2,
        hue: isFireball ? 10 + Math.random() * 25 : 45 + Math.random() * 20,
        alpha: 0.8,
        trail: true,
    });
}

function killBrick(brick) {
    brick.alive = false;
    score += 10 * currentLevel; // score scales with level
    spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.hue);
    spawnPowerup(brick.x + brick.w / 2, brick.y + brick.h / 2);
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    if (gameState !== 'playing') return;

    const now = Date.now();

    // paddle
    const normX = handNormX ?? mouseNormX;
    if (normX !== null) {
        const targetX = normX * GW - PADDLE_W / 2;
        paddle.x = Math.max(0, Math.min(GW - PADDLE_W, targetX));
    }

    // shoot power-up: auto-fire
    if (shootEnabled) {
        if (now > shootEndTime) {
            shootEnabled = false;
        } else if (now - lastShotTime > SHOOT_INTERVAL) {
            bullets.push({ x: paddle.x + 12,                 y: PADDLE_Y - 1 });
            bullets.push({ x: paddle.x + PADDLE_W - 16,      y: PADDLE_Y - 1 });
            lastShotTime = now;
        }
    }

    // fireball timer
    if (fireballEnabled && now > fireballEndTime) fireballEnabled = false;

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bu = bullets[i];
        bu.y -= BULLET_SPEED;
        if (bu.y < 0) { bullets.splice(i, 1); continue; }
        let hit = false;
        for (const brick of bricks) {
            if (!brick.alive) continue;
            if (bu.x + 4 > brick.x && bu.x < brick.x + brick.w &&
                bu.y < brick.y + brick.h && bu.y + 12 > brick.y) {
                killBrick(brick);
                bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;
    }

    // balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.x += b.vx;
        b.y += b.vy;

        spawnTrail(b.x, b.y, fireballEnabled);

        // wall bounces
        if (b.x - BALL_R <= 0)  { b.x = BALL_R;      b.vx =  Math.abs(b.vx); }
        if (b.x + BALL_R >= GW) { b.x = GW - BALL_R; b.vx = -Math.abs(b.vx); }
        if (b.y - BALL_R <= 0)  { b.y = BALL_R;       b.vy =  Math.abs(b.vy); }

        // ball lost
        if (b.y - BALL_R > GH) {
            spawnParticles(b.x, GH - 20, 0, 20);
            balls.splice(i, 1);
            continue;
        }

        // paddle collision
        if (
            b.vy > 0 &&
            b.y + BALL_R >= PADDLE_Y && b.y - BALL_R <= PADDLE_Y + PADDLE_H &&
            b.x >= paddle.x - BALL_R && b.x <= paddle.x + PADDLE_W + BALL_R
        ) {
            const rel   = (b.x - paddle.x) / PADDLE_W;
            const angle = (rel - 0.5) * Math.PI * 0.75;
            const spd   = Math.hypot(b.vx, b.vy);
            b.vx = Math.sin(angle) * spd;
            b.vy = -Math.abs(Math.cos(angle) * spd);
            b.y  = PADDLE_Y - BALL_R;
            spawnParticles(b.x, PADDLE_Y, 280, 8);
        }

        // brick collisions
        for (const brick of bricks) {
            if (!brick.alive) continue;
            if (
                b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + brick.w &&
                b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + brick.h
            ) {
                killBrick(brick);
                if (fireballEnabled) continue; // pierce – no bounce, keep checking
                // normal bounce on least-overlap axis
                const ol  = (b.x + BALL_R) - brick.x;
                const or_ = (brick.x + brick.w) - (b.x - BALL_R);
                const ot  = (b.y + BALL_R) - brick.y;
                const ob  = (brick.y + brick.h) - (b.y - BALL_R);
                if (Math.min(ot, ob) < Math.min(ol, or_)) b.vy *= -1;
                else                                       b.vx *= -1;
                break;
            }
        }
    }

    // all balls lost
    if (balls.length === 0) {
        lives--;
        if (lives <= 0) {
            gameState = 'gameover';
        } else {
            resetBalls();
            shootEnabled    = false;
            fireballEnabled = false;
            bullets         = [];
        }
        return;
    }

    // powerups fall & collect
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.y += pu.vy;
        if (pu.y - POWERUP_R > GH) { powerups.splice(i, 1); continue; }
        if (
            pu.y + POWERUP_R >= PADDLE_Y && pu.y - POWERUP_R <= PADDLE_Y + PADDLE_H &&
            pu.x >= paddle.x - POWERUP_R && pu.x <= paddle.x + PADDLE_W + POWERUP_R
        ) {
            activatePowerup(pu.type);
            spawnParticles(pu.x, pu.y, POWERUP_META[pu.type].hue, 22);
            powerups.splice(i, 1);
        }
    }

    // particles
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.alpha -= p.trail ? 0.05 : 0.018;
    }
    particles = particles.filter(p => p.alpha > 0);

    // level clear check
    if (bricks.every(b => !b.alive)) {
        gameState = currentLevel >= MAX_LEVEL ? 'win' : 'levelup';
    }
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function glow(color, blur = 18) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow()               { ctx.shadowBlur = 0; }

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, GW, GH);

    // webcam background
    if (video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(GW, 0); ctx.scale(-1, 1);
        ctx.globalAlpha = 0.35;
        ctx.drawImage(video, 0, 0, GW, GH);
        ctx.restore();
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#0a0015';
        ctx.fillRect(0, 0, GW, GH);
    }

    ctx.fillStyle = 'rgba(5, 0, 20, 0.65)';
    ctx.fillRect(0, 0, GW, GH);

    if (gameState === 'loading') {
        drawCentered('Loading arcane model...', GH / 2, '#8888ff', '26px');
        return;
    }

    // bricks
    for (const b of bricks) {
        if (!b.alive) continue;
        glow(`hsl(${b.hue},100%,60%)`, 12);
        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        g.addColorStop(0, `hsl(${b.hue},80%,75%)`);
        g.addColorStop(1, `hsl(${b.hue},80%,40%)`);
        ctx.fillStyle = g;
        roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
        ctx.strokeStyle = `hsl(${b.hue},100%,85%)`; ctx.lineWidth = 1; ctx.stroke();
        noGlow();
    }

    // particles
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = `hsl(${p.hue},100%,70%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // falling power-ups (spherical)
    for (const pu of powerups) {
        const meta = POWERUP_META[pu.type];
        glow(meta.glowColor, 20);
        const pg = ctx.createRadialGradient(
            pu.x - POWERUP_R * 0.3, pu.y - POWERUP_R * 0.3, 1, pu.x, pu.y, POWERUP_R
        );
        pg.addColorStop(0,   `hsl(${meta.hue},100%,92%)`);
        pg.addColorStop(0.6, `hsl(${meta.hue},100%,60%)`);
        pg.addColorStop(1,   `hsl(${meta.hue},80%,28%)`);
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(pu.x, pu.y, POWERUP_R, 0, Math.PI * 2); ctx.fill();
        noGlow();
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(meta.label, pu.x, pu.y);
        ctx.textBaseline = 'alphabetic';
    }

    // bullets
    for (const bu of bullets) {
        glow('#ffff88', 12);
        const bg = ctx.createLinearGradient(bu.x, bu.y, bu.x, bu.y + 12);
        bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.5, '#ffee44'); bg.addColorStop(1, '#ff8800');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.ellipse(bu.x + 2, bu.y + 6, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
        noGlow();
    }

    // paddle
    glow(shootEnabled ? '#ffdd00' : '#aa44ff', 22);
    const pg = ctx.createLinearGradient(paddle.x, PADDLE_Y, paddle.x + PADDLE_W, PADDLE_Y);
    if (shootEnabled) {
        pg.addColorStop(0, '#886600'); pg.addColorStop(0.5, '#ffdd00'); pg.addColorStop(1, '#886600');
    } else {
        pg.addColorStop(0, '#4411aa'); pg.addColorStop(0.5, '#cc44ff'); pg.addColorStop(1, '#4411aa');
    }
    ctx.fillStyle = pg;
    roundRect(paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H, 7); ctx.fill();
    ctx.strokeStyle = shootEnabled ? '#ffee88' : '#ee88ff'; ctx.lineWidth = 2; ctx.stroke();
    noGlow();

    // balls
    for (const b of balls) {
        if (fireballEnabled) {
            glow('#ff4400', 28);
            const fg = ctx.createRadialGradient(b.x - BALL_R * 0.3, b.y - BALL_R * 0.3, 1, b.x, b.y, BALL_R);
            fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.4, '#ff8800'); fg.addColorStop(1, '#cc0000');
            ctx.fillStyle = fg;
        } else {
            glow('#ffdd44', 24);
            const ng = ctx.createRadialGradient(b.x - BALL_R * 0.3, b.y - BALL_R * 0.3, 1, b.x, b.y, BALL_R);
            ng.addColorStop(0, '#ffffff'); ng.addColorStop(0.5, '#ffee66'); ng.addColorStop(1, '#ff8800');
            ctx.fillStyle = ng;
        }
        ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
        noGlow();
    }

    drawHUD();

    if (gameState === 'start') {
        drawOverlay('✨ HANDY BLOCKS', 'Move your hand to control the magic staff', '#cc88ff', 'Press SPACE or tap to begin');
    } else if (gameState === 'levelup') {
        drawLevelUp();
    } else if (gameState === 'gameover') {
        drawOverlay('GAME OVER', `Level ${currentLevel}  ·  Score: ${score}`, '#ff5555', 'Press SPACE or tap to retry');
    } else if (gameState === 'win') {
        drawOverlay('ALL LEVELS CLEARED! ✨', `Final score: ${score}`, '#55ffaa', 'Press SPACE or tap to play again');
    }
}

function drawHUD() {
    const now = Date.now();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, GW, 48);

    ctx.font = 'bold 17px "Times New Roman"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cc88ff';
    ctx.fillText(`✨ ${score}  ·  Lvl ${currentLevel}/${MAX_LEVEL}`, 14, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#cc88ff';
    ctx.fillText(`${'♥'.repeat(lives)}  ×${balls.length}`, GW - 14, 30);

    const detected = handNormX !== null;
    ctx.textAlign = 'center';
    ctx.fillStyle = detected ? '#66ffaa' : '#ff8866';
    ctx.fillText(detected ? '✋ Hand detected' : '✋ Show your hand', GW / 2, 30);

    // active power-up badges (bottom-left)
    let bx = 14;
    const by = GH - 14;
    ctx.font = 'bold 13px Arial'; ctx.textBaseline = 'middle';

    if (shootEnabled) {
        const rem = Math.ceil((shootEndTime - now) / 1000);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 4, by - 12, 76, 24);
        glow('#ffdd00', 10); ctx.fillStyle = '#ffee44'; ctx.textAlign = 'left';
        ctx.fillText(`⚡ Shoot ${rem}s`, bx, by); noGlow();
        bx += 88;
    }
    if (fireballEnabled) {
        const rem = Math.ceil((fireballEndTime - now) / 1000);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 4, by - 12, 84, 24);
        glow('#ff4400', 10); ctx.fillStyle = '#ff8844'; ctx.textAlign = 'left';
        ctx.fillText(`🔥 Pierce ${rem}s`, bx, by); noGlow();
    }
    ctx.textBaseline = 'alphabetic';
}

function drawLevelUp() {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, GW, GH);

    const cy = GH / 2;

    glow('#ffcc44', 35);
    ctx.font = 'bold 58px "Times New Roman"';
    ctx.fillStyle = '#ffcc44'; ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${currentLevel} CLEAR! ⭐`, GW / 2, cy - 72);
    noGlow();

    ctx.font = '24px "Times New Roman"'; ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${score}   Lives: ${'♥'.repeat(lives)}`, GW / 2, cy - 18);

    // divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(GW * 0.2, cy + 8); ctx.lineTo(GW * 0.8, cy + 8); ctx.stroke();

    // next level preview
    const nextCfg = LEVEL_CONFIG[currentLevel]; // currentLevel is still the just-cleared one (1-indexed)
    ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#aaddff';
    ctx.fillText(`— Level ${currentLevel + 1} of ${MAX_LEVEL} incoming —`, GW / 2, cy + 34);

    ctx.font = '15px Arial';
    ctx.fillStyle = '#ffbb55';
    ctx.fillText(`Speed: ${SPEED_LABELS[currentLevel]}`, GW / 2 - 90, cy + 62);
    ctx.fillStyle = '#55ddff';
    ctx.fillText(`Power-ups: ${POWERUP_LABELS[currentLevel]}`, GW / 2 + 80, cy + 62);

    ctx.font = '17px "Times New Roman"'; ctx.fillStyle = '#777777';
    ctx.fillText('Press SPACE or tap to continue', GW / 2, cy + 100);
}

function drawOverlay(title, sub, color, hint) {
    ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, GW, GH);
    glow(color, 35);
    ctx.font = 'bold 58px "Times New Roman"'; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(title, GW / 2, GH / 2 - 35); noGlow();
    ctx.font = '26px "Times New Roman"'; ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, GW / 2, GH / 2 + 20);
    ctx.font = '18px "Times New Roman"'; ctx.fillStyle = '#aaaaaa';
    ctx.fillText(hint, GW / 2, GH / 2 + 65);
}

function drawCentered(text, y, color, size) {
    ctx.font = `${size} "Times New Roman"`; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(text, GW / 2, y);
}

// ─── Loops ────────────────────────────────────────────────────────────────────
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

async function detectLoop() {
    if (handposeModel && video && video.readyState >= 2) {
        const preds = await handposeModel.estimateHands(video);
        if (preds.length > 0) {
            const lm = preds[0].landmarks;
            const palmIdxs = [0, 5, 9, 13, 17];
            let sumX = 0; palmIdxs.forEach(i => sumX += lm[i][0]);
            handNormX = 1 - (sumX / palmIdxs.length) / videoWidth;
        } else { handNormX = null; }
    }
    requestAnimationFrame(detectLoop);
}

// ─── Start / restart ──────────────────────────────────────────────────────────
function startGame() {
    score        = 0;
    lives        = 3;
    currentLevel = 1;
    particles    = [];
    powerups     = [];
    bullets      = [];
    shootEnabled    = false;
    fireballEnabled = false;
    loadLevel(1);
    gameState = 'playing';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = GW; canvas.height = GH;
    ctx = canvas.getContext('2d');

    function fitCanvas() {
        const s = Math.min(window.innerWidth / GW, window.innerHeight / GH);
        canvas.style.width = GW * s + 'px'; canvas.style.height = GH * s + 'px';
    }
    fitCanvas(); window.addEventListener('resize', fitCanvas);

    const status = document.getElementById('loading-status');
    status.textContent = 'Requesting camera access...';
    video = document.getElementById('webcam');
    video.width = 640; video.height = 480;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false, video: { facingMode: 'user', width: 640, height: 480, frameRate: { max: 30 } },
        });
        video.srcObject = stream;
        await new Promise(r => { video.onloadedmetadata = r; });
        video.play(); videoWidth = video.videoWidth; videoHeight = video.videoHeight;
    } catch (e) { console.warn('No webcam – mouse/keyboard only.', e); }

    status.textContent = 'Summoning hand-tracking magic...';
    handposeModel = await handpose.load();
    document.getElementById('loading-screen').style.display = 'none';

    loadLevel(1); gameState = 'start';
    detectLoop(); gameLoop();
}

// ─── Input ────────────────────────────────────────────────────────────────────
function handleAdvance() {
    if (gameState === 'levelup')  nextLevel();
    else if (gameState !== 'playing') startGame();
}

document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleAdvance(); }
    if (gameState === 'playing') {
        if (e.key === 'ArrowLeft')  paddle.x = Math.max(0, paddle.x - 20);
        if (e.key === 'ArrowRight') paddle.x = Math.min(GW - PADDLE_W, paddle.x + 20);
    }
});

window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseNormX = (e.clientX - rect.left) / rect.width;
});
window.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseNormX = (e.touches[0].clientX - rect.left) / rect.width;
}, { passive: false });

window.addEventListener('click',      handleAdvance);
window.addEventListener('touchstart', handleAdvance);

// ─── Go ───────────────────────────────────────────────────────────────────────
init();
