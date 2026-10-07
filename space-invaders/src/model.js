/* Pure simulation: Cocos renders this state; tests run the same gameplay rules. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Neon = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const WIDTH = 900, HEIGHT = 620, PLAYER_Y = 66;
  const ALIENS = ['squid', 'crab', 'insect'], POWERS = ['fast', 'double', 'piercing'];
  function validateLevel(level, file = 'level') {
    const fail = message => { throw new Error(`${file}: ${message}`); };
    const positive = (value, name, min, max) => { if (!Number.isFinite(value) || value < min || value > max) fail(`${name} must be between ${min} and ${max}`); };
    if (!level || typeof level !== 'object') fail('expected an object');
    positive(level.id, 'id', 1, 999);
    if (!Number.isInteger(level.id)) fail('id must be an integer');
    for (const key of ['name', 'subtitle', 'hint']) if (typeof level[key] !== 'string' || !level[key].trim()) fail(`${key} is required`);
    if (!/^#[\da-f]{6}$/i.test(level.color)) fail('color must be a six-digit hex color');
    const f = level.formation;
    if (!f || !Array.isArray(f.rows) || !f.rows.length || f.rows.length > 6 || f.rows.some(x => !ALIENS.includes(x))) fail('formation.rows must contain 1–6 supported alien types');
    positive(f.columns, 'formation.columns', 1, 12);
    if (!Number.isInteger(f.columns)) fail('formation.columns must be an integer');
    positive(f.spacingX, 'formation.spacingX', 42, 90);
    positive(f.spacingY, 'formation.spacingY', 42, 70);
    positive(f.startY, 'formation.startY', 250, 510);
    if ((f.columns - 1) * f.spacingX > WIDTH - 120) fail('formation is wider than the playfield');
    if (f.startY - (f.rows.length - 1) * f.spacingY < 180) fail('formation starts too close to the player');
    for (const [key, min, max] of [['speed', 1, 150], ['descent', 1, 40], ['acceleration', 0, 4]]) positive(level.movement?.[key], `movement.${key}`, min, max);
    for (const [key, min, max] of [['interval', .2, 10], ['bulletSpeed', 50, 500], ['maxBullets', 1, 20]]) positive(level.enemyFire?.[key], `enemyFire.${key}`, min, max);
    if (!Number.isInteger(level.enemyFire.maxBullets)) fail('enemyFire.maxBullets must be an integer');
    for (const key of [...ALIENS, 'clearBonus']) positive(level.scores?.[key], `scores.${key}`, 0, 100000);
    positive(level.powerups?.dropChance, 'powerups.dropChance', 0, 1);
    positive(level.powerups?.duration, 'powerups.duration', 1, 60);
    if (!Array.isArray(level.powerups.types) || !level.powerups.types.length || level.powerups.types.some(x => !POWERS.includes(x))) fail('powerups.types contains an unsupported power-up');
    return level;
  }
  function overlaps(a, b, x, y) { return Math.abs(a.x - b.x) < x && Math.abs(a.y - b.y) < y; }
  class Game {
    constructor(levels, random = Math.random) {
      if (!levels.length) throw new Error('Campaign is empty');
      levels.forEach((l, i) => validateLevel(l, `level ${i + 1}`));
      if (new Set(levels.map(l => l.id)).size !== levels.length) throw new Error('Campaign level IDs must be unique');
      this.levels = levels; this.random = random; this.phase = 'splash'; this.levelIndex = 0;
      this.score = 0; this.lives = 3; this.time = 0; this.events = []; this.nextId = 0;
      this.player = { x: WIDTH / 2, y: PLAYER_Y }; this.resetEntities();
    }
    resetEntities() {
      this.aliens = []; this.bullets = []; this.drops = []; this.effects = [];
      this.powers = { fast: 0, double: 0, piercing: 0 }; this.cooldown = 0; this.invulnerable = 0;
      this.fireTimer = 0; this.direction = 1; this.elapsed = 0;
    }
    get level() { return this.levels[this.levelIndex]; }
    emit(type, data = {}) { this.events.push({ type, ...data }); }
    drainEvents() { return this.events.splice(0); }
    start() {
      this.score = 0; this.lives = 3; this.levelIndex = 0; this.time = 0; this.events = [];
      this.prepareLevel();
    }
    prepareLevel() {
      this.resetEntities(); this.player.x = WIDTH / 2;
      const f = this.level.formation;
      const left = (WIDTH - (f.columns - 1) * f.spacingX) / 2;
      f.rows.forEach((type, row) => {
        for (let col = 0; col < f.columns; col++) this.aliens.push({ id: ++this.nextId, type, col, row, x: left + col * f.spacingX, y: f.startY - row * f.spacingY });
      });
      this.totalAliens = this.aliens.length; this.phase = 'briefing'; this.phaseTimer = 2.8;
      this.emit('level', { index: this.levelIndex });
    }
    launch() { if (this.phase === 'briefing') { this.phase = 'playing'; this.invulnerable = 1.5; this.emit('launch'); } }
    pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.emit('pause'); } else if (this.phase === 'paused') { this.phase = 'playing'; this.emit('resume'); } }
    finish(won) {
      if (this.phase === 'gameover' || this.phase === 'victory') return;
      this.phase = won ? 'victory' : 'gameover'; this.emit('finish', { won, score: this.score, level: this.levelIndex + 1 });
    }
    shoot() {
      if (this.cooldown > 0) return;
      const offsets = this.powers.double > 0 ? [-10, 10] : [0];
      for (const dx of offsets) this.bullets.push({ id: ++this.nextId, owner: 'player', x: this.player.x + dx, y: PLAYER_Y + 22, piercing: this.powers.piercing > 0, hit: new Set() });
      this.cooldown = this.powers.fast > 0 ? .13 : .32;
      this.emit('shoot');
    }
    destroyAlien(alien) {
      this.aliens = this.aliens.filter(a => a.id !== alien.id); this.score += this.level.scores[alien.type];
      this.emit('explode', { x: alien.x, y: alien.y, color: alien.type === 'squid' ? 'pink' : 'cyan' });
      if (this.random() < this.level.powerups.dropChance) {
        const types = this.level.powerups.types;
        this.drops.push({ id: ++this.nextId, x: alien.x, y: alien.y, type: types[Math.floor(this.random() * types.length)] });
      }
    }
    hurt() {
      if (this.invulnerable > 0) return;
      this.lives--; this.invulnerable = 2.5; this.powers = { fast: 0, double: 0, piercing: 0 };
      this.emit('hurt', { x: this.player.x, y: PLAYER_Y });
      if (this.lives <= 0) this.finish(false);
    }
    update(delta, input = {}) {
      const dt = Math.max(0, Math.min(delta, .05));
      if (this.phase === 'paused') return;
      this.time += dt;
      if (this.phase === 'briefing' || this.phase === 'clear') {
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          if (this.phase === 'briefing') this.launch();
          else if (this.levelIndex === this.levels.length - 1) this.finish(true);
          else { this.levelIndex++; this.prepareLevel(); }
        }
        return;
      }
      if (this.phase !== 'playing') return;
      this.elapsed += dt; this.cooldown = Math.max(0, this.cooldown - dt);
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      for (const type of POWERS) this.powers[type] = Math.max(0, this.powers[type] - dt);
      const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      this.player.x = Math.max(36, Math.min(WIDTH - 36, this.player.x + direction * 360 * dt));
      if (input.fire) this.shoot();
      const speed = this.level.movement.speed * (1 + this.level.movement.acceleration * (1 - this.aliens.length / this.totalAliens));
      const dx = this.direction * speed * dt;
      if (this.aliens.some(a => a.x + dx < 30 || a.x + dx > WIDTH - 30)) {
        this.direction *= -1; for (const a of this.aliens) a.y -= this.level.movement.descent;
      } else for (const a of this.aliens) a.x += dx;
      if (this.aliens.some(a => a.y < PLAYER_Y + 30)) { this.finish(false); return; }
      this.fireTimer += dt;
      if (this.fireTimer >= this.level.enemyFire.interval) {
        this.fireTimer = 0;
        if (this.bullets.filter(b => b.owner === 'enemy').length < this.level.enemyFire.maxBullets && this.aliens.length) {
          const bottom = new Map();
          for (const a of this.aliens) if (!bottom.has(a.col) || bottom.get(a.col).y > a.y) bottom.set(a.col, a);
          const shooters = [...bottom.values()]; const a = shooters[Math.floor(this.random() * shooters.length)];
          this.bullets.push({ id: ++this.nextId, owner: 'enemy', x: a.x, y: a.y - 18 });
        }
      }
      const removed = new Set();
      for (const b of this.bullets) {
        b.y += (b.owner === 'player' ? 600 : -this.level.enemyFire.bulletSpeed) * dt;
        if (b.y > HEIGHT || b.y < -20) { removed.add(b.id); continue; }
        if (b.owner === 'player') {
          for (const a of [...this.aliens]) if (!b.hit.has(a.id) && overlaps(b, a, 18, 22)) {
            b.hit.add(a.id); this.destroyAlien(a);
            if (!b.piercing) { removed.add(b.id); break; }
          }
        } else if (overlaps(b, this.player, 17, 21)) { removed.add(b.id); this.hurt(); if (this.phase === 'gameover') return; }
      }
      this.bullets = this.bullets.filter(b => !removed.has(b.id));
      this.drops = this.drops.filter(d => {
        d.y -= 100 * dt;
        if (overlaps(d, this.player, 28, 28)) { this.powers[d.type] = this.level.powerups.duration; this.emit('power', { powerType: d.type }); return false; }
        return d.y > -20;
      });
      if (this.phase === 'playing' && !this.aliens.length) {
        this.score += this.level.scores.clearBonus; this.phase = 'clear'; this.phaseTimer = 2;
        this.bullets = []; this.drops = []; this.emit('clear', { bonus: this.level.scores.clearBonus });
      }
    }
  }
  class ScoreStore {
    constructor(storage) { this.storage = storage; this.key = 'tokio-neon.highscores.v1'; this.available = true; this.scores = this.read(); }
    read() {
      try {
        const data = JSON.parse(this.storage.getItem(this.key) || '[]');
        if (!Array.isArray(data)) return [];
        return data.filter(s => s && typeof s.id === 'string' && /^[A-Z0-9]{1,3}$/.test(s.name) && Number.isSafeInteger(s.score) && s.score >= 0 && Number.isInteger(s.level) && s.level > 0 && s.level <= 999).sort((a,b) => b.score - a.score).slice(0,10);
      } catch { return []; }
    }
    save() { try { this.storage.setItem(this.key, JSON.stringify(this.scores)); } catch { this.available = false; } }
    add(score, level, name = 'YOU') {
      const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, score, level };
      this.scores = [...this.scores, item].sort((a,b) => b.score - a.score).slice(0,10); this.save(); return item.id;
    }
    rename(id, name) { const item = this.scores.find(s => s.id === id); if (item) { item.name = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,3) || 'YOU'; this.save(); } }
  }
  return { Game, ScoreStore, validateLevel, WIDTH, HEIGHT, PLAYER_Y, POWERS };
});
