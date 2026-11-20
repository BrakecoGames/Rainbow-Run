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
## Iteration 1 – Quick UX/QA fixes
- **Problem:** source and test build had no `<meta charset>` (arrow keys rendered as `â†`); Escape did not leave Unicorns/Missions/Scores; no keyboard way to restart after a crash.
- **Change:** added `<meta charset="utf-8">` (stripped again by `build.py` so platform builds keep a single charset tag); Escape closes sub-menus; Space/Enter on the game-over screen = Play again (0.7 s guard so a held jump key cannot skip the results; hint hidden on touch devices).
- **Files:** `rainbow-run.html`, `build.py`, `tests/*` (new).
- **Tests:** `tests/functional.js` 30/30 pass; build script OK.
- **Remaining:** none.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 6.5* | 7* | 8.5* | 7 | 6.5* | 6* | 6* | 8 | 7* | 7* |

`*` = expert estimate; others are backed by automated tests (stability: 0 JS errors across all suites; UX: menu/keyboard flows tested).

## Iteration 2 – First-run tutorial
- **Problem:** a new player got no in-run guidance; the first obstacle comes after ~3 s and an idle player crashed at 98 m within 10 s.
- **Change:** for a fresh save the first three rows are scripted (dodge → jump → roll). A hint pill ("Swipe up to jump" / "Press ↑ or Space to jump", touch/keyboard aware) appears, and time slows to 22 % in the last 7.5 m until the player performs the action. A crash on a tutorial obstacle is forgiven. A 6-star line at the start gives a reward within ~1 s, a star line rewards the first dodge. After the tutorial: toast + jingle, `save.tut = 1`. The first 250 m have fewer double rows (12 % instead of 30 %). Existing saves with progress skip the tutorial (migration).
- **Files:** `rainbow-run.html`, `tests/tutorial.js` (new).
- **Tests:** `tests/tutorial.js` 16/16 (hint shown, slow motion, each action passes, flag saved, no tutorial on run 2, idle new player survives the tutorial); `functional.js` 30/30 incl. legacy-save check.
- **Remaining:** hint copy is English only (as is the whole game).

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7* | 8.5* | 8 | 6.5* | 6.5* | 6* | 8 | 7.5* | 7.5* |

## Iteration 3 – Upgrades shop
- **Problem:** coins had a single sink (6 unicorns); after buying them there was nothing to save up for, and no strategic choices between runs.
- **Change:** the "Unicorns" menu button became **Shop** with two tabs: *Unicorns* and *Upgrades*. Four upgrades with 5 levels each (200 / 450 / 800 / 1,400 / 2,200 coins = 20,200 coins total): Magnet, 2x Stars and Superjump last +2 s per level; Magic boost charges +15 % faster per level. Level pips show progress, the button shows the next price. A yellow dot on the Shop button appears when something is affordable. Save gets `upg: {}` (old saves are migrated automatically).
- **Files:** `rainbow-run.html`, `tests/functional.js`.
- **Tests:** functional suite 41/41 (tabs, purchase + coin deduction, pip, dot on/off, upgraded magnet lasts 10 s, legacy save).
- **Remaining:** coin income per run is low (≈5 coins per gold coin; a 1 km run gives ~25 coins), handled in iteration 4.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7* | 8.5* | 8 | 7.5 | 7* | 6* | 8 | 7.5* | 7.5* |

## Iteration 4 – Rewarding game-over screen
- **Problem:** the game-over screen did not show what the run *earned* or what to aim for next; coin income was ~25 coins per km, so upgrades/unicorns felt far away. Also found a bug: active power-up chips (e.g. "Magnet 5s") stayed on screen over the game-over panel and menu.
- **Change:** distance bonus of 1 coin per 20 m (paid at game over / quit, never twice after a revive). Game-over panel shows **"+N coins (incl. X distance bonus)"**, a **Next goal** card (next world to unlock with progress bar and metres to go, otherwise the mission closest to completion) and a **Shop** button with the affordability dot. "Coins" stat renamed "Gold coins" to avoid confusion. Compact layout for short landscape screens. Chips are cleared on game over and on returning to the menu.
- **Files:** `rainbow-run.html`, `tests/functional.js`.
- **Tests:** functional 46/46 (bonus = ⌊d/20⌋, earned text, next-goal text, Shop from game over + Escape back, chips cleared, Space restart), tutorial 16/16.
- **Remaining:** none known.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7* | 8.5* | 8.5 | 8 | 7.5* | 6* | 8.5 | 7.5* | 8* |

## Iteration 5 – In-run progress feedback
- **Problem:** during a run there was no visible progress towards the next world and beating your record went unnoticed until game over.
- **Change:** thin rainbow progress bar along the top edge shows progress through the current world; in the last 20 % a label "Enchanted Forest in 120 m" fades in. When the score passes the saved record a "New record! · Keep going" banner + jingle plays once per run.
- **Files:** `rainbow-run.html`, `tests/functional.js`.
- **Tests:** functional 49/49 (record banner, bar fills, next-world label near the end, save/reload).
- **Remaining:** none.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7.5* | 8.5* | 8.5 | 8 | 7.5* | 6* | 8.5 | 7.5* | 8* |

## Iteration 6 – Daily gift streak
- **Problem:** apart from the daily challenges there was little reason to come back tomorrow.
- **Change:** a Daily gift panel when entering the menu once per day: 7-day streak 50 / 75 / 100 / 150 / 200 / 300 / 500 coins; a missed day restarts at day 1 (no punishment beyond that, no timers or pressure copy). Brand-new players see it only after the tutorial, so the very first session goes straight to playing. Enter/Space/Escape collect. Save gets `gift: {last, streak}`; existing players simply get day 1.
- **Files:** `rainbow-run.html`, `tests/gift.js` (new), `tests/harness.js`, `tests/functional.js`.
- **Tests:** gift 10/10 (not for new players, day 1, once per day, streak continues, Enter collects, reset after gap, cap at day 7); functional 51/51 (existing save gets the gift, coins correct).
- **Remaining:** none.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7.5* | 8.5* | 8.5 | 8 | 8* | 6* | 8.5 | 7.5* | 8* |

## Iteration 7 – Rendering performance (draw calls)
- **Problem:** 600–1,700 draw calls and up to 1 M triangles per frame (measured with `renderer.info`). Decor props were already merged per material, but obstacles were not (e.g. Sunset Skies: 379 obstacle meshes on screen). There was no fallback beyond lowering the pixel ratio.
- **Change:** obstacles are now baked with the existing `bakeProp` merger at full detail (no sphere LOD swap, spinning parts kept separate via `spinNode`); merged geometry is disposed through a single `dropObs()` helper on every removal path (incl. revive). Adaptive *low detail*: only when FPS stays < 40 for two 2-second windows while the pixel ratio is already at its floor (≤ 0.75), 65 % of far props and 60 % of side clouds are skipped for new spawns; turns off again at > 58 FPS.
- **Files:** `rainbow-run.html`, `tests/harness.js`.
- **Tests:** draw-call probe per world: obstacle meshes 2–9× fewer (W2 119→27, W6 220→51, W8 379→40); low-detail mode cuts total draw calls 10–30 % and triangles up to 50 %. Visual A/B gallery of all obstacle types (old vs baked, same seed): identical. All suites pass.
- **Not testable here:** real FPS on devices (SwiftShader only); low-detail thresholds are an estimate.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8 | 7.5* | 8.5 | 8.5 | 8 | 8* | 7* | 8.5 | 8* | 8* |

## Iteration 8 – Close-call bonus (+ tutorial pacing fix)
- **Problem:** gameplay rewarded only avoiding and collecting; skilful late dodges gave no feedback. While testing, found that the first random row came only ~13 m after the last tutorial row (rowGap switched to normal immediately) – a likely first-run crash.
- **Change:** leaving a lane less than 0.42 s before its obstacle passes = **Close call!** (+50 × multiplier points, +6 % boost meter, pop-up text and chime; not during boost or on tutorial rows). New mission line "Make N close calls" (10 / 40 / 120 / 300 / 800; daily 8). New stat `close` in lifetime/daily stats with safe defaults for old saves. Rows stay 34 m apart until the tutorial is completed.
- **Files:** `rainbow-run.html`, `tests/functional.js`, `tests/tutorial.js`.
- **Tests:** functional 53/53 (last-moment dodge → close call; early dodge → none); tutorial 16/16 ×3 runs (previously flaky 2 of 3 because of the row-gap bug); gift 10/10.
- **Remaining:** none known.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 8* | 8.5 | 8.5 | 8 | 8* | 7* | 9 | 8* | 8* |

## Iteration 9 – Toast queue and ad-less revive button
- **Problem:** several mission/world toasts could stack (4+ seen in screenshots) and cover the track right where obstacles appear. Without an ad SDK (e.g. ad blocker) the "Watch an ad to continue" button was shown but could only answer with an error toast.
- **Change:** toasts are queued, at most two on screen; queued ones follow after 2.2 s. During a run they are smaller and sit below the multiplier (on short landscape screens: just above the boost button). The revive button is hidden when the ad SDK is not available (still shown in the test build).
- **Files:** `rainbow-run.html`, `tests/functional.js`, `tests/harness.js`, `tests/shots.js`, `README.md`.
- **Tests:** functional 55/55 (max two toasts, queued toast appears later).
- **Remaining:** none.

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 8* | 8.5 | 9 | 8 | 8* | 7* | 9 | 8* | 8.5* |

## Iteration 10 – Daily challenges on the pause screen
- **Problem:** the pause screen was empty (Resume / Sound / Quit); players had to quit a run to see how close they were to today's challenges.
- **Change:** the pause panel lists today's three challenges with live progress bars (shared `renderDaily()` with the Missions screen; compact on short landscape screens).
- **Files:** `rainbow-run.html`, `tests/functional.js`.
- **Tests:** functional 56/56 (pause shows 3 challenges).

| Eerste indruk | Gameplay | Visueel | UX | Progressie | Retentie | Performance | Stabiliteit | Mobiel | CrazyGames |
|---|---|---|---|---|---|---|---|---|---|
| 8.5 | 8* | 8.5 | 9 | 8.5 | 8* | 7* | 9 | 8* | 8.5* |

