#!/usr/bin/env python3
"""Build Rainbow Run for every target from rainbow-run.html.

Outputs
  rainbow-run-test.html          test build (everything unlocked)
  crazygames/index.html          CrazyGames SDK v3 build (+ three.min.js)
  poki/index.html                Poki SDK v2 build (+ three.min.js)
  dist/rainbow-run-crazygames.zip, dist/rainbow-run-poki.zip
"""
import os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'rainbow-run.html')
CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'

POKI_ADAPTER = r"""const CG = {
  sdk: null, ready: false, muted: false, adBusy: false,
  load() {
    return new Promise(res => {
      if (window.PokiSDK) return res();
      if (/claude/i.test(location.hostname)) return res(); // preview host: no SDK
      const s = document.createElement('script');
      s.src = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
      s.onload = () => res(); s.onerror = () => res();
      document.head.appendChild(s);
      setTimeout(res, 3500);
    });
  },
  async init() {
    try {
      await this.load();
      if (window.PokiSDK) { await window.PokiSDK.init(); this.sdk = window.PokiSDK; this.ready = true; }
    } catch (e) { this.ready = false; } // e.g. an ad blocker: the game keeps working without ads
  },
  call(fn) { if (!this.ready) return; try { fn(this.sdk); } catch (e) {} },
  loadingStart() {},
  loadingStop() { this.call(s => s.gameLoadingFinished()); },
  start() { this.call(s => s.gameplayStart()); },
  stop() { this.call(s => s.gameplayStop()); },
  happy() {},
  lbOn() { return false; },
  async submitScore() {},
  ad(type, done, fail) {
    if (!this.ready) { (fail || done)(); return; }
    let finished = false;
    const begin = () => { this.adBusy = true; AU.duck(true); };
    const end = ok => { if (finished) return; finished = true; this.adBusy = false; AU.duck(false); ok ? done() : (fail || done)(); };
    try {
      if (type === 'rewarded') this.sdk.rewardedBreak({ size: 'medium', onStart: begin }).then(ok => end(!!ok)).catch(() => end(false));
      else this.sdk.commercialBreak(begin).then(() => end(true)).catch(() => end(true));
    } catch (e) { end(type !== 'rewarded'); }
  }
};"""


def doc(head, body, sdk_tag):
    return ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n'
            '<title>Rainbow Run</title>\n' + sdk_tag + '\n' + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')


def split(s):
    i = s.index('<canvas id="cv">')
    head, body = s[:i], s[i:]
    assert body.count(CDN) == 1
    return head.replace('<meta charset="utf-8">\n', '', 1).replace('<title>Rainbow Run</title>', ''), body.replace(CDN, '<script src="three.min.js"></script>')


def package(folder, zipname):
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    with zipfile.ZipFile(os.path.join(ROOT, 'dist', zipname), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(folder)):
            z.write(os.path.join(folder, f), f)


def main():
    s = open(SRC, encoding='utf-8').read()
    assert s.count('const TEST = false;') == 1

    # test build
    t = (s.replace('const TEST = false;', 'const TEST = true;', 1)
          .replace('<title>Rainbow Run</title>', '<title>Rainbow Run Test</title>', 1)
          .replace('<span class="sub">The Unicorn Adventure</span>', '<span class="sub">Test build</span>', 1))
    open(os.path.join(ROOT, 'rainbow-run-test.html'), 'w', encoding='utf-8').write(t)

    three = os.path.join(ROOT, 'crazygames', 'three.min.js')
    assert os.path.exists(three), 'crazygames/three.min.js (three.js r128) is required'

    # CrazyGames
    head, body = split(s)
    cg = doc(head, body, '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>')
    assert 'cdnjs' not in cg
    open(os.path.join(ROOT, 'crazygames', 'index.html'), 'w', encoding='utf-8').write(cg)
    package(os.path.join(ROOT, 'crazygames'), 'rainbow-run-crazygames.zip')

    # Poki
    a = s.index('const CG = {')
    b = s.index('\n};\n', a) + 3
    p = s[:a] + POKI_ADAPTER + s[b:]
    p = p.replace("PLATFORM = 'CrazyGames';", "PLATFORM = 'Poki';", 1)
    assert "PLATFORM = 'Poki';" in p and 'sdk.crazygames.com' not in p
    head, body = split(p)
    pk = doc(head, body, '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>')
    assert 'cdnjs' not in pk and 'sdk.crazygames.com' not in pk
    os.makedirs(os.path.join(ROOT, 'poki'), exist_ok=True)
    open(os.path.join(ROOT, 'poki', 'index.html'), 'w', encoding='utf-8').write(pk)
    shutil.copy(three, os.path.join(ROOT, 'poki', 'three.min.js'))
    open(os.path.join(ROOT, 'poki', 'README.txt'), 'w', encoding='utf-8').write(POKI_README)
    package(os.path.join(ROOT, 'poki'), 'rainbow-run-poki.zip')
    print('built test, crazygames, poki')


POKI_README = """Rainbow Run - Poki build
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
"""

if __name__ == '__main__':
    main()
