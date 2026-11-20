// Screenshots of game over / pause / gift / upgrades at phone sizes. Usage: node uishots.js <outdir>
const { launch } = require('./harness');
const { setupSim } = require('./sim');
const out = process.argv[2] || '.';
(async () => {
  for (const [nm, w, h] of [['P', 390, 844], ['L', 844, 390]]) {
    const { browser, page, errors } = await launch({ width: w, height: h, mobile: true });
    const s = await setupSim(page);
    const shot = async t => { await page.evaluate(() => { const R = __rr.renderer; R.render = R.__render; __step(1); R.render = () => {}; }); await page.screenshot({ path: `${out}/u${nm}-${t}.png` }); };
    await page.evaluate(() => { __rr.save.tut = 1; __rr.save.coins = 900; __rr.startRun(); });
    await s.step(300, 'pro'); await page.evaluate(() => { document.getElementById('pauseBtn').click(); }); await shot('pause');
    await page.evaluate(() => { document.getElementById('resumeBtn').click(); __rr.G.invT = 0; });
    await s.run(120, 'idle'); await s.step(200); await shot('over');
    const ov = await page.evaluate(() => { const p = document.querySelector('#over .panel'); return [p.scrollHeight, p.clientHeight]; });
    console.log(nm, 'over panel scroll/client', ov);
    await page.evaluate(() => __rr.toMenu()); await shot('gift');
    await page.evaluate(() => { document.getElementById('giftBtn').click(); document.getElementById('shopBtn').click(); document.querySelector('#shopTabs .tab[data-t=upg]').click(); }); await shot('upg');
    console.log(nm, errors);
    await browser.close();
  }
})();
