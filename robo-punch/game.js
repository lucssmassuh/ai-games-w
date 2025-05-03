// game.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.style.border = '1pt solid black';
  
    // Create two player robots with different initial positions and colors
    const separation = 400; // Increased distance between players for larger canvas
    const player1 = new Robot('red', canvas.width / 2 - separation / 2, canvas.height / 2);
    player1.score = 0; // Initialize score
    const player2 = new Robot('blue', canvas.width / 2 + separation / 2, canvas.height / 2);
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
  
    function checkCollisionAndToggleDirection(robot1, robot2) {
      const dx = robot1.dynamicFoot.x - robot2.staticFoot.x;
      const dy = robot1.dynamicFoot.y - robot2.staticFoot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      // Assuming the feet are circles, check if circles overlap
      if (distance < robot1.footRadius + robot2.footRadius) {
          robot1.spinSpeed = -robot1.spinSpeed; // Toggle the spin direction of robot1
          player1.score += 10; // Assuming player2 scores when player1 hits
      }
  
      // Check the other way around
      const dx2 = robot2.dynamicFoot.x - robot1.staticFoot.x;
      const dy2 = robot2.dynamicFoot.y - robot1.staticFoot.y;
      const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  
      if (distance2 < robot1.footRadius + robot2.footRadius) {
          robot2.spinSpeed = -robot2.spinSpeed; // Toggle the spin direction of robot2
          player2.score += 10; // Assuming player1 scores when player2 hits
      }
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
  
    checkCollisionAndToggleDirection(player1, player2);
  
    player1.draw(ctx);
    player2.draw(ctx);
  
    drawScores(); // Draw scores last to ensure they're on top
  }
  
    // Start the game loop
    gameLoop();
  });
  