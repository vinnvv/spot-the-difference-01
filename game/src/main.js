// Bootstrap: builds the game, then honours deterministic screenshot modes
// from the URL so a shot can be reproduced exactly.
//   ?shot=start            show the start overlay on a fresh board
//   ?shot=play&found=2,5,7 start playing with those differences already found
//   ?shot=play&found=2,5,7&elapsed=84  as above, with the timer at 1:24
//   ?shot=hint&found=1,3,4,6,8 start playing and fire a hint highlight
//   ?shot=win              show the win modal with all 8 differences found
// With no params the game opens on the start overlay, as a player sees it.
import { SpotDifferenceGame } from './game.js';
import { DIFFERENCES } from './differences.js';

const game = new SpotDifferenceGame(document.getElementById('app'));

function parseFound(search) {
  const raw = search.get('found') ?? '';
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => DIFFERENCES.some((d) => d.id === n));
}

function parseElapsed(search) {
  const raw = Number(search.get('elapsed'));
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : null;
}

function applyShotMode() {
  const search = new URLSearchParams(window.location.search);
  const shot = search.get('shot');
  if (!shot || shot === 'start') return;
  const found = parseFound(search);
  const elapsed = parseElapsed(search);
  if (shot === 'play' || shot === 'hint') {
    game.start('apprentice');
    // A mid-game shot should show a plausible clock, not 0:01 after several
    // finds; the timer keeps ticking from here, so the shot reads ~1:24.
    if (elapsed !== null) {
      game.elapsed = elapsed;
      game.updateHud();
    }
    game.presetFound(found);
    if (shot === 'hint') game.useHint();
  } else if (shot === 'win') {
    game.start('apprentice');
    game.presetFound(DIFFERENCES.map((d) => d.id));
    // A win is reached by finding the last difference, so finish the game
    // through the real path: score the finds, then close it out.
    game.score = 800;
    game.clicks = 8;
    game.correctClicks = 8;
    game.elapsed = 147;
    game.win();
  }
}

applyShotMode();
