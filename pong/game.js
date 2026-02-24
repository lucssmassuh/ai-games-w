// Pong Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;

// Game state
let gameState = 'waiting'; // 'waiting', 'playing', 'paused'
let leftScore = 0;
let rightScore = 0;

// Paddles
const leftPaddle = {
    x: 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0
};

const rightPaddle = {
    x: canvas.width - 20 - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: BALL_SIZE / 2,
    velocityX: BALL_SPEED,
    velocityY: BALL_SPEED
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Start/pause game with spacebar
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'waiting' || gameState === 'paused') {
            gameState = 'playing';
            resetBall();
        } else if (gameState === 'playing') {
            gameState = 'paused';
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    // Randomize initial direction
    const angle = (Math.random() - 0.5) * Math.PI / 3; // -30 to 30 degrees
    ball.velocityX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ball.velocityY = BALL_SPEED * Math.sin(angle);
}

// Update paddle positions
function updatePaddles() {
    // Left paddle (W/S keys)
    if (keys['w'] && leftPaddle.y > 0) {
        leftPaddle.y -= PADDLE_SPEED;
    }
    if (keys['s'] && leftPaddle.y < canvas.height - leftPaddle.height) {
        leftPaddle.y += PADDLE_SPEED;
    }
    
    // Right paddle (Arrow keys)
    if (keys['arrowup'] && rightPaddle.y > 0) {
        rightPaddle.y -= PADDLE_SPEED;
    }
    if (keys['arrowdown'] && rightPaddle.y < canvas.height - rightPaddle.height) {
        rightPaddle.y += PADDLE_SPEED;
    }
}

// Update ball position
function updateBall() {
    if (gameState !== 'playing') return;
    
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Top and bottom wall collision
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.velocityY = -ball.velocityY;
    }
    
    // Left paddle collision
    if (ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
        ball.x - ball.radius >= leftPaddle.x &&
        ball.y >= leftPaddle.y &&
        ball.y <= leftPaddle.y + leftPaddle.height) {
        ball.velocityX = Math.abs(ball.velocityX); // Ensure ball goes right
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - leftPaddle.y) / leftPaddle.height;
        ball.velocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }
    
    // Right paddle collision
    if (ball.x + ball.radius >= rightPaddle.x &&
        ball.x + ball.radius <= rightPaddle.x + rightPaddle.width &&
        ball.y >= rightPaddle.y &&
        ball.y <= rightPaddle.y + rightPaddle.height) {
        ball.velocityX = -Math.abs(ball.velocityX); // Ensure ball goes left
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - rightPaddle.y) / rightPaddle.height;
        ball.velocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }
    
    // Score points
    if (ball.x - ball.radius <= 0) {
        rightScore++;
        updateScore();
        resetBall();
        gameState = 'waiting';
    }
    if (ball.x + ball.radius >= canvas.width) {
        leftScore++;
        updateScore();
        resetBall();
        gameState = 'waiting';
    }
}

// Update score display
function updateScore() {
    scoreElement.textContent = `${leftScore} : ${rightScore}`;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Add gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGameState() {
    if (gameState === 'waiting') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED - Press SPACE to resume', canvas.width / 2, canvas.height / 2);
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    drawCenterLine();
    
    // Update game objects
    updatePaddles();
    updateBall();
    
    // Draw game objects
    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);
    drawBall();
    drawGameState();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
resetBall();
updateScore();
gameLoop();
