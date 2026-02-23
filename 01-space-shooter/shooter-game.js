// ========================================
// グローバル変数とゲーム設定
// ========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = true;
let score = 0;
let level = 1;

// マウス座標
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// キー入力
const keys = {};

// ゲームオブジェクト配列
const bullets = [];
const enemies = [];
const powerUps = [];
const particles = [];

// ========================================
// プレイヤークラス
// ========================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 4;
        this.maxSpeed = 6;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.fireRate = 250; // ミリ秒
        this.lastFireTime = 0;
        this.weaponLevel = 1; // 武器レベル
        this.invincible = false;
        this.invincibleTime = 0;
    }

    update() {
        // 移動入力
        let ax = 0;
        let ay = 0;

        if (keys['w'] || keys['W'] || keys['ArrowUp']) ay -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) ay += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) ax -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) ax += 1;

        // 加速度を適用
        if (ax !== 0 || ay !== 0) {
            const len = Math.sqrt(ax * ax + ay * ay);
            ax /= len;
            ay /= len;

            this.vx += ax * this.speed * 0.3;
            this.vy += ay * this.speed * 0.3;
        }

        // 摩擦
        this.vx *= 0.92;
        this.vy *= 0.92;

        // 最大速度制限
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > this.maxSpeed) {
            this.vx = (this.vx / currentSpeed) * this.maxSpeed;
            this.vy = (this.vy / currentSpeed) * this.maxSpeed;
        }

        // 位置更新
        this.x += this.vx;
        this.y += this.vy;

        // 画面端で跳ね返る
        if (this.x < this.size) {
            this.x = this.size;
            this.vx *= -0.5;
        }
        if (this.x > canvas.width - this.size) {
            this.x = canvas.width - this.size;
            this.vx *= -0.5;
        }
        if (this.y < this.size) {
            this.y = this.size;
            this.vy *= -0.5;
        }
        if (this.y > canvas.height - this.size) {
            this.y = canvas.height - this.size;
            this.vy *= -0.5;
        }

        // マウスの方向を向く
        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);

        // 無敵時間の更新
        if (this.invincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;
        this.lastFireTime = now;

        // 武器レベルに応じて弾を発射
        if (this.weaponLevel === 1) {
            bullets.push(new Bullet(this.x, this.y, this.angle, 10));
        } else if (this.weaponLevel === 2) {
            // ダブルショット
            bullets.push(new Bullet(this.x, this.y, this.angle - 0.1, 10));
            bullets.push(new Bullet(this.x, this.y, this.angle + 0.1, 10));
        } else if (this.weaponLevel >= 3) {
            // トリプルショット
            bullets.push(new Bullet(this.x, this.y, this.angle, 10));
            bullets.push(new Bullet(this.x, this.y, this.angle - 0.2, 10));
            bullets.push(new Bullet(this.x, this.y, this.angle + 0.2, 10));
        }

        // 射撃音の代わりにパーティクル
        createParticles(this.x, this.y, 3, '#ffff00', 2);
    }

    takeDamage(damage) {
        if (this.invincible) return;

        this.hp -= damage;
        this.invincible = true;
        this.invincibleTime = 60; // 1秒間無敵（60フレーム）

        // ダメージエフェクト
        createParticles(this.x, this.y, 10, '#ff0066', 4);

        if (this.hp <= 0) {
            this.hp = 0;
            gameOver();
        }

        updateUI();
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
        createParticles(this.x, this.y, 10, '#00ff00', 3);
        updateUI();
    }

    upgradeWeapon() {
        this.weaponLevel = Math.min(this.weaponLevel + 1, 3);
        this.fireRate = Math.max(150, this.fireRate - 30);
        createParticles(this.x, this.y, 15, '#00ffff', 4);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 無敵中は点滅
        if (this.invincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // プレイヤー本体（三角形）
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.lineTo(-this.size, -this.size / 2);
        ctx.closePath();
        ctx.fill();

        // エンジン炎
        if (keys['w'] || keys['W'] || keys['s'] || keys['S'] ||
            keys['a'] || keys['A'] || keys['d'] || keys['D']) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(-this.size - 5, 3);
            ctx.lineTo(-this.size - 5, -3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // HPバー
        const barWidth = 40;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 10;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
}

// ========================================
// 弾クラス
// ========================================
class Bullet {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.size = 3;
        this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 120; // 寿命（フレーム）
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        return this.life > 0 &&
               this.x > 0 && this.x < canvas.width &&
               this.y > 0 && this.y < canvas.height;
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ========================================
// 敵クラス
// ========================================
class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;

        if (type === 'normal') {
            this.size = 12;
            this.speed = 1.5 + level * 0.1;
            this.hp = 2;
            this.maxHp = 2;
            this.damage = 10;
            this.scoreValue = 10;
            this.color = '#ff0066';
        } else if (type === 'fast') {
            this.size = 8;
            this.speed = 3 + level * 0.15;
            this.hp = 1;
            this.maxHp = 1;
            this.damage = 5;
            this.scoreValue = 15;
            this.color = '#ff6600';
        } else if (type === 'tank') {
            this.size = 18;
            this.speed = 0.8 + level * 0.05;
            this.hp = 5;
            this.maxHp = 5;
            this.damage = 20;
            this.scoreValue = 30;
            this.color = '#9900ff';
        }

        this.angle = 0;
    }

    update(player) {
        // プレイヤーを追跡
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        this.angle = Math.atan2(dy, dx);
    }

    takeDamage(damage) {
        this.hp -= damage;
        createParticles(this.x, this.y, 5, this.color, 2);
        return this.hp <= 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        if (this.type === 'normal') {
            // 四角形
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.type === 'fast') {
            // 三角形
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size, this.size);
            ctx.lineTo(-this.size, -this.size);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'tank') {
            // 六角形
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = Math.cos(angle) * this.size;
                const py = Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        // HPバー（HPが減っている場合のみ）
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 6;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ff0066';
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }
}

// ========================================
// パワーアップクラス
// ========================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.type = type; // 'health' or 'weapon'
        this.life = 600; // 10秒
        this.angle = 0;

        if (type === 'health') {
            this.color = '#00ff00';
            this.symbol = '+';
        } else if (type === 'weapon') {
            this.color = '#00ffff';
            this.symbol = 'W';
        }
    }

    update() {
        this.life--;
        this.angle += 0.05;
        return this.life > 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ========================================
// パーティクルクラス
// ========================================
class Particle {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.size = size || 2;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.maxLife = 30;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
        return this.life > 0;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y, count, color, size) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, size));
    }
}

// ========================================
// ゲームインスタンス
// ========================================
const player = new Player(canvas.width / 2, canvas.height / 2);

// ========================================
// 敵のスポーン
// ========================================
function spawnEnemy() {
    // ランダムな辺からスポーン
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { // 上
        x = Math.random() * canvas.width;
        y = -20;
    } else if (side === 1) { // 右
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
    } else if (side === 2) { // 下
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
    } else { // 左
        x = -20;
        y = Math.random() * canvas.height;
    }

    // 敵のタイプを確率で決定
    const rand = Math.random();
    let type;
    if (rand < 0.6) type = 'normal';
    else if (rand < 0.85) type = 'fast';
    else type = 'tank';

    enemies.push(new Enemy(x, y, type));
}

// ========================================
// パワーアップのスポーン
// ========================================
function spawnPowerUp(x, y) {
    const rand = Math.random();
    const type = rand < 0.6 ? 'health' : 'weapon';
    powerUps.push(new PowerUp(x, y, type));
}

// ========================================
// 衝突判定
// ========================================
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < obj1.size + obj2.size;
}

// ========================================
// UI更新
// ========================================
function updateUI() {
    document.getElementById('hpDisplay').textContent = Math.max(0, Math.floor(player.hp));
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('levelDisplay').textContent = level;
}

// ========================================
// レベルアップ
// ========================================
function checkLevelUp() {
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) {
        level = newLevel;
        updateUI();
        // レベルアップエフェクト
        createParticles(canvas.width / 2, 50, 30, '#ffff00', 5);
    }
}

// ========================================
// ゲームオーバー
// ========================================
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

// ========================================
// ゲームリスタート
// ========================================
function restartGame() {
    // リセット
    gameRunning = true;
    score = 0;
    level = 1;
    bullets.length = 0;
    enemies.length = 0;
    powerUps.length = 0;
    particles.length = 0;

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.weaponLevel = 1;
    player.fireRate = 250;
    player.invincible = false;

    updateUI();
    document.getElementById('gameOver').style.display = 'none';
}

// ========================================
// 星空背景
// ========================================
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
    });
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // ゆっくり下に移動
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// ========================================
// メインゲームループ
// ========================================
let lastSpawnTime = 0;
const spawnInterval = 2000; // 2秒ごと

function gameLoop() {
    // 背景クリア
    ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星空
    drawStars();

    if (gameRunning) {
        // プレイヤー更新
        player.update();

        // 弾の更新
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].update()) {
                bullets.splice(i, 1);
            }
        }

        // 敵の更新
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player);

            // プレイヤーとの衝突
            if (checkCollision(player, enemies[i])) {
                player.takeDamage(enemies[i].damage);
                createParticles(enemies[i].x, enemies[i].y, 15, enemies[i].color, 3);
                enemies.splice(i, 1);
                continue;
            }

            // 弾との衝突
            for (let j = bullets.length - 1; j >= 0; j--) {
                if (checkCollision(bullets[j], enemies[i])) {
                    bullets.splice(j, 1);
                    if (enemies[i].takeDamage(1)) {
                        // 敵を倒した
                        score += enemies[i].scoreValue;
                        updateUI();
                        checkLevelUp();

                        // パワーアップのドロップ（20%）
                        if (Math.random() < 0.2) {
                            spawnPowerUp(enemies[i].x, enemies[i].y);
                        }

                        createParticles(enemies[i].x, enemies[i].y, 20, enemies[i].color, 4);
                        enemies.splice(i, 1);
                    }
                    break;
                }
            }
        }

        // パワーアップの更新
        for (let i = powerUps.length - 1; i >= 0; i--) {
            if (!powerUps[i].update()) {
                powerUps.splice(i, 1);
                continue;
            }

            // プレイヤーとの衝突
            if (checkCollision(player, powerUps[i])) {
                if (powerUps[i].type === 'health') {
                    player.heal(30);
                } else if (powerUps[i].type === 'weapon') {
                    player.upgradeWeapon();
                }
                powerUps.splice(i, 1);
            }
        }

        // パーティクルの更新
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update()) {
                particles.splice(i, 1);
            }
        }

        // 敵のスポーン
        const now = Date.now();
        if (now - lastSpawnTime > spawnInterval / level) {
            spawnEnemy();
            lastSpawnTime = now;
        }
    }

    // 描画
    particles.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    powerUps.forEach(p => p.draw());
    player.draw();

    requestAnimationFrame(gameLoop);
}

// ========================================
// イベントリスナー
// ========================================
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    if (gameRunning) {
        player.shoot();
    }
});

document.getElementById('restartBtn').addEventListener('click', restartGame);

// ========================================
// ゲーム開始
// ========================================
updateUI();
gameLoop();
