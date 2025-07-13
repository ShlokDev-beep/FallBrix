class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentScoreElement = document.getElementById('currentScore');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.finalScoreElement = document.getElementById('finalScore');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');

        // Game settings
        this.canvasWidth = 360;
        this.canvasHeight = 640;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('fallingBricksHighScore') || '0');
        this.startTime = 0;
        this.lastTime = 0;
        this.animationId = null;

        // Player properties
        this.player = {
            x: this.canvasWidth / 2 - 25,
            y: this.canvasHeight - 60,
            width: 50,
            height: 40,
            speed: 5,
            color: '#3B82F6'
        };

        // Bricks array
        this.bricks = [];
        this.brickSpeed = 2;
        this.brickSpawnRate = 0.02;
        this.lastBrickSpawn = 0;

        // Input handling
        this.keys = {};
        this.touchControls = {
            left: false,
            right: false
        };

        // Initialize game
        this.init();
    }

    init() {
        this.updateHighScoreDisplay();
        this.setupEventListeners();
        this.showMainMenu();
        this.gameLoop();
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Button event listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());
        this.resumeBtn.addEventListener('click', () => this.togglePause());
        this.pauseBtn.addEventListener('click', () => this.togglePause());

        // Mobile touch controls
        this.leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });

        this.leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });

        this.rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });

        this.rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });

        // Mouse controls for desktop
        this.leftBtn.addEventListener('mousedown', () => {
            this.touchControls.left = true;
        });

        this.leftBtn.addEventListener('mouseup', () => {
            this.touchControls.left = false;
        });

        this.rightBtn.addEventListener('mousedown', () => {
            this.touchControls.right = true;
        });

        this.rightBtn.addEventListener('mouseup', () => {
            this.touchControls.right = false;
        });

        // Prevent context menu on mobile
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    showMainMenu() {
        this.gameState = 'menu';
        this.overlayTitle.textContent = 'Falling Bricks';
        this.overlayMessage.textContent = 'Dodge the falling bricks and survive as long as possible!';
        this.startBtn.classList.remove('hidden');
        this.restartBtn.classList.add('hidden');
        this.gameOverlay.classList.remove('hidden');
        this.pauseOverlay.classList.add('hidden');
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.startTime = Date.now();
        this.lastTime = 0;
        this.lastBrickSpawn = 0;
        this.bricks = [];
        this.brickSpeed = 2;
        this.brickSpawnRate = 0.02;
        
        // Reset player position
        this.player.x = this.canvasWidth / 2 - 25;
        
        // Hide overlays
        this.gameOverlay.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        
        this.updateScoreDisplay();
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
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fallingBricksHighScore', this.highScore.toString());
            this.updateHighScoreDisplay();
        }
        
        // Show game over screen
        this.overlayTitle.textContent = 'Game Over!';
        this.overlayMessage.innerHTML = `You survived for <span id="finalScore">${this.score}</span> seconds!`;
        this.finalScoreElement = document.getElementById('finalScore');
        this.startBtn.classList.add('hidden');
        this.restartBtn.classList.remove('hidden');
        this.gameOverlay.classList.remove('hidden');
        this.pauseOverlay.classList.add('hidden');
    }

    updateScoreDisplay() {
        this.currentScoreElement.textContent = this.score;
    }

    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }

    handleInput() {
        if (this.gameState !== 'playing') return;

        // Keyboard controls
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.x += this.player.speed;
        }

        // Touch controls
        if (this.touchControls.left) {
            this.player.x -= this.player.speed;
        }
        if (this.touchControls.right) {
            this.player.x += this.player.speed;
        }

        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.canvasWidth - this.player.width, this.player.x));
    }

    spawnBrick() {
        const now = Date.now();
        if (now - this.lastBrickSpawn > 1000 / (this.brickSpawnRate * 60)) {
            this.bricks.push({
                x: Math.random() * (this.canvasWidth - 40),
                y: -40,
                width: 40,
                height: 30,
                speed: this.brickSpeed,
                color: this.getRandomBrickColor()
            });
            this.lastBrickSpawn = now;
        }
    }

    getRandomBrickColor() {
        const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateBricks() {
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            brick.y += brick.speed;

            // Remove bricks that are off screen
            if (brick.y > this.canvasHeight) {
                this.bricks.splice(i, 1);
                continue;
            }

            // Check collision with player
            if (this.checkCollision(this.player, brick)) {
                this.gameOver();
                return;
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    increaseDifficulty() {
        const timePlayed = this.score;
        
        // Increase brick speed every 10 seconds
        if (timePlayed % 10 === 0 && timePlayed > 0) {
            this.brickSpeed = Math.min(8, 2 + timePlayed / 20);
        }
        
        // Increase spawn rate every 15 seconds
        if (timePlayed % 15 === 0 && timePlayed > 0) {
            this.brickSpawnRate = Math.min(0.08, 0.02 + timePlayed / 500);
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Update score (seconds survived)
        this.score = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateScoreDisplay();

        // Handle input
        this.handleInput();

        // Spawn bricks
        this.spawnBrick();

        // Update bricks
        this.updateBricks();

        // Increase difficulty over time
        this.increaseDifficulty();
    }

    drawPlayer() {
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Add player glow effect
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;
    }

    drawBricks() {
        this.bricks.forEach(brick => {
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Add brick border
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        });
    }

    drawBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#1e40af');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Add subtle grid pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvasWidth; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvasHeight; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw background
        this.drawBackground();

        // Draw game elements
        this.drawPlayer();
        this.drawBricks();

        // Draw game info if playing
        if (this.gameState === 'playing') {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Speed: ${this.brickSpeed.toFixed(1)}`, this.canvasWidth / 2, 30);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Make Game available globally
window.Game = Game;