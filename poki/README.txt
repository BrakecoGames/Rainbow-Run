Rainbow Run - Poki build
========================

Upload the contents of this folder (index.html + three.min.js) to Poki for Developers.

Poki SDK v2
- PokiSDK.init() at start; the game keeps working if it fails (e.g. ad blocker).
- gameLoadingFinished() once the menu is ready.
- gameplayStart() when a run starts or resumes, gameplayStop() on pause, game over or quit.
- commercialBreak() before "Play again"; audio is muted and keyboard input is ignored during the break.
- rewardedBreak({ size: 'medium' }) for "Watch an ad to continue"; the revive is only given when it returns true.
- Arrow keys, space and the mouse wheel do not scroll the page.

Saving
- Progress is stored in localStorage (Poki has no cloud save in the SDK).
