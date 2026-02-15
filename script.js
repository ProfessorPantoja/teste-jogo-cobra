const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');

const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const GRID_SIZE = 24;
const BOARD_TILES = 24;
const BASE_SPEED = 145;
const SPEED_STEP = 8;

let snake;
let direction;
let queuedDirection;
let food;
let score;
let highScore;
let level;
let gameInterval;
let running = false;
let paused = false;
let overdriveTicks = 0;

function randomTile() {
  return {
    x: Math.floor(Math.random() * BOARD_TILES),
    y: Math.floor(Math.random() * BOARD_TILES),
  };
}

function showOverlay(overlay, visible) {
  overlay.classList.toggle('visible', visible);
}

function updateHud() {
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
  levelElement.textContent = level;
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(134, 169, 255, 0.12)';
  ctx.lineWidth = 1;

  for (let i = 1; i < BOARD_TILES; i += 1) {
    const offset = i * GRID_SIZE;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }
}

function drawFood() {
  const px = food.x * GRID_SIZE;
  const py = food.y * GRID_SIZE;

  const pulse = 4 + Math.sin(Date.now() / 120) * 1.5;
  const radius = GRID_SIZE / 2 - 4;

  ctx.beginPath();
  ctx.fillStyle = '#ff7998';
  ctx.shadowColor = '#ff7ca8';
  ctx.shadowBlur = 20;
  ctx.arc(px + GRID_SIZE / 2, py + GRID_SIZE / 2, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.shadowBlur = 0;
  ctx.arc(px + GRID_SIZE / 2, py + GRID_SIZE / 2, pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;

    const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
    gradient.addColorStop(0, overdriveTicks > 0 ? '#ffd66e' : '#7bffd3');
    gradient.addColorStop(1, overdriveTicks > 0 ? '#ffa969' : '#72a6ff');

    ctx.fillStyle = gradient;
    ctx.shadowColor = overdriveTicks > 0 ? '#ffd66e' : '#7bffd3';
    ctx.shadowBlur = index === 0 ? 18 : 8;
    ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

    if (index === 0) {
      ctx.fillStyle = '#031022';
      ctx.shadowBlur = 0;
      const eyeSize = 3;
      ctx.fillRect(x + 6, y + 7, eyeSize, eyeSize);
      ctx.fillRect(x + GRID_SIZE - 9, y + 7, eyeSize, eyeSize);
    }
  });

  ctx.shadowBlur = 0;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();

  if (overdriveTicks > 0) {
    ctx.fillStyle = 'rgba(255, 214, 110, 0.16)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffe38a';
    ctx.font = '700 20px Orbitron';
    ctx.fillText('OVERDRIVE!', 14, 30);
  }
}

function spawnFood() {
  let candidate;
  do {
    candidate = randomTile();
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
  food = candidate;
}

function stopLoop() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = undefined;
  }
}

function gameOver() {
  running = false;
  stopLoop();
  showOverlay(gameOverScreen, true);
  finalScoreElement.textContent = `Seu score: ${score}`;
}

function applyDirection(nextDirection) {
  const { x, y } = direction;
  if (x + nextDirection.x === 0 && y + nextDirection.y === 0) {
    return;
  }
  queuedDirection = nextDirection;
}

function tick() {
  if (!running || paused) {
    return;
  }

  direction = queuedDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= BOARD_TILES || nextHead.y >= BOARD_TILES;
  const hitSelf = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(nextHead);

  const ateFood = nextHead.x === food.x && nextHead.y === food.y;
  if (ateFood) {
    score += 10;
    level = Math.floor(score / 50) + 1;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('cobra-quantum-high-score', String(highScore));
    }

    if (score % 60 === 0) {
      overdriveTicks = 12;
    }

    spawnFood();
    restartLoop();
    updateHud();
  } else {
    snake.pop();
  }

  if (overdriveTicks > 0) {
    overdriveTicks -= 1;
  }

  render();
}

function getTickSpeed() {
  const levelBoost = Math.max(55, BASE_SPEED - (level - 1) * SPEED_STEP);
  return overdriveTicks > 0 ? Math.max(42, levelBoost - 25) : levelBoost;
}

function restartLoop() {
  stopLoop();
  gameInterval = setInterval(tick, getTickSpeed());
}

function resetState() {
  snake = [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = direction;
  score = 0;
  level = 1;
  overdriveTicks = 0;
  paused = false;
  spawnFood();
  updateHud();
  showOverlay(pauseScreen, false);
  showOverlay(gameOverScreen, false);
}

function startGame() {
  resetState();
  running = true;
  showOverlay(startScreen, false);
  restartLoop();
  render();
}

function togglePause() {
  if (!running) {
    return;
  }

  paused = !paused;
  showOverlay(pauseScreen, paused);
}

function fullReset() {
  running = false;
  stopLoop();
  resetState();
  showOverlay(startScreen, true);
  render();
}

function setupControls() {
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (key === ' ') {
      event.preventDefault();
      togglePause();
      return;
    }

    const controls = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 },
    };

    const nextDirection = controls[key];
    if (nextDirection) {
      event.preventDefault();
      applyDirection(nextDirection);
    }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', fullReset);
}

function boot() {
  highScore = Number(localStorage.getItem('cobra-quantum-high-score')) || 0;
  resetState();
  showOverlay(startScreen, true);
  setupControls();
  render();
}

boot();
