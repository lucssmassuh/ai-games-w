// game.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.style.border = '1pt solid black';
  
    // Create two player robots with different initial positions and colors
    const separation = 400; // Increased distance between players for larger canvas
    const player1 = new Robot('red', canvas.width / 2 - separation / 2, canvas.height / 2, canvas.width, canvas.height);
    player1.score = 0; // Initialize score
    const player2 = new Robot('blue', canvas.width / 2 + separation / 2, canvas.height / 2, canvas.width, canvas.height);
    player2.score = 0; // Initialize score
    
    // Listen for keydown events for both players
    document.addEventListener('keydown', (e) => {
        if (e.key === 'q' || e.key === 'Q') {
            player1.toggleFeet(canvas.width, canvas.height);
        } else if (e.key === 'p' || e.key === 'P') {
          player2.toggleFeet(canvas.width, canvas.height);
        } else if (e.key === 'w') {
          player1.fireBullet();
      } else if (e.key === 'o') {
          player2.fireBullet();
      }
    });
  
    function checkBulletCollision(robot1, robot2) {
    // Check if any of robot1's bullets hit robot2's static foot
    robot1.bullets = robot1.bullets.filter(bullet => {
        const dx = bullet.x - robot2.staticFoot.x;
        const dy = bullet.y - robot2.staticFoot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < robot2.footRadius) {
            robot2.spinSpeed = -robot2.spinSpeed;
            robot1.score += 20;
            robot1.createExplosion(robot2.staticFoot.x, robot2.staticFoot.y);
            return false;
        }
        return true;
    });

    // Check if any of robot2's bullets hit robot1's static foot
    robot2.bullets = robot2.bullets.filter(bullet => {
        const dx = bullet.x - robot1.staticFoot.x;
        const dy = bullet.y - robot1.staticFoot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < robot1.footRadius) {
            robot1.spinSpeed = -robot1.spinSpeed;
            robot2.score += 20;
            robot2.createExplosion(robot1.staticFoot.x, robot1.staticFoot.y);
            return false;
        }
        return true;
    });
}

function checkCollisionAndToggleDirection(robot1, robot2) {
    // Check foot collisions
    const dx = robot1.dynamicFoot.x - robot2.staticFoot.x;
    const dy = robot1.dynamicFoot.y - robot2.staticFoot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < robot1.footRadius + robot2.footRadius) {
        robot1.spinSpeed = -robot1.spinSpeed;
        robot1.score += 10;
    }

    const dx2 = robot2.dynamicFoot.x - robot1.staticFoot.x;
    const dy2 = robot2.dynamicFoot.y - robot1.staticFoot.y;
    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (distance2 < robot1.footRadius + robot2.footRadius) {
        robot2.spinSpeed = -robot2.spinSpeed;
        robot2.score += 10;
    }

    // Check bullet collisions
    checkBulletCollision(robot1, robot2);
  }
  function drawScores() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText(player1.score, 10, 30); // Top left
    ctx.textAlign = 'right';
    ctx.fillText(player2.score, canvas.width - 10, 30); // Top right
  }
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player1.updateDynamicFootPosition();
    player2.updateDynamicFootPosition();

    // Update bullets
    player1.updateBullets();
    player2.updateBullets();

    // Update explosions
    player1.updateExplosions();
    player2.updateExplosions();

    checkCollisionAndToggleDirection(player1, player2);

    // Draw everything
    player1.draw(ctx);
    player2.draw(ctx);
    drawScores();
  }
  
    // Start the game loop
    gameLoop();
  });
  