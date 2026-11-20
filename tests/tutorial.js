// First-run tutorial checks.
const { launch } = require('./harness');
const { setupSim } = require('./sim');
let fails = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fails++; };
(async () => {
  const { browser, page, errors } = await launch();
  const s = await setupSim(page);
  const ev = (f, a) => page.evaluate(f, a);
  ok(await ev(() => __rr.save.tut === 0), 'fresh save has tutorial pending');
  await page.click('#playBtn');
  // first reward: star line right at the start
  await s.step(120);
  ok(await ev(() => __rr.G.stars >= 4), 'first stars collected within 2 s (' + await ev(() => __rr.G.stars) + ')');
  const keys = { lane: 'ArrowLeft', jump: 'ArrowUp', roll: 'ArrowDown' };
  for (const k of ['lane', 'jump', 'roll']) {
    let seen = false, slow = false;
    for (let i = 0; i < 400 && !slow; i++) {
      await s.step(5);
      seen = seen || await page.isVisible('#hint');
      const d0 = await ev(() => __rr.G.d); await s.step(1); const dd = await ev(() => __rr.G.d) - d0;
      slow = dd < 0.12;
    }
    ok(seen, `${k}: hint shown (${await page.textContent('#hintTx')})`);
    ok(slow, `${k}: time slows down before the obstacle`);
    if (k === 'lane') { await page.screenshot({ path: process.env.SHOT || '/dev/null' }).catch(() => {}); }
    await page.keyboard.press(keys[k]);
    await s.step(90);
    ok(await ev(() => __rr.G.mode === 'play'), `${k}: player passes the obstacle`);
  }
  await s.step(120);
  ok(await ev(() => __rr.save.tut === 1), 'tutorial marked done and saved');
  ok(!(await page.isVisible('#hint')), 'hint hidden after tutorial');
  // second run: no tutorial rows
  await ev(() => { __rr.G.invT = 0; });
  await s.run(60, 'idle'); await s.step(200);
  await ev(() => __rr.startRun());
  ok(await ev(() => __rr.obstacles.every(o => !o.tut)), 'no tutorial on the next run');
  // idle new player: tutorial crashes are forgiven
  await ev(() => { __rr.save.tut = 0; __rr.startRun(); });
  await s.step(60 * 25);
  ok(await ev(() => __rr.G.d > 125 && __rr.save.tut === 1), 'idle new player survives the tutorial (d=' + Math.floor(await ev(() => __rr.G.d)) + ')');
  ok(errors.length === 0, 'no JS errors ' + errors.join('|'));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
