# Rainbow Run – Game Improvement Log

## Phase 1 – Project analysis (v1.0.0 baseline)

**Tech:** one self-contained `rainbow-run.html` (~4,100 lines), three.js r128, Web Audio procedural music, CrazyGames SDK v3 wrapper (Poki adapter swapped in by `build.py`). Save = one JSON blob under `rainbowrun_v1` in CrazyGames `SDK.data` (fallback `localStorage`).

**Game loop:** 3-lane endless runner. Speed 14 → 34 m/s (reached at ~4.4 km). Obstacle rows every `max(11, speed·0.82+2)` m; kinds `low` (jump), `high` (roll), `full` (dodge), plus ice/portal specials. Stars feed a combo multiplier (x1–x10, lost when a started star line is missed) and the Magic Boost meter. 8 worlds of 700 m each, unlocked by distance; 6 unicorns with passives; 9 lifetime missions × 5 levels + 3 daily challenges; personal scoreboard; rewarded revive + midgame ad.

**Strengths:** very polished art and music, 8 distinct worlds, good juice (crash animations, multiplier pops), solid SDK handling, prop baking to cut draw calls, adaptive pixel ratio.

**Top 10 improvement points (prioritised by player impact / retention / risk / effort):**

| # | Issue | Impact | Risk | Effort |
|---|---|---|---|---|
| 1 | No in-run onboarding: first obstacle arrives after ~3 s, controls are only listed in small menu text. An idle player crashes at ~98 m (measured). | Very high (first 30 s) | Low | Small |
| 2 | Coins have only one sink (6 unicorns, 9,500 coins total). No upgrades → little long-term choice. | High (retention) | Medium (save format) | Medium |
| 3 | Game-over screen does not show coins earned or the next goal → weak "one more run" pull. | High | Low | Small |
| 4 | No in-run sense of progress towards the next world / milestones. | Medium-high | Low | Small |
| 5 | No reason to come back tomorrow besides daily challenges (no streak/daily gift). | Medium-high | Low | Small |
| 6 | Heavy scenes: 600–1,700 draw calls and up to 1 M triangles per frame (measured). Risky on low-end mobile. | Medium (mobile) | Medium | Medium |
| 7 | Source HTML has no `<meta charset>`: arrow glyphs show as mojibake when the source/test build is opened directly (seen in screenshot). | Medium (QA/test build) | Very low | Tiny |
| 8 | Escape does not leave sub-menus; no keyboard restart after game over. | Low-medium | Very low | Tiny |
| 9 | No skill reward for close dodges (near misses) – gameplay is purely avoid/collect. | Medium | Low | Small |
| 10 | Early game difficulty: double rows (2 lanes blocked) from the very first row for new players. | Medium | Low | Small |

## Phase 2 – Test setup

- `tests/harness.js` – Playwright (pre-installed Chromium, SwiftShader WebGL). Serves the game with three.js from `crazygames/three.min.js` (CDN is blocked in this sandbox), blocks SDK/font hosts, and exposes internals on `window.__rr` **only in the test page** (production code untouched).
- `tests/sim.js` – stops the rAF loop and steps the game at a fixed 60 fps with rendering stubbed, plus bots: `idle`, `novice` (late, 18 % misses), `pro` (lane planning, timed jumps/rolls).
- `tests/functional.js` – 30 regression checks (menus, Escape, mute, lanes/jump/roll/boost, pause, crash → game over, save/localStorage, reload, v1.0.0 save compatibility, no JS errors).
- `tests/balance.js` – bot runs for difficulty probing; `tests/shots.js` – screenshots at 1280×720, 390×844 and 844×390.

**Not testable here:** real FPS (SwiftShader renders at ~2 fps, so FPS numbers are not representative – draw calls/triangles were measured instead), real touch hardware, the live CrazyGames SDK (ads, `SDK.data`), audio output.

**Baseline measurements:** boot ≈ 26 s under SwiftShader (8 world thumbnails rendered at boot); idle player dies at 98 m / 10 s; novice bot 140–540 m; pro bot 1–8 km. No JS errors.

---
