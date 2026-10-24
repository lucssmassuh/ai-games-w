/* Cocos2d scene: native terrain, destructible masonry and cannon sprites.
 * The existing simulation paints its HUD and transient effects onto an overlay.
 */
window.startCastleRenderer = function (game) {
    const W = 1440, H = 900;
    function textureFromCanvas(canvas) {
        const texture = new cc.Texture2D();
        texture.initWithElement(canvas);
        texture.handleLoadedTexture();
        texture.setAliasTexParameters();
        return texture;
    }
    // Small, code-authored sprite textures keep a consistent physical pixel size.
    function pixelTexture(width, height, paint) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        paint(canvas.getContext('2d'));
        return textureFromCanvas(canvas);
    }
    function rect(ctx, color, x, y, w, h) {
        ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    }
    const Scene = cc.Scene.extend({
        onEnter: function () {
            this._super();
            const landscape = new cc.Sprite('assets/medieval-landscape.png');
            landscape.getTexture().setAliasTexParameters();
            // Generated horizon is at 75%; align it with the simulation's ground.
            landscape.setAnchorPoint(0, 0);
            landscape.setScaleX(W / landscape.width);
            landscape.setScaleY(H * 1.22 / landscape.height);
            landscape.setPosition(0, -H * .215);
            this.addChild(landscape, -10);
            this.rebuildStones();
            const barrel = pixelTexture(38, 10, c => {
                rect(c, '#211e19', 0, 1, 38, 8);
                rect(c, '#745330', 2, 2, 34, 6);
                rect(c, '#c8a35b', 2, 2, 34, 2);
                rect(c, '#423725', 2, 7, 34, 1);
                [7, 16, 25, 34].forEach(x => {
                    rect(c, '#322b22', x, 0, 2, 10);
                    rect(c, '#e0bd74', x, 1, 1, 3);
                });
            });
            this.cannonNodes = game.cannons.map((cannon, side) => {
                const base = pixelTexture(40, 24, c => {
                    rect(c, '#33261c', 2, 9, 36, 8);
                    rect(c, '#a2763d', 4, 9, 32, 3);
                    rect(c, side ? '#9e3930' : '#355f8e', 13, 5, 15, 5);
                    [9, 30].forEach(x => {
                        rect(c, '#25241e', x-7, 10, 14, 12);
                        rect(c, '#25241e', x-5, 8, 10, 16);
                        rect(c, '#926b3c', x-4, 11, 8, 10);
                        rect(c, '#d3b16d', x-1, 10, 2, 12);
                        rect(c, '#d3b16d', x-5, 15, 10, 2);
                        rect(c, '#30291e', x-1, 15, 3, 3);
                    });
                });
                const carriage = new cc.Sprite(base);
                carriage.setScale(2); carriage.setAnchorPoint(.5, 0);
                this.addChild(carriage, 2);
                const gun = new cc.Sprite(barrel);
                gun.setAnchorPoint(.1, .5); gun.setScale(2);
                this.addChild(gun, 1);
                return {carriage, gun};
            });
            const overlayTexture = textureFromCanvas(game.canvas);
            const overlay = new cc.Sprite(overlayTexture);
            overlay.setAnchorPoint(0, 0); overlay.setPosition(0, 0);
            this.addChild(overlay, 10);
            window.castleRenderer = this;
            this.scheduleUpdate();
        },
        rebuildStones: function () {
            if (this.stones) this.stones.flat(2).forEach(tile => tile.removeFromParent());
            this.stones = game.castles.map((castle, side) => {
                const tiles = [];
                for (let row = 0; row < castle.stones.length; row++) {
                    tiles[row] = [];
                    for (let col = 0; col < castle.stones[row].length; col++) {
                        // Existing pixel atlas: coursed stone, windows and banners.
                        const isFlag = row === 0 && col % 2 === 0;
                        const sx = isFlag ? (side ? 96 : 160) :
                            row === 4 && col % 2 === 1 ? 32 : 192;
                        const sy = isFlag ? 32 : 0;
                        const tile = new cc.Sprite('castle-tileset.png', cc.rect(sx, sy, 32, 32));
                        tile.getTexture().setAliasTexParameters();
                        tile.setAnchorPoint(0, 1);
                        this.addChild(tile);
                        tiles[row][col] = tile;
                    }
                }
                return tiles;
            });
        },
        update: function () {
            game.tick();
            if (game.castles.some((castle, side) => castle.stones.length !== this.stones[side].length)) this.rebuildStones();
            game.castles.forEach((castle, side) => {
                this.stones[side].forEach((row, r) => row.forEach((tile, col) => {
                    const health = castle.stones[r][col];
                    tile.setVisible(health > 0);
                    tile.setPosition(castle.x + col * castle.width / castle.stones[0].length, H - castle.y - r * castle.width / castle.stones[0].length);
                    tile.setScale(castle.width / castle.stones[0].length / 32);
                    tile.setColor(health === 1 ? cc.color(115, 100, 78) : health === 2 ? cc.color(184, 169, 138) : cc.color.WHITE);
                }));
            });
            game.cannons.forEach((cannon, side) => {
                const nodes = this.cannonNodes[side];
                nodes.carriage.setPosition(cannon.x, H - cannon.y);
                const elapsed = Date.now() - (cannon.fireTime || 0);
                const recoil = elapsed < 200 ? Math.sin(elapsed / 200 * Math.PI) * 8 : 0;
                const angle = cannon.angle * Math.PI / 180;
                nodes.gun.setPosition(cannon.x + (side ? 10 : -10) - Math.cos(angle) * recoil,
                    H - cannon.y + 22 + Math.sin(angle) * recoil);
                nodes.gun.setRotation(cannon.angle);
            });
        }
    });
    cc.game.onStart = function () {
        cc.view.setDesignResolutionSize(W, H, cc.ResolutionPolicy.SHOW_ALL);
        cc.view.resizeWithBrowserSize(true);
        cc.LoaderScene.preload(['assets/medieval-landscape.png', 'castle-tileset.png'], function () {
            cc.director.runScene(new Scene());
        });
    };
    // Canvas rendering makes the live simulation overlay a zero-copy sprite texture.
    document.fonts.load('12px "Press Start 2P"').catch(() => {}).then(function () {
        cc.game.run({id: 'gameCanvas', renderMode: 1, frameRate: 60, debugMode: 0, showFPS: false, jsList: []});
    });
};
