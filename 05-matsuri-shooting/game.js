// ============================
// お祭り射的ゲーム v4
// 的30種 / マイナス的20種 / 15ステージ / 銃42種
// ============================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ========== 銃の定義（42種） ==========
// unlockLevel = 選んだステージがこの値以上なら使える
const GUNS = [
  // --- Lv1 (3種) ---
  { id: 'cork',       name: 'コルク銃',           emoji: '🔫', ammo: 10, power: 1.0,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: 'ふつうの射的銃',           unlockLevel: 1 },
  { id: 'rapid',      name: 'はやうち銃',         emoji: '💨', ammo: 20, power: 0.6,  spread: 3,  burst: 1,  piercing: false, explosive: 0,   desc: '弾が多いけど弱い',         unlockLevel: 1 },
  { id: 'heavy',      name: 'ヘビーガン',         emoji: '💪', ammo: 5,  power: 2.5,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '弾少ないけど超強い',       unlockLevel: 1 },
  // --- Lv2 (3種) ---
  { id: 'double',     name: 'ダブルショット',     emoji: '✌️',  ammo: 8,  power: 0.9,  spread: 15, burst: 2,  piercing: false, explosive: 0,   desc: '2発同時に飛ぶ！',          unlockLevel: 2 },
  { id: 'sniper',     name: 'スナイパー',         emoji: '🎯', ammo: 4,  power: 3.0,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '貫通する！でも弾少ない',   unlockLevel: 2 },
  { id: 'pistol',     name: 'ピストル',           emoji: '🔧', ammo: 12, power: 0.8,  spread: 2,  burst: 1,  piercing: false, explosive: 0,   desc: 'バランス型。使いやすい',   unlockLevel: 2 },
  // --- Lv3 (3種) ---
  { id: 'triple',     name: 'トリプルショット',   emoji: '🔱', ammo: 7,  power: 0.7,  spread: 20, burst: 3,  piercing: false, explosive: 0,   desc: '3方向に撃てる！',          unlockLevel: 3 },
  { id: 'magnum',     name: 'マグナム',           emoji: '🔥', ammo: 6,  power: 2.0,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '強くて弾もそこそこ',       unlockLevel: 3 },
  { id: 'pellet',     name: 'ペレットガン',       emoji: '🫘', ammo: 15, power: 0.5,  spread: 5,  burst: 1,  piercing: false, explosive: 0,   desc: '弾多めで練習向き',         unlockLevel: 3 },
  // --- Lv4 (3種) ---
  { id: 'laser',      name: 'レーザーガン',       emoji: '⚡', ammo: 6,  power: 1.8,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '一直線に貫通！',           unlockLevel: 4 },
  { id: 'scatter',    name: 'ばらまきガン',       emoji: '🎆', ammo: 5,  power: 0.5,  spread: 35, burst: 5,  piercing: false, explosive: 0,   desc: '5発ばらまく！',            unlockLevel: 4 },
  { id: 'musket',     name: 'マスケット',         emoji: '🏴', ammo: 3,  power: 3.5,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '昔の銃。超強いけど3発',    unlockLevel: 4 },
  // --- Lv5 (3種) ---
  { id: 'rocket',     name: 'ロケラン',           emoji: '🚀', ammo: 3,  power: 3.0,  spread: 0,  burst: 1,  piercing: false, explosive: 120, desc: '爆発で周りも巻き込む！',   unlockLevel: 5 },
  { id: 'gatling',    name: 'ガトリング',         emoji: '🌀', ammo: 40, power: 0.4,  spread: 8,  burst: 1,  piercing: false, explosive: 0,   desc: '超連射！でも弱い',         unlockLevel: 5 },
  { id: 'crossbow',   name: 'クロスボウ',         emoji: '🏹', ammo: 7,  power: 2.2,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '貫通＋強め！',             unlockLevel: 5 },
  // --- Lv6 (3種) ---
  { id: 'freeze',     name: 'フリーズガン',       emoji: '🧊', ammo: 8,  power: 0.8,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '当たると的が止まる！',     unlockLevel: 6, special: 'freeze' },
  { id: 'bouncer',    name: 'バウンスガン',       emoji: '🏀', ammo: 8,  power: 1.2,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '近くの的に連鎖ヒット！',   unlockLevel: 6, special: 'chain' },
  { id: 'shotgun',    name: 'ショットガン',       emoji: '💥', ammo: 6,  power: 0.8,  spread: 25, burst: 4,  piercing: false, explosive: 0,   desc: '4発近距離ばらまき！',      unlockLevel: 6 },
  // --- Lv7 (3種) ---
  { id: 'quad',       name: 'クアッドショット',   emoji: '✦',  ammo: 6,  power: 0.6,  spread: 30, burst: 4,  piercing: false, explosive: 0,   desc: '4方向に撃てる！',          unlockLevel: 7 },
  { id: 'railgun',    name: 'レールガン',         emoji: '🔷', ammo: 3,  power: 5.0,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '超強力貫通！3発だけ',      unlockLevel: 7 },
  { id: 'flamethr',   name: 'かえんほうしゃ',     emoji: '🔥', ammo: 30, power: 0.3,  spread: 12, burst: 1,  piercing: false, explosive: 0,   desc: '30発の炎！弱いけど楽しい', unlockLevel: 7 },
  // --- Lv8 (3種) ---
  { id: 'minigun',    name: 'ミニガン',           emoji: '⛓️',  ammo: 60, power: 0.3,  spread: 10, burst: 1,  piercing: false, explosive: 0,   desc: '60発！超ばらまき',         unlockLevel: 8 },
  { id: 'grenade',    name: 'グレネード',         emoji: '🧨', ammo: 4,  power: 2.5,  spread: 0,  burst: 1,  piercing: false, explosive: 150, desc: '大爆発！範囲広い',         unlockLevel: 8 },
  { id: 'dualwield',  name: '二丁拳銃',           emoji: '🤠', ammo: 14, power: 0.7,  spread: 10, burst: 2,  piercing: false, explosive: 0,   desc: '両手で2発！弾も多い',      unlockLevel: 8 },
  // --- Lv9 (3種) ---
  { id: 'cannon',     name: 'たいほう',           emoji: '💣', ammo: 2,  power: 6.0,  spread: 0,  burst: 1,  piercing: false, explosive: 180, desc: '2発だけ。超特大爆発！',    unlockLevel: 9 },
  { id: 'boomerang',  name: 'ブーメランガン',     emoji: '🪃', ammo: 8,  power: 1.0,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '貫通して戻ってくる！',     unlockLevel: 9 },
  { id: 'pentashot',  name: 'ペンタショット',     emoji: '⛤',  ammo: 5,  power: 0.6,  spread: 40, burst: 5,  piercing: false, explosive: 0,   desc: '5方向の星型！',            unlockLevel: 9 },
  // --- Lv10 (3種) ---
  { id: 'plasma',     name: 'プラズマキャノン',   emoji: '🟣', ammo: 5,  power: 3.5,  spread: 0,  burst: 1,  piercing: true,  explosive: 80,  desc: '貫通＋爆発！',             unlockLevel: 10 },
  { id: 'storm',      name: 'ストームガン',       emoji: '🌪️', ammo: 4,  power: 0.8,  spread: 45, burst: 8,  piercing: false, explosive: 0,   desc: '8発嵐のように！',          unlockLevel: 10 },
  { id: 'electro',    name: 'エレキガン',         emoji: '⚡', ammo: 10, power: 1.0,  spread: 0,  burst: 1,  piercing: false, explosive: 0,   desc: '当てると周り3体に連鎖！',  unlockLevel: 10, special: 'chain' },
  // --- Lv11 (3種) ---
  { id: 'bazooka',    name: 'バズーカ',           emoji: '🎇', ammo: 2,  power: 4.0,  spread: 0,  burst: 1,  piercing: false, explosive: 200, desc: '超広範囲爆発！2発だけ',    unlockLevel: 11 },
  { id: 'ninja',      name: 'にんじゃガン',       emoji: '🥷', ammo: 12, power: 1.5,  spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '手裏剣！貫通＋弾多め',     unlockLevel: 11 },
  { id: 'hexashot',   name: 'ヘキサショット',     emoji: '🔯', ammo: 4,  power: 0.5,  spread: 50, burst: 6,  piercing: false, explosive: 0,   desc: '6方向同時！',              unlockLevel: 11 },
  // --- Lv12 (2種) ---
  { id: 'golden',     name: 'ゴールデンガン',     emoji: '👑', ammo: 1,  power: 10,   spread: 0,  burst: 1,  piercing: true,  explosive: 0,   desc: '一撃必殺。弾は1発だけ。',  unlockLevel: 12 },
  { id: 'iceage',     name: 'アイスエイジ',       emoji: '❄️',  ammo: 5,  power: 1.5,  spread: 20, burst: 3,  piercing: false, explosive: 0,   desc: '3発フリーズ弾！',          unlockLevel: 12, special: 'freeze' },
  // --- Lv13 (3種) ---
  { id: 'antimatter', name: 'アンチマター',       emoji: '🕳️', ammo: 2,  power: 8.0,  spread: 0,  burst: 1,  piercing: true,  explosive: 100, desc: '貫通＋爆発＋超威力！',     unlockLevel: 13 },
  { id: 'meteor',     name: 'メテオガン',         emoji: '☄️',  ammo: 3,  power: 2.0,  spread: 0,  burst: 1,  piercing: false, explosive: 250, desc: '隕石級の爆発範囲！',       unlockLevel: 13 },
  { id: 'octoshot',   name: 'オクトショット',     emoji: '🐙', ammo: 3,  power: 0.7,  spread: 55, burst: 8,  piercing: false, explosive: 0,   desc: '8方向タコ足攻撃！',       unlockLevel: 13 },
  // --- Lv14 (2種) ---
  { id: 'supernova',  name: 'スーパーノヴァ',     emoji: '💫', ammo: 1,  power: 5.0,  spread: 0,  burst: 1,  piercing: true,  explosive: 300, desc: '画面全体爆発！1発だけ',    unlockLevel: 14 },
  { id: 'hypergate',  name: 'ハイパーガトリング', emoji: '🔩', ammo: 80, power: 0.3,  spread: 12, burst: 1,  piercing: false, explosive: 0,   desc: '80発！弾幕を張れ！',       unlockLevel: 14 },
  // --- Lv15 (2種) ---
  { id: 'ultimate',   name: 'アルティメット',     emoji: '🌟', ammo: 3,  power: 5.0,  spread: 25, burst: 5,  piercing: true,  explosive: 100, desc: '全部入り。最強。',         unlockLevel: 15 },
  { id: 'galaxy',     name: 'ギャラクシー',       emoji: '🌌', ammo: 2,  power: 6.0,  spread: 60, burst: 10, piercing: true,  explosive: 50,  desc: '10発貫通＋爆発！宇宙最強', unlockLevel: 15 },
];

// ========== 的（ターゲット 30種） ==========
const TARGETS_GOOD = [
  // --- LOW（かんたん・大きい・止まってる）---
  { emoji: '🎯', name: 'ふつうの的',       points: 30,   size: 52, weight: 1, baseSpeed: 0,   tier: 'low' },
  { emoji: '🔴', name: '赤まと',           points: 50,   size: 48, weight: 1, baseSpeed: 0,   tier: 'low' },
  { emoji: '🟡', name: '黄まと',           points: 70,   size: 46, weight: 1, baseSpeed: 0,   tier: 'low' },
  { emoji: '🟢', name: '緑まと',           points: 80,   size: 44, weight: 2, baseSpeed: 0.3, tier: 'low' },
  { emoji: '🟤', name: '茶まと',           points: 60,   size: 50, weight: 2, baseSpeed: 0,   tier: 'low' },
  { emoji: '⬜', name: '白まと',           points: 40,   size: 55, weight: 1, baseSpeed: 0,   tier: 'low' },
  { emoji: '🫧', name: 'バブルまと',       points: 90,   size: 42, weight: 0, baseSpeed: 0.4, tier: 'low' },
  // --- MID（中くらい・ちょっと動く）---
  { emoji: '🔵', name: '青まと',           points: 120,  size: 40, weight: 2, baseSpeed: 0.6, tier: 'mid' },
  { emoji: '🟣', name: '紫まと',           points: 150,  size: 38, weight: 2, baseSpeed: 0.8, tier: 'mid' },
  { emoji: '🟠', name: 'オレンジまと',     points: 180,  size: 36, weight: 3, baseSpeed: 1.0, tier: 'mid' },
  { emoji: '💠', name: 'ダイヤまと',       points: 200,  size: 34, weight: 3, baseSpeed: 1.0, tier: 'mid' },
  { emoji: '🪙', name: 'コインまと',       points: 220,  size: 30, weight: 2, baseSpeed: 1.2, tier: 'mid' },
  { emoji: '🔶', name: 'ひしがたまと',     points: 170,  size: 35, weight: 3, baseSpeed: 0.9, tier: 'mid' },
  { emoji: '🏵️', name: 'はなまと',         points: 250,  size: 32, weight: 3, baseSpeed: 1.3, tier: 'mid' },
  { emoji: '🫠', name: 'とろけるまと',     points: 160,  size: 38, weight: 1, baseSpeed: 1.5, tier: 'mid' },
  // --- HIGH（レア・小さい・速い）---
  { emoji: '⭐', name: 'スターまと',       points: 300,  size: 28, weight: 4, baseSpeed: 1.8, tier: 'high' },
  { emoji: '🌙', name: '月まと',           points: 350,  size: 26, weight: 4, baseSpeed: 2.0, tier: 'high' },
  { emoji: '☀️', name: '太陽まと',         points: 400,  size: 25, weight: 4, baseSpeed: 2.2, tier: 'high' },
  { emoji: '🪐', name: 'わくせいまと',     points: 450,  size: 24, weight: 5, baseSpeed: 2.5, tier: 'high' },
  { emoji: '🔮', name: 'クリスタルまと',   points: 500,  size: 23, weight: 5, baseSpeed: 2.5, tier: 'high' },
  { emoji: '❤️‍🔥', name: 'ハートまと',     points: 380,  size: 27, weight: 3, baseSpeed: 2.8, tier: 'high' },
  { emoji: '🦋', name: 'ちょうちょまと',   points: 420,  size: 22, weight: 2, baseSpeed: 3.0, tier: 'high' },
  // --- ULTRA（激レア・超小さい・超速い・超重い）---
  { emoji: '💎', name: 'ダイヤモンドまと', points: 700,  size: 20, weight: 6, baseSpeed: 3.0, tier: 'ultra' },
  { emoji: '🌈', name: 'にじまと',         points: 900,  size: 18, weight: 6, baseSpeed: 3.5, tier: 'ultra' },
  { emoji: '👑', name: 'キングまと',       points: 1200, size: 16, weight: 7, baseSpeed: 4.0, tier: 'ultra' },
  { emoji: '🌌', name: 'ギャラクシーまと', points: 1500, size: 15, weight: 7, baseSpeed: 4.5, tier: 'ultra' },
  { emoji: '🔱', name: 'トライデントまと', points: 1000, size: 18, weight: 6, baseSpeed: 3.8, tier: 'ultra' },
  { emoji: '🎭', name: 'ミステリーまと',   points: 800,  size: 20, weight: 5, baseSpeed: 4.0, tier: 'ultra' },
  { emoji: '☄️', name: 'いんせきまと',     points: 2000, size: 14, weight: 8, baseSpeed: 5.0, tier: 'ultra' },
  { emoji: '✨', name: 'きせきのまと',     points: 3000, size: 12, weight: 9, baseSpeed: 5.5, tier: 'ultra' },
];

// ========== マイナス的（撃つと減点！ 20種） ==========
const TARGETS_BAD = [
  // 人
  { emoji: '👦', name: 'おきゃくさん',   points: -200,  size: 45, weight: 1, baseSpeed: 1.0, desc: '撃っちゃダメ！' },
  { emoji: '👧', name: 'おんなのこ',     points: -200,  size: 42, weight: 1, baseSpeed: 1.2, desc: '撃っちゃダメ！' },
  { emoji: '👴', name: 'おじいちゃん',   points: -250,  size: 48, weight: 2, baseSpeed: 0.5, desc: 'こらー！' },
  { emoji: '👶', name: 'あかちゃん',     points: -400,  size: 35, weight: 1, baseSpeed: 0.8, desc: 'うわーん！' },
  { emoji: '👩', name: 'おかあさん',     points: -300,  size: 44, weight: 2, baseSpeed: 0.7, desc: 'なにしてるの！' },
  { emoji: '🧑‍🍳', name: 'コックさん',   points: -220,  size: 42, weight: 2, baseSpeed: 0.9, desc: '料理中だよ！' },
  // 動物
  { emoji: '🐱', name: 'ねこ',           points: -150,  size: 35, weight: 1, baseSpeed: 2.0, desc: 'にゃーん！' },
  { emoji: '🐶', name: 'いぬ',           points: -150,  size: 38, weight: 1, baseSpeed: 1.8, desc: 'わん！' },
  { emoji: '🐦', name: 'ことり',         points: -120,  size: 30, weight: 0, baseSpeed: 2.5, desc: 'ピヨッ！' },
  { emoji: '🐰', name: 'うさぎ',         points: -180,  size: 32, weight: 1, baseSpeed: 2.2, desc: 'ぴょん！' },
  { emoji: '🐹', name: 'ハムスター',     points: -130,  size: 28, weight: 0, baseSpeed: 2.8, desc: 'キュッ！' },
  { emoji: '🦊', name: 'きつね',         points: -170,  size: 34, weight: 1, baseSpeed: 2.0, desc: 'コンッ！' },
  // もの
  { emoji: '🎈', name: 'ふうせん',       points: -100,  size: 40, weight: 0, baseSpeed: 0.5, desc: 'パーン！' },
  { emoji: '💣', name: 'ばくだん',       points: -300,  size: 32, weight: 3, baseSpeed: 0,   desc: 'ドカーン！' },
  { emoji: '🌸', name: 'さくら',         points: -80,   size: 38, weight: 0, baseSpeed: 0.3, desc: 'きれいなのに…' },
  { emoji: '🧁', name: 'カップケーキ',   points: -180,  size: 34, weight: 1, baseSpeed: 0,   desc: 'もったいない！' },
  { emoji: '☂️',  name: 'かさ',           points: -160,  size: 40, weight: 1, baseSpeed: 0.6, desc: '雨がふるよ！' },
  { emoji: '🎁', name: 'プレゼント',     points: -250,  size: 36, weight: 2, baseSpeed: 0,   desc: 'だれかのだよ！' },
  { emoji: '📱', name: 'スマホ',         points: -350,  size: 30, weight: 1, baseSpeed: 0.4, desc: 'こわれた！弁償！' },
  { emoji: '🍰', name: 'ケーキ',         points: -200,  size: 38, weight: 1, baseSpeed: 0,   desc: 'ぐちゃっ！' },
];

// ========== レベル定義（15ステージ） ==========
const LEVELS = [
  { level: 1,  name: 'はじめての射的',       time: 35, penaltyRate: 0.03, speedMul: 1.0, targetCount: [4,4,5], clearScore: 400,   movingRate: 0.05, refillSec: 10 },
  { level: 2,  name: 'ちょっと動くよ',       time: 35, penaltyRate: 0.08, speedMul: 1.1, targetCount: [4,5,5], clearScore: 600,   movingRate: 0.15, refillSec: 10 },
  { level: 3,  name: 'にぎやかな射的場',     time: 33, penaltyRate: 0.12, speedMul: 1.2, targetCount: [4,5,6], clearScore: 900,   movingRate: 0.25, refillSec: 9 },
  { level: 4,  name: '的がはやい！',         time: 33, penaltyRate: 0.15, speedMul: 1.4, targetCount: [5,5,6], clearScore: 1200,  movingRate: 0.35, refillSec: 9 },
  { level: 5,  name: 'おまつりベテラン',     time: 30, penaltyRate: 0.18, speedMul: 1.6, targetCount: [5,6,6], clearScore: 1600,  movingRate: 0.40, refillSec: 8 },
  { level: 6,  name: 'ニセモノに注意',       time: 30, penaltyRate: 0.22, speedMul: 1.8, targetCount: [5,6,7], clearScore: 2000,  movingRate: 0.45, refillSec: 8 },
  { level: 7,  name: 'ハイスピード',         time: 28, penaltyRate: 0.24, speedMul: 2.0, targetCount: [5,6,7], clearScore: 2500,  movingRate: 0.55, refillSec: 7 },
  { level: 8,  name: 'カオスな射的場',       time: 28, penaltyRate: 0.27, speedMul: 2.2, targetCount: [6,6,7], clearScore: 3000,  movingRate: 0.60, refillSec: 7 },
  { level: 9,  name: '暗闇の射的',           time: 26, penaltyRate: 0.28, speedMul: 2.4, targetCount: [6,7,7], clearScore: 3500,  movingRate: 0.65, refillSec: 6 },
  { level: 10, name: 'ゴッドハンド',         time: 26, penaltyRate: 0.30, speedMul: 2.6, targetCount: [6,7,8], clearScore: 4200,  movingRate: 0.70, refillSec: 6 },
  { level: 11, name: '地獄の射的場',         time: 25, penaltyRate: 0.33, speedMul: 2.8, targetCount: [6,7,8], clearScore: 5000,  movingRate: 0.75, refillSec: 5 },
  { level: 12, name: '鬼レベル',             time: 25, penaltyRate: 0.35, speedMul: 3.0, targetCount: [7,7,8], clearScore: 6000,  movingRate: 0.80, refillSec: 5 },
  { level: 13, name: '超人の領域',           time: 23, penaltyRate: 0.37, speedMul: 3.3, targetCount: [7,8,8], clearScore: 7500,  movingRate: 0.85, refillSec: 4 },
  { level: 14, name: '伝説の射的師',         time: 23, penaltyRate: 0.40, speedMul: 3.6, targetCount: [7,8,9], clearScore: 9000,  movingRate: 0.90, refillSec: 4 },
  { level: 15, name: '∞ エンドレス',        time: 45, penaltyRate: 0.42, speedMul: 4.0, targetCount: [8,8,9], clearScore: 99999, movingRate: 0.95, refillSec: 3 },
];

// ========== ゲーム状態 ==========
let score = 0;
let totalScore = 0;
let bullets = 10;
let maxBullets = 10;
let timeLeft = 30;
let gameRunning = false;
let timerInterval = null;
let refillInterval = null;
let targets = [];
let particles = [];
let shotEffects = [];
let hitTexts = [];
let shelves = [];
let currentLevel = 1;
let currentGun = GUNS[0];
let combo = 0;
let maxCombo = 0;
let screenShake = 0;
let unlockedLevel = Number(localStorage.getItem('matsuri_unlocked') || '1');

// ========== 音声 ==========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playShot() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const p = currentGun.power;
  osc.type = p > 2 ? 'sawtooth' : 'square';
  osc.frequency.setValueAtTime(150 + p * 50, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1 + p * 0.03);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}

function playHit() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800 + combo * 50, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1400 + combo * 80, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playPenalty() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150 - i * 30, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    }, i * 50);
  }
}

function playEmpty() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(100, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playReload() {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    }, i * 60);
  }
}

function playExplosion() {
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  source.connect(gain); gain.connect(audioCtx.destination);
  source.start();
}

function playFreeze() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.25);
}

function playSelect() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playLocked() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}

function playFanfare() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }, i * 120);
  });
}

function playUnlock() {
  const notes = [440, 554, 659, 880, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    }, i * 80);
  });
}

function playGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }, i * 150);
  });
}

function playStartGame() {
  const notes = [330, 440, 554, 660];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    }, i * 60);
  });
}

// ========== キャンバス ==========
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// ========== タイトル画面 ==========
function buildTitle() {
  // レベル選択
  const levelList = document.getElementById('level-list');
  levelList.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const lvLocked = lv.level > unlockedLevel;
    const btn = document.createElement('div');
    btn.className = 'level-btn' + (currentLevel === lv.level ? ' selected' : '') + (lvLocked ? ' locked' : '');
    if (lvLocked) {
      btn.innerHTML = `
        <span class="lv-num">🔒</span>
        <span class="lv-name">${lv.name}</span>
      `;
      btn.onclick = () => { audioCtx.resume(); playLocked(); };
    } else {
      btn.innerHTML = `
        <span class="lv-num">${lv.level}</span>
        <span class="lv-name">${lv.name}</span>
      `;
      btn.onclick = () => { audioCtx.resume(); playSelect(); currentLevel = lv.level; buildTitle(); };
    }
    levelList.appendChild(btn);
  });

  // 選んだレベルでロックされた銃なら、コルク銃にリセット
  if (currentGun.unlockLevel > currentLevel) {
    currentGun = GUNS[0];
  }

  // 銃リスト
  const gunList = document.getElementById('gun-list');
  gunList.innerHTML = '';
  GUNS.forEach(gun => {
    const locked = gun.unlockLevel > currentLevel;
    const btn = document.createElement('div');
    btn.className = 'gun-btn' + (gun.id === currentGun.id ? ' selected' : '') + (locked ? ' locked' : '');
    btn.innerHTML = `
      <span class="gun-emoji">${locked ? '🔒' : gun.emoji}</span>
      <span class="gun-name">${gun.name}</span>
      <span class="gun-stat">${locked ? 'Lv.' + gun.unlockLevel + ' で解放' : gun.desc}</span>
    `;
    if (!locked) {
      btn.onclick = () => { audioCtx.resume(); playSelect(); currentGun = gun; buildTitle(); };
    } else {
      btn.onclick = () => { audioCtx.resume(); playLocked(); };
    }
    gunList.appendChild(btn);
  });
}

// ========== 棚 ==========
function createShelves() {
  shelves = [];
  const h = canvas.height;
  for (let i = 0; i < 3; i++) {
    shelves.push({ y: h * 0.28 + i * (h * 0.22), height: 8 });
  }
}

// ========== 的の生成 ==========
function createTargets() {
  targets = [];
  fillTargets();
}

function fillTargets() {
  const lvData = LEVELS[currentLevel - 1];

  shelves.forEach((shelf, shelfIdx) => {
    const count = lvData.targetCount[shelfIdx] || 5;
    const spacing = canvas.width / (count + 1);

    // この段に今いる生きてる的の数
    const aliveOnShelf = targets.filter(t => t.shelfIdx === shelfIdx && t.alive && !t.falling).length;
    const needed = count - aliveOnShelf;
    if (needed <= 0) return;

    // 空いてるスロットを見つける
    const usedX = targets.filter(t => t.shelfIdx === shelfIdx && t.alive && !t.falling).map(t => t.baseX);

    for (let i = 0; i < count && targets.filter(t => t.shelfIdx === shelfIdx && t.alive && !t.falling).length < count; i++) {
      const slotX = spacing * (i + 1);
      // このスロット付近に的がいるかチェック
      const occupied = usedX.some(ux => Math.abs(ux - slotX) < spacing * 0.4);
      if (occupied) continue;

      const isPenalty = Math.random() < lvData.penaltyRate;
      let data;
      if (isPenalty) {
        data = TARGETS_BAD[Math.floor(Math.random() * TARGETS_BAD.length)];
      } else {
        let pool;
        if (shelfIdx === 0) pool = TARGETS_GOOD.filter(p => p.tier === 'high' || p.tier === 'ultra');
        else if (shelfIdx === 1) pool = TARGETS_GOOD.filter(p => p.tier === 'mid' || p.tier === 'high');
        else pool = TARGETS_GOOD.filter(p => p.tier === 'low' || p.tier === 'mid');
        data = pool[Math.floor(Math.random() * pool.length)];
      }

      const forceMoving = Math.random() < lvData.movingRate;
      const spd = (data.baseSpeed || 0) * lvData.speedMul + (forceMoving && !data.baseSpeed ? 0.8 * lvData.speedMul : 0);

      targets.push({
        x: slotX, y: shelf.y - data.size / 2 - 8,
        baseX: slotX, size: data.size,
        emoji: data.emoji, name: data.name, points: data.points,
        weight: data.weight || 1, speed: spd,
        phase: Math.random() * Math.PI * 2,
        alive: true, falling: false,
        fallVelX: 0, fallVelY: 0,
        fallRotation: 0, fallRotSpeed: 0,
        opacity: 1, shelfIdx, isPenalty: isPenalty,
        hitCount: 0, desc: data.desc || '',
        frozen: false, frozenTimer: 0,
        tier: data.tier || null,
        spawnAnim: 1.0,
      });
    }
  });
}

// ========== エフェクト ==========
function addShotEffect(x, y) {
  const count = currentGun.power > 2 ? 10 : 6;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    shotEffects.push({ x, y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, life: 1, color: '#ffdd44' });
  }
}

function addHitParticles(x, y, color, cnt) {
  for (let i = 0; i < (cnt || 15); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 1, color: color || '#ffdd44', size: 2 + Math.random() * 4 });
  }
}

function addExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3, life: 1, color: ['#ff4444','#ff8800','#ffdd00'][Math.floor(Math.random()*3)], size: 3 + Math.random() * 6 });
  }
}

function addHitText(x, y, pts, customText) {
  const text = customText || (pts >= 0 ? `+${pts}` : `${pts}`);
  hitTexts.push({ x, y, text, life: 1, vy: -2, isPenalty: pts < 0 });
}

// ========== 射撃ロジック ==========
function shoot(mx, my) {
  if (!gameRunning) return;
  if (bullets <= 0) { playEmpty(); return; }

  bullets--;
  document.getElementById('bullets').textContent = bullets;
  playShot();

  // burst
  const burstAngles = [];
  if (currentGun.burst === 1) {
    burstAngles.push(0);
  } else {
    const totalSpread = currentGun.spread * (Math.PI / 180);
    for (let b = 0; b < currentGun.burst; b++) {
      burstAngles.push(-totalSpread / 2 + (totalSpread / (currentGun.burst - 1)) * b);
    }
  }

  const spreadRad = currentGun.spread * (Math.PI / 180);

  burstAngles.forEach(bAngle => {
    let hitX, hitY;
    if (currentGun.burst === 1) {
      hitX = mx + (Math.random() - 0.5) * spreadRad * 30;
      hitY = my + (Math.random() - 0.5) * spreadRad * 30;
    } else {
      const offX = Math.sin(bAngle) * 50;
      const offY = -Math.cos(bAngle) * 50;
      hitX = mx + offX + (Math.random() - 0.5) * spreadRad * 15;
      hitY = my + offY + (Math.random() - 0.5) * spreadRad * 15;
    }

    addShotEffect(hitX, hitY);
    checkHit(hitX, hitY);
  });

  // 爆発系
  if (currentGun.explosive > 0) {
    screenShake = 12;
    playExplosion();
    addExplosion(mx, my);
    targets.forEach(t => {
      if (!t.alive || t.falling) return;
      const dx = mx - t.x, dy = my - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < currentGun.explosive) {
        applyHit(t, currentGun.power * (1 - dist / currentGun.explosive));
      }
    });
  }

  if (bullets <= 0) {
    document.getElementById('reload-hint').classList.remove('hidden');
  }
}

function checkHit(hx, hy) {
  let hitSomething = false;
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    if (!t.alive || t.falling) continue;
    const dx = hx - t.x, dy = hy - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < t.size * 0.6) {
      applyHit(t, currentGun.power);
      hitSomething = true;

      // チェインヒット
      if (currentGun.special === 'chain' && !t.isPenalty) {
        let chainCount = 0;
        targets.forEach(t2 => {
          if (t2 === t || !t2.alive || t2.falling || t2.isPenalty) return;
          const d = Math.sqrt((t.x - t2.x) ** 2 + (t.y - t2.y) ** 2);
          if (d < 150 && chainCount < 2) {
            chainCount++;
            setTimeout(() => applyHit(t2, currentGun.power * 0.6), chainCount * 100);
          }
        });
      }

      if (!currentGun.piercing) break;
    }
  }
  if (!hitSomething) {
    combo = 0;
    updateComboDisplay();
  }
}

function applyHit(t, power) {
  t.hitCount++;

  if (t.isPenalty) {
    score += t.points;
    combo = 0;
    playPenalty();
    screenShake = 8;
    addHitParticles(t.x, t.y, '#ff2222', 20);
    addHitText(t.x, t.y - 20, t.points);
    t.falling = true;
    t.fallVelX = (Math.random() - 0.5) * 4;
    t.fallVelY = -2;
    t.fallRotSpeed = (Math.random() - 0.5) * 0.3;
  } else {
    // フリーズ特殊効果
    if (currentGun.special === 'freeze' && !t.frozen) {
      t.frozen = true;
      t.frozenTimer = 180; // 3秒
      t.speed = 0;
      playFreeze();
      addHitParticles(t.x, t.y, '#88ddff', 10);
    }

    const knockPower = power * 2.5 - t.weight + Math.random() * 2 + t.hitCount * 0.5;
    if (knockPower > 2.5) {
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      const comboBonus = Math.floor(t.points * combo * 0.1);
      const totalPts = t.points + comboBonus;
      score += totalPts;
      t.falling = true;
      t.fallVelX = (Math.random() - 0.5) * 4;
      t.fallVelY = -3 - Math.random() * 2;
      t.fallRotSpeed = (Math.random() - 0.5) * 0.3;
      playHit();
      addHitParticles(t.x, t.y, '#44ff88', 15);
      addHitText(t.x, t.y - 20, totalPts);
      if (combo >= 3) {
        addHitText(t.x, t.y - 45, 0, `🔥${combo}COMBO!`);
      }
    } else {
      t.x += (Math.random() - 0.5) * 15;
      t.y -= 3;
      score += 10;
      addHitParticles(t.x, t.y, '#ff8844', 8);
      addHitText(t.x, t.y - 20, 10);
    }
  }
  document.getElementById('score').textContent = Math.max(0, score);
  updateComboDisplay();
}

function updateComboDisplay() {
  const el = document.getElementById('combo-display');
  const numEl = document.getElementById('combo');
  if (combo >= 2) { el.classList.remove('hidden'); numEl.textContent = combo; }
  else { el.classList.add('hidden'); }
}

// ========== リロード ==========
function reload() {
  if (bullets <= 0 && gameRunning) {
    bullets = maxBullets;
    document.getElementById('bullets').textContent = bullets;
    document.getElementById('reload-hint').classList.add('hidden');
    playReload();
  }
}

// ========== 描画 ==========
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0520');
  grad.addColorStop(0.4, '#1a0a3e');
  grad.addColorStop(1, '#2a1520');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 提灯
  const lanternCount = Math.floor(canvas.width / 100);
  for (let i = 0; i < lanternCount; i++) {
    const lx = 50 + i * 100;
    const sway = Math.sin(Date.now() * 0.001 + i) * 5;
    ctx.strokeStyle = '#553322'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (i > 0) { ctx.moveTo(lx - 50, 20); ctx.quadraticCurveTo(lx, 35 + sway, lx + 50, 20); }
    ctx.stroke();

    const color = i % 2 === 0 ? '#ff4433' : '#ffdd44';
    const glowColor = i % 2 === 0 ? 'rgba(255,68,51,0.3)' : 'rgba(255,221,68,0.3)';
    ctx.save();
    ctx.translate(lx, 45 + sway);
    const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
    glowGrad.addColorStop(0, glowColor); glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad; ctx.fillRect(-30, -30, 60, 60);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    for (let j = -12; j <= 12; j += 6) { ctx.beginPath(); ctx.moveTo(j, -15); ctx.lineTo(j, 15); ctx.stroke(); }
    ctx.restore();
  }
}

function drawShelves() {
  shelves.forEach(shelf => {
    const g = ctx.createLinearGradient(0, shelf.y - 4, 0, shelf.y + shelf.height);
    g.addColorStop(0, '#8B6914'); g.addColorStop(0.5, '#A0822A'); g.addColorStop(1, '#6B4E0A');
    ctx.fillStyle = g;
    ctx.fillRect(30, shelf.y, canvas.width - 60, shelf.height);
    ctx.fillStyle = 'rgba(255,255,200,0.15)';
    ctx.fillRect(30, shelf.y, canvas.width - 60, 2);
  });
}

// 的のティア別グロー色
const TIER_GLOW = {
  low:   { color: 'rgba(100,255,100,0.35)', ring: '#44cc44' },
  mid:   { color: 'rgba(80,150,255,0.4)',   ring: '#4488ff' },
  high:  { color: 'rgba(255,180,50,0.45)',  ring: '#ffaa22' },
  ultra: { color: 'rgba(255,50,200,0.5)',    ring: '#ff44cc' },
};

function drawTargets() {
  targets.forEach(t => {
    if (!t.alive && !t.falling) return;
    ctx.save();

    // 登場アニメ
    if (t.spawnAnim > 0) {
      const s = 1 - t.spawnAnim;
      ctx.globalAlpha = s;
      if (t.falling) {
        ctx.globalAlpha = t.opacity * s;
      }
    }

    if (t.falling) {
      ctx.globalAlpha = t.opacity;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.fallRotation);
    } else {
      if (t.speed > 0 && !t.frozen) {
        t.x = t.baseX + Math.sin(Date.now() * 0.002 * t.speed + t.phase) * 40;
      }
      ctx.translate(t.x, t.y);
    }

    // マイナス的は赤い光（濃く）
    if (t.isPenalty && !t.falling) {
      const warn = ctx.createRadialGradient(0, 0, t.size * 0.2, 0, 0, t.size * 1.0);
      warn.addColorStop(0, 'rgba(255,0,0,0.3)'); warn.addColorStop(1, 'transparent');
      ctx.fillStyle = warn;
      ctx.fillRect(-t.size * 1.2, -t.size * 1.2, t.size * 2.4, t.size * 2.4);
      // 赤リング
      ctx.strokeStyle = 'rgba(255,50,50,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, t.size * 0.55, 0, Math.PI * 2); ctx.stroke();
    }

    // 良い的のティア別グロー（濃い色の光）
    if (!t.isPenalty && !t.falling && t.tier) {
      const glow = TIER_GLOW[t.tier];
      if (glow) {
        const g = ctx.createRadialGradient(0, 0, t.size * 0.15, 0, 0, t.size * 0.9);
        g.addColorStop(0, glow.color); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(-t.size, -t.size, t.size * 2, t.size * 2);
        // ティアリング
        ctx.strokeStyle = glow.ring;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * (0.4 + Math.sin(Date.now() * 0.004) * 0.2);
        ctx.beginPath(); ctx.arc(0, 0, t.size * 0.55, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = t.falling ? t.opacity : (t.spawnAnim > 0 ? 1 - t.spawnAnim : 1);
      }
    }

    // フリーズ中は青い光
    if (t.frozen && !t.falling) {
      const fGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, t.size * 0.7);
      fGrad.addColorStop(0, 'rgba(100,200,255,0.35)'); fGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fGrad;
      ctx.fillRect(-t.size, -t.size, t.size * 2, t.size * 2);
    }

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(2, t.size * 0.4, t.size * 0.4, 5, 0, 0, Math.PI * 2); ctx.fill();

    // 絵文字（少し大きく）
    ctx.font = `${Math.round(t.size * 1.1)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.emoji, 0, 0);

    // ラベル（太字で濃く）
    if (!t.falling) {
      ctx.font = 'bold 12px sans-serif';
      if (t.isPenalty) {
        ctx.fillStyle = '#ff3333';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
        ctx.strokeText('✕ ダメ！', 0, t.size * 0.55 + 12);
        ctx.fillText('✕ ダメ！', 0, t.size * 0.55 + 12);
      } else {
        const ptColors = { low: '#66ff66', mid: '#66aaff', high: '#ffcc33', ultra: '#ff66dd' };
        ctx.fillStyle = ptColors[t.tier] || '#ffdd44';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
        ctx.strokeText(`${t.points}pt`, 0, t.size * 0.55 + 12);
        ctx.fillText(`${t.points}pt`, 0, t.size * 0.55 + 12);
      }
    }
    ctx.restore();
  });
}

function drawEffects() {
  shotEffects.forEach(e => {
    ctx.globalAlpha = e.life; ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, 3 * e.life, 0, Math.PI * 2); ctx.fill();
  });
  particles.forEach(p => {
    ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
  });
  hitTexts.forEach(h => {
    ctx.globalAlpha = h.life;
    ctx.font = h.text.includes('COMBO') ? 'bold 28px sans-serif' : 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = h.isPenalty ? '#ff2222' : (h.text.includes('COMBO') ? '#ff44aa' : '#44ff88');
    if (h.text === '+10') ctx.fillStyle = '#ff8844';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3;
    ctx.strokeText(h.text, h.x, h.y); ctx.fillText(h.text, h.x, h.y);
  });
  ctx.globalAlpha = 1;

  if (screenShake > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${screenShake * 0.02})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

let mouseX = 0, mouseY = 0;

function drawCrosshair() {
  if (!gameRunning) return;
  const active = bullets > 0;
  ctx.strokeStyle = active ? 'rgba(255,50,50,0.8)' : 'rgba(100,100,100,0.5)';
  ctx.lineWidth = 2;
  const sz = currentGun.burst >= 5 ? 35 : currentGun.piercing ? 30 : 20;
  ctx.beginPath(); ctx.arc(mouseX, mouseY, sz, 0, Math.PI * 2); ctx.stroke();

  if (currentGun.burst > 1) {
    const ts = currentGun.spread * (Math.PI / 180);
    ctx.globalAlpha = 0.3;
    for (let b = 0; b < currentGun.burst; b++) {
      const a = -ts / 2 + (ts / (currentGun.burst - 1)) * b;
      ctx.beginPath(); ctx.arc(mouseX + Math.sin(a) * 50, mouseY - Math.cos(a) * 50, 8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 爆発範囲プレビュー
  if (currentGun.explosive > 0) {
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(mouseX, mouseY, currentGun.explosive, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  const len = 28, gap = 8;
  ctx.beginPath();
  ctx.moveTo(mouseX - len, mouseY); ctx.lineTo(mouseX - gap, mouseY);
  ctx.moveTo(mouseX + gap, mouseY); ctx.lineTo(mouseX + len, mouseY);
  ctx.moveTo(mouseX, mouseY - len); ctx.lineTo(mouseX, mouseY - gap);
  ctx.moveTo(mouseX, mouseY + gap); ctx.lineTo(mouseX, mouseY + len);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,50,50,0.9)';
  ctx.beginPath(); ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2); ctx.fill();
}

// ========== 更新 ==========
function update() {
  targets.forEach(t => {
    // 登場アニメ
    if (t.spawnAnim > 0) t.spawnAnim -= 0.05;

    // フリーズタイマー
    if (t.frozen) {
      t.frozenTimer--;
      if (t.frozenTimer <= 0) t.frozen = false;
    }

    if (t.falling) {
      t.fallVelY += 0.3;
      t.x += t.fallVelX; t.y += t.fallVelY;
      t.fallRotation += t.fallRotSpeed;
      t.opacity -= 0.015;
      if (t.opacity <= 0) { t.alive = false; t.falling = false; }
    }
  });

  // 死んだ的を掃除
  targets = targets.filter(t => t.alive || t.falling);

  shotEffects.forEach(e => { e.x += e.vx; e.y += e.vy; e.life -= 0.06; });
  shotEffects = shotEffects.filter(e => e.life > 0);
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025; });
  particles = particles.filter(p => p.life > 0);
  hitTexts.forEach(h => { h.y += h.vy; h.life -= 0.02; });
  hitTexts = hitTexts.filter(h => h.life > 0);
  if (screenShake > 0) screenShake -= 0.5;
}

// ========== メインループ ==========
function gameLoop() {
  if (!gameRunning) return;
  ctx.save();
  if (screenShake > 0) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);
  drawBackground(); drawShelves(); drawTargets(); drawEffects(); drawCrosshair();
  update();
  ctx.restore();
  requestAnimationFrame(gameLoop);
}

// ========== ゲーム制御 ==========
function startGame() {
  audioCtx.resume();
  playStartGame();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('stage-clear').classList.add('hidden');

  resizeCanvas();
  score = 0; combo = 0; maxCombo = 0;
  maxBullets = currentGun.ammo;
  bullets = maxBullets;
  const lvData = LEVELS[currentLevel - 1];
  timeLeft = lvData.time;
  gameRunning = true;
  particles = []; shotEffects = []; hitTexts = []; screenShake = 0;

  document.getElementById('score').textContent = score;
  document.getElementById('bullets').textContent = bullets;
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('hud-level').textContent = currentLevel;
  document.getElementById('gun-name-display').textContent = `${currentGun.emoji} ${currentGun.name}`;
  document.getElementById('reload-hint').classList.add('hidden');
  document.getElementById('combo-display').classList.add('hidden');

  createShelves();
  createTargets();

  // タイマー
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) endStage();
  }, 1000);

  // 的の自動補充
  clearInterval(refillInterval);
  refillInterval = setInterval(() => {
    if (gameRunning) fillTargets();
  }, lvData.refillSec * 1000);

  gameLoop();
}

function endStage() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearInterval(refillInterval);

  const lvData = LEVELS[currentLevel - 1];
  const finalScore = Math.max(0, score);

  if (finalScore >= lvData.clearScore) {
    totalScore += finalScore;

    // 次ステージ開放
    if (currentLevel >= unlockedLevel) {
      unlockedLevel = Math.min(currentLevel + 1, LEVELS.length);
      localStorage.setItem('matsuri_unlocked', unlockedLevel);
    }

    if (currentLevel >= LEVELS.length) {
      // 全ステージクリア！
      playUnlock();
      showResult(true);
    } else {
      document.getElementById('stage-clear').classList.remove('hidden');
      document.getElementById('clear-title').textContent = '🎉 ステージクリア！';
      document.getElementById('clear-score').textContent = `スコア: ${finalScore}点（目標: ${lvData.clearScore}点）`;

      if (currentLevel === unlockedLevel - 1) {
        document.getElementById('clear-unlock').textContent = `🔓 ステージ ${unlockedLevel} が開放された！`;
        playUnlock();
      } else {
        document.getElementById('clear-unlock').textContent = '';
        playFanfare();
      }

      const btns = document.getElementById('clear-buttons');
      btns.innerHTML = '<button onclick="nextLevel()">次のステージへ →</button>';
    }
  } else {
    totalScore += finalScore;
    playGameOver();
    showResult(false);
  }
}

function nextLevel() {
  currentLevel++;
  document.getElementById('stage-clear').classList.add('hidden');
  startGame();
}

function showResult(allClear) {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  const finalScore = Math.max(0, totalScore);

  if (allClear) {
    document.getElementById('result-title').textContent = '🏆 全ステージクリア！！🏆';
    document.getElementById('result-score').textContent = `合計 ${finalScore} 点`;
    document.getElementById('result-rank').textContent = '🌟 伝説の射的師 🌟';
    document.getElementById('prizes-won').textContent = 'おめでとう！全ステージを制覇した！';
  } else {
    document.getElementById('result-title').textContent = '結果発表';
    document.getElementById('result-score').textContent = `合計 ${finalScore} 点`;

    let rank;
    if (finalScore >= 10000)     rank = '🏆 神の射的師！！';
    else if (finalScore >= 6000) rank = '🥇 伝説級！';
    else if (finalScore >= 3000) rank = '🥈 射的マスター！';
    else if (finalScore >= 1500) rank = '🥉 なかなかの腕前！';
    else if (finalScore >= 500)  rank = '🎖️ がんばったね！';
    else                          rank = '💪 もう一回チャレンジ！';
    document.getElementById('result-rank').textContent = rank;
    document.getElementById('prizes-won').textContent = '';
  }

  document.getElementById('result-combo').textContent = maxCombo >= 3 ? `最大コンボ: 🔥${maxCombo}` : '';
  document.getElementById('unlocks').textContent = unlockedLevel > 1 ? `開放済み: ステージ ${unlockedLevel} まで` : '';
}

function goToTitle() {
  totalScore = 0;
  currentLevel = 1;
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');
  buildTitle();
}

function restartFromFirst() {
  totalScore = 0;
  currentLevel = 1;
  currentGun = GUNS[0];
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  playStartGame();
  startGame();
}

// ========== イベント ==========
canvas.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener('click', e => {
  if (bullets <= 0) reload();
  else shoot(e.clientX, e.clientY);
});
canvas.addEventListener('contextmenu', e => { e.preventDefault(); reload(); });
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  mouseX = touch.clientX; mouseY = touch.clientY;
  if (bullets <= 0) reload();
  else shoot(touch.clientX, touch.clientY);
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  mouseX = touch.clientX; mouseY = touch.clientY;
}, { passive: false });

// 初期化
buildTitle();
