// Screenshots of the main screens at desktop and phone sizes. Usage: node shots.js <outdir> [file]
const { launch } = require('./harness');
const { setupSim } = require('./sim');
const out = process.argv[2] || '.';
const SIZES = [['desk', 1280, 720, false], ['phoneP', 390, 844, true], ['phoneL', 844, 390, true]];
(async () => {
  for (const [nm, w, h, mob] of SIZES) {
    const { browser, page, errors } = await launch({ width: w, height: h, mobile: mob, file: process.argv[3] });
    const s = await setupSim(page);
    const snap = async tag => { await page.evaluate(() => { const R = __rr.renderer; R.render = R.__render; __step(1); R.render = () => {}; }); await page.screenshot({ path: `${out}/${nm}-${tag}.png` }); };
    await snap('menu');
    await page.evaluate(() => __rr.startRun());
    await s.step(150, 'pro'); await snap('play');
    await s.step(600, 'pro'); await snap('play2');
    await page.evaluate(() => { __rr.G.invT = 0; __rr.G.mode = 'play'; });
    await s.run(120, 'idle'); await s.step(200);
    await snap('over');
    for (const b of ['shopBtn', 'misBtn']) { await page.evaluate(() => __rr.toMenu()); await page.click('#' + b); await snap(b); }
    console.log(nm, 'errors', errors);
    await browser.close();
  }
})();
