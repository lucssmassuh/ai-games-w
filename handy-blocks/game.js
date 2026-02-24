// ─── Constants ───────────────────────────────────────────────────────────────
const GW = 800;   // game width
const GH = 600;   // game height

const PADDLE_W   = 110;
const PADDLE_H   = 14;
const PADDLE_Y   = GH - 55;
const BALL_R     = 9;
const BALL_SPEED = 5.5;

const BRICK_COLS   = 8;
const BRICK_ROWS   = 5;
const BRICK_W      = 80;
const BRICK_H      = 24;
const BRICK_PAD    = 10;
const BRICK_LEFT   = (GW - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_PAD)) / 2;
const BRICK_TOP    = 65;

// brick row colours (hue values)
const ROW_HUES = [280, 200, 160, 50, 10];

// ─── State ────────────────────────────────────────────────────────────────────
let canvas, ctx, video, handposeModel;
let videoWidth = 640, videoHeight = 480;

let handNormX = null;          // 0..1 (null = not detected)
let mouseNormX = null;         // fallback

let gameState = 'loading';     // loading | start | playing | paused | gameover | win
let score = 0;
let lives = 3;
let particles = [];
let bricks = [];
let paddle = { x: GW / 2 - PADDLE_W / 2 };
let ball = {};

// ─── Brick helpers ────────────────────────────────────────────────────────────
function initBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
                y: BRICK_TOP  + r * (BRICK_H  + BRICK_PAD),
                w: BRICK_W, h: BRICK_H,
                hue: ROW_HUES[r],
                alive: true,
            });
        }
    }
}

function resetBall() {
    const angle = (Math.random() - 0.5) * 0.8; // slight random angle
    ball = {
        x: GW / 2,
        y: PADDLE_Y - 40,
        vx: Math.sin(angle) * BALL_SPEED,
        vy: -Math.cos(angle) * BALL_SPEED,
    };
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
            hue,
            alpha: 1,
        });
    }
}

function spawnTrail(x, y) {
    particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 2,
        hue: 45 + Math.random() * 20,
        alpha: 0.8,
        trail: true,
    });
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    if (gameState !== 'playing') return;

    // --- paddle ---
    const normX = handNormX ?? mouseNormX;
    if (normX !== null) {
        const targetX = normX * GW - PADDLE_W / 2;
        paddle.x = Math.max(0, Math.min(GW - PADDLE_W, targetX));
    }

    // --- ball ---
    ball.x += ball.vx;
    ball.y += ball.vy;

    spawnTrail(ball.x, ball.y);

    // wall bounces
    if (ball.x - BALL_R <= 0)  { ball.x = BALL_R;        ball.vx =  Math.abs(ball.vx); }
    if (ball.x + BALL_R >= GW) { ball.x = GW - BALL_R;   ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R <= 0)  { ball.y = BALL_R;         ball.vy =  Math.abs(ball.vy); }

    // ball lost
    if (ball.y - BALL_R > GH) {
        lives--;
        spawnParticles(ball.x, GH - 20, 0, 20);
        if (lives <= 0) { gameState = 'gameover'; }
        else            { resetBall(); }
        return;
    }

    // paddle collision
    if (
        ball.vy > 0 &&
        ball.y + BALL_R >= PADDLE_Y &&
        ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
        ball.x >= paddle.x - BALL_R &&
        ball.x <= paddle.x + PADDLE_W + BALL_R
    ) {
        const rel   = (ball.x - paddle.x) / PADDLE_W;     // 0..1
        const angle = (rel - 0.5) * Math.PI * 0.75;        // -67.5° to +67.5°
        const spd   = Math.hypot(ball.vx, ball.vy);
        ball.vx = Math.sin(angle) * spd;
        ball.vy = -Math.abs(Math.cos(angle) * spd);
        ball.y  = PADDLE_Y - BALL_R;
        spawnParticles(ball.x, PADDLE_Y, 280, 8);
    }

    // brick collisions
    for (const b of bricks) {
        if (!b.alive) continue;

        if (
            ball.x + BALL_R > b.x &&
            ball.x - BALL_R < b.x + b.w &&
            ball.y + BALL_R > b.y &&
            ball.y - BALL_R < b.y + b.h
        ) {
            b.alive = false;
            score += 10;
            spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.hue);

            // resolve bounce direction (least overlap axis)
            const ol = (ball.x + BALL_R) - b.x;
            const or = (b.x + b.w) - (ball.x - BALL_R);
            const ot = (ball.y + BALL_R) - b.y;
            const ob = (b.y + b.h) - (ball.y - BALL_R);
            if (Math.min(ot, ob) < Math.min(ol, or)) { ball.vy *= -1; }
            else                                       { ball.vx *= -1; }
            break;
        }
    }

    // win check
    if (bricks.every(b => !b.alive)) { gameState = 'win'; }

    // update particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.trail ? 0.05 : 0.018;
    }
    particles = particles.filter(p => p.alpha > 0);
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function glow(color, blur = 18) {
    ctx.shadowColor = color;
    ctx.shadowBlur  = blur;
}
function noGlow() { ctx.shadowBlur = 0; }

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, GW, GH);

    // --- background: webcam feed ---
    if (video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(GW, 0);
        ctx.scale(-1, 1);
        ctx.globalAlpha = 0.35;
        ctx.drawImage(video, 0, 0, GW, GH);
        ctx.restore();
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#0a0015';
        ctx.fillRect(0, 0, GW, GH);
    }

    // dark vignette overlay
    ctx.fillStyle = 'rgba(5, 0, 20, 0.65)';
    ctx.fillRect(0, 0, GW, GH);

    if (gameState === 'loading') {
        drawCentered('Loading arcane model...', GH / 2, '#8888ff', '26px');
        return;
    }

    // --- bricks ---
    for (const b of bricks) {
        if (!b.alive) continue;
        glow(`hsl(${b.hue},100%,60%)`, 12);
        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        g.addColorStop(0, `hsl(${b.hue},80%,75%)`);
        g.addColorStop(1, `hsl(${b.hue},80%,40%)`);
        ctx.fillStyle = g;
        roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
        ctx.strokeStyle = `hsl(${b.hue},100%,85%)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        noGlow();
    }

    // --- particles ---
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle   = `hsl(${p.hue},100%,70%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- paddle ---
    glow('#aa44ff', 22);
    const pg = ctx.createLinearGradient(paddle.x, PADDLE_Y, paddle.x + PADDLE_W, PADDLE_Y);
    pg.addColorStop(0,   '#4411aa');
    pg.addColorStop(0.5, '#cc44ff');
    pg.addColorStop(1,   '#4411aa');
    ctx.fillStyle = pg;
    roundRect(paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H, 7);
    ctx.fill();
    ctx.strokeStyle = '#ee88ff';
    ctx.lineWidth   = 2;
    ctx.stroke();
    noGlow();

    // --- ball ---
    glow('#ffdd44', 24);
    const bg = ctx.createRadialGradient(
        ball.x - BALL_R * 0.3, ball.y - BALL_R * 0.3, 1,
        ball.x, ball.y, BALL_R
    );
    bg.addColorStop(0,   '#ffffff');
    bg.addColorStop(0.5, '#ffee66');
    bg.addColorStop(1,   '#ff8800');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    noGlow();

    // --- HUD ---
    drawHUD();

    // --- overlays ---
    if (gameState === 'start') {
        drawOverlay(
            '✨ ARCANE BREAKER',
            'Move your hand to control the magic staff',
            '#cc88ff',
            'Press SPACE or tap to begin',
        );
    } else if (gameState === 'gameover') {
        drawOverlay('GAME OVER', `Final score: ${score}`, '#ff5555', 'Press SPACE or tap to retry');
    } else if (gameState === 'win') {
        drawOverlay('YOU WIN! ✨', `Score: ${score}`, '#55ffaa', 'Press SPACE or tap to play again');
    }
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, GW, 48);

    ctx.font      = 'bold 18px "Times New Roman"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cc88ff';
    ctx.fillText(`✨ Score: ${score}`, 16, 30);

    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${'♥'.repeat(lives)}`, GW - 16, 30);

    const detected = handNormX !== null;
    ctx.textAlign  = 'center';
    ctx.fillStyle  = detected ? '#66ffaa' : '#ff8866';
    ctx.fillText(detected ? '✋ Hand detected' : '✋ Show your hand', GW / 2, 30);
}

function drawOverlay(title, sub, color, hint) {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, GW, GH);

    glow(color, 35);
    ctx.font      = 'bold 60px "Times New Roman"';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(title, GW / 2, GH / 2 - 35);
    noGlow();

    ctx.font      = '26px "Times New Roman"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, GW / 2, GH / 2 + 20);

    ctx.font      = '18px "Times New Roman"';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(hint, GW / 2, GH / 2 + 65);
}

function drawCentered(text, y, color, size) {
    ctx.font      = `${size} "Times New Roman"`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, GW / 2, y);
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ─── Hand detection loop ──────────────────────────────────────────────────────
async function detectLoop() {
    if (handposeModel && video && video.readyState >= 2) {
        const preds = await handposeModel.estimateHands(video);
        if (preds.length > 0) {
            const lm = preds[0].landmarks;
            // average palm landmarks [0,5,9,13,17] for stable X
            const palmIdxs = [0, 5, 9, 13, 17];
            let sumX = 0;
            palmIdxs.forEach(i => sumX += lm[i][0]);
            const rawX = sumX / palmIdxs.length;
            // mirror to match the flipped webcam display
            handNormX = 1 - (rawX / videoWidth);
        } else {
            handNormX = null;
        }
    }
    requestAnimationFrame(detectLoop);
}

// ─── Restart helper ───────────────────────────────────────────────────────────
function startGame() {
    score = 0;
    lives = 3;
    particles = [];
    initBricks();
    resetBall();
    gameState = 'playing';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    // Canvas setup
    canvas = document.getElementById('gameCanvas');
    canvas.width  = GW;
    canvas.height = GH;
    ctx = canvas.getContext('2d');

    function fitCanvas() {
        const s = Math.min(window.innerWidth / GW, window.innerHeight / GH);
        canvas.style.width  = GW * s + 'px';
        canvas.style.height = GH * s + 'px';
    }
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    // Webcam
    const loadingStatus = document.getElementById('loading-status');
    loadingStatus.textContent = 'Requesting camera access...';

    video = document.getElementById('webcam');
    video.width  = 640;
    video.height = 480;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user', width: 640, height: 480, frameRate: { max: 30 } },
        });
        video.srcObject = stream;
        await new Promise(resolve => { video.onloadedmetadata = resolve; });
        video.play();
        videoWidth  = video.videoWidth;
        videoHeight = video.videoHeight;
    } catch (e) {
        console.warn('Webcam not available – mouse/keyboard only mode.', e);
    }

    // Load handpose model
    loadingStatus.textContent = 'Summoning hand-tracking magic...';
    handposeModel = await handpose.load();

    // Hide loading screen
    document.getElementById('loading-screen').style.display = 'none';

    // Initial game state
    initBricks();
    resetBall();
    gameState = 'start';

    // Start loops
    detectLoop();
    gameLoop();
}

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const key = e.key;
    if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'gameover' || gameState === 'win') {
            startGame();
        }
    }
    // Keyboard fallback to move paddle (arrow keys)
    if (gameState === 'playing') {
        const step = 20;
        if (key === 'ArrowLeft')  paddle.x = Math.max(0, paddle.x - step);
        if (key === 'ArrowRight') paddle.x = Math.min(GW - PADDLE_W, paddle.x + step);
    }
});

// Mouse/touch fallback
window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GW / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    mouseNormX = mx / GW;
});

window.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = GW / rect.width;
    const mx = (e.touches[0].clientX - rect.left) * scaleX;
    mouseNormX = mx / GW;
}, { passive: false });

window.addEventListener('click',      () => { if (gameState !== 'playing') startGame(); });
window.addEventListener('touchstart', () => { if (gameState !== 'playing') startGame(); });

// ─── Start ────────────────────────────────────────────────────────────────────
init();
