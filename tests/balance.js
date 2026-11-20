// Balance probe: how far do idle / novice / pro players get?
const { launch } = require('./harness');
const { setupSim } = require('./sim');
(async () => {
  const { browser, page, errors } = await launch();
  const s = await setupSim(page);
  const res = {};
  for (const bot of ['idle', 'novice', 'novice', 'novice', 'pro', 'pro']) {
    await page.evaluate(() => __rr.startRun());
    const t0 = await page.evaluate(() => __simNow);
    const r = await s.run(+process.env.SEC || 600, bot);
    r.sec = Math.round((await page.evaluate(() => __simNow) - t0) / 1000);
    (res[bot] = res[bot] || []).push(r);
    await page.evaluate(() => { if (__rr.G.mode === 'dying') { __rr.gameOver(); } });
  }
  console.log(JSON.stringify(res, null, 1));
  console.log('errors', errors);
  await browser.close();
})();
