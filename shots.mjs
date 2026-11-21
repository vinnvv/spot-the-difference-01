// Polish-round verification + screenshots for The Thirteenth Chime.
// Serves game/ locally, checks the full-height layout, click mapping through
// the letterboxed SVG, keyboard/hint/win behaviour, zero non-local requests
// and zero console errors, then writes the 4 screenshots DIRECTLY into the
// repo's screenshots/ directory. Run: node shots.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/tmp/shot-tools/package.json');
const { chromium } = require('playwright');

const REPO = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.join(REPO, 'game');
const SHOTS = path.join(REPO, 'screenshots');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(GAME, p);
      if (!file.startsWith(GAME) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
}

const SCENE_W = 640;
const SCENE_H = 460;

(async () => {
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // The rect the scene art actually occupies on screen (SVG letterboxes
  // inside its panel), for one panel. Mirrors the game's own mapping.
  async function sceneBox(panel) {
    return page.evaluate((p) => {
      const svg = document.querySelector(p + ' .scene svg');
      const r = svg.getBoundingClientRect();
      const s = Math.min(r.width / 640, r.height / 460);
      const w = 640 * s;
      const h = 460 * s;
      return { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };
    }, panel);
  }

  async function clickScene(panel, sx, sy) {
    const box = await sceneBox(panel);
    await page.mouse.click(box.x + (sx / SCENE_W) * box.w, box.y + (sy / SCENE_H) * box.h);
  }

  // --- 1. Layout: the page fills 1280x800, no dead band at the bottom ---
  await page.goto(base + '/?shot=play&found=2,5,7&elapsed=84', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const layout = await page.evaluate(() => {
    const app = document.querySelector('#app').getBoundingClientRect();
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const keys = document.querySelector('.keys-hint').getBoundingClientRect();
    const panelA = document.querySelector('#panel-a').getBoundingClientRect();
    const svgA = document.querySelector('#panel-a .scene svg').getBoundingClientRect();
    const markersA = document.querySelector('#panel-a .markers').getBoundingClientRect();
    const s = Math.min(svgA.width / 640, svgA.height / 460);
    const contentW = 640 * s;
    const contentH = 460 * s;
    return {
      appBottom: Math.round(app.bottom),
      stageHeight: Math.round(stage.height),
      panelHeight: Math.round(panelA.height),
      keysBottom: Math.round(keys.bottom),
      scrollHeight: document.documentElement.scrollHeight,
      svgW: Math.round(svgA.width),
      svgH: Math.round(svgA.height),
      contentW: Math.round(contentW),
      contentH: Math.round(contentH),
      markersW: Math.round(markersA.width),
      markersH: Math.round(markersA.height),
      markersTop: Math.round(markersA.top - panelA.top),
      markersLeft: Math.round(markersA.left - panelA.left),
    };
  });
  console.log('LAYOUT', JSON.stringify(layout));
  check('page fills the viewport (app bottom ~800)', layout.appBottom >= 795 && layout.appBottom <= 800, `bottom=${layout.appBottom}`);
  check('keys-hint line sits near the bottom, no dead band', layout.keysBottom >= 775, `bottom=${layout.keysBottom}`);
  check('no vertical page scroll', layout.scrollHeight <= 801, `scrollHeight=${layout.scrollHeight}`);
  check('stage grew tall (was ~440)', layout.stageHeight > 550, `stage=${layout.stageHeight}`);
  check('scene is width-limited, letterboxed (content shorter than panel)', layout.contentH < layout.panelHeight - 50, `contentH=${layout.contentH} panelH=${layout.panelHeight}`);
  check('markers layer pinned to the drawn scene rect', Math.abs(layout.markersW - layout.contentW) <= 2 && Math.abs(layout.markersH - layout.contentH) <= 2, `markers=${layout.markersW}x${layout.markersH} content=${layout.contentW}x${layout.contentH}`);

  // --- 2. Cover preset: 3 found, plausible timer ---
  check('cover counter is 5 Remaining', (await page.textContent('#remaining')) === '5 Remaining');
  const timer = await page.textContent('#timer');
  check('cover timer reads a plausible mid-game 1:24-1:25', /^1:2[45]$/.test(timer), `timer=${timer}`);
  check('cover score is 300', (await page.textContent('#score')) === 'Score 300');
  check('six rings placed (3 diffs x both panels)', (await page.locator('.ring').count()) === 6);
  check('three tracker pips lit', (await page.locator('.pip.lit').count()) === 3);
  // A ring sits exactly on its difference: moon (id 2) at scene (330,74).
  const ringAligned = await page.evaluate(() => {
    const svg = document.querySelector('#panel-a .scene svg').getBoundingClientRect();
    const s = Math.min(svg.width / 640, svg.height / 460);
    const cx = svg.left + (svg.width - 640 * s) / 2 + (330 / 640) * 640 * s;
    const cy = svg.top + (svg.height - 460 * s) / 2 + (74 / 460) * 460 * s;
    const rings = [...document.querySelectorAll('#panel-a .ring')];
    return rings.some((r) => {
      const b = r.getBoundingClientRect();
      return Math.abs(b.left + b.width / 2 - cx) <= 3 && Math.abs(b.top + b.height / 2 - cy) <= 3;
    });
  });
  check('moon ring centred on the moon art', ringAligned);

  // --- 3. Clicks map through the letterbox: panel A, then panel B ---
  await clickScene('#panel-a', 104, 152); // pendulum, id 1
  await page.waitForTimeout(400);
  check('click on panel A marks a difference', (await page.textContent('#remaining')) === '4 Remaining');
  check('rings grow to 8', (await page.locator('.ring').count()) === 8);
  await clickScene('#panel-b', 557, 80); // shelf vessel, id 3
  await page.waitForTimeout(400);
  check('click on panel B marks a difference', (await page.textContent('#remaining')) === '3 Remaining');

  // --- 4. Misclick penalty, then a hint ---
  await clickScene('#panel-a', 250, 300); // empty wall area
  await page.waitForTimeout(300);
  check('misclick drops score by 10', (await page.textContent('#score')) === 'Score 490');
  await page.click('#hint-btn');
  await page.waitForTimeout(300);
  check('hint halo appears on both panels', (await page.locator('.hint-halo').count()) === 2);
  check('hints counter drops to 4', (await page.textContent('#hints-left')).includes('4 hint'));

  // --- 5. Find the rest, win modal ---
  for (const [x, y] of [[112, 248], [496, 212], [494, 415]]) {
    await clickScene('#panel-b', x, y);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  check('counter hits 0 Remaining', (await page.textContent('#remaining')) === '0 Remaining');
  check('all 8 tracker pips lit', (await page.locator('.pip.lit').count()) === 8);
  check('win modal appears', await page.isVisible('#end-modal'));
  check('win title is Time Restored', (await page.textContent('#end-title')) === 'Time Restored');

  // --- 6. Keyboard: arrows + Enter, H for hint, R for reset ---
  await page.goto(base + '/?shot=start', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.click('[data-difficulty="apprentice"]');
  await page.waitForTimeout(200);
  // Crosshair starts at scene centre (320,230); desk clock is at (320,350): 7 downs of 18px.
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  check('keyboard Enter marks a difference', (await page.textContent('#remaining')) === '7 Remaining');
  check('crosshair visible', (await page.locator('#crosshair.visible').count()) === 1);
  await page.keyboard.press('h');
  await page.waitForTimeout(200);
  check('H key fires a hint', (await page.locator('.hint-halo').count()) === 2);
  await page.keyboard.press('r');
  await page.waitForTimeout(300);
  check('R key resets to 8 Remaining', (await page.textContent('#remaining')) === '8 Remaining');

  // --- 7. Network + errors ---
  const external = requests.filter((u) => !u.startsWith(base) && !u.startsWith('data:'));
  check('zero non-local requests', external.length === 0, `${requests.length} total, ${external.length} external`);
  check('zero console/page errors', errors.length === 0, errors.join(' | '));

  // --- 8. Screenshots, written directly into screenshots/ ---
  async function shoot(name, query, wait) {
    await page.goto(base + query, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(SHOTS, name), type: 'jpeg', quality: 80 });
    const st = fs.statSync(path.join(SHOTS, name));
    console.log(`SHOT  ${name}  ${st.size} bytes`);
    check(`${name} under 256 KiB`, st.size < 262144, `${st.size} bytes`);
  }
  await shoot('1-cover.jpg', '/?shot=play&found=2,5,7&elapsed=84', 700);
  await shoot('2-start.jpg', '/?shot=start', 500);
  // Hint shot: retry until the halo lands on the cat (id 7), as before.
  let hintOk = false;
  for (let attempt = 1; attempt <= 8; attempt++) {
    await page.goto(base + '/?shot=hint&found=1,3,4,6,8&elapsed=196', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const log = await page.textContent('#find-log');
    if (log.includes('sleeping cat')) { hintOk = true; console.log(`HINT  cat halo on attempt ${attempt}`); break; }
    console.log(`HINT  attempt ${attempt}: ${log}`);
  }
  check('hint shot halo is on the sleeping cat', hintOk);
  await page.screenshot({ path: path.join(SHOTS, '3-hint.jpg'), type: 'jpeg', quality: 80 });
  const hintSt = fs.statSync(path.join(SHOTS, '3-hint.jpg'));
  console.log(`SHOT  3-hint.jpg  ${hintSt.size} bytes`);
  check('3-hint.jpg under 256 KiB', hintSt.size < 262144, `${hintSt.size} bytes`);
  await shoot('4-win.jpg', '/?shot=win', 800);

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
