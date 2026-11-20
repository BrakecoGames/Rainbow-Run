# Rainbow Run – The Unicorn Adventure

A colourful 3D unicorn endless runner made with HTML and three.js (r128), by Brakeco Games.

**Version 1.0.0 · 7 November 2026**

## Files

| Path | What it is |
| --- | --- |
| `rainbow-run.html` | The game source: one self-contained HTML file (loads three.js from a CDN). Edit this one. |
| `rainbow-run-test.html` | Test build: all unicorns and worlds unlocked, world picker, invincible mode. |
| `crazygames/` | CrazyGames build (SDK v3) with a local `three.min.js`. |
| `poki/` | Poki build (SDK v2) with a local `three.min.js`. |
| `dist/` | Ready-to-upload zips for CrazyGames and Poki. |
| `build.py` | Rebuilds the test build, both platform folders and the zips from `rainbow-run.html`. |
| `tests/` | Playwright tests (functional, tutorial, daily gift), gameplay bots, balance probe and screenshot script. |
| `GAME_IMPROVEMENT_LOG.md` | Changelog of the improvement iterations with test results and scores. |

## Building

```
python3 build.py
```

Change `VERSION` and `BUILD_DATE` near the top of the script in `rainbow-run.html` before a release; the menu shows them.

## Controls

- Keyboard: ← → / A D switch lanes, ↑ / W / Space jump, ↓ / S roll (dives down in the air), Shift / E / B Magic Boost, P / Esc pause.
- Mobile: swipe left, right, up or down; tap the Magic Boost button.

## Features added after 1.0.0

- First-run tutorial (dodge, jump, roll) with hints and slow motion; skipped for existing players.
- Shop with **Upgrades**: Magnet, 2x Stars and Superjump last longer, Magic boost charges faster (5 levels each).
- Game-over summary: coins earned (incl. a distance bonus of 1 coin per 20 m), next goal and a Shop shortcut.
- World progress bar and a "New record!" banner during the run.
- Daily gift with a 7-day streak (50 → 500 coins).
- Close calls: dodge out of a lane at the last moment for bonus points (+ new mission).
- Obstacle meshes are merged (fewer draw calls) and far decor is thinned out automatically on slow devices.

Old saves (`rainbowrun_v1`) load unchanged; new fields (`tut`, `upg`, `gift`, `close`) get defaults.

## Testing

```
cd tests
node functional.js   # menus, controls, saving, upgrades, game over, close calls
node tutorial.js     # first-run tutorial
node gift.js         # daily gift streak
node balance.js      # bot runs (idle / novice / pro)
node shots.js <dir>  # screenshots at desktop and phone sizes
```

The harness serves the game with `crazygames/three.min.js`, so no network is needed. It needs Playwright with Chromium.
