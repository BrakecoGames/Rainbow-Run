// Playwright harness for Rainbow Run.
// Serves rainbow-run.html with three.js from crazygames/three.min.js (no CDN needed),
// exposes internal state on window.__rr for tests, and blocks external SDK/font hosts.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const THREE_JS = fs.readFileSync(path.join(ROOT, 'crazygames', 'three.min.js'), 'utf8');
const HOOK = `\nwindow.__rr = { G, get save() { return save; }, set save(v) { save = v; }, obstacles, items, decor, startRun, toMenu, gameOver, revive, jump, roll, moveLane, useBoost, persist, loadSave, checkMissions, renderer, scene, cur, collect, crash, addMult, WORLDS, UNICORNS, get run() { return run; }, frame, QL, addObstacle, OBS };\n`;

function buildHtml(file = 'rainbow-run.html') {
  let s = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const i = s.lastIndexOf('})();\n</script>');
  if (i < 0) throw new Error('hook point not found');
  return s.slice(0, i) + HOOK + s.slice(i);
}

async function launch({ width = 1280, height = 720, mobile = false, file, storage } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext(mobile
    ? { viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
    : { viewport: { width, height }, deviceScaleFactor: 1 });
  const html = buildHtml(file);
  const errors = [];
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith('http://rr.local/')) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  if (storage) await ctx.addInitScript(s => { try { if (!sessionStorage.__seeded) { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.__seeded = 1; } } catch (e) {} }, storage);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('http://rr.local/', { timeout: 180000 });
  await page.waitForFunction(() => window.__rr && (!document.getElementById('menu').hidden || !document.getElementById('gift').hidden), null, { timeout: 60000 });
  return { browser, ctx, page, errors };
}
module.exports = { launch, buildHtml };
