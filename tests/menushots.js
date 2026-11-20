// Quick menu/over screenshots at phone sizes. Usage: node menushots.js <outdir>
const { launch } = require('./harness');
const { setupSim } = require('./sim');
const out = process.argv[2] || '.';
(async () => {
  for (const [nm, w, h] of [['P', 390, 844], ['L', 844, 390], ['L2', 740, 360]]) {
    const { browser, page, errors } = await launch({ width: w, height: h, mobile: true });
    await setupSim(page);
    await page.evaluate(() => { const R = __rr.renderer; R.render = R.__render; __step(1); R.render = () => {}; });
    await page.screenshot({ path: `${out}/m${nm}.png` });
    const play = await page.locator('#playBtn').boundingBox();
    console.log(nm, 'play button', JSON.stringify(play), 'in view:', play && play.y + play.height <= h, errors);
    await browser.close();
  }
})();
