(() => {
  // ─── Config ───
  const TILE = 32;
  const WALL = 1;
  const PATH = 0;
  const BASE_COLS = 11;
  const BASE_ROWS = 11;

  // ─── State ───
  let level = 1;
  let lives = 3;
  let cols, rows, maze;
  let player, zombies, pigeons, goal;
  let collectedPigeons, totalPigeons;
  let startTime, elapsed, timerInterval;
  let canvas, ctx;
  let gameActive = false;
  let particles = [];
  let flashTimer = 0;

  // ─── Screens ───
  const screens = {
    title: document.getElementById('screen-title'),
    game: document.getElementById('screen-game'),
    clear: document.getElementById('screen-clear'),
    over: document.getElementById('screen-over'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ─── HUD ───
  const hud = {
    level: document.getElementById('hud-level'),
    pigeons: document.getElementById('hud-pigeons'),
    lives: document.getElementById('hud-lives'),
    time: document.getElementById('hud-time'),
  };

  function updateHUD() {
    hud.level.textContent = level;
    hud.pigeons.textContent = `${collectedPigeons}/${totalPigeons}`;
    hud.lives.textContent = '❤️'.repeat(lives);
    hud.time.textContent = elapsed + 's';
  }

  // ─── Maze Generation (Recursive Backtracker) ───
  function generateMaze(c, r) {
    const grid = Array.from({ length: r }, () => Array(c).fill(WALL));

    function carve(cx, cy) {
      grid[cy][cx] = PATH;
      const dirs = shuffle([
        [0, -2], [0, 2], [-2, 0], [2, 0],
      ]);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (ny >= 0 && ny < r && nx >= 0 && nx < c && grid[ny][nx] === WALL) {
          grid[cy + dy / 2][cx + dx / 2] = PATH;
          carve(nx, ny);
        }
      }
    }

    carve(1, 1);
    return grid;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── Place Entities ───
  function getOpenCells() {
    const cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (maze[y][x] === PATH) cells.push({ x, y });
      }
    }
    return cells;
  }

  function dist(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function setupLevel() {
    // Scale maze with level
    cols = BASE_COLS + Math.floor(level / 2) * 2;
    rows = BASE_ROWS + Math.floor(level / 2) * 2;
    // Keep odd
    if (cols % 2 === 0) cols++;
    if (rows % 2 === 0) rows++;
    // Cap
    cols = Math.min(cols, 31);
    rows = Math.min(rows, 31);

    maze = generateMaze(cols, rows);

    // Player at top-left
    player = { x: 1, y: 1 };

    // Goal at bottom-right
    goal = { x: cols - 2, y: rows - 2 };
    maze[goal.y][goal.x] = PATH;

    const open = getOpenCells().filter(
      c => !(c.x === player.x && c.y === player.y) && !(c.x === goal.x && c.y === goal.y)
    );
    shuffle(open);

    // Pigeons
    totalPigeons = Math.min(3 + level, 10);
    collectedPigeons = 0;
    pigeons = [];
    for (let i = 0; i < totalPigeons && open.length > 0; i++) {
      const cell = open.pop();
      pigeons.push({ x: cell.x, y: cell.y, collected: false, bobPhase: Math.random() * Math.PI * 2 });
    }

    // Zombies — placed far from player
    const zombieCount = Math.min(1 + Math.floor(level / 2), 6);
    const farCells = open
      .filter(c => dist(c, player) > Math.max(cols, rows) / 2)
      .sort((a, b) => dist(b, player) - dist(a, player));

    zombies = [];
    for (let i = 0; i < zombieCount && farCells.length > 0; i++) {
      const cell = farCells.shift();
      zombies.push({
        x: cell.x,
        y: cell.y,
        moveTimer: 0,
        moveInterval: Math.max(6, 14 - level),
        face: '🧟',
      });
    }

    // Canvas size
    canvas.width = cols * TILE;
    canvas.height = rows * TILE;

    // Timer
    elapsed = 0;
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!gameActive) return;
      elapsed = Math.floor((Date.now() - startTime) / 1000);
      updateHUD();
    }, 250);

    particles = [];
    flashTimer = 0;
    gameActive = true;
    updateHUD();
  }

  // ─── Drawing ───
  const COLORS = {
    wall: '#2d1b69',
    wallTop: '#4a2c8a',
    path: '#e8dff5',
    pathDot: '#d4c5f0',
    goal: '#43e97b',
    goalLocked: '#888',
  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * TILE;
        const py = y * TILE;
        if (maze[y][x] === WALL) {
          // Wall with 3D effect
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(px, py, TILE, TILE - 3);
          // Random stars on walls
          if ((x * 7 + y * 13) % 11 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px serif';
            ctx.fillText('✦', px + 10, py + 18);
          }
        } else {
          // Path
          ctx.fillStyle = COLORS.path;
          ctx.fillRect(px, py, TILE, TILE);
          // Small dots pattern
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = COLORS.pathDot;
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw goal
    const goalUnlocked = collectedPigeons >= totalPigeons;
    const gx = goal.x * TILE;
    const gy = goal.y * TILE;
    ctx.fillStyle = goalUnlocked ? COLORS.goal : COLORS.goalLocked;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 300);
    ctx.fillRect(gx + 2, gy + 2, TILE - 4, TILE - 4);
    ctx.globalAlpha = 1;
    ctx.font = `${TILE - 6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(goalUnlocked ? '🚪' : '🔒', gx + TILE / 2, gy + TILE / 2 + 1);

    // Draw pigeons
    for (const p of pigeons) {
      if (p.collected) continue;
      const bob = Math.sin(Date.now() / 400 + p.bobPhase) * 3;
      ctx.font = `${TILE - 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐦', p.x * TILE + TILE / 2, p.y * TILE + TILE / 2 + bob);
    }

    // Draw zombies
    for (const z of zombies) {
      ctx.font = `${TILE - 2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.face, z.x * TILE + TILE / 2, z.y * TILE + TILE / 2 + 1);
    }

    // Draw player
    const playerBob = Math.sin(Date.now() / 200) * 1.5;
    ctx.font = `${TILE - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('😎', player.x * TILE + TILE / 2, player.y * TILE + TILE / 2 + playerBob);

    // Flash effect on hit
    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 0, 80, ${flashTimer * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashTimer--;
    }

    // Particles
    drawParticles();
  }

  // ─── Particles ───
  function spawnParticles(x, y, emoji, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x * TILE + TILE / 2,
        y: y * TILE + TILE / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 30 + Math.random() * 20,
        emoji,
        size: 12 + Math.random() * 8,
      });
    }
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      const alpha = Math.min(1, p.life / 15);
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, p.x, p.y);
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  // ─── Player Movement ───
  function movePlayer(dx, dy) {
    if (!gameActive) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    if (maze[ny][nx] === WALL) return;

    player.x = nx;
    player.y = ny;

    // Check pigeon
    for (const p of pigeons) {
      if (!p.collected && p.x === nx && p.y === ny) {
        p.collected = true;
        collectedPigeons++;
        spawnParticles(nx, ny, '✨', 6);
        spawnParticles(nx, ny, '🐦', 2);
        playSound('collect');
        updateHUD();
      }
    }

    // Check goal
    if (nx === goal.x && ny === goal.y && collectedPigeons >= totalPigeons) {
      gameActive = false;
      clearInterval(timerInterval);
      playSound('clear');
      spawnParticles(nx, ny, '🎉', 10);
      setTimeout(() => {
        document.getElementById('clear-time').textContent =
          `クリアタイム: ${elapsed}秒`;
        showScreen('clear');
      }, 800);
      return;
    }

    // Check zombie collision
    checkZombieCollision();
  }

  // ─── Zombie AI ───
  let gameTick = 0;

  function updateZombies() {
    if (!gameActive) return;
    gameTick++;

    for (const z of zombies) {
      z.moveTimer++;
      if (z.moveTimer < z.moveInterval) continue;
      z.moveTimer = 0;

      // Simple chase: move toward player with some randomness
      const dirs = shuffle([[0, -1], [0, 1], [-1, 0], [1, 0]]);
      let bestDir = dirs[0];
      let bestDist = Infinity;

      // 70% chance to chase, 30% random
      const chasing = Math.random() < 0.7;

      if (chasing) {
        for (const [dx, dy] of dirs) {
          const nx = z.x + dx;
          const ny = z.y + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          if (maze[ny][nx] === WALL) continue;
          const d = dist({ x: nx, y: ny }, player);
          if (d < bestDist) {
            bestDist = d;
            bestDir = [dx, dy];
          }
        }
      } else {
        // Random valid move
        for (const [dx, dy] of dirs) {
          const nx = z.x + dx;
          const ny = z.y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === PATH) {
            bestDir = [dx, dy];
            break;
          }
        }
      }

      const [dx, dy] = bestDir;
      const nx = z.x + dx;
      const ny = z.y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === PATH) {
        z.x = nx;
        z.y = ny;
      }
    }

    checkZombieCollision();
  }

  function checkZombieCollision() {
    for (const z of zombies) {
      if (z.x === player.x && z.y === player.y) {
        lives--;
        flashTimer = 8;
        spawnParticles(player.x, player.y, '💥', 5);
        playSound('hit');
        updateHUD();

        if (lives <= 0) {
          gameActive = false;
          clearInterval(timerInterval);
          setTimeout(() => {
            document.getElementById('over-level').textContent =
              `レベル ${level} でやられた…`;
            showScreen('over');
          }, 600);
          return;
        }

        // Respawn player at start
        player.x = 1;
        player.y = 1;
        break;
      }
    }
  }

  // ─── Sound (Web Audio) ───
  let audioCtx;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playSound(type) {
    try {
      ensureAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      switch (type) {
        case 'collect':
          osc.frequency.setValueAtTime(600, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
          break;
        case 'hit':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
          break;
        case 'clear':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.15);
          osc.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
          break;
      }
    } catch (e) { /* audio not available */ }
  }

  // ─── Game Loop ───
  let lastFrame = 0;
  const FRAME_INTERVAL = 1000 / 30;

  function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    if (timestamp - lastFrame < FRAME_INTERVAL) return;
    lastFrame = timestamp;

    updateZombies();
    draw();
  }

  // ─── Input ───
  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer(0, -1); break;
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer(0, 1); break;
      case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer(1, 0); break;
    }
  });

  // Mobile controls
  document.querySelectorAll('.ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switch (btn.dataset.dir) {
        case 'up': movePlayer(0, -1); break;
        case 'down': movePlayer(0, 1); break;
        case 'left': movePlayer(-1, 0); break;
        case 'right': movePlayer(1, 0); break;
      }
    });
  });

  // Swipe support
  let touchStartX, touchStartY;
  const SWIPE_THRESHOLD = 30;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 1 : -1, 0);
    } else {
      movePlayer(0, dy > 0 ? 1 : -1);
    }
  });

  // ─── Buttons ───
  document.getElementById('btn-start').addEventListener('click', () => {
    level = 1;
    lives = 3;
    startGame();
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    level++;
    startGame();
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    level = 1;
    lives = 3;
    startGame();
  });

  function startGame() {
    canvas = document.getElementById('maze-canvas');
    ctx = canvas.getContext('2d');
    setupLevel();
    showScreen('game');
    requestAnimationFrame(gameLoop);
  }

  // ─── Init ───
  showScreen('title');
})();
