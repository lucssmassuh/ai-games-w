// ─── Constants ────────────────────────────────────────────────────────────────
const GW = 800, GH = 600;
const BUBBLE_R   = 26;
const DIAM       = BUBBLE_R * 2;
const ROW_H      = Math.round(BUBBLE_R * 1.73); // ≈ 45 — hex vertical spacing
const EVEN_COLS  = 13;
const ODD_COLS   = 12;
const GRID_TOP   = 50;
const GRID_ROWS  = 14; // total grid rows (only ~8 filled at start)
const SHOOTER_X  = GW / 2;
const SHOOTER_Y  = GH - 58;
const BUBBLE_SPD = 13;
const LOSE_ROW   = 10; // game over if any bubble reaches this row

const PALETTE = [
    { hue: 280 }, // purple
    { hue: 200 }, // blue
    { hue: 130 }, // green
    { hue:  50 }, // yellow
    { hue:  10 }, // red
    { hue: 330 }, // pink
];
const NUM_COLORS = PALETTE.length;

// ─── State ────────────────────────────────────────────────────────────────────
let canvas, ctx, video, handposeModel;
let videoWidth = 640, videoHeight = 480;
let handNormX  = null;
let mouseNormX = null;
let aimAngle   = 0; // radians from vertical
let gameState  = 'loading';
let score      = 0;
let grid       = []; // grid[row][col] = color index or null
let particles  = [];
let bubble     = null; // the active shooter bubble
let nextColor  = null;

// ─── Grid helpers ─────────────────────────────────────────────────────────────
function rowCols(r) { return r % 2 === 0 ? EVEN_COLS : ODD_COLS; }

function cellPos(r, c) {
    return {
        x: BUBBLE_R + c * DIAM + (r % 2 === 1 ? BUBBLE_R : 0),
        y: GRID_TOP + r * ROW_H,
    };
}

// Hex-grid offset neighbors (even-row and odd-row offsets)
function neighbors(r, c) {
    const ns  = [];
    const even = r % 2 === 0;
    const maxC = rowCols(r) - 1;
    if (c > 0)     ns.push([r, c - 1]);
    if (c < maxC)  ns.push([r, c + 1]);
    const addRow = (dr) => {
        const nr = r + dr;
        if (nr < 0 || nr >= GRID_ROWS) return;
        const nmax = rowCols(nr) - 1;
        if (even) {
            if (c - 1 >= 0)    ns.push([nr, c - 1]);
            if (c     <= nmax) ns.push([nr, c    ]);
        } else {
            if (c     <= nmax) ns.push([nr, c    ]);
            if (c + 1 <= nmax) ns.push([nr, c + 1]);
        }
    };
    addRow(-1); addRow(1);
    return ns;
}

function initGrid(filledRows = 7) {
    grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        const row = [];
        for (let c = 0; c < rowCols(r); c++) {
            row.push(r < filledRows ? Math.floor(Math.random() * NUM_COLORS) : null);
        }
        grid.push(row);
    }
}

// BFS: find all cells matching color at (r,c)
function findMatches(startR, startC) {
    const color = grid[startR][startC];
    if (color === null) return [];
    const visited = new Set(), queue = [[startR, startC]], result = [];
    while (queue.length) {
        const [r, c] = queue.shift();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (grid[r]?.[c] === color) {
            result.push([r, c]);
            neighbors(r, c).forEach(n => { if (!visited.has(`${n[0]},${n[1]}`)) queue.push(n); });
        }
    }
    return result;
}

// BFS from top row to find all connected bubbles
function findConnected() {
    const visited = new Set();
    const queue = [];
    for (let c = 0; c < rowCols(0); c++) {
        if (grid[0][c] !== null) { queue.push([0, c]); visited.add(`0,${c}`); }
    }
    while (queue.length) {
        const [r, c] = queue.shift();
        neighbors(r, c).forEach(([nr, nc]) => {
            const key = `${nr},${nc}`;
            if (!visited.has(key) && grid[nr]?.[nc] !== null) {
                visited.add(key); queue.push([nr, nc]);
            }
        });
    }
    return visited;
}

function resolveGrid(r, c) {
    const matches = findMatches(r, c);
    if (matches.length < 3) return;
    for (const [mr, mc] of matches) {
        const { x, y } = cellPos(mr, mc);
        spawnParticles(x, y, grid[mr][mc]);
        grid[mr][mc] = null;
        score += 10;
    }
    // drop floating bubbles
    const connected = findConnected();
    for (let gr = 0; gr < GRID_ROWS; gr++) {
        for (let gc = 0; gc < rowCols(gr); gc++) {
            if (grid[gr][gc] !== null && !connected.has(`${gr},${gc}`)) {
                const { x, y } = cellPos(gr, gc);
                spawnParticles(x, y, grid[gr][gc], 8);
                grid[gr][gc] = null;
                score += 5;
            }
        }
    }
}

// Find nearest empty grid cell to snap the flying bubble into
function snapToGrid(bx, by) {
    let best = null, bestD = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < rowCols(r); c++) {
            if (grid[r][c] !== null) continue;
            // must touch top or an existing bubble
            const adjacent = r === 0 ||
                neighbors(r, c).some(([nr, nc]) => grid[nr]?.[nc] !== null);
            if (!adjacent) continue;
            const { x, y } = cellPos(r, c);
            const d = Math.hypot(bx - x, by - y);
            if (d < bestD) { bestD = d; best = [r, c]; }
        }
    }
    return best;
}

// ─── Particles ────────────────────────────────────────────────────────────────
function spawnParticles(x, y, colorIdx, count = 14) {
    const hue = PALETTE[colorIdx].hue;
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const s = 1.5 + Math.random() * 3;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 3 + Math.random() * 3, hue, alpha: 1 });
    }
}

// ─── Shooter helpers ──────────────────────────────────────────────────────────
function spawnBubble() {
    nextColor = nextColor ?? Math.floor(Math.random() * NUM_COLORS);
    const color = nextColor;
    nextColor = Math.floor(Math.random() * NUM_COLORS);
    bubble = { color, x: SHOOTER_X, y: SHOOTER_Y, vx: 0, vy: 0, flying: false };
}

function shoot() {
    if (!bubble || bubble.flying) return;
    const a = Math.max(-Math.PI * 0.43, Math.min(Math.PI * 0.43, aimAngle));
    bubble.vx = Math.sin(a) * BUBBLE_SPD;
    bubble.vy = -Math.cos(a) * BUBBLE_SPD;
    bubble.flying = true;
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    if (gameState !== 'playing') return;

    // aim from hand or mouse
    const normX = handNormX ?? mouseNormX;
    if (normX !== null) {
        aimAngle = (normX - 0.5) * Math.PI * 1.2;
    }

    if (!bubble) spawnBubble();

    if (bubble.flying) {
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        // wall bounce
        if (bubble.x - BUBBLE_R <= 0) { bubble.x = BUBBLE_R;      bubble.vx =  Math.abs(bubble.vx); }
        if (bubble.x + BUBBLE_R >= GW) { bubble.x = GW - BUBBLE_R; bubble.vx = -Math.abs(bubble.vx); }

        let stuck = bubble.y - BUBBLE_R <= GRID_TOP;

        if (!stuck) {
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < rowCols(r); c++) {
                    if (grid[r][c] === null) continue;
                    const { x, y } = cellPos(r, c);
                    if (Math.hypot(bubble.x - x, bubble.y - y) < DIAM - 2) { stuck = true; break; }
                }
                if (stuck) break;
            }
        }

        if (stuck) {
            const snap = snapToGrid(bubble.x, bubble.y);
            if (snap) {
                const [r, c] = snap;
                grid[r][c] = bubble.color;
                resolveGrid(r, c);

                // lose: bubble reached too low
                for (let lc = 0; lc < rowCols(LOSE_ROW); lc++) {
                    if (grid[LOSE_ROW]?.[lc] !== null) { gameState = 'gameover'; return; }
                }
                // win: grid cleared
                if (grid.every(row => row.every(v => v === null))) { gameState = 'win'; return; }
            }
            bubble = null;
        }
    }

    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.alpha -= 0.02; }
    particles = particles.filter(p => p.alpha > 0);
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function glow(color, blur = 18) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow()                { ctx.shadowBlur = 0; }

function drawBubble(x, y, colorIdx, r = BUBBLE_R) {
    const hue = PALETTE[colorIdx].hue;
    glow(`hsl(${hue},100%,60%)`, 18);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0,   `hsl(${hue},80%,90%)`);
    g.addColorStop(0.5, `hsl(${hue},90%,58%)`);
    g.addColorStop(1,   `hsl(${hue},80%,28%)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    noGlow();
    // shine highlight
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.32, r * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawAimLine() {
    if (!bubble || bubble.flying) return;
    const a  = Math.max(-Math.PI * 0.43, Math.min(Math.PI * 0.43, aimAngle));
    let x = SHOOTER_X, y = SHOOTER_Y;
    let vx = Math.sin(a), vy = -Math.cos(a);
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = 'rgba(200,140,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 0; i < 500; i++) {
        x += vx * 4; y += vy * 4;
        if (x - BUBBLE_R <= 0) { x = BUBBLE_R;      vx = Math.abs(vx); }
        if (x + BUBBLE_R >= GW) { x = GW - BUBBLE_R; vx = -Math.abs(vx); }
        if (y <= GRID_TOP + BUBBLE_R * 1.5) break;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.clearRect(0, 0, GW, GH);

    // background
    if (video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(GW, 0); ctx.scale(-1, 1);
        ctx.globalAlpha = 0.3;
        ctx.drawImage(video, 0, 0, GW, GH);
        ctx.restore();
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#0a0015';
        ctx.fillRect(0, 0, GW, GH);
    }
    ctx.fillStyle = 'rgba(5,0,20,0.72)';
    ctx.fillRect(0, 0, GW, GH);

    // grid bubbles
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < rowCols(r); c++) {
            if (grid[r][c] === null) continue;
            const { x, y } = cellPos(r, c);
            if (y - BUBBLE_R < GH) drawBubble(x, y, grid[r][c]);
        }
    }

    // particles
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        glow(`hsl(${p.hue},100%,70%)`, 8);
        ctx.fillStyle = `hsl(${p.hue},100%,70%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        noGlow();
    }
    ctx.globalAlpha = 1;

    // aim line
    if (gameState === 'playing') drawAimLine();

    // shooter base
    glow('#aa44ff', 22);
    const sg = ctx.createRadialGradient(SHOOTER_X, SHOOTER_Y + 14, 4, SHOOTER_X, SHOOTER_Y + 14, 22);
    sg.addColorStop(0, '#cc44ff'); sg.addColorStop(1, '#330066');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(SHOOTER_X, SHOOTER_Y + 14, 22, 0, Math.PI * 2); ctx.fill();
    noGlow();

    // active + flying bubble
    if (bubble) drawBubble(bubble.x, bubble.y, bubble.color);

    // next preview
    if (nextColor !== null && gameState === 'playing') {
        ctx.font = '12px "Times New Roman"'; ctx.fillStyle = '#8866bb'; ctx.textAlign = 'left';
        ctx.fillText('NEXT', 22, GH - 72);
        drawBubble(38, GH - 46, nextColor, BUBBLE_R * 0.72);
    }

    drawHUD();

    if      (gameState === 'start')    drawOverlay('🫧 STICKY BUBBLES', 'Aim & shoot — match 3 to pop!', '#cc88ff', 'Press SPACE or tap to begin');
    else if (gameState === 'gameover') drawOverlay('GAME OVER',         `Score: ${score}`,               '#ff5555', 'Press SPACE or tap to retry');
    else if (gameState === 'win')      drawOverlay('CLEARED! ✨',        `Final score: ${score}`,         '#55ffaa', 'Press SPACE or tap to play again');
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, GW, 40);
    ctx.font = 'bold 17px "Times New Roman"'; ctx.textAlign = 'left'; ctx.fillStyle = '#cc88ff';
    ctx.fillText(`🫧 ${score}`, 14, 26);
    const det = handNormX !== null;
    ctx.textAlign = 'center'; ctx.fillStyle = det ? '#66ffaa' : '#ff8866';
    ctx.fillText(det ? '✋ Hand detected' : '✋ Show your hand', GW / 2, 26);
}

function drawOverlay(title, sub, color, hint) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, GW, GH);
    glow(color, 35);
    ctx.font = 'bold 52px "Times New Roman"'; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(title, GW / 2, GH / 2 - 30); noGlow();
    ctx.font = '26px "Times New Roman"'; ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, GW / 2, GH / 2 + 24);
    ctx.font = '18px "Times New Roman"'; ctx.fillStyle = '#aaaaaa';
    ctx.fillText(hint, GW / 2, GH / 2 + 66);
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
        } else handNormX = null;
    }
    requestAnimationFrame(detectLoop);
}

// ─── Start / init ─────────────────────────────────────────────────────────────
function startGame() {
    score = 0; particles = []; bubble = null; nextColor = null;
    initGrid(7);
    gameState = 'playing';
}

async function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = GW; canvas.height = GH;
    ctx = canvas.getContext('2d');
    function fitCanvas() {
        const s = Math.min(window.innerWidth / GW, window.innerHeight / GH);
        canvas.style.width  = GW * s + 'px';
        canvas.style.height = GH * s + 'px';
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
    } catch (e) { console.warn('No webcam', e); }

    status.textContent = 'Summoning bubble magic...';
    handposeModel = await handpose.load();
    document.getElementById('loading-screen').style.display = 'none';

    initGrid(7); gameState = 'start';
    detectLoop(); gameLoop();
}

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'playing') shoot(); else startGame();
    }
});

window.addEventListener('mousemove', e => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width  * GW;
    const my = (e.clientY - rect.top)  / rect.height * GH;
    aimAngle   = Math.atan2(mx - SHOOTER_X, SHOOTER_Y - my);
    mouseNormX = (e.clientX - rect.left) / rect.width;
});

window.addEventListener('click',      () => { if (gameState === 'playing') shoot(); else startGame(); });
window.addEventListener('touchstart', () => { if (gameState === 'playing') shoot(); else startGame(); });
window.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tx = (e.touches[0].clientX - rect.left) / rect.width  * GW;
    const ty = (e.touches[0].clientY - rect.top)  / rect.height * GH;
    aimAngle = Math.atan2(tx - SHOOTER_X, SHOOTER_Y - ty);
}, { passive: false });

// ─── Go ───────────────────────────────────────────────────────────────────────
init();
