// The game itself: clicks and keyboard marks, rings on both panels, the
// counter, timer, score, hints, the gear-pip tracker, and the win/time-up
// states. The scene drawing lives in scene.js, the difference data in
// differences.js, the sounds in audio.js; this file only runs the game.
import { DIFFERENCES, SCENE_WIDTH, SCENE_HEIGHT, findDifferenceAt } from './differences.js';
import { buildScene } from './scene.js';
import { playChime, playThud, playHintNote, playWinArpeggio } from './audio.js';

export const DIFFICULTIES = {
  apprentice: { label: 'Apprentice', timeLimit: 0, hints: 5, misclick: 10, blurb: 'Untimed, 5 hints. Learn the workshop.' },
  journeyman: { label: 'Journeyman', timeLimit: 300, hints: 3, misclick: 10, blurb: '5 minutes on the clock, 3 hints.' },
  master: { label: 'Master', timeLimit: 180, hints: 1, misclick: 25, blurb: '3 minutes, 1 hint, misclicks cost 25.' },
};

const RANKS = [
  { min: 0, title: 'Apprentice Tinkerer' },
  { min: 500, title: 'Journeyman Horologist' },
  { min: 750, title: 'Master of the Thirteenth Chime' },
  { min: 950, title: 'Keeper of True Time' },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class SpotDifferenceGame {
  constructor(root) {
    this.root = root;
    this.panels = {
      A: root.querySelector('#panel-a'),
      B: root.querySelector('#panel-b'),
    };
    this.stage = root.querySelector('#stage');
    this.linkLayer = root.querySelector('#link-layer');
    this.crosshair = root.querySelector('#crosshair');
    this.remainingEl = root.querySelector('#remaining');
    this.timerEl = root.querySelector('#timer');
    this.scoreEl = root.querySelector('#score');
    this.hintsEl = root.querySelector('#hints-left');
    this.logEl = root.querySelector('#find-log');
    this.trackerEl = root.querySelector('#tracker-pips');
    this.startOverlay = document.querySelector('#start-overlay');
    this.endModal = document.querySelector('#end-modal');
    this.endTitle = document.querySelector('#end-title');
    this.endStats = document.querySelector('#end-stats');
    this.endRank = document.querySelector('#end-rank');
    this.difficulty = 'apprentice';
    this.found = new Set();
    this.clicks = 0;
    this.correctClicks = 0;
    this.score = 0;
    this.hintsLeft = 5;
    this.timeLeft = 0;
    this.elapsed = 0;
    this.timerId = null;
    this.started = false;
    this.over = false;
    this.crosshairPos = { panel: 'A', x: SCENE_WIDTH / 2, y: SCENE_HEIGHT / 2 };
    this.hintTimer = null;
    this.buildPanels();
    this.buildTracker();
    this.bindEvents();
    this.layoutOverlayLayers();
    // Panels resize with the viewport; keep the ring/hint layers pinned to
    // the drawn scene whenever the stage changes size.
    if (typeof ResizeObserver !== 'undefined') {
      this.overlayObserver = new ResizeObserver(() => this.layoutOverlayLayers());
      this.overlayObserver.observe(this.stage);
    }
  }

  // The SVG scales to fit its panel (preserveAspectRatio meet), so the drawn
  // scene may be letterboxed inside the panel. This is the rect the scene
  // art actually occupies; clicks, rings, hints and the crosshair all map
  // through it, never through the panel or the scene div.
  sceneContentRect(panelKey) {
    const svg = this.panels[panelKey].querySelector('.scene svg');
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / SCENE_WIDTH, rect.height / SCENE_HEIGHT);
    const w = SCENE_WIDTH * scale;
    const h = SCENE_HEIGHT * scale;
    return {
      left: rect.left + (rect.width - w) / 2,
      top: rect.top + (rect.height - h) / 2,
      width: w,
      height: h,
    };
  }

  // The ring and hint layers sit over the panel; pin them to the drawn scene
  // rect so markers land on the art, not on the letterbox bands.
  layoutOverlayLayers() {
    for (const key of ['A', 'B']) {
      const panelRect = this.panels[key].getBoundingClientRect();
      const r = this.sceneContentRect(key);
      for (const sel of ['.markers', '.hint-layer']) {
        const el = this.panels[key].querySelector(sel);
        el.style.left = `${r.left - panelRect.left}px`;
        el.style.top = `${r.top - panelRect.top}px`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
      }
    }
  }

  buildPanels() {
    this.panels.A.querySelector('.scene').innerHTML = buildScene('A');
    this.panels.B.querySelector('.scene').innerHTML = buildScene('B');
  }

  buildTracker() {
    this.trackerEl.innerHTML = DIFFERENCES.map(
      (d) => `<span class="pip" data-id="${d.id}" title="${d.name}">&#9881;</span>`,
    ).join('');
  }

  bindEvents() {
    for (const key of ['A', 'B']) {
      this.panels[key].addEventListener('click', (event) => this.handlePanelClick(key, event));
    }
    this.root.querySelector('#hint-btn').addEventListener('click', () => this.useHint());
    this.root.querySelector('#reset-btn').addEventListener('click', () => this.reset());
    document.querySelector('#play-again-btn').addEventListener('click', () => this.reset());
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', () => this.start(btn.dataset.difficulty));
    });
    document.addEventListener('keydown', (event) => this.handleKey(event));
  }

  start(difficulty) {
    this.difficulty = difficulty;
    const cfg = DIFFICULTIES[difficulty];
    this.found = new Set();
    this.clicks = 0;
    this.correctClicks = 0;
    this.score = 0;
    this.hintsLeft = cfg.hints;
    this.timeLeft = cfg.timeLimit;
    this.elapsed = 0;
    this.started = true;
    this.over = false;
    this.clearMarkers();
    this.buildTracker();
    this.startOverlay.classList.add('hidden');
    this.endModal.classList.add('hidden');
    this.logEl.textContent = 'The thirteenth chime fractured time. Find all 8 glitches.';
    this.updateHud();
    this.startTimer();
    this.showCrosshair();
  }

  reset() {
    this.stopTimer();
    this.start(this.difficulty);
  }

  startTimer() {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      this.elapsed += 1;
      if (DIFFICULTIES[this.difficulty].timeLimit > 0) {
        this.timeLeft -= 1;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.updateHud();
          this.timeUp();
          return;
        }
      }
      this.updateHud();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  updateHud() {
    const remaining = DIFFERENCES.length - this.found.size;
    this.remainingEl.textContent = `${remaining} Remaining`;
    this.timerEl.textContent = DIFFICULTIES[this.difficulty].timeLimit > 0
      ? formatTime(this.timeLeft)
      : formatTime(this.elapsed);
    this.scoreEl.textContent = `Score ${this.score}`;
    this.hintsEl.textContent = `${this.hintsLeft} hint${this.hintsLeft === 1 ? '' : 's'} left`;
    this.timerEl.classList.toggle('urgent', this.timeLeft <= 30 && DIFFICULTIES[this.difficulty].timeLimit > 0);
  }

  scenePoint(panelKey, event) {
    const rect = this.sceneContentRect(panelKey);
    return {
      x: ((event.clientX - rect.left) / rect.width) * SCENE_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * SCENE_HEIGHT,
    };
  }

  handlePanelClick(panelKey, event) {
    if (!this.started || this.over) return;
    const point = this.scenePoint(panelKey, event);
    this.crosshairPos = { panel: panelKey, x: point.x, y: point.y };
    this.showCrosshair();
    this.markAt(point.x, point.y, event.clientX, event.clientY);
  }

  markAt(x, y, clientX, clientY) {
    if (!this.started || this.over) return;
    this.clicks += 1;
    const diff = findDifferenceAt(x, y);
    if (diff && !this.found.has(diff.id)) {
      this.found.add(diff.id);
      this.correctClicks += 1;
      this.score += 100;
      playChime();
      this.placeRing(diff);
      this.flashLink(diff);
      this.trackerEl.querySelector(`[data-id="${diff.id}"]`).classList.add('lit');
      this.logEl.textContent = diff.log;
      this.updateHud();
      if (this.found.size === DIFFERENCES.length) this.win();
    } else if (diff && this.found.has(diff.id)) {
      this.logEl.textContent = `Already repaired: ${diff.name}.`;
    } else {
      this.score = Math.max(0, this.score - DIFFICULTIES[this.difficulty].misclick);
      playThud();
      this.showPenalty(clientX, clientY);
      this.stage.classList.remove('shake');
      void this.stage.offsetWidth;
      this.stage.classList.add('shake');
      this.updateHud();
    }
  }

  placeRing(diff) {
    for (const key of ['A', 'B']) {
      const ring = document.createElement('div');
      ring.className = 'ring';
      ring.style.left = `${(diff.x / SCENE_WIDTH) * 100}%`;
      ring.style.top = `${(diff.y / SCENE_HEIGHT) * 100}%`;
      ring.style.width = `${(diff.r * 2 / SCENE_WIDTH) * 100}%`;
      ring.title = diff.name;
      this.panels[key].querySelector('.markers').appendChild(ring);
    }
  }

  flashLink(diff) {
    const a = this.panelPoint('A', diff);
    const b = this.panelPoint('B', diff);
    const stageRect = this.stage.getBoundingClientRect();
    const x1 = a.x - stageRect.left;
    const y1 = a.y - stageRect.top;
    const x2 = b.x - stageRect.left;
    const y2 = b.y - stageRect.top;
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - 46;
    this.linkLayer.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
    this.linkLayer.innerHTML = `<path d="M${x1},${y1} Q${midX},${midY} ${x2},${y2}" class="link-arc"/>`;
    this.linkLayer.classList.add('show');
    window.setTimeout(() => {
      this.linkLayer.classList.remove('show');
      this.linkLayer.innerHTML = '';
    }, 900);
  }

  panelPoint(panelKey, diff) {
    const rect = this.sceneContentRect(panelKey);
    return {
      x: rect.left + (diff.x / SCENE_WIDTH) * rect.width,
      y: rect.top + (diff.y / SCENE_HEIGHT) * rect.height,
    };
  }

  showPenalty(clientX, clientY) {
    const stageRect = this.stage.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'penalty';
    el.textContent = `-${DIFFICULTIES[this.difficulty].misclick}`;
    el.style.left = `${clientX - stageRect.left}px`;
    el.style.top = `${clientY - stageRect.top}px`;
    this.stage.appendChild(el);
    window.setTimeout(() => el.remove(), 900);
  }

  useHint() {
    if (!this.started || this.over) return;
    if (this.hintsLeft <= 0) {
      this.logEl.textContent = 'No hints left. Trust your eyes, horologist.';
      return;
    }
    const remaining = DIFFERENCES.filter((d) => !this.found.has(d.id));
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    playHintNote();
    this.logEl.textContent = `Hint: look near the ${pick.name.toLowerCase()}.`;
    this.showHintHighlight(pick);
    this.updateHud();
  }

  showHintHighlight(diff) {
    if (this.hintTimer !== null) window.clearTimeout(this.hintTimer);
    for (const key of ['A', 'B']) {
      const layer = this.panels[key].querySelector('.hint-layer');
      layer.innerHTML = '';
      const halo = document.createElement('div');
      halo.className = 'hint-halo';
      halo.style.left = `${(diff.x / SCENE_WIDTH) * 100}%`;
      halo.style.top = `${(diff.y / SCENE_HEIGHT) * 100}%`;
      halo.style.width = `${(diff.r * 2 / SCENE_WIDTH) * 100}%`;
      layer.appendChild(halo);
    }
    this.hintTimer = window.setTimeout(() => {
      for (const key of ['A', 'B']) this.panels[key].querySelector('.hint-layer').innerHTML = '';
      this.hintTimer = null;
    }, 4000);
  }

  // Deterministic setup for screenshots: mark a set of differences as found
  // without clicks, so the shot shows rings, tracker pips and the counter.
  presetFound(ids) {
    for (const id of ids) {
      const diff = DIFFERENCES.find((d) => d.id === id);
      if (!diff || this.found.has(id)) continue;
      this.found.add(id);
      this.clicks += 1;
      this.correctClicks += 1;
      this.score += 100;
      this.placeRing(diff);
      this.trackerEl.querySelector(`[data-id="${id}"]`).classList.add('lit');
    }
    this.updateHud();
  }

  showCrosshair() {
    const { panel, x, y } = this.crosshairPos;
    const rect = this.sceneContentRect(panel);
    const stageRect = this.stage.getBoundingClientRect();
    this.crosshair.style.left = `${rect.left - stageRect.left + (x / SCENE_WIDTH) * rect.width}px`;
    this.crosshair.style.top = `${rect.top - stageRect.top + (y / SCENE_HEIGHT) * rect.height}px`;
    this.crosshair.classList.add('visible');
  }

  moveCrosshair(dx, dy) {
    const pos = this.crosshairPos;
    let { x, y } = pos;
    let panel = pos.panel;
    x += dx;
    y += dy;
    if (x > SCENE_WIDTH) {
      if (panel === 'A') { panel = 'B'; x -= SCENE_WIDTH; }
      else x = SCENE_WIDTH;
    }
    if (x < 0) {
      if (panel === 'B') { panel = 'A'; x += SCENE_WIDTH; }
      else x = 0;
    }
    y = Math.max(0, Math.min(SCENE_HEIGHT, y));
    this.crosshairPos = { panel, x, y };
    this.showCrosshair();
  }

  handleKey(event) {
    if (!this.startOverlay.classList.contains('hidden') && !this.started) {
      if (event.key === 'Enter') { this.start('apprentice'); event.preventDefault(); }
      return;
    }
    if (!this.started || this.over) return;
    const step = event.shiftKey ? 6 : 18;
    switch (event.key) {
      case 'ArrowLeft': this.moveCrosshair(-step, 0); event.preventDefault(); break;
      case 'ArrowRight': this.moveCrosshair(step, 0); event.preventDefault(); break;
      case 'ArrowUp': this.moveCrosshair(0, -step); event.preventDefault(); break;
      case 'ArrowDown': this.moveCrosshair(0, step); event.preventDefault(); break;
      case 'Enter':
      case ' ': {
        const rect = this.sceneContentRect(this.crosshairPos.panel);
        this.markAt(this.crosshairPos.x, this.crosshairPos.y, rect.left + (this.crosshairPos.x / SCENE_WIDTH) * rect.width, rect.top + (this.crosshairPos.y / SCENE_HEIGHT) * rect.height);
        event.preventDefault();
        break;
      }
      case 'h':
      case 'H': this.useHint(); break;
      case 'r':
      case 'R': this.reset(); break;
      default: break;
    }
  }

  clearMarkers() {
    for (const key of ['A', 'B']) {
      this.panels[key].querySelector('.markers').innerHTML = '';
      this.panels[key].querySelector('.hint-layer').innerHTML = '';
    }
  }

  accuracy() {
    return this.clicks === 0 ? 100 : Math.round((this.correctClicks / this.clicks) * 100);
  }

  rankTitle() {
    let title = RANKS[0].title;
    for (const r of RANKS) if (this.score >= r.min) title = r.title;
    return title;
  }

  win() {
    this.over = true;
    this.stopTimer();
    const timeBonus = DIFFICULTIES[this.difficulty].timeLimit > 0 ? this.timeLeft * 2 : 0;
    this.score += timeBonus;
    playWinArpeggio();
    this.updateHud();
    this.endTitle.textContent = 'Time Restored';
    this.endRank.textContent = this.rankTitle();
    this.endStats.innerHTML = `
      <div><span>Final time</span><strong>${formatTime(this.elapsed)}</strong></div>
      <div><span>Score</span><strong>${this.score}</strong></div>
      <div><span>Accuracy</span><strong>${this.accuracy()}%</strong></div>
      <div><span>Differences found</span><strong>8 of 8</strong></div>
      ${timeBonus > 0 ? `<div><span>Time bonus</span><strong>+${timeBonus}</strong></div>` : ''}`;
    this.endModal.classList.remove('hidden');
  }

  timeUp() {
    this.over = true;
    this.stopTimer();
    playThud();
    this.endTitle.textContent = 'Time Ran Out';
    this.endRank.textContent = 'The thirteenth chime still echoes...';
    this.endStats.innerHTML = `
      <div><span>Differences found</span><strong>${this.found.size} of 8</strong></div>
      <div><span>Score</span><strong>${this.score}</strong></div>
      <div><span>Accuracy</span><strong>${this.accuracy()}%</strong></div>`;
    this.endModal.classList.remove('hidden');
  }
}
