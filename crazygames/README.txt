Rainbow Run - CrazyGames upload
================================

Upload this zip on the CrazyGames developer portal (HTML5 game, index.html in the root).
Contents: index.html, three.min.js (three.js r128, loaded locally).

Submission form
- Under "Does your game save progress?" turn ON the data option.
  The game saves coins, unicorns, missions, records and unlocked worlds with the CrazyGames data module.
- Works with keyboard and touch, in landscape and portrait.

Scoreboard
- The in-game scoreboard (Today / This week / This month / All time) shows the player's own runs, saved with the progress.
- CrazyGames leaderboard: only for games CrazyGames invites. Once invited, paste the encryption key from the
  developer portal into CG_LB_KEY in index.html; scores are then sent with SDK.user.submitScore after each run.

Ads
- Midgame ad: only when the player presses "Play again" after a run.
- Rewarded ad: "Watch an ad to continue" on the game-over screen (one revive per run).

Testing
- Use the CrazyGames QA Tool from the developer portal.
- Locally the SDK only runs on localhost (environment "local"); ads show a placeholder there.
