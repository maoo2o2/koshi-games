// ========================================
// グローバル変数とゲーム設定
// ========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// マップサイズ（画面の3倍）
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

let gameRunning = true;
let score = 0;
let level = 1;
let kills = 0; // 敵撃破数

// カメラ
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height
};

// マウス座標（ワールド座標）
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let mouseWorldX = 0;
let mouseWorldY = 0;

// キー入力
const keys = {};

// ゲームオブジェクト配列
const bullets = [];
const enemies = [];
const bosses = [];
const powerUps = [];
const particles = [];
const obstacles = [];
const treasures = [];

// 宝物コレクション
const treasureCollection = {
    diamond: { name: 'ダイヤモンド', icon: '💎', collected: false, color: '#00ffff' },
    ruby: { name: 'ルビー', icon: '❤️', collected: false, color: '#ff0066' },
    emerald: { name: 'エメラルド', icon: '💚', collected: false, color: '#00ff66' },
    gold: { name: '金の延べ棒', icon: '🟨', collected: false, color: '#ffcc00' },
    pearl: { name: '真珠', icon: '⚪', collected: false, color: '#ffffff' },
    sapphire: { name: 'サファイア', icon: '💙', collected: false, color: '#0066ff' },
    crown: { name: '王冠', icon: '👑', collected: false, color: '#ffaa00' }
};

// ========================================
// カメラ関数
// ========================================
function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // カメラをマップ内に制限
    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - canvas.height));
}

function worldToScreen(x, y) {
    return {
        x: x - camera.x,
        y: y - camera.y
    };
}

function screenToWorld(x, y) {
    return {
        x: x + camera.x,
        y: y + camera.y
    };
}

// ========================================
// 障害物クラス
// ========================================
class Obstacle {
    constructor(x, y, width, height, type = 'rock') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);
        ctx.fillStyle = this.type === 'rock' ? '#666' : '#444';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;

        ctx.fillRect(screen.x, screen.y, this.width, this.height);
        ctx.strokeRect(screen.x, screen.y, this.width, this.height);

        // テクスチャ風
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(screen.x + 5, screen.y + 5, this.width - 10, this.height - 10);
    }

    collidesWith(obj) {
        return obj.x + obj.size > this.x &&
               obj.x - obj.size < this.x + this.width &&
               obj.y + obj.size > this.y &&
               obj.y - obj.size < this.y + this.height;
    }
}

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
        this.fireRate = 250;
        this.lastFireTime = 0;
        this.weaponType = 'normal'; // 'normal', 'laser', 'shotgun', 'missile', 'spread'
        this.invincible = false;
        this.invincibleTime = 0;
    }

    update() {
        let ax = 0;
        let ay = 0;

        if (keys['w'] || keys['W'] || keys['ArrowUp']) ay -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) ay += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) ax -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) ax += 1;

        if (ax !== 0 || ay !== 0) {
            const len = Math.sqrt(ax * ax + ay * ay);
            ax /= len;
            ay /= len;

            this.vx += ax * this.speed * 0.3;
            this.vy += ay * this.speed * 0.3;
        }

        this.vx *= 0.92;
        this.vy *= 0.92;

        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > this.maxSpeed) {
            this.vx = (this.vx / currentSpeed) * this.maxSpeed;
            this.vy = (this.vy / currentSpeed) * this.maxSpeed;
        }

        // 仮の移動
        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        // 障害物との衝突チェック
        let collided = false;
        for (const obstacle of obstacles) {
            if (obstacle.collidesWith({ x: newX, y: newY, size: this.size })) {
                collided = true;
                break;
            }
        }

        if (!collided) {
            this.x = newX;
            this.y = newY;
        } else {
            this.vx *= -0.5;
            this.vy *= -0.5;
        }

        // マップ境界
        this.x = Math.max(this.size, Math.min(this.x, WORLD_WIDTH - this.size));
        this.y = Math.max(this.size, Math.min(this.y, WORLD_HEIGHT - this.size));

        this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

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

        if (this.weaponType === 'normal') {
            // 通常弾
            bullets.push(new Bullet(this.x, this.y, this.angle, 10, false, 'normal'));
            createParticles(this.x, this.y, 3, '#ffff00', 2);
        } else if (this.weaponType === 'laser') {
            // レーザー（速くて貫通）
            bullets.push(new Bullet(this.x, this.y, this.angle, 15, false, 'laser'));
            createParticles(this.x, this.y, 5, '#00ffff', 2);
        } else if (this.weaponType === 'shotgun') {
            // ショットガン（5発を扇状に発射）
            for (let i = -2; i <= 2; i++) {
                bullets.push(new Bullet(this.x, this.y, this.angle + i * 0.15, 8, false, 'shotgun'));
            }
            createParticles(this.x, this.y, 8, '#ff6600', 3);
        } else if (this.weaponType === 'missile') {
            // ミサイル（ホーミング）
            bullets.push(new Bullet(this.x, this.y, this.angle, 6, false, 'missile'));
            createParticles(this.x, this.y, 4, '#ff0066', 2);
        } else if (this.weaponType === 'spread') {
            // 拡散弾（3方向）
            bullets.push(new Bullet(this.x, this.y, this.angle, 10, false, 'spread'));
            bullets.push(new Bullet(this.x, this.y, this.angle - 0.3, 10, false, 'spread'));
            bullets.push(new Bullet(this.x, this.y, this.angle + 0.3, 10, false, 'spread'));
            createParticles(this.x, this.y, 6, '#9900ff', 2);
        }
    }

    takeDamage(damage) {
        if (this.invincible) return;

        this.hp -= damage;
        this.invincible = true;
        this.invincibleTime = 60;

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

    changeWeapon(newWeaponType) {
        this.weaponType = newWeaponType;

        // 武器ごとの発射レート
        if (newWeaponType === 'laser') {
            this.fireRate = 100; // 速い
        } else if (newWeaponType === 'shotgun') {
            this.fireRate = 400; // 遅い
        } else if (newWeaponType === 'missile') {
            this.fireRate = 600; // かなり遅い
        } else if (newWeaponType === 'spread') {
            this.fireRate = 300;
        } else {
            this.fireRate = 250; // 通常
        }

        createParticles(this.x, this.y, 15, '#00ffff', 4);
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);

        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.rotate(this.angle);

        if (this.invincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.lineTo(-this.size, -this.size / 2);
        ctx.closePath();
        ctx.fill();

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
        const barX = screen.x - barWidth / 2;
        const barY = screen.y - this.size - 10;

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
    constructor(x, y, angle, speed, fromEnemy = false, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = fromEnemy ? 4 : (type === 'missile' ? 5 : type === 'laser' ? 2 : 3);
        this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = type === 'laser' ? 60 : 120;
        this.fromEnemy = fromEnemy;
        this.angle = angle;

        // ミサイル用
        this.homingStrength = 0.05;
    }

    update() {
        // ミサイルのホーミング
        if (this.type === 'missile' && !this.fromEnemy && enemies.length > 0) {
            let closest = null;
            let closestDist = 300; // ホーミング範囲

            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closest = enemy;
                    closestDist = dist;
                }
            }

            if (closest) {
                const targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
                this.angle += (targetAngle - this.angle) * this.homingStrength;
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // レーザーは障害物を貫通
        if (this.type !== 'laser') {
            for (const obstacle of obstacles) {
                if (obstacle.collidesWith({ x: this.x, y: this.y, size: this.size })) {
                    return false;
                }
            }
        }

        return this.life > 0 &&
               this.x > 0 && this.x < WORLD_WIDTH &&
               this.y > 0 && this.y < WORLD_HEIGHT;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);
        if (screen.x < -50 || screen.x > canvas.width + 50 ||
            screen.y < -50 || screen.y > canvas.height + 50) return;

        ctx.save();

        if (this.type === 'laser') {
            // レーザー
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(screen.x - this.vx * 2, screen.y - this.vy * 2);
            ctx.stroke();
        } else if (this.type === 'missile') {
            // ミサイル
            ctx.translate(screen.x, screen.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#ff0066';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0066';
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size, this.size / 2);
            ctx.lineTo(-this.size, -this.size / 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'shotgun') {
            // ショットガン
            ctx.fillStyle = '#ff6600';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff6600';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spread') {
            // 拡散弾
            ctx.fillStyle = '#9900ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#9900ff';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 通常弾
            ctx.fillStyle = this.fromEnemy ? '#ff6600' : '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.fromEnemy ? '#ff6600' : '#ffff00';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ========================================
// 敵クラス（可愛い目付き）
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
            this.color = '#ff99cc';
        } else if (type === 'fast') {
            this.size = 8;
            this.speed = 3 + level * 0.15;
            this.hp = 1;
            this.maxHp = 1;
            this.damage = 5;
            this.scoreValue = 15;
            this.color = '#ffcc99';
        } else if (type === 'tank') {
            this.size = 18;
            this.speed = 0.8 + level * 0.05;
            this.hp = 5;
            this.maxHp = 5;
            this.damage = 20;
            this.scoreValue = 30;
            this.color = '#cc99ff';
        }

        this.angle = 0;
        this.eyeOffset = Math.random() * Math.PI * 2;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const newX = this.x + (dx / dist) * this.speed;
            const newY = this.y + (dy / dist) * this.speed;

            // 障害物チェック
            let collided = false;
            for (const obstacle of obstacles) {
                if (obstacle.collidesWith({ x: newX, y: newY, size: this.size })) {
                    collided = true;
                    break;
                }
            }

            if (!collided) {
                this.x = newX;
                this.y = newY;
            }
        }

        this.angle = Math.atan2(dy, dx);
    }

    takeDamage(damage) {
        this.hp -= damage;
        createParticles(this.x, this.y, 5, this.color, 2);
        return this.hp <= 0;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);
        if (screen.x < -50 || screen.x > canvas.width + 50 ||
            screen.y < -50 || screen.y > canvas.height + 50) return;

        ctx.save();
        ctx.translate(screen.x, screen.y);

        // 本体
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Claude風の可愛い目（白目なし、大きな黒目だけ）
        const eyeY = -this.size * 0.15;
        const eyeX = this.size * 0.35;
        const eyeSize = this.size * 0.3; // 大きめの目

        // 黒い目だけ（シンプル）
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // 小さな白いハイライト（キラキラ感）
        ctx.fillStyle = '#ffffff';
        const highlightSize = eyeSize * 0.35;
        ctx.beginPath();
        ctx.arc(-eyeX - eyeSize * 0.2, eyeY - eyeSize * 0.2, highlightSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.2, eyeY - eyeSize * 0.2, highlightSize, 0, Math.PI * 2);
        ctx.fill();

        // 口（小さなニッコリ笑顔）
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, this.size * 0.25, this.size * 0.25, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();

        // HPバー
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barX = screen.x - barWidth / 2;
            const barY = screen.y - this.size - 6;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = this.color;
            ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }
}

// ========================================
// ボスクラス
// ========================================
class Boss {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = 0;
        this.attackTimer = 0;
        this.moveTimer = 0;
        this.targetX = x;
        this.targetY = y;

        const bossData = {
            'barrage': { name: '弾幕王', size: 40, hp: 150, speed: 2, color: '#ff0066', scoreValue: 500 },
            'charger': { name: '突撃隊長', size: 35, hp: 120, speed: 4, color: '#ff6600', scoreValue: 450 },
            'summoner': { name: '召喚師', size: 38, hp: 100, speed: 1.5, color: '#9900ff', scoreValue: 550 },
            'laser': { name: 'レーザー砲', size: 42, hp: 140, speed: 1, color: '#00ffff', scoreValue: 600 },
            'spinner': { name: '回転斬り', size: 36, hp: 130, speed: 2.5, color: '#ffcc00', scoreValue: 500 },
            'fortress': { name: '要塞', size: 50, hp: 200, speed: 0.5, color: '#666699', scoreValue: 700 }
        };

        const data = bossData[type] || bossData['barrage'];
        this.name = data.name;
        this.size = data.size;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = data.speed;
        this.color = data.color;
        this.scoreValue = data.scoreValue;
        this.damage = 30;

        this.chargeSpeed = 0;
        this.chargeAngle = 0;
        this.laserAngle = 0;
        this.laserActive = false;
        this.summonTimer = 0;
    }

    update(player) {
        this.attackTimer++;
        this.moveTimer++;

        // 移動パターン
        if (this.type === 'charger') {
            // 突撃攻撃
            if (this.attackTimer > 180 && this.attackTimer < 210) {
                this.chargeAngle = Math.atan2(player.y - this.y, player.x - this.x);
                this.chargeSpeed = this.speed * 3;
            } else if (this.attackTimer >= 210 && this.attackTimer < 240) {
                this.x += Math.cos(this.chargeAngle) * this.chargeSpeed;
                this.y += Math.sin(this.chargeAngle) * this.chargeSpeed;
                this.chargeSpeed *= 0.95;
            } else if (this.attackTimer > 300) {
                this.attackTimer = 0;
            } else {
                this.moveTowardsPlayer(player);
            }
        } else {
            this.moveTowardsPlayer(player);
        }

        // 攻撃パターン
        if (this.type === 'barrage' && this.attackTimer % 90 === 0) {
            this.barrageAttack();
        } else if (this.type === 'laser') {
            this.laserAttack(player);
        } else if (this.type === 'summoner' && this.attackTimer % 180 === 0) {
            this.summonMinions();
        } else if (this.type === 'spinner' && this.attackTimer % 60 === 0) {
            this.spinnerAttack();
        } else if (this.type === 'fortress' && this.attackTimer % 45 === 0) {
            this.fortressAttack(player);
        }

        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
    }

    moveTowardsPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 200) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    barrageAttack() {
        const bulletCount = 16;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i + this.attackTimer * 0.05;
            bullets.push(new Bullet(this.x, this.y, angle, 5, true));
        }
    }

    laserAttack(player) {
        this.laserAngle = Math.atan2(player.y - this.y, player.x - this.x);
        if (this.attackTimer % 120 > 60 && this.attackTimer % 120 < 90) {
            this.laserActive = true;
        } else {
            this.laserActive = false;
        }
    }

    summonMinions() {
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 80;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            enemies.push(new Enemy(x, y, 'fast'));
        }
    }

    spinnerAttack() {
        const bulletCount = 8;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i + this.attackTimer * 0.1;
            bullets.push(new Bullet(this.x, this.y, angle, 6, true));
        }
    }

    fortressAttack(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push(new Bullet(this.x, this.y, angle, 7, true));
        bullets.push(new Bullet(this.x, this.y, angle + 0.2, 7, true));
        bullets.push(new Bullet(this.x, this.y, angle - 0.2, 7, true));
    }

    takeDamage(damage) {
        this.hp -= damage;
        createParticles(this.x, this.y, 10, this.color, 4);
        updateBossHPBar();
        return this.hp <= 0;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);

        ctx.save();
        ctx.translate(screen.x, screen.y);

        // レーザー描画
        if (this.type === 'laser' && this.laserActive) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 6;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.laserAngle) * 1000, Math.sin(this.laserAngle) * 1000);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ボス本体
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // ボスの目
        const eyeY = -this.size * 0.2;
        const eyeX = this.size * 0.35;
        const eyeSize = this.size * 0.2;

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ========================================
// 宝物クラス
// ========================================
class Treasure {
    constructor(x, y, treasureType) {
        this.x = x;
        this.y = y;
        this.type = treasureType;
        this.size = 15;
        this.angle = 0;
        this.data = treasureCollection[treasureType];
    }

    update() {
        this.angle += 0.05;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);

        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.data.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.data.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.data.icon, 0, 0);

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ========================================
// パワーアップクラス
// ========================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.type = type;
        this.life = 600;
        this.angle = 0;

        const typeData = {
            'health': { color: '#00ff00', symbol: '+', name: '回復' },
            'laser': { color: '#00ffff', symbol: 'L', name: 'レーザー' },
            'shotgun': { color: '#ff6600', symbol: 'S', name: 'ショットガン' },
            'missile': { color: '#ff0066', symbol: 'M', name: 'ミサイル' },
            'spread': { color: '#9900ff', symbol: 'P', name: '拡散弾' },
            'normal': { color: '#ffff00', symbol: 'N', name: '通常弾' }
        };

        const data = typeData[type] || typeData['normal'];
        this.color = data.color;
        this.symbol = data.symbol;
        this.name = data.name;
    }

    update() {
        this.life--;
        this.angle += 0.05;
        return this.life > 0;
    }

    draw() {
        const screen = worldToScreen(this.x, this.y);

        ctx.save();
        ctx.translate(screen.x, screen.y);
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
        const screen = worldToScreen(this.x, this.y);
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.size, 0, Math.PI * 2);
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
// マップ生成
// ========================================
function generateMap() {
    // 障害物配置
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * (WORLD_WIDTH - 100) + 50;
        const y = Math.random() * (WORLD_HEIGHT - 100) + 50;
        const width = 40 + Math.random() * 60;
        const height = 40 + Math.random() * 60;

        // プレイヤー初期位置から離す
        if (Math.abs(x - WORLD_WIDTH / 2) > 200 || Math.abs(y - WORLD_HEIGHT / 2) > 200) {
            obstacles.push(new Obstacle(x, y, width, height));
        }
    }

    // 宝物をマップに散らばらせる
    const treasureTypes = Object.keys(treasureCollection);
    for (const treasureType of treasureTypes) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 50) {
            const x = Math.random() * (WORLD_WIDTH - 200) + 100;
            const y = Math.random() * (WORLD_HEIGHT - 200) + 100;

            // プレイヤー初期位置から離す
            const distFromPlayer = Math.sqrt(
                Math.pow(x - WORLD_WIDTH / 2, 2) + Math.pow(y - WORLD_HEIGHT / 2, 2)
            );

            if (distFromPlayer > 400) {
                treasures.push(new Treasure(x, y, treasureType));
                placed = true;
            }

            attempts++;
        }
    }
}

// ========================================
// ゲームインスタンス
// ========================================
const player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

// ========================================
// 敵のスポーン
// ========================================
function spawnEnemy() {
    const margin = 100;
    const side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) {
        x = player.x + (Math.random() - 0.5) * 400;
        y = player.y - 400;
    } else if (side === 1) {
        x = player.x + 400;
        y = player.y + (Math.random() - 0.5) * 400;
    } else if (side === 2) {
        x = player.x + (Math.random() - 0.5) * 400;
        y = player.y + 400;
    } else {
        x = player.x - 400;
        y = player.y + (Math.random() - 0.5) * 400;
    }

    x = Math.max(margin, Math.min(x, WORLD_WIDTH - margin));
    y = Math.max(margin, Math.min(y, WORLD_HEIGHT - margin));

    const rand = Math.random();
    let type;
    if (rand < 0.6) type = 'normal';
    else if (rand < 0.85) type = 'fast';
    else type = 'tank';

    enemies.push(new Enemy(x, y, type));
}

// ========================================
// ボスのスポーン
// ========================================
function spawnBoss() {
    const bossTypes = ['barrage', 'charger', 'summoner', 'laser', 'spinner', 'fortress'];
    const randomType = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    const x = player.x + (Math.random() - 0.5) * 600;
    const y = player.y + (Math.random() - 0.5) * 600;

    const boss = new Boss(x, y, randomType);
    bosses.push(boss);

    // ボス警告表示
    const warning = document.getElementById('bossWarning');
    warning.style.display = 'block';
    setTimeout(() => {
        warning.style.display = 'none';
    }, 2000);

    // ボスHPバー表示
    document.getElementById('bossName').textContent = boss.name;
    document.getElementById('bossHpBar').style.display = 'block';
    updateBossHPBar();
}

function updateBossHPBar() {
    if (bosses.length > 0) {
        const boss = bosses[0];
        const percent = (boss.hp / boss.maxHp) * 100;
        document.getElementById('bossHpInner').style.width = percent + '%';
    }
}

// ========================================
// 宝物ドロップ
// ========================================
function dropTreasure(x, y) {
    const availableTypes = Object.keys(treasureCollection).filter(
        key => !treasureCollection[key].collected
    );

    if (availableTypes.length > 0) {
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        treasures.push(new Treasure(x, y, randomType));
    }
}

// ========================================
// パワーアップのスポーン
// ========================================
function spawnPowerUp(x, y) {
    const types = ['health', 'laser', 'shotgun', 'missile', 'spread', 'normal'];
    const weights = [0.3, 0.15, 0.15, 0.15, 0.15, 0.1]; // 確率

    let rand = Math.random();
    let cumulativeWeight = 0;
    let type = 'normal';

    for (let i = 0; i < types.length; i++) {
        cumulativeWeight += weights[i];
        if (rand < cumulativeWeight) {
            type = types[i];
            break;
        }
    }

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
    document.getElementById('killsDisplay').textContent = kills;
    document.getElementById('levelDisplay').textContent = level;

    // 宝物リスト更新
    const treasureListEl = document.getElementById('treasureList');
    treasureListEl.innerHTML = '';

    for (const key in treasureCollection) {
        const treasure = treasureCollection[key];
        const item = document.createElement('div');
        item.className = 'treasure-item';
        item.style.opacity = treasure.collected ? '1' : '0.3';

        item.innerHTML = `
            <div class="treasure-icon">${treasure.icon}</div>
            <span style="font-size: 11px;">${treasure.name}</span>
        `;

        treasureListEl.appendChild(item);
    }
}

// ========================================
// レベルアップ
// ========================================
function checkLevelUp() {
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) {
        level = newLevel;
        updateUI();
        createParticles(player.x, player.y, 30, '#ffff00', 5);
    }
}

// ========================================
// ゲームオーバー
// ========================================
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalKills').textContent = kills;

    const collectedCount = Object.values(treasureCollection).filter(t => t.collected).length;
    document.getElementById('finalTreasures').textContent = collectedCount;

    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('bossHpBar').style.display = 'none';
}

// ========================================
// ゲームリスタート
// ========================================
function restartGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    kills = 0;

    bullets.length = 0;
    enemies.length = 0;
    bosses.length = 0;
    powerUps.length = 0;
    particles.length = 0;
    treasures.length = 0;
    obstacles.length = 0;

    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.weaponType = 'normal';
    player.fireRate = 250;
    player.invincible = false;

    for (const key in treasureCollection) {
        treasureCollection[key].collected = false;
    }

    generateMap();
    updateUI();
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('bossHpBar').style.display = 'none';
}

// ========================================
// ミニマップ描画
// ========================================
function drawMinimap() {
    const scaleX = minimapCanvas.width / WORLD_WIDTH;
    const scaleY = minimapCanvas.height / WORLD_HEIGHT;

    minimapCtx.fillStyle = '#000';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // 障害物
    minimapCtx.fillStyle = '#444';
    for (const obs of obstacles) {
        minimapCtx.fillRect(obs.x * scaleX, obs.y * scaleY, obs.width * scaleX, obs.height * scaleY);
    }

    // 敵
    minimapCtx.fillStyle = '#ff6666';
    for (const enemy of enemies) {
        minimapCtx.fillRect(enemy.x * scaleX - 1, enemy.y * scaleY - 1, 2, 2);
    }

    // ボス
    minimapCtx.fillStyle = '#ff0000';
    for (const boss of bosses) {
        minimapCtx.fillRect(boss.x * scaleX - 3, boss.y * scaleY - 3, 6, 6);
    }

    // 宝物
    minimapCtx.fillStyle = '#ffaa00';
    for (const treasure of treasures) {
        minimapCtx.fillRect(treasure.x * scaleX - 2, treasure.y * scaleY - 2, 4, 4);
    }

    // プレイヤー
    minimapCtx.fillStyle = '#00ffff';
    minimapCtx.fillRect(player.x * scaleX - 2, player.y * scaleY - 2, 4, 4);

    // 枠
    minimapCtx.strokeStyle = '#00ffff';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);
}

// ========================================
// 星空背景
// ========================================
const stars = [];
for (let i = 0; i < 200; i++) {
    stars.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: Math.random() * 2 + 0.5
    });
}

function drawStars() {
    stars.forEach(star => {
        const screen = worldToScreen(star.x, star.y);
        if (screen.x >= 0 && screen.x <= canvas.width &&
            screen.y >= 0 && screen.y <= canvas.height) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ========================================
// メインゲームループ
// ========================================
let lastSpawnTime = 0;
const spawnInterval = 2000;

function gameLoop() {
    // 背景クリア
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星空
    drawStars();

    // 障害物
    obstacles.forEach(obs => obs.draw());

    if (gameRunning) {
        player.update();
        updateCamera();

        // 弾の更新
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].update()) {
                bullets.splice(i, 1);
                continue;
            }

            // プレイヤーの弾が敵に当たる
            if (!bullets[i].fromEnemy) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    if (checkCollision(bullets[i], enemies[j])) {
                        bullets.splice(i, 1);
                        if (enemies[j].takeDamage(1)) {
                            score += enemies[j].scoreValue;
                            kills++;
                            updateUI();
                            checkLevelUp();

                            // ボス出現チェック
                            if (kills > 0 && kills % 20 === 0 && bosses.length === 0) {
                                spawnBoss();
                            }

                            if (Math.random() < 0.15) {
                                spawnPowerUp(enemies[j].x, enemies[j].y);
                            }

                            createParticles(enemies[j].x, enemies[j].y, 20, enemies[j].color, 4);
                            enemies.splice(j, 1);
                        }
                        break;
                    }
                }

                // ボスに当たる
                for (let j = bosses.length - 1; j >= 0; j--) {
                    if (bullets[i] && checkCollision(bullets[i], bosses[j])) {
                        bullets.splice(i, 1);
                        if (bosses[j].takeDamage(1)) {
                            score += bosses[j].scoreValue;
                            updateUI();

                            // ボスは武器アイテムを落とす
                            spawnPowerUp(bosses[j].x, bosses[j].y);

                            createParticles(bosses[j].x, bosses[j].y, 50, bosses[j].color, 6);
                            bosses.splice(j, 1);
                            document.getElementById('bossHpBar').style.display = 'none';
                        }
                        break;
                    }
                }
            } else {
                // 敵の弾がプレイヤーに当たる
                if (checkCollision(bullets[i], player)) {
                    bullets.splice(i, 1);
                    player.takeDamage(5);
                }
            }
        }

        // 敵の更新
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player);

            if (checkCollision(player, enemies[i])) {
                player.takeDamage(enemies[i].damage);
                createParticles(enemies[i].x, enemies[i].y, 15, enemies[i].color, 3);
                enemies.splice(i, 1);
            }
        }

        // ボスの更新
        for (let i = bosses.length - 1; i >= 0; i--) {
            bosses[i].update(player);

            if (checkCollision(player, bosses[i])) {
                player.takeDamage(bosses[i].damage);
            }

            // レーザー判定
            if (bosses[i].type === 'laser' && bosses[i].laserActive) {
                const dx = player.x - bosses[i].x;
                const dy = player.y - bosses[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angleDiff = Math.abs(Math.atan2(dy, dx) - bosses[i].laserAngle);

                if (dist < 600 && angleDiff < 0.05) {
                    player.takeDamage(1);
                }
            }
        }

        // 宝物の更新
        for (let i = treasures.length - 1; i >= 0; i--) {
            treasures[i].update();

            if (checkCollision(player, treasures[i])) {
                treasureCollection[treasures[i].type].collected = true;
                score += 100;
                createParticles(treasures[i].x, treasures[i].y, 20, treasures[i].data.color, 5);
                treasures.splice(i, 1);
                updateUI();
            }
        }

        // パワーアップの更新
        for (let i = powerUps.length - 1; i >= 0; i--) {
            if (!powerUps[i].update()) {
                powerUps.splice(i, 1);
                continue;
            }

            if (checkCollision(player, powerUps[i])) {
                if (powerUps[i].type === 'health') {
                    player.heal(30);
                } else {
                    // 武器変更
                    player.changeWeapon(powerUps[i].type);
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
        if (now - lastSpawnTime > spawnInterval / Math.max(1, level * 0.8) && enemies.length < 20) {
            spawnEnemy();
            lastSpawnTime = now;
        }
    }

    // 描画
    particles.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    bosses.forEach(b => b.draw());
    treasures.forEach(t => t.draw());
    powerUps.forEach(p => p.draw());
    player.draw();

    // ミニマップ
    drawMinimap();

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

    const world = screenToWorld(mouseX, mouseY);
    mouseWorldX = world.x;
    mouseWorldY = world.y;
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
generateMap();
updateUI();
gameLoop();
