// Long-session soak test: many runs with the pro bot; watches geometry/texture counts and object arrays.
const { launch } = require('./harness');
const { setupSim } = require('./sim');
(async () => {
  const { browser, page, errors } = await launch();
  const s = await setupSim(page);
  const mem = () => page.evaluate(() => ({ geo: __rr.renderer.info.memory.geometries, tex: __rr.renderer.info.memory.textures, sceneKids: __rr.scene.children.length, obs: __rr.obstacles.length, items: __rr.items.length, decor: __rr.decor.length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : -1 }));
  // count geometries via a real render each sample
  const sample = async tag => { await page.evaluate(() => { const R = __rr.renderer; R.render = R.__render; __step(1); R.render = () => {}; }); console.log(tag, JSON.stringify(await mem())); };
  await page.evaluate(() => { __rr.save.tut = 1; });
  let total = 0, runs = 0; const dists = [];
  await sample('start');
  while (total < 600) {
    await page.evaluate(() => __rr.startRun());
    const t0 = await page.evaluate(() => __simNow);
    const r = await s.run(180, 'pro');
    total += (await page.evaluate(() => __simNow) - t0) / 1000; runs++; dists.push(r.d);
    await s.step(200);
    if (runs % 3 === 0) await sample(`after ${runs} runs (${Math.round(total)} s)`);
  }
  await page.evaluate(() => __rr.toMenu());
  await sample('menu');
  console.log('runs', runs, 'distances', dists.join(','), 'errors', errors);
  await browser.close();
})();
