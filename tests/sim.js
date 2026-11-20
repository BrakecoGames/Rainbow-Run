// Headless gameplay simulation: stops the render loop, stubs rendering and steps the game at 60 fps.
// Usage: const s = await sim(page); await s.run(seconds, botName)
async function setupSim(page) {
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const R = __rr.renderer; R.__render = R.render; R.render = () => {};
    window.__simNow = performance.now() + 1000;
    window.__step = (n, bot) => {
      for (let i = 0; i < n; i++) {
        if (bot) window.__bots[bot]();
        __simNow += 1000 / 60; __rr.frame(__simNow, true);
      }
    };
    const G = __rr.G, LANES = [-2.2, 0, 2.2];
    const danger = (lane, zmin, zmax) => __rr.obstacles.filter(o => !o.dead && o.kind !== 'ice' && o.kind !== 'portal' && o.lane === lane && (G.d - o.s) > zmin && (G.d - o.s) < zmax);
    let cool = 0;
    window.__bots = {
      idle() {},
      // a good player: dodges into a free lane, otherwise jumps lows / rolls highs
      pro() {
        if (G.mode !== 'play') return;
        if (cool > 0) cool--;
        // nearest threatening obstacle per lane (z < 0 is ahead)
        const next = L => { const l = danger(L, -60, 0.9); return l.length ? l.reduce((a, b) => a.s < b.s ? a : b) : null; };
        const zOf = o => o ? G.d - o.s : -99;
        const cost = L => { const o = next(L); if (!o) return 0; const z = zOf(o); if (z < -G.speed * 1.2) return 0; return o.kind === 'full' ? 9 : 1; };
        const lx = Math.round((G.x + 2.2) / 2.2);
        if (cool <= 0 && Math.abs(G.x - [-2.2, 0, 2.2][G.lane]) < 0.2) {
          const here = cost(G.lane);
          if (here > 0) {
            let best = G.lane, bc = here;
            for (const dl of [-1, 1]) { const L = G.lane + dl; if (L < 0 || L > 2) continue; const c = cost(L); if (c < bc) { bc = c; best = L; } }
            if (best !== G.lane) { __rr.moveLane(best - G.lane); cool = 4; }
          }
        }
        const o = next(G.lane); if (!o) return; const z = zOf(o);
        if (o.kind === 'low' && z > -G.speed * 0.3 && z < 0 && G.y <= 0.001) __rr.jump();
        else if (o.kind === 'high' && z > -G.speed * 0.2 && z < 0 && G.rollT <= 0.05) __rr.roll();
      },
      // a new player: reacts late and sometimes not at all
      novice() {
        if (G.mode !== 'play') return;
        if (cool > 0) { cool--; return; }
        const near = danger(G.lane, -6, 0.5);
        if (!near.length) return;
        cool = 12;
        if (Math.random() < 0.18) return; // misses it
        const o = near[0];
        for (const dl of [-1, 1]) { const L = G.lane + dl; if (L < 0 || L > 2) continue; if (!danger(L, -10, 2).length) { __rr.moveLane(dl); return; } }
        if (o.kind === 'low') __rr.jump(); else if (o.kind === 'high') __rr.roll();
      }
    };
  });
  return {
    step: (n, bot) => page.evaluate(([n, bot]) => window.__step(n, bot), [n, bot]),
    // run until death or time limit; returns stats
    async run(sec, bot, chunk = 600) {
      let t = 0;
      while (t < sec * 60) {
        await page.evaluate(([n, bot]) => window.__step(n, bot), [chunk, bot]); t += chunk;
        const m = await page.evaluate(() => __rr.G.mode);
        if (m !== 'play') break;
      }
      return page.evaluate(() => ({ mode: __rr.G.mode, d: Math.floor(__rr.G.d), score: Math.floor(__rr.G.score), stars: __rr.G.stars, coins: __rr.G.coins, maxMult: __rr.G.maxMult, world: __rr.G.world, saveCoins: __rr.save.coins }));
    },
    render: () => page.evaluate(() => { const R = __rr.renderer; R.__render.call(R, __rr.scene, R.__cam || null); }),
  };
}
module.exports = { setupSim };
