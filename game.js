class Game {
  constructor() {
    // Canvas & display
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasWidth = 360;
    this.canvasHeight = 640;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    // UI elements
    this.currentScoreElement = document.getElementById('currentScore');
    this.highScoreElement = document.getElementById('highScore');
    this.gameOverlay = document.getElementById('gameOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayMessage = document.getElementById('overlayMessage');
    this.startBtn = document.getElementById('startBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.resumeBtn = document.getElementById('resumeBtn');

    // Game variables
    this.gameState = 'menu';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('fallingBricksHighScore')) || 0;

    // Player
    this.player = { x: 155, y: 600, width: 50, height: 40, speed: 5, color: '#3B82F6' };

    // Bricks
    this.bricks = [];
    this.brickSpeed = 2;
    this.brickSpawnRate = 0.02;
    this.lastBrickTime = 0;

    // Input
    this.keys = {};

    // Initialize
    this.updateHighScore();
    this.setupEventListeners();
    this.showMenu();
    this.gameLoop();
  }

  setupEventListeners() {
    // Keyboard
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (e.key === ' ') { e.preventDefault(); this.togglePause(); }
    });
    window.addEventListener('keyup', e => this.keys[e.key] = false);

    // Mouse/Touch drag
    let dragging = false, offsetX = 0;
    this.canvas.addEventListener('mousedown', e => {
      if (this.isInsidePlayer(e.offsetX, e.offsetY)) {
        dragging = true;
        offsetX = e.offsetX - this.player.x;
      }
    });
    this.canvas.addEventListener('mousemove', e => {
      if (dragging && this.gameState === 'playing') {
        this.player.x = e.offsetX - offsetX;
        this.constrainPlayer();
      }
    });
    window.addEventListener('mouseup', () => dragging = false);

    this.canvas.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left, y = touch.clientY - rect.top;
      if (this.isInsidePlayer(x, y)) {
        dragging = true;
        offsetX = x - this.player.x;
      }
    });
    this.canvas.addEventListener('touchmove', e => {
      if (dragging && this.gameState === 'playing') {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        this.player.x = x - offsetX;
        this.constrainPlayer();
        e.preventDefault();
      }
    });
    this.canvas.addEventListener('touchend', () => dragging = false);

    // UI buttons
    this.startBtn.addEventListener('click', () => this.startGame());
    this.restartBtn.addEventListener('click', () => this.startGame());
    this.resumeBtn.addEventListener('click', () => this.togglePause());
  }

  isInsidePlayer(x, y) {
    return x >= this.player.x && x <= this.player.x + this.player.width &&
           y >= this.player.y && y <= this.player.y + this.player.height;
  }

  constrainPlayer() {
    this.player.x = Math.max(0, Math.min(this.canvasWidth - this.player.width, this.player.x));
  }

  updateScore() {
    this.currentScoreElement.textContent = this.score;
  }
  updateHighScore() {
    this.highScoreElement.textContent = this.highScore;
  }

  showMenu() {
    this.gameState = 'menu';
    this.overlayTitle.textContent = 'Falling Bricks';
    this.overlayMessage.textContent = 'Dodge falling bricks!';
    this.startBtn.classList.remove('hidden');
    this.restartBtn.classList.add('hidden');
    this.gameOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
  }

  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.bricks = [];
    this.brickSpeed = 2;
    this.brickSpawnRate = 0.02;
    this.player.x = (this.canvasWidth - this.player.width) / 2;

    this.gameOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.updateScore();
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.pauseOverlay.classList.remove('hidden');
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.pauseOverlay.classList.add('hidden');
    }
  }

  gameOver() {
    this.gameState = 'gameOver';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('fallingBricksHighScore', this.highScore);
      this.updateHighScore();
    }

    this.overlayTitle.textContent = 'Game Over!';
    this.overlayMessage.innerHTML = `You survived ${this.score} seconds`;
    this.startBtn.classList.add('hidden');
    this.restartBtn.classList.remove('hidden');
    this.gameOverlay.classList.remove('hidden');
    this.pauseOverlay.classList.add('hidden');
  }

  spawnBrick() {
    if (Math.random() < this.brickSpawnRate) {
      this.bricks.push({
        x: Math.random() * (this.canvasWidth - 40),
        y: -30,
        width: 40,
        height: 30,
        speed: this.brickSpeed,
        color: ['#EF4444','#F97316','#EAB308','#22C55E','#8B5CF6','#EC4899'][Math.floor(Math.random()*6)]
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    this.score = Math.floor((Date.now() - this.startTime)/1000);
    this.updateScore();

    // Input
    if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x -= this.player.speed;
    if (this.keys['ArrowRight'] || this.keys['d']) this.player.x += this.player.speed;
    this.constrainPlayer();

    // Bricks
    this.spawnBrick();
    this.bricks.forEach((b,i) => {
      b.y += b.speed;
      if (b.y > this.canvasHeight) this.bricks.splice(i,1);
      if (this.checkCollision(this.player,b)) this.gameOver();
    });

    // Difficulty
    if (this.score % 10 === 0) {
      this.brickSpeed = Math.min(8,2 + this.score/20);
      this.brickSpawnRate = Math.min(.1, .02 + this.score/500);
    }
  }

  checkCollision(a,b) {
    return a.x < b.x+b.width && a.x+a.width > b.x &&
           a.y < b.y+b.height && a.y+a.height > b.y;
  }

  draw() {
    // Background
    const grad = this.ctx.createLinearGradient(0,0,0,this.canvasHeight);
    grad.addColorStop(0,'#1e3a8a');
    grad.addColorStop(1,'#1e40af');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0,0,this.canvasWidth,this.canvasHeight);

    // Grid
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    for (let x = 0; x < this.canvasWidth; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x,0);
      this.ctx.lineTo(x,this.canvasHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0,y);
      this.ctx.lineTo(this.canvasWidth,y);
      this.ctx.stroke();
    }

    // Player
    this.ctx.shadowColor = this.player.color;
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(this.player.x,this.player.y,this.player.width,this.player.height);
    this.ctx.shadowBlur = 0;

    // Bricks
    this.bricks.forEach(b => {
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x,b.y,b.width,b.height);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(b.x,b.y,b.width,b.height);
    });

    // HUD
    if (this.gameState === 'playing') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Speed: ${this.brickSpeed.toFixed(1)}`, this.canvasWidth/2, 30);
    }
  }

  gameLoop() {
    if (this.gameState === 'playing' && !this.startTime) {
      this.startTime = Date.now();
    }
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Expose globally
window.Game = Game;
