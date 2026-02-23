const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// スマホボタン表示・非表示切替
const touchButtons = document.getElementById("touchButtons");
if (!isMobile && touchButtons) {
  touchButtons.style.display = "none";
}

// PC操作説明の表示
const pcControls = document.getElementById("pcControls");
if (!isMobile && pcControls) {
  pcControls.style.display = "block";
}

if (!isMobile) {
  document.getElementById("mobileControls").style.display = "none";
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const seShoot = document.getElementById("se-shoot");
const seBomb1 = document.getElementById("se-mini-bomb1");
const seBomb2 = document.getElementById("se-mini-bomb2");

const scoreDisplay = document.getElementById("score");
const stageLabel = document.getElementById("stageLabel");
const gameOverScreen = document.getElementById("gameOverScreen");
const retryButton = document.getElementById("retryButton");
const stageClearScreen = document.getElementById("stageClearScreen");

retryButton.onclick = () => location.reload();

let score = 0;
let stage = 1;
let isGameOver = false;
let enemySpeedBase = 2;
let spawning = true;

const playerImg = new Image();
playerImg.src = "./ロケット.png";

const enemyImgs = [
                
                    "./omoro_alien_04.png",
                    "./omoro_alien_05.png",
                    "./omoro_alien_07.png",
                   "./omoro_alien_01.png",
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});
let currentEnemyImg = enemyImgs[0];

const player = {
  x: canvas.width / 2 - 32,
  y: canvas.height - 100,
  width: 64,
  height: 64,
  speed: 6
};

const keys = {}, bullets = [], enemies = [], explosions = [];

function fireBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 10
  });
  seShoot.currentTime = 0;
  seShoot.play();
}

window.addEventListener("keydown", e => {
  if (isGameOver) return;
  keys[e.key] = true;
  if (e.code === "Space") fireBullet();
});
window.addEventListener("keyup", e => keys[e.key] = false);

function spawnEnemy() {
  if (!spawning) return;
  const size = 64;
  const x = Math.random() * (canvas.width - size);
  enemies.push({
    x, y: -size, width: size, height: size,
    speed: enemySpeedBase + Math.random() * 1.5
  });
}
setInterval(spawnEnemy, 1000);

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    if (b.y < 0) bullets.splice(i, 1);
  }
}

function drawEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed;
    ctx.drawImage(currentEnemyImg, e.x, e.y, e.width, e.height);
    if (e.y > canvas.height) enemies.splice(i, 1);
  }
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${ex.alpha})`;
    ctx.fill();
    ex.radius += 2;
    ex.alpha -= 0.03;
    if (ex.alpha <= 0) explosions.splice(i, 1);
  }
}

function showStageClear() {
  stageClearScreen.style.display = "flex";
  spawning = false;
  setTimeout(() => {
    stage++;
    stageLabel.textContent = `ステージ: ${stage}`;
    currentEnemyImg = enemyImgs[Math.min(stage - 1, enemyImgs.length - 1)];
    enemySpeedBase += 0.5;
    stageClearScreen.style.display = "none";
    spawning = true;
  }, 2500);
}

function detectCollisions() {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        explosions.push({ x: e.x + e.width/2, y: e.y + e.height/2, radius: 10, alpha: 1 });

        seBomb1.volume = 0.4;
        seBomb1.currentTime = 0;
        seBomb1.play();

        score++;
        scoreDisplay.textContent = score;

        if (score % 10 === 0 && stage < enemyImgs.length) {
          showStageClear();
        }

        break;
      }
    }
  }
}

function checkPlayerCollision() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (player.x < e.x + e.width && player.x + player.width > e.x &&
        player.y < e.y + e.height && player.y + player.height > e.y) {
      explosions.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 10,
        alpha: 1
      });
      isGameOver = true;
      seBomb2.volume = 0.6;
      seBomb2.currentTime = 0;
      seBomb2.play();
      gameOverScreen.style.display = "flex";
    }
  }
}

const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 0.5 + 0.2
}));

function drawStars() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  for (let star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
}

function gameLoop() {
  if (isGameOver) return;
  drawStars();

  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  drawPlayer();
  drawBullets();
  drawEnemies();
  drawExplosions();
  detectCollisions();
  checkPlayerCollision();

  requestAnimationFrame(gameLoop);
}

gameLoop();

// スマホ用ボタン処理
let holdLeft = false, holdRight = false, fireHold = false, fireTimer = null;
document.getElementById("leftBtn").addEventListener("touchstart", () => holdLeft = true);
document.getElementById("leftBtn").addEventListener("touchend", () => holdLeft = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => holdRight = true);
document.getElementById("rightBtn").addEventListener("touchend", () => holdRight = false);
document.getElementById("fireBtn").addEventListener("touchstart", () => {
  fireBullet();
  fireTimer = setInterval(fireBullet, 250);
});
document.getElementById("fireBtn").addEventListener("touchend", () => clearInterval(fireTimer));

function touchLoop() {
  if (holdLeft) player.x -= player.speed;
  if (holdRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  requestAnimationFrame(touchLoop);
}
touchLoop();
