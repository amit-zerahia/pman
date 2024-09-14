const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const pacman = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    dx: 0,
    dy: 0,
    speed: 5,
    direction: 'right'
};
let mouthAngle = 0;
let mouthDirection = 1;
const mouthSpeed = 0.07;
const characters = 'HappyBirthday'.split('');
const characterSize = 30;
let currentCharacterIndex = 0;
let currentCharacter = null;
let isGameOver = false;
let score = 0;
const MIN_DISTANCE_FROM_PACMAN = 150;
const enemies = [];
const enemyCount = 1;
const enemySize = characterSize;
let enemySpeed = 1;
let enemiesWereSpawned = false;

function getRandomPosition(minDistance) {
    let position;
    let isValidPosition = false;
    while (!isValidPosition) {
        position = {
            x: Math.random() * (canvas.width - characterSize) + characterSize / 2,
            y: Math.random() * (canvas.height - characterSize) + characterSize / 2
        };
        const distX = position.x - pacman.x;
        const distY = position.y - pacman.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance >= minDistance) {
            isValidPosition = true;
        }
    }
    return position;
}

function initializeCharacter() {
    if (currentCharacterIndex < characters.length) {
        const position = getRandomPosition(MIN_DISTANCE_FROM_PACMAN);
        currentCharacter = {
            alerted: false,
            char: characters[currentCharacterIndex],
            x: position.x,
            y: position.y,
            dx: 0,
            dy: 0
        };
    }
}

function createEnemy() {
    let position;
    let isValidPosition = false;
    while (!isValidPosition) {
        position = {
            x: Math.random() * (canvas.width - enemySize) + enemySize / 2,
            y: Math.random() * (canvas.height - enemySize) + enemySize / 2
        };
        const distX = position.x - pacman.x;
        const distY = position.y - pacman.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance >= MIN_DISTANCE_FROM_PACMAN) {
            isValidPosition = true;
        }
    }
    return {
        x: position.x,
        y: position.y,
        size: enemySize,
        dx: 0,
        dy: 0
    };
}

function initializeEnemies() {
    enemiesWereSpawned = true;
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(createEnemy());
    }
}

function drawPacman(x, y, size, direction, mouthAngle, bodyColor, eyeColor) {
    ctx.beginPath();
    const angles = {
        right: { start: 0.2 * Math.PI, end: 1.8 * Math.PI },
        left: { start: 1.2 * Math.PI, end: 0.8 * Math.PI },
        up: { start: 1.75 * Math.PI, end: 1.25 * Math.PI },
        down: { start: 0.75 * Math.PI, end: 0.25 * Math.PI }
    };
    const { start, end } = angles[direction];
    const adjustedStart = start - mouthAngle;
    const adjustedEnd = end + mouthAngle;
    ctx.arc(x, y, size, adjustedStart, adjustedEnd);
    ctx.lineTo(x, y);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    const eyeRadius = size / 8;
    const eyeOffset = size / 2;
    let eyeX = x;
    let eyeY = y - 8;
    switch (direction) {
        case 'right':
            eyeX += eyeOffset / 2;
            eyeY -= eyeOffset / 2;
            break;
        case 'left':
            eyeX -= eyeOffset / 2;
            eyeY -= eyeOffset / 2;
            break;
        case 'up':
            eyeX += eyeOffset;
            eyeY += eyeOffset / 2;
            break;
        case 'down':
            eyeX -= eyeOffset;
            eyeY += eyeOffset / 2;
            break;
    }
    ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = eyeColor;
    ctx.fill();
    ctx.closePath();
}

function drawUserPacman() {
    drawPacman(pacman.x, pacman.y, pacman.size, pacman.direction, mouthAngle, '#FFFF00', '#000000');
}

function drawCharacter() {
    if (currentCharacter) {
        ctx.beginPath();
        ctx.font = `${characterSize + 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00FF00';
        ctx.fillText(currentCharacter.char, currentCharacter.x, currentCharacter.y);
        ctx.closePath();
    }
}

function moveCharacterAway() {
    if (currentCharacter) {
        const distX = currentCharacter.x - pacman.x;
        const distY = currentCharacter.y - pacman.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        const threshold = 75;
        if (distance <= threshold) {
            currentCharacter.alerted = true;
            const moveFactor = Math.min(currentCharacterIndex / 3.5, pacman.speed);
            const angle = Math.atan2(distY, distX);
            currentCharacter.dx = Math.cos(angle) * moveFactor;
            currentCharacter.dy = Math.sin(angle) * moveFactor;
        }
        if (currentCharacter.alerted) {
            currentCharacter.x += currentCharacter.dx;
            currentCharacter.y += currentCharacter.dy;
        } else {
            currentCharacter.dx = 0;
            currentCharacter.dy = 0;
        }
        if (currentCharacter.x < 0) currentCharacter.x = canvas.width - characterSize / 2;
        if (currentCharacter.x > canvas.width) currentCharacter.x = characterSize / 2;
        if (currentCharacter.y < 0) currentCharacter.y = canvas.height - characterSize / 2;
        if (currentCharacter.y > canvas.height) currentCharacter.y = characterSize / 2;
    }
}

function moveEnemies() {
    enemies.forEach(enemy => {
        const xVector = pacman.x - enemy.x;
        const yVector = pacman.y - enemy.y;
        const distance = Math.sqrt(xVector * xVector + yVector * yVector);
        if (distance > 0) {
            const angle = Math.atan2(yVector, xVector);
            const directionX = Math.cos(angle) * enemySpeed;
            const directionY = Math.sin(angle) * enemySpeed;
            if (Math.abs(xVector) >= Math.abs(yVector)) {
                enemy.direction = enemy.dx > 0 ? 'right' : 'left';
                enemy.dx = directionX;
                enemy.dy = 0;
            } else {
                enemy.direction = enemy.dy > 0 ? 'down' : 'up';
                enemy.dx = 0;
                enemy.dy = directionY;
            }
            enemy.x += enemy.dx;
            enemy.y += enemy.dy;
            if (enemy.x < 0) enemy.x = canvas.width - enemy.size / 2;
            if (enemy.x > canvas.width) enemy.x = enemy.size / 2;
            if (enemy.y < 0) enemy.y = canvas.height - enemy.size / 2;
            if (enemy.y > canvas.height) enemy.y = enemy.size / 2;
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        drawPacman(enemy.x, enemy.y, enemy.size, enemy.direction || 'right', mouthAngle, '#FF0000', '#FFFFFF');
    });
}

function checkEnemyCollisions() {
    enemies.forEach(enemy => {
        const distX = pacman.x - enemy.x;
        const distY = pacman.y - enemy.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance < pacman.size + enemy.size) {
            handleLoss();
        }
    });
}

function update() {
    if (isGameOver) return;

    pacman.x += pacman.dx;
    pacman.y += pacman.dy;

    if (pacman.x < pacman.size) pacman.x = pacman.size;
    if (pacman.x > canvas.width - pacman.size) pacman.x = canvas.width - pacman.size;
    if (pacman.y < pacman.size) pacman.y = pacman.size;
    if (pacman.y > canvas.height - pacman.size) pacman.y = canvas.height - pacman.size;

    mouthAngle += mouthDirection * mouthSpeed;
    if (mouthAngle >= 0.5) {
        mouthDirection = -1;
    } else if (mouthAngle <= 0.1) {
        mouthDirection = 1;
    }

    moveCharacterAway();
    moveEnemies();
    if (
        currentCharacter &&
        Math.abs(pacman.x - currentCharacter.x) < pacman.size &&
        Math.abs(pacman.y - currentCharacter.y) < pacman.size
    ) {
        score++;
        document.getElementById('score').textContent = `Score: ${score}`;
        currentCharacter = null;
        currentCharacterIndex++;
        if (currentCharacterIndex >= characters.length) {
            handleWin();
        } else {
            initializeCharacter();
            if (currentCharacterIndex >= characters.length / 3) {
                if (!enemiesWereSpawned) {
                    initializeEnemies();
                }
                enemySpeed = Math.min((currentCharacterIndex + 2) / 6, pacman.speed);
            }
        }
    }
    checkEnemyCollisions();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPacman(pacman.x, pacman.y, pacman.size, pacman.direction, mouthAngle, '#FFFF00', '#000000');
    drawCharacter();
    drawEnemies();
}

function handleGameEnd() {
    isGameOver = true;
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('mobile-controls').style.display = 'none';
    document.getElementById('game-over-container').style.display = 'block';
}

function handleWin() {
    handleGameEnd();
    document.getElementById('game-over-message').textContent = 'Happy 22nd birthday Michelle!';
    document.getElementById('game-over-sub-message').textContent = 'From Amit & Botzer';
    generateBalloons(22);
    generateConfetti(222);
}

function handleLoss() {
    handleGameEnd();
    document.getElementById('game-over-message').textContent = 'Game Over!';
    document.getElementById('game-over-sub-message').textContent = 'Better luck next time.';
}

function generateBalloons(num) {
    const container = document.querySelector('.balloon-container');
    container.innerHTML = '';
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    for (let i = 0; i < num; i++) {
        let balloon = document.createElement('div');
        balloon.className = 'balloon';
        const size = Math.floor(Math.random() * 60 + 30);
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size}px`;
        let balloonImg = document.createElement('img');
        balloonImg.src = './balloon.png';
        balloonImg.style.width = '100%';
        balloonImg.style.height = '100%';
        balloon.appendChild(balloonImg);
        const maxLeft = viewportWidth - size;
        const maxTop = viewportHeight - size;
        const left = Math.random() * maxLeft;
        const top = Math.random() * maxTop;
        balloon.style.position = 'absolute';
        balloon.style.left = `${left}px`;
        balloon.style.top = `${top}px`;
        balloon.style.animationDuration = `${Math.floor(Math.random() * 1000 + 3000)}ms`;
        balloon.addEventListener('click', () => {
            balloon.remove();
        });
        container.appendChild(balloon);
    }
}

function generateConfetti(num) {
    const confettiContainer = document.querySelector('.confetti-container');
    confettiContainer.innerHTML = '';
    for (let i = 0; i < num; i++) {
        let confettiPiece = document.createElement('div');
        confettiPiece.className = 'confetti';
        confettiPiece.style.backgroundColor = getRandomNeonColor();
        confettiPiece.style.left = `${Math.random() * 100}%`;
        confettiPiece.style.top = `${Math.random() * 100}vh`;
        confettiPiece.style.animationDuration = `${Math.random() * 3 + 3}s`;
        confettiContainer.appendChild(confettiPiece);
    }
}

function getRandomNeonColor() {
    const neonColors = ['#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF4081'];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
}

function setPacmanMovement(dx, dy, direction) {
    pacman.dx = dx;
    pacman.dy = dy;
    pacman.direction = direction;
}

document.getElementById('left').addEventListener('touchend', () => {
    if (isGameOver) return;
    setPacmanMovement(-pacman.speed, 0, 'left');
});

document.getElementById('right').addEventListener('touchend', () => {
    if (isGameOver) return;
    setPacmanMovement(pacman.speed, 0, 'right');
});

document.getElementById('up').addEventListener('touchend', () => {
    if (isGameOver) return;
    setPacmanMovement(0, -pacman.speed, 'up');
});

document.getElementById('down').addEventListener('touchend', () => {
    if (isGameOver) return;
    setPacmanMovement(0, pacman.speed, 'down');
});

document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    switch (e.key) {
        case 'ArrowUp':
            setPacmanMovement(0, -pacman.speed, 'up');
            break;
        case 'ArrowDown':
            setPacmanMovement(0, pacman.speed, 'down');
            break;
        case 'ArrowLeft':
            setPacmanMovement(-pacman.speed, 0, 'left');
            break;
        case 'ArrowRight':
            setPacmanMovement(pacman.speed, 0, 'right');
            break;
    }
});

function startGame() {
    initializeCharacter();
    setInterval(update, 1000 / 30);
}

startGame();