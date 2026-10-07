import { Camera } from '../engine/camera.js';
import { TileSheet } from '../engine/sprite.js';
import { resolvePlatforms, overlaps } from '../physics.js';
import { MONTH_NAMES } from '../level.js';
import { Player } from '../entities/player.js';
import { Boss } from '../entities/boss.js';
import { Bomb } from '../entities/bomb.js';
import { Coin } from '../entities/coin.js';
import { calculateSalary } from '../tax.js';

const VALOR_PESO = 8000;
const VALOR_TAX = -1500;
const VIEW_W = 800;
const VIEW_H = 480;

export class GameScene {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.images = game.assets.images;

    this.camera = new Camera(VIEW_W, VIEW_H);
    this.camera.setBounds(0, 0, level.width, level.height);

    this.ingresos = 0;
    this.gameOver = false;
    this.levelComplete = false;

    this.platforms = []; // collidable {x,y,halfW,halfH,type}
    this.coins = [];
    this.aguinaldoQueue = [];
    this.findeanioQueue = [];
    this.monthLabels = [];
    this.levelCompleteMarker = null;

    this.passedAguinaldo = false;
    this.passedFinDeAnio = false;

    this.boss1 = null;
    this.boss2 = null;
    this.bomb = new Bomb(new TileSheet(this.images.bomb, 6, 3));

    this.rain1Timer = 0;
    this.rain2Timer = 0;
    this.drop1Timer = 0;
    this.drop2Timer = 0;
    this.dropping1 = false;
    this.dropping2 = false;

    this._buildFromLevel();
    this._buildMonthLabels();
  }

  _buildFromLevel() {
    const playerSheet = new TileSheet(this.images.player, 19, 1);
    const bossSheet = new TileSheet(this.images.boss, 4, 1);
    const boss2Sheet = new TileSheet(this.images.boss2, 5, 1);

    for (const e of this.level.entities) {
      switch (e.type) {
        case 'platform1':
          this.platforms.push(this._platformRect(e.x, e.y, this.images.calendar, 'platform1'));
          break;
        case 'platform2':
          this.platforms.push(this._platformRect(e.x, e.y, this.images.aguinaldo, 'platform2'));
          break;
        case 'platform4':
          this.platforms.push(this._platformRect(e.x, e.y, this.images.aguinaldo, 'platform4'));
          break;
        case 'coin':
          this.coins.push(new Coin(e.x, e.y, 'coin'));
          break;
        case 'platform3': {
          const c = new Coin(e.x, e.y, 'aguinaldoBill');
          this.coins.push(c);
          this.aguinaldoQueue.push(c);
          break;
        }
        case 'platform32': {
          const c = new Coin(e.x, e.y, 'findeanioBill');
          this.coins.push(c);
          this.findeanioQueue.push(c);
          break;
        }
        case 'player':
          this.player = new Player(e.x, e.y, playerSheet);
          break;
        case 'bomb':
          this.bomb.x = e.x;
          this.bomb.y = e.y;
          break;
        case 'boss':
          this.boss1 = new Boss(e.x, e.y, bossSheet, {
            frames: { first: 0, last: 3, durations: [100, 100, 100, 100] },
            xMin: 2600, xMax: 3000, speed: 112,
          });
          break;
        case 'boss2':
          this.boss2 = new Boss(e.x, e.y, boss2Sheet, {
            frames: { first: 0, last: 4, durations: [100, 100, 100, 100, 100] },
            xMin: 5700, xMax: 6100, speed: 112,
          });
          break;
        case 'levelComplete':
          this.levelCompleteMarker = { x: e.x, y: e.y, collected: false, t: 0 };
          break;
        default:
          break;
      }
    }
  }

  _platformRect(x, y, img, type) {
    return { x, y, halfW: img.width / 2, halfH: img.height / 2, type };
  }

  _buildMonthLabels() {
    for (let i = 0; i < MONTH_NAMES.length; i++) {
      const isSpecial = i === 6 || i === 13;
      this.monthLabels.push({
        x: 100 + i * 450,
        y: isSpecial ? 270 : 210,
        text: MONTH_NAMES[i],
      });
    }
  }

  onTap() {
    if (this.gameOver || this.levelComplete) {
      this.game.goToMenu();
      return;
    }
    if (this.player.moonwalking) this.player.moonwalkTurn();
    else if (this.player.running) this.player.startJumping();
  }

  update(dt) {
    if (this.gameOver || this.levelComplete) return;

    this.player.update(dt);

    const landed = resolvePlatforms(this.player, this.platforms);
    if (landed) {
      this.player.onLanded();
      if (landed.type === 'platform1') {
        this.player.startRunning();
      } else if (landed.type === 'platform2' && !this.passedAguinaldo) {
        this.passedAguinaldo = true;
        this._triggerAguinaldo();
      } else if (landed.type === 'platform4' && !this.passedFinDeAnio) {
        this.passedFinDeAnio = true;
        this._triggerFinDeAnio();
      }
    }

    if (this.player.dead) {
      this.gameOver = true;
      this.salary = calculateSalary(this.ingresos);
      return;
    }

    for (const coin of this.coins) {
      coin.update(dt);
      if (!coin.collected && overlaps(this.player, coin)) {
        coin.collected = true;
        this._addIngresos(VALOR_PESO);
      }
    }

    this._updateRain(dt);
    this._updateBossDrops(dt);

    if (this.boss1) this.boss1.update(dt);
    if (this.boss2) this.boss2.update(dt);
    this.bomb.update(dt);

    if (this.bomb.visible && !this.bomb.exploding && overlaps(this.player, this.bomb)) {
      this._addIngresos(VALOR_TAX);
      this.bomb.startExploding();
    }

    if (this.levelCompleteMarker && !this.levelCompleteMarker.collected) {
      this.levelCompleteMarker.t += dt;
      const marker = this.levelCompleteMarker;
      if (overlaps(this.player, { x: marker.x, y: marker.y, halfW: 75, halfH: 75 })) {
        marker.collected = true;
        this.player.stop();
        this.levelComplete = true;
        this.salary = calculateSalary(this.ingresos);
      }
    }

    this.camera.chase(this.player.x, this.player.y);
  }

  _addIngresos(v) {
    this.ingresos += v;
  }

  _triggerAguinaldo() {
    this.player.startMoonwalking();
    this._rainQueue = this.aguinaldoQueue.slice();
    this.rain1Timer = 0;
    this.boss1.startFlying();
    this.dropping1 = true;
    this.drop1Timer = 0;
  }

  _triggerFinDeAnio() {
    this.player.startMoonwalking();
    this._rainQueue2 = this.findeanioQueue.slice();
    this.rain2Timer = 0;
    this.boss2.startFlying();
    this.dropping2 = true;
    this.drop2Timer = 0;
  }

  _updateRain(dt) {
    if (this._rainQueue && this._rainQueue.length) {
      this.rain1Timer += dt;
      if (this.rain1Timer >= 1) {
        this.rain1Timer -= 1;
        const c = this._rainQueue.shift();
        if (c) c.release();
      }
    }
    if (this._rainQueue2 && this._rainQueue2.length) {
      this.rain2Timer += dt;
      if (this.rain2Timer >= 1) {
        this.rain2Timer -= 1;
        const c = this._rainQueue2.shift();
        if (c) c.release();
      }
    }
  }

  _updateBossDrops(dt) {
    if (this.dropping1) {
      this.drop1Timer += dt;
      if (this.drop1Timer >= 1.5) {
        this.drop1Timer -= 1.5;
        this.bomb.startFalling(this.boss1.x, this.boss1.y);
      }
      if (this.player.x > 3250) {
        this.dropping1 = false;
        this.boss1.stop();
      }
    }
    if (this.dropping2) {
      this.drop2Timer += dt;
      if (this.drop2Timer >= 1.5) {
        this.drop2Timer -= 1.5;
        this.bomb.startFalling(this.boss2.x, this.boss2.y);
      }
    }
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------

  render(ctx) {
    ctx.fillStyle = '#1f6fe0';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    this._drawPlatforms(ctx);
    this._drawMonthLabels(ctx);
    this._drawCoins(ctx);
    this._drawLevelCompleteMarker(ctx);
    if (this.boss1 && this.boss1.visible) this._drawTiled(ctx, this.boss1);
    if (this.boss2 && this.boss2.visible) this._drawTiled(ctx, this.boss2);
    if (this.bomb.visible) this._drawTiled(ctx, this.bomb);
    if (!this.player.dead) this._drawTiled(ctx, this.player);

    this._drawHud(ctx);
    if (this.player.moonwalking) this._drawMoonwalkHint(ctx);

    if (this.gameOver) this._drawResultsScreen(ctx, 0);
    if (this.levelComplete) this._drawResultsScreen(ctx, 2);
  }

  _drawPlatforms(ctx) {
    for (const p of this.platforms) {
      const img = p.type === 'platform1' ? this.images.calendar : this.images.aguinaldo;
      const s = this.camera.worldToScreen(p.x, p.y);
      ctx.drawImage(img, s.x - img.width / 2, s.y - img.height / 2);
    }
  }

  _drawMonthLabels(ctx) {
    ctx.save();
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    for (const m of this.monthLabels) {
      const s = this.camera.worldToScreen(m.x, m.y);
      if (s.x < -100 || s.x > VIEW_W + 100) continue;
      ctx.strokeText(m.text, s.x, s.y);
      ctx.fillText(m.text, s.x, s.y);
    }
    ctx.restore();
  }

  _drawCoins(ctx) {
    const img = this.images.bill;
    for (const c of this.coins) {
      if (c.collected) continue;
      const s = this.camera.worldToScreen(c.x, c.y);
      if (s.x < -50 || s.x > VIEW_W + 50 || s.y < -50 || s.y > VIEW_H + 50) continue;
      const scale = c.scale;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, s.x - w / 2, s.y - h / 2, w, h);
    }
  }

  _drawLevelCompleteMarker(ctx) {
    const marker = this.levelCompleteMarker;
    if (!marker || marker.collected) return;
    const sheet = new TileSheet(this.images.star, 2, 1);
    const frame = sheet.frameRect(0);
    const scale = 1 + ((Math.sin(marker.t * 3) + 1) / 2) * 0.3;
    const s = this.camera.worldToScreen(marker.x, marker.y);
    const w = frame.sw * scale;
    const h = frame.sh * scale;
    ctx.drawImage(
      this.images.star, frame.sx, frame.sy, frame.sw, frame.sh,
      s.x - w / 2, s.y - h / 2, w, h,
    );
  }

  _drawTiled(ctx, entity) {
    const sheet = entity.sheet;
    const frame = sheet.frameRect(entity.animator ? entity.animator.currentTile : 0);
    const s = this.camera.worldToScreen(entity.x, entity.y);
    ctx.save();
    ctx.translate(s.x, s.y);
    if (entity.flipped) ctx.scale(-1, 1);
    ctx.drawImage(
      sheet.image, frame.sx, frame.sy, frame.sw, frame.sh,
      -frame.sw / 2, -frame.sh / 2, frame.sw, frame.sh,
    );
    ctx.restore();
  }

  _drawHud(ctx) {
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const text = `$ ${this.ingresos}`;
    ctx.strokeText(text, 20, 50);
    ctx.fillText(text, 20, 50);
  }

  _drawMoonwalkHint(ctx) {
    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const text = 'Tap to dodge bombs — keep drifting right to move on';
    ctx.strokeText(text, VIEW_W / 2, VIEW_H - 24);
    ctx.fillText(text, VIEW_W / 2, VIEW_H - 24);
    ctx.restore();
  }

  // Shared by both the Game Over and Level Complete screens: same panel,
  // same Gross/deductions/Final score breakdown, just a different star
  // count — 0 filled for dying, 2 filled for finishing (the original
  // hardcodes "2 of 3" on completion; there's no scoring for more).
  _drawResultsScreen(ctx, starsFilled) {
    const win = this.images.levelCompleteWindow;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(win, cx - win.width / 2, cy - win.height / 2);

    const starSheet = new TileSheet(this.images.star, 2, 1);
    const stars = [0, 1, 2].map((i) => (i < starsFilled ? 0 : 1)); // tile 0 = filled, 1 = empty
    const startX = cx - win.width / 2 + 150;
    stars.forEach((tileIdx, i) => {
      const f = starSheet.frameRect(tileIdx);
      const sx = startX + i * 175;
      const sy = cy - win.height / 2 + 90;
      ctx.drawImage(this.images.star, f.sx, f.sy, f.sw, f.sh, sx - 60, sy - 60, 120, 120);
    });

    const s = this.salary;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';

    // Centered single-line text (titles, the footer prompt).
    const drawCentered = (text, size, bold) => {
      ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = bold ? 4 : 3;
      ctx.strokeText(text, cx, y);
      ctx.fillText(text, cx, y);
    };

    // Label/value row: both columns are right-aligned to a fixed x, so every
    // ":" lines up at colonX regardless of label length, and every value's
    // last digit lines up at valueX — with Courier New giving each digit the
    // same advance width, that lines up the tens, hundreds, etc. place by
    // place too. No padding math needed, and no risk of the longest label
    // ever touching the value column.
    const colonX = cx - 15;
    const valueX = cx + 175;
    const drawRow = (label, value, size, bold) => {
      ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`;
      ctx.lineWidth = bold ? 4 : 3;
      ctx.textAlign = 'right';
      ctx.strokeText(`${label}:`, colonX, y);
      ctx.fillText(`${label}:`, colonX, y);
      ctx.strokeText(value, valueX, y);
      ctx.fillText(value, valueX, y);
    };

    let y = cy + 10;
    drawRow('Gross', `$ ${s.bruto}`, 18, true);
    y += 26;
    for (const row of s.breakdown) {
      drawRow(row.label, `-$ ${row.amount}`, 16, false);
      y += 20;
    }
    y += 12;
    drawRow('Final score', `$ ${s.neto}`, 22, true);

    y = cy + win.height / 2 - 10;
    drawCentered('Press the SPACEBAR to return', 16, false);
  }
}
