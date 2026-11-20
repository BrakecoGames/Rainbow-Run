// Functional regression tests. Usage: node functional.js
const { launch } = require('./harness');
const { setupSim } = require('./sim');
let fails = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fails++; };
(async () => {
  const { browser, ctx, page, errors } = await launch();
  const s = await setupSim(page);
  const ev = f => page.evaluate(f);
  ok(await ev(() => __rr.G.mode === 'menu'), 'boots into menu');
  ok(await ev(() => document.characterSet === 'UTF-8'), 'page is UTF-8');
  // sub screens + Escape
  for (const [btn, id] of [['shopBtn', 'shop'], ['misBtn', 'missions'], ['lbBtn', 'scores']]) {
    await page.click('#' + btn);
    ok(await page.isVisible('#' + id), `${btn} opens ${id}`);
    await page.keyboard.press('Escape');
    ok(await page.isVisible('#menu') && !(await page.isVisible('#' + id)), `Escape closes ${id}`);
  }
  // upgrades shop
  await ev(() => { __rr.save.coins = 1000; __rr.toMenu(); });
  ok(await page.isVisible('#shopDot'), 'shop dot shows when something is affordable');
  await page.click('#shopBtn'); await page.click('#shopTabs .tab[data-t=upg]');
  ok(await page.isVisible('#upgList') && !(await page.isVisible('#shopGrid')), 'Upgrades tab shows upgrade list');
  ok(await page.locator('#upgList .upg').count() === 4, '4 upgrades listed');
  await page.locator('#upgList .upg').first().locator('button').click();
  ok(await ev(() => __rr.save.upg.magnet === 1 && __rr.save.coins === 800), 'buying magnet level 1 costs 200');
  ok(await page.locator('#upgList .upg').first().locator('.pips i.on').count() === 1, 'level pip shown');
  await page.screenshot({ path: process.env.SHOT || '/dev/null' }).catch(() => {});
  await page.click('#shopTabs .tab[data-t=uni]'); ok(await page.isVisible('#shopGrid'), 'Unicorns tab back');
  await page.keyboard.press('Escape');
  await ev(() => { __rr.save.coins = 0; __rr.toMenu(); });
  ok(!(await page.isVisible('#shopDot')), 'shop dot hidden when nothing is affordable');
  // mute toggle persists
  await page.click('#muteBtn'); ok(await ev(() => __rr.save.muted === true), 'mute toggles');
  await page.click('#muteBtn'); ok(await ev(() => __rr.save.muted === false), 'unmute toggles');
  // play
  await page.click('#playBtn');
  ok(await ev(() => __rr.G.mode === 'play'), 'Play starts a run');
  await s.step(240, 'pro'); await ev(() => { __rr.G.invT = 30; });
  ok(await ev(() => __rr.G.d > 40), 'unicorn moves forward');
  const lane0 = await ev(() => __rr.G.lane);
  await page.keyboard.press('ArrowLeft'); ok(await ev(() => __rr.G.lane) === Math.max(0, lane0 - 1), 'ArrowLeft switches lane');
  await page.keyboard.press('ArrowUp'); await s.step(5, 'pro'); ok(await ev(() => __rr.G.y > 0), 'ArrowUp jumps');
  await s.step(60, 'pro');
  await page.keyboard.press('ArrowDown'); ok(await ev(() => __rr.G.rollT > 0), 'ArrowDown rolls');
  // pause / resume
  await page.keyboard.press('p'); ok(await ev(() => __rr.G.mode === 'pause') && await page.isVisible('#pause'), 'P pauses');
  await page.keyboard.press('Escape'); ok(await ev(() => __rr.G.mode === 'play'), 'Escape resumes');
  // collect + boost
  await ev(() => { __rr.G.boost = 1; }); await page.keyboard.press('Shift'); ok(await ev(() => __rr.G.boostT > 0), 'Shift uses magic boost');
  await ev(() => { const it = { type: 'magnet', mesh: { position: { x: 0, y: 1, z: 0 } } }; __rr.collect(it); });
  ok(await ev(() => __rr.G.power.magnet > 9.9), 'upgraded magnet lasts 10 s');
  // run until death
  await ev(() => { __rr.G.invT = 0; });
  const r = await s.run(300, 'idle'); await s.step(200);
  ok(r.mode !== 'play' && await ev(() => __rr.G.mode === 'over') && await page.isVisible('#over'), 'idle player crashes, game-over screen shown');
  const ov = await ev(() => ({ d: __rr.G.d, bonus: __rr.G.distBonus, earned: __rr.save.coins - __rr.G.coins0, txt: document.getElementById('oEarnN').textContent, goal: document.getElementById('oGoalT').textContent }));
  ok(ov.bonus === Math.floor(ov.d / 20) && ov.earned >= ov.bonus && ov.txt === `+${ov.earned.toLocaleString('en-US')} coins`, `coins earned shown incl. distance bonus (${ov.txt}, bonus ${ov.bonus})`);
  ok(/Run .* m in one run to reach Enchanted Forest/.test(ov.goal) && await page.isVisible('#oGoal'), 'next goal shows next world: ' + ov.goal);
  await page.screenshot({ path: (process.env.SHOT || '/dev/null').replace('.png', '-over.png') }).catch(() => {});
  ok(await ev(() => document.getElementById('chips').children.length === 0), 'power-up chips cleared on game over');
  await page.click('#oShop'); ok(await page.isVisible('#shop'), 'Shop opens from game over');
  await page.keyboard.press('Escape'); ok(await page.isVisible('#over'), 'Escape returns to game over');
  const best = await ev(() => __rr.save.best);
  ok(best > 0, 'record saved after run');
  ok(await ev(() => JSON.parse(localStorage.getItem('rainbowrun_v1')).best) === best, 'save written to localStorage');
  ok(await ev(() => __rr.save.runs.length === 1), 'run recorded on scoreboard');
  // mid-run record banner
  await ev(() => document.activeElement.blur()); await page.waitForTimeout(800); await page.keyboard.press('Space');
  await ev(() => { __rr.G.invT = 99; __rr.G.score = __rr.save.best + 1; }); await s.step(40, 'pro');
  ok(await ev(() => __rr.G.recShown && /New record/.test(document.getElementById('banner').textContent)), 'New record banner during the run');
  ok(await ev(() => parseFloat(document.getElementById('wprogF').style.width) > 0), 'world progress bar fills');
  await ev(() => { __rr.G.d = 650; }); await s.step(2, 'pro');
  ok(await ev(() => /Enchanted Forest in \d+ m/.test(document.getElementById('wprogL').textContent) && document.getElementById('wprog').classList.contains('near')), 'next world label near the end');
  await ev(() => { __rr.G.invT = 0; }); await s.run(300, 'idle'); await s.step(200);
  // space restarts after a short delay
  await ev(() => document.activeElement.blur()); await page.waitForTimeout(800); await page.keyboard.press('Space');
  ok(await ev(() => __rr.G.mode === 'play'), 'Space on game-over plays again');
  await s.step(120, 'pro');
  // quit from pause
  await page.keyboard.press('p'); await page.click('#quitBtn');
  ok(await ev(() => __rr.G.mode === 'menu'), 'Quit returns to menu');
  ok(await ev(() => __rr.save.runs.length === 3), 'quit run recorded');
  // reload keeps progress
  const coins = await ev(() => __rr.save.coins), best2 = await ev(() => __rr.save.best);
  await page.reload(); await page.waitForFunction(() => window.__rr && !document.getElementById('menu').hidden, null, { timeout: 60000 });
  ok(await ev(() => __rr.save.best) === best2 && await ev(() => __rr.save.coins) === coins, 'progress survives reload');
  // legacy save loads (v1.0.0 format)
  await ev(() => { localStorage.setItem('rainbowrun_v1', JSON.stringify({ coins: 777, owned: ['sparkle', 'golden'], selected: 'golden', best: 4321, muted: false, life: { stars: 10, coins: 1, jumps: 2, rolls: 3, powerups: 0, boosts: 0, dist: 900, score: 4321, unicorns: ['sparkle'] }, mlevel: { stars: 0 }, daily: null, maxWorld: 1, startWorld: 1, runs: [] })); });
  await page.reload(); await page.waitForFunction(() => window.__rr && !document.getElementById('menu').hidden, null, { timeout: 60000 });
  ok(await ev(() => __rr.save.coins === 777 && __rr.save.selected === 'golden' && __rr.save.best === 4321 && __rr.save.maxWorld === 1), 'v1.0.0 save loads unchanged');
  await setupSim(page); await page.click('#playBtn'); await s.step(120, 'pro');
  ok(await ev(() => __rr.G.mode === 'play' && __rr.G.world === 1), 'legacy save starts in chosen world');
  ok(errors.length === 0, 'no JS errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})();
