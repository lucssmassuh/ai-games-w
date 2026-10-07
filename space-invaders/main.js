(async function () {
  'use strict';
  const read = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    try { return await response.json(); } catch { throw new Error(`${url}: invalid JSON`); }
  };
  try {
    const manifest = await read('levels/campaign.json');
    if (!Array.isArray(manifest.levels) || !manifest.levels.length || manifest.levels.some(f => !/^[\w-]+\.json$/.test(f))) throw new Error('levels/campaign.json: expected a non-empty list of JSON filenames');
    const levels = await Promise.all(manifest.levels.map(async file => Neon.validateLevel(await read(`levels/${file}`), file)));
    const metadata = await read('assets/sprites/sprites.json');
    window.neonCampaign = levels;
    window.neonSprites = metadata;
    const resources = [metadata.player.file, ...Object.values(metadata.aliens).map(x => x.file), ...Object.values(metadata.powerups).map(x => x.file)].map(f => `assets/sprites/${f}`);
    cc.game.onStart = function () {
      try {
        cc.view.adjustViewPort(false);
        cc.view.enableRetina(true);
        const frame = document.getElementById('game-frame');
        const resize = () => {
          cc.view.setFrameSize(frame.clientWidth, frame.clientHeight);
          cc.view.setDesignResolutionSize(Neon.WIDTH, Neon.HEIGHT, cc.ResolutionPolicy.SHOW_ALL);
        };
        resize();
        new ResizeObserver(resize).observe(frame);
        cc.loader.load(resources, function (error) {
          if (error) { NeonUI.error(new Error('Unable to load sprite textures. Check assets/sprites/.')); return; }
          try {
            resources.forEach(file => cc.textureCache.getTextureForKey(file)?.setAliasTexParameters());
            NeonUI.init(levels);
            cc.director.runScene(new NeonScene());
          } catch (e) { NeonUI.error(e); }
        });
      } catch (error) { NeonUI.error(error); }
    };
    cc.game.run();
  } catch (error) { NeonUI.error(error); }
})();
