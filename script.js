const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const speedEl = document.getElementById("speed");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const baseTick = 120;

let snake;
let food;
let direction;
let nextDirection;
let score;
let highScore = Number(localStorage.getItem("cobra-high-score") || 0);
let gameLoop;
let running = false;
let paused = false;
let particles = [];

highScoreEl.textContent = highScore;

function resetState() {
  snake = [
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  food = spawnFood();
  score = 0;
  particles = [];
  updateHud();
}

function spawnFood() {
  let p;
  do {
    p = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake?.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

function showOverlay(title, text, startLabel = "Jogar de novo") {
  overlayTitle.textContent = title;
  overlayText.innerHTML = text;
  startBtn.textContent = startLabel;
  overlay.classList.add("is-visible");
}

function hideOverlay() {
  overlay.classList.remove("is-visible");
}

function updateHud() {
  scoreEl.textContent = score;
  speedEl.textContent = `${(baseTick / getTickInterval()).toFixed(1)}x`;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("cobra-high-score", String(highScore));
    highScoreEl.textContent = highScore;
  }
}

function getTickInterval() {
  return Math.max(50, baseTick - score * 2);
}

function emitParticles(x, y, color) {
  for (let i = 0; i < 16; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 24 + Math.random() * 20,
      color
    });
  }
}

function drawBackgroundGrid() {
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1b2340";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const p = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const x = part.x * gridSize;
    const y = part.y * gridSize;

    const grad = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
    grad.addColorStop(0, "#35ffe4");
    grad.addColorStop(1, index === 0 ? "#8d63ff" : "#2ad7bf");

    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

    if (index === 0) {
      ctx.fillStyle = "#0b1229";
      ctx.fillRect(x + 6, y + 7, 3, 3);
      ctx.fillRect(x + gridSize - 9, y + 7, 3, 3);
    }
  });
}

function drawFood() {
  const x = food.x * gridSize + gridSize / 2;
  const y = food.y * gridSize + gridSize / 2;

  ctx.beginPath();
  ctx.fillStyle = "#ff5f7a";
  ctx.shadowColor = "#ff5f7a";
  ctx.shadowBlur = 14;
  ctx.arc(x, y, gridSize * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawParticles() {
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;

    ctx.globalAlpha = particle.life / 40;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function render() {
  drawBackgroundGrid();
  drawFood();
  drawSnake();
  drawParticles();
}

function gameTick() {
  if (!running || paused) {
    return;
  }

  direction = { ...nextDirection };

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall =
    head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;

  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);

  if (hitWall || hitSelf) {
    running = false;
    clearInterval(gameLoop);
    emitParticles(snake[0].x * gridSize + 10, snake[0].y * gridSize + 10, "#ff5f7a");
    render();
    showOverlay(
      "💥 Fim de jogo",
      `Você fez <strong>${score}</strong> pontos.<br/>${
        score >= highScore
          ? "Novo recorde! Você é lendário."
          : "Quase! Na próxima vai vir o UAU."
      }`,
      "Tentar novamente"
    );
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    emitParticles(
      food.x * gridSize + gridSize / 2,
      food.y * gridSize + gridSize / 2,
      "#35ffe4"
    );
    food = spawnFood();
    updateHud();
    clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, getTickInterval());
  } else {
    snake.pop();
  }

  render();
}

function startGame() {
  resetState();
  running = true;
  paused = false;
  hideOverlay();
  clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, getTickInterval());
  render();
}

function togglePause() {
  if (!running) {
    return;
  }
  paused = !paused;
  if (paused) {
    showOverlay("⏸️ Pausado", "Respire. Quando quiser, continue a dominar a arena.", "Continuar");
  } else {
    hideOverlay();
  }
}

function setDirection(x, y) {
  if (!running || paused) {
    return;
  }
  if (x === -direction.x && y === -direction.y) {
    return;
  }
  nextDirection = { x, y };
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "arrowup" || key === "w") setDirection(0, -1);
  if (key === "arrowdown" || key === "s") setDirection(0, 1);
  if (key === "arrowleft" || key === "a") setDirection(-1, 0);
  if (key === "arrowright" || key === "d") setDirection(1, 0);
  if (key === " ") {
    event.preventDefault();
    togglePause();
  }
});

startBtn.addEventListener("click", () => {
  if (paused) {
    paused = false;
    hideOverlay();
    return;
  }
  startGame();
});

resetBtn.addEventListener("click", () => {
  clearInterval(gameLoop);
  resetState();
  running = false;
  paused = false;
  render();
  showOverlay(
    "🐍 Cobra Revolucionária",
    "Tudo resetado! Agora sim, bora fazer um score absurdo.",
    "Começar"
  );
});

resetState();
render();
showOverlay(
  "🐍 Cobra Revolucionária",
  "Jogo completo com score, início, pausa, reset e fim. Agora é com você: mete marcha e diz <strong>UAU</strong>!",
  "Começar"
);
