(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scoreText = n => String(n).padStart(6, '0');
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Storage unavailable'); } }; }
  const store = new Neon.ScoreStore(storage);
  const input = { left: false, right: false, fire: false };
  let game, levels = [], previousPhase, savedId, toastTimer, frameTick = 0;
  let audio, sound = false;
  const splash = $('overlay-content').innerHTML;
  function clearInput() { input.left = input.right = input.fire = false; }
  function tone(frequency, duration, type = 'square', volume = .025) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency / 3), audio.currentTime + duration);
      gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
    } catch { sound = false; updateSound(); }
  }
  function updateSound() { $('sound-label').textContent = sound ? 'ON' : 'OFF'; $('sound-toggle').setAttribute('aria-pressed', String(sound)); }
  function toggleSound() { sound = !sound; updateSound(); tone(650, .1); }
  function scores() {
    $('best').textContent = scoreText(store.scores[0]?.score || 0);
  }

  function announce(code, content, action, footer, compact = true) {
    $('overlay-code').textContent = code; $('overlay-content').innerHTML = content; $('action-label').textContent = action;
    $('overlay-footer').textContent = footer; $('overlay').hidden = false;
    document.querySelector('.transmission').classList.toggle('compact', compact);
    clearInput();
  }
  function syncPhase() {
    if (!game || game.phase === previousPhase) return;
    previousPhase = game.phase; clearInput();
    const l = game.level;
    const names = { splash:'AWAITING PILOT', briefing:'ESTABLISHING UPLINK', playing:'DEFENSE SYSTEM ACTIVE', paused:'SYSTEM ON HOLD', clear:'DISTRICT SECURED', victory:'CITY SECURED', gameover:'SIGNAL LOST' };
    $('phase-status').textContent = names[game.phase];
    $('mission-label').textContent = game.phase === 'splash' ? 'SYSTEM READY' : `${l.name} / ${names[game.phase]}`;
    $('pause-toggle').disabled = !['playing','paused'].includes(game.phase);
    $('pause-toggle').textContent = game.phase === 'paused' ? 'ESC / RESUME' : 'ESC / PAUSE';
    if (game.phase === 'playing') { $('overlay').hidden = true; return; }
    if (game.phase === 'splash') { announce('INCOMING TRANSMISSION', splash, 'START YOUR RUN', 'PRESS ENTER TO BEGIN', false); return; }
    if (game.phase === 'briefing') {
      announce(`DISTRICT UPLINK / ${String(game.levelIndex+1).padStart(2,'0')}`, `<p class="overline">${escapeHTML(l.subtitle.toUpperCase())}</p><div class="level-number">${String(game.levelIndex+1).padStart(2,'0')}</div><h2 class="level-title">${escapeHTML(l.name)}</h2><p class="mission-copy">${escapeHTML(l.hint)}</p><div class="brief-stats"><div>${game.aliens.length}<small>HOSTILES</small></div><div>${l.scores.clearBonus}<small>CLEAR BONUS</small></div><div>${game.lives}<small>SHIELDS</small></div></div>`, 'LAUNCH NOW', 'AUTO-LAUNCH IN 3 SECONDS · ENTER TO SKIP');
    } else if (game.phase === 'paused') {
      announce('TRANSMISSION ON HOLD', '<p class="overline">TAKE A BREATH, PILOT</p><h2>PAUSED</h2><p class="mission-copy">The city can wait a moment.<br>Your run is right where you left it.</p>', 'RESUME YOUR RUN', 'ESC OR ENTER TO RESUME');
      const button = document.createElement('button'); button.className = 'secondary-action'; button.textContent = 'RETURN TO SPLASH / END RUN';
      button.addEventListener('click', () => { game.finish(false); consumeEvents(); game.phase = 'splash'; previousPhase = null; syncPhase(); });
      $('overlay-content').appendChild(button);
    } else if (game.phase === 'clear') {
      $('overlay').hidden = true;
      showToast(`DISTRICT SECURED / +${l.scores.clearBonus} CLEAR BONUS`, 2000);
      $('primary-action').disabled = true;
    } else {
      const won = game.phase === 'victory';
      announce(won ? 'ALL DISTRICTS SECURED' : 'DEFENSE NETWORK OFFLINE', `<p class="overline">${won ? 'YOU KEPT THE LIGHTS ON' : 'THE NIGHT ISN’T OVER'}</p><h2>${won ? 'CITY<br><span>SAVED</span>' : 'SIGNAL<br><span>LOST</span>'}</h2><div class="result-score">${scoreText(game.score)}</div><p class="mission-copy">${won ? 'All five districts cleared.' : `Reached district ${game.levelIndex+1}: ${escapeHTML(l.name)}.`}<br>Your score has been recorded.</p><form class="initials-form" id="initials-form"><label for="initials">CALLSIGN</label><input id="initials" name="initials" value="YOU" maxlength="3" pattern="[A-Za-z0-9]{1,3}" aria-label="Three-character callsign" autocomplete="off"><button type="submit">SAVE</button></form>`, 'ANOTHER NIGHT / PLAY AGAIN', 'ENTER OR R TO START A NEW RUN');
      $('initials-form').addEventListener('submit', e => { e.preventDefault(); store.rename(savedId, $('initials').value); scores(); $('initials-form').querySelector('button').textContent = 'SAVED'; });
    }
    if (game.phase !== 'clear') $('primary-action').disabled = false;
  }
  function primary() {
    if (!game) return;
    if (['splash','victory','gameover'].includes(game.phase)) { savedId = null; game.start(); tone(550,.2); }
    else if (game.phase === 'briefing') game.launch();
    else if (game.phase === 'paused') game.pause();
    consumeEvents(); syncPhase();
  }
  function showToast(message, duration = 2200) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible'); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), duration); }
  // Power event payload uses powerType to keep its event discriminator intact.
  function consumeEvents() {
    const events = game.drainEvents();
    for (const e of events) {
      if (e.type === 'finish') { savedId = store.add(e.score, e.level); scores(); }
      else if (e.type === 'power') { showToast(`${{fast:'RAPID FIRE',double:'DOUBLE SHOT',piercing:'PIERCING SHOT'}[e.powerType]} ONLINE`); tone(1000,.25,'triangle'); }
      else if (e.type === 'shoot') tone(650,.055);
      else if (e.type === 'hurt') { showToast('SHIELD LOST / 2.5s RECOVERY'); tone(90,.3,'sawtooth',.05); }
      else if (e.type === 'clear' || e.type === 'launch') tone(750,.25,'triangle');
      else if (e.type === 'explode') tone(130,.075,'sawtooth',.018);
    }
    return events;
  }
  document.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (['ArrowLeft','ArrowRight','Space','Enter','Escape','KeyA','KeyD','KeyM','KeyR'].includes(e.code)) e.preventDefault();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'Space' && game?.phase === 'playing') input.fire = true;
    if (e.repeat) return;
    if (e.code === 'Enter') primary();
    if (e.code === 'Escape' && game) { game.pause(); syncPhase(); }
    if (e.code === 'KeyM') toggleSound();
    if (e.code === 'KeyR' && ['gameover','victory'].includes(game?.phase)) primary();
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    if (e.code === 'Space') input.fire = false;
  });
  function backgroundPause() { clearInput(); if (game?.phase === 'playing') { game.pause(); syncPhase(); } }
  window.addEventListener('blur', backgroundPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) backgroundPause(); });
  $('primary-action').addEventListener('click', primary);
  $('pause-toggle').addEventListener('click', () => { game?.pause(); syncPhase(); });
  $('sound-toggle').addEventListener('click', toggleSound);
  scores();
  window.NeonUI = {
    input, store,
    init(campaign) { levels = campaign; game = new Neon.Game(levels); this.game = game; syncPhase(); $('primary-action').disabled = false; },
    tick(dt) {
      game.update(dt, input); const events = consumeEvents(); syncPhase();
      // DOM counters update at 10 Hz; Cocos simulation and rendering stay at 60 Hz.
      frameTick += dt;
      if (frameTick > .1) {
        frameTick = 0; $('score').textContent = scoreText(game.score);
        $('best').textContent = scoreText(Math.max(game.score, store.scores[0]?.score || 0));
        $('district').innerHTML = `${String(game.levelIndex+1).padStart(2,'0')} <span>/ ${String(levels.length).padStart(2,'0')}</span>`;
        $('lives').textContent = Array.from({length:3}, (_,i) => i < game.lives ? '▰' : '▱').join(' '); $('lives').setAttribute('aria-label', `${game.lives} lives`);
        $('wave-progress').textContent = game.phase === 'splash' ? `${levels[0].formation.rows.length * levels[0].formation.columns} HOSTILES DETECTED` : `${game.aliens.length} HOSTILES REMAINING`;
        for (const type of Neon.POWERS) {
          const slot = document.querySelector(`[data-power="${type}"]`); slot.classList.toggle('active', game.powers[type] > 0);
          $(`${type}-timer`).textContent = game.powers[type] > 0 ? `${game.powers[type].toFixed(1)}s ACTIVE` : 'STANDBY';
          slot.querySelector('i').style.width = `${game.powers[type] / game.level.powerups.duration * 100}%`;
        }
        if (game.phase === 'briefing') $('overlay-footer').textContent = `AUTO-LAUNCH IN ${Math.ceil(game.phaseTimer)} SECONDS · ENTER TO SKIP`;
      }
      return events;
    },
    error(error) {
      announce('UPLINK FAILED', `<p class="overline">SYSTEM NEEDS ATTENTION</p><h2>NO<br><span>SIGNAL</span></h2><p class="error-detail">${escapeHTML(error.message || error)}</p><p class="mission-copy">Check the level JSON files and reload.</p>`, 'RELOAD SYSTEM', 'SEE README FOR SETUP');
      $('primary-action').disabled = false; $('primary-action').addEventListener('click', () => location.reload(), { once:true });
      $('phase-status').textContent = 'CONFIGURATION ERROR';
    }
  };
})();
