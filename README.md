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

## Building

```
python3 build.py
```

Change `VERSION` and `BUILD_DATE` near the top of the script in `rainbow-run.html` before a release; the menu shows them.

## Controls

- Keyboard: ← → / A D switch lanes, ↑ / W / Space jump, ↓ / S roll (dives down in the air), Shift / E / B Magic Boost, P / Esc pause.
- Mobile: swipe left, right, up or down; tap the Magic Boost button.
