// Get the canvas element and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.5,
    jumpStrength: -10,
    onGround: true,
    health: 100
};

let bullets = [];
let zombies = [];
let score = 0;
let gameRunning = true;
let gamePaused = false;
let keys = {};
let zombieSpawnInterval = 2000; // Initial interval in milliseconds
let zombieSpeedIncreaseInterval = 60000; // Speed increase every 60 seconds
let zombieSpeedIncreaseAmount = 0.1; // Speed increase amount

// Bullet settings
const bulletLimit = 3; // Number of bullets that can be fired per key press
let bulletsInCurrentShot = 0;
let canShoot = true;
let shootCooldown = 500; // Cooldown in milliseconds
let lastShootTime = 0;

// Key press event listeners
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Toggle pause state
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        gamePaused = !gamePaused;
        if (!gamePaused) {
            update(); // Resume the game
        }
    }
});

// Load leaderboard from local storage
function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    return leaderboard;
}

// Save leaderboard to local storage
function saveLeaderboard(name, score) {
    let leaderboard = loadLeaderboard();
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score); // Sort by score descending
    leaderboard = leaderboard.slice(0, 10); // Keep top 10
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Function to move player
function movePlayer() {
    player.x += player.dx;
    player.y += player.dy;

    // Apply gravity
    if (!player.onGround) {
        player.dy += player.gravity;
    }

    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.onGround = true;
        player.dy = 0;
    }
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 20); // Background of the health bar
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, player.health, 20); // Foreground of the health bar
}

// Function to shoot bullets with projectile motion
function shootBullet() {
    if (bulletsInCurrentShot < bulletLimit && canShoot) {
        let angle = -Math.PI / 4; // 45 degrees upward angle
        let speed = 5;
        let bullet = {
            x: player.x + player.width / 2 - 5, // Centered bullet
            y: player.y,
            width: 10,
            height: 10,
            dx: speed * Math.cos(angle), // Horizontal velocity
            dy: speed * Math.sin(angle), // Vertical velocity
            gravity: 0.1 // Gravity effect on the bullet
        };
        bullets.push(bullet);
        bulletsInCurrentShot++;
    }
}

// Draw bullets
function drawBullets() {
    bullets.forEach((bullet, index) => {
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        bullet.dy += bullet.gravity;

        // Remove bullets that go off screen
        if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }
    });
}

// Create and update zombies
function spawnZombie() {
    const x = canvas.width;
    const y = canvas.height - 50;
    const speed = 2 + Math.random() * 3;
    zombies.push({ x, y, width: 50, height: 50, speed });
}

function drawZombies() {
    zombies.forEach((zombie, index) => {
        ctx.fillStyle = 'green';
        ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
        zombie.x -= zombie.speed; // Move zombies left
        
        // Check for collisions with player
        if (zombie.x < player.x + player.width &&
            zombie.x + zombie.width > player.x &&
            zombie.y < player.y + player.height &&
            zombie.y + zombie.height > player.y) {
            // Zombie hits player
            player.health -= 10;
            zombies.splice(index, 1); // Remove zombie
            if (player.health <= 0) {
                gameRunning = false; // End game
                let name = prompt("Game Over! Enter your name for the leaderboard:");
                if (name) {
                    saveLeaderboard(name, score);
                }
            }
        }
        
        // Remove zombies that go off screen
        if (zombie.x + zombie.width < 0) {
            zombies.splice(index, 1);
        }
    });
}

// Function to check collisions between bullets and zombies
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        zombies.forEach((zombie, zombieIndex) => {
            if (bullet.x < zombie.x + zombie.width &&
                bullet.x + bullet.width > zombie.x &&
                bullet.y < zombie.y + zombie.height &&
                bullet.y + bullet.height > zombie.y) {
                // Bullet hits zombie
                zombies.splice(zombieIndex, 1); // Remove zombie
                bullets.splice(bulletIndex, 1); // Remove bullet
                score += 10; // Increase score
            }
        });
    });
}

// Draw score
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 50);
}

// Draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 70, canvas.height / 2);
}

// Draw leaderboard
function drawLeaderboard() {
    let leaderboard = loadLeaderboard();
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Leaderboard:', 10, 80);
    leaderboard.forEach((entry, index) => {
        ctx.fillText(`${index + 1}. ${entry.name} - ${entry.score}`, 10, 110 + index * 30);
    });
}

// Handle shooting logic
function handleShooting() {
    let now = Date.now();
    if (keys[' '] && now - lastShootTime > shootCooldown) {
        lastShootTime = now;
        shootBullet();
        bulletsInCurrentShot = 0; // Reset bullets count after shooting
        canShoot = false; // Set flag to false to prevent immediate re-shoot
        setTimeout(() => canShoot = true, shootCooldown); // Allow shooting again after cooldown
    }
}

// Game loop
function update() {
    if (gameRunning) {
        if (!gamePaused) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Move and draw player
            if (keys['ArrowRight'] || keys['d']) {
                player.dx = player.speed;
            } else if (keys['ArrowLeft'] || keys['a']) {
                player.dx = -player.speed;
            } else {
                player.dx = 0;
            }
            if (keys['ArrowUp'] || keys['w']) {
                if (player.onGround) {
                    player.dy = player.jumpStrength;
                    player.onGround = false;
                }
            }

            movePlayer();
            drawPlayer();
            drawBullets();
            drawZombies();
            checkCollisions();
            drawScore();
            handleShooting(); // Check for shooting

            if (Math.random() < 0.02) spawnZombie(); // Spawn zombies randomly

            // Increase zombie speed gradually
            setTimeout(() => {
                zombieSpawnInterval = Math.max(500, zombieSpawnInterval - 50);
            }, zombieSpeedIncreaseInterval);

            requestAnimationFrame(update);
        } else {
            drawPauseScreen();
            requestAnimationFrame(update);
        }
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
        drawLeaderboard(); // Show leaderboard on game over
    }
}

// Start the game loop
update();
