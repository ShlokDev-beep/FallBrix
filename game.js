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

    // Mouse / touch drag
    let isDragging = false;
    let offsetX = 0;

    this.canvas.addEventListener('mousedown', (e) => {
        if (this.isInsidePlayer(e.offsetX, e.offsetY)) {
            isDragging = true;
            offsetX = e.offsetX - this.player.x;
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            this.player.x = e.offsetX - offsetX;
            this.constrainPlayer();
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (this.isInsidePlayer(x, y)) {
            isDragging = true;
            offsetX = x - this.player.x;
        }
    });

    this.canvas.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            this.player.x = x - offsetX;
            this.constrainPlayer();
        }
    });

    this.canvas.addEventListener('touchend', () => {
        isDragging = false;
    });
},

isInsidePlayer(x, y) {
    return (
        x >= this.player.x &&
        x <= this.player.x + this.player.width &&
        y >= this.player.y &&
        y <= this.player.y + this.player.height
    );
},

constrainPlayer() {
    this.player.x = Math.max(0, Math.min(this.canvasWidth - this.player.width, this.player.x));
},

handleInput() {
    if (this.gameState !== 'playing') return;

    // Keyboard controls
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        this.player.x -= this.player.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        this.player.x += this.player.speed;
    }

    this.constrainPlayer();
}
