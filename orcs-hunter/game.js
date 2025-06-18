// game.js

var GameLayer = cc.Layer.extend({
    hero: null,
    orcs: [],
    orcFrames: [],
    dragons: [],
    arrows: [],
    arrowFrame: null,
    castle: null,
    background: null,

    // Draw debug rectangle for collision visualization
    drawDebugRect: function(rect, color) {
        if (!this.debugNode) {
            this.debugNode = new cc.DrawNode();
            this.addChild(this.debugNode, 999); // Add on top of everything
        }
        
        // Draw rectangle border
        this.debugNode.drawRect(
            cc.p(rect.x, rect.y),
            cc.p(rect.x + rect.width, rect.y + rect.height),
            color,
            1,
            color
        );
    },

    // Castle power bar state and nodes
    castlePower: 0,
    maxCastlePower: 0,
    powerBarBg: null,
    powerBar: null,

    // Update the castle power bar visuals
    updatePowerBar: function() {
        if (!this.powerBarBg || !this.powerBar) return;
        this.powerBarBg.clear();
        this.powerBar.clear();
        var x = 10;
        var h = 20;
        var y = cc.winSize.height - h - 10;
        var w = 200;
        this.powerBarBg.drawRect(
            cc.p(x, y), cc.p(x + w, y + h),
            cc.color(0, 0, 0, 255), 1, cc.color(0, 0, 0, 255)
        );
        var pct = Math.max(0, this.castlePower) / this.maxCastlePower;
        this.powerBar.drawRect(
            cc.p(x + 1, y + 1), cc.p(x + 1 + (w - 2) * pct, y + h - 1),
            cc.color(0, 255, 0, 255), 0, cc.color(0, 255, 0, 255)
        );
    },

    // Decrease castle power by one and refresh bar
    decrementCastlePower: function() {
        this.castlePower = Math.max(0, this.castlePower - 1);
        this.updatePowerBar();
    },

    /**
     * Draw discrete health bars above enemies that have been hit (health < maxHealth).
     * Applies to orcs (including big orcs) and dragons.
     */
    drawHealthBars: function() {
        if (!this.orcHealthBarLayer) return;
        this.orcHealthBarLayer.clear();
        var barWidth = 20, barHeight = 0.5, barSpacing = 2;
        var enemies = this.orcs.concat(this.dragons);
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (typeof e.health !== 'number' || e.health >= e.maxHealth || e.health <= 0) continue;
            var segments = e.maxHealth;
            var currentSegments = e.health;
            var segmentWidth = (barWidth - (segments - 1) * barSpacing) / segments;
            var pos = e.getPosition();
            var heightHalf = e.getContentSize().height * e.getScaleY() / 2;
            var startX = pos.x - barWidth / 2;
            var startY = pos.y + heightHalf + 10;
            for (var s = 0; s < segments; s++) {
                var x1 = startX + s * (segmentWidth + barSpacing);
                var y1 = startY;
                var color = s < currentSegments ? cc.color(255, 0, 0, 255)
                                              : cc.color(128, 128, 128, 255);
                this.orcHealthBarLayer.drawRect(
                    cc.p(x1, y1), cc.p(x1 + segmentWidth, y1 + barHeight),
                    color, 1, color
                );
            }
        }
    },

    ctor: function () {
        this._super();
        
        // Initialize arrays and variables
        this.orcs = [];
        this.arrows = [];
        this.keys = {};
        this.debugNode = null;

        // Add background (z-order: -1 to be behind everything)
        console.log("Creating background...");
        this.background = new cc.Background();
        if (this.background) {
            console.log("Background created, adding to scene...");
            this.background.setPosition(0, 0);
            this.background.setAnchorPoint(0, 0);
            this.addChild(this.background, -1);
            console.log("Background added to scene");
        } else {
            console.error("Failed to create background!");
        }

        // Create and add castle
        console.log("Creating castle instance...");
        this.castle = new cc.Castle();
        console.log("Adding castle to scene...");
        this.castle.setPosition(20, 0); // Move castle 20 pixels to the right
        this.addChild(this.castle);
        console.log("Castle added to scene, position:", this.castle.getPosition());
        // Initialize castle power and display its bar
        this.maxCastlePower = 1000;
        this.castlePower = this.maxCastlePower;
        this.powerBarBg = new cc.DrawNode();
        this.powerBar = new cc.DrawNode();
        this.addChild(this.powerBarBg, 1000);
        this.addChild(this.powerBar, 1000);

        // Layer for drawing orcs' health bars
        this.orcHealthBarLayer = new cc.DrawNode();
        this.addChild(this.orcHealthBarLayer, 1000);
        this.updatePowerBar();


        // Load the orc texture
        this.orcTexture = cc.textureCache.addImage("assets/orc.png");
        if (!this.orcTexture) {
            console.error("Failed to load orc.png");
            return;
        }

        // Initialize hero
        this.hero = new Hero();
        // Add hero with z-order 0 (bottom layer)
        this.addChild(this.hero, 0);


        // Prepare arrow projectile frame (first of 10)
        var arrowTexture = cc.textureCache.addImage("assets/arrow.png");
        var arrowFrameWidth = arrowTexture.width / 10;
        this.arrowFrame = new cc.SpriteFrame(
            arrowTexture,
            cc.rect(0, 0, arrowFrameWidth, arrowTexture.height)
        );
        Arrow.arrowFrame = this.arrowFrame;
        this.arrows = [];
        this.hero.arrows = this.arrows;
        this.dragons = [];

        // Score display and coin animation (initial coins for purchases)
        this.score = 20;
        var coinTexture = cc.textureCache.addImage("assets/coin.png");
        var frameW = coinTexture.width / 8;
        var frameH = coinTexture.height;
        this.coinFrames = [];
        for (var i = 0; i < 8; i++) {
            this.coinFrames.push(
                new cc.SpriteFrame(
                    coinTexture,
                    cc.rect(i * frameW, 0, frameW, frameH)
                )
            );
        }
        this.coinSprite = new cc.Sprite(this.coinFrames[0]);
        this.addChild(this.coinSprite, 1000);
        this.coinSprite.setAnchorPoint(1, 1);
        this.coinSprite.setScale(1.3);
        // Position UI (coin + score) shifted 200px towards center from right edge
        var uiX = cc.winSize.width - 10 - 200;
        var uiY = cc.winSize.height - 10;
        this.coinSprite.setPosition(uiX, uiY);
        this.scoreLabel = new cc.LabelTTF(this.score.toString(), "Arial", 24);
        this.addChild(this.scoreLabel, 1000);
        this.scoreLabel.setAnchorPoint(0, 1);
        // Place score text immediately to the right of the coin
        this.scoreLabel.setPosition(
            this.coinSprite.getPositionX() + 5,
            this.coinSprite.getPositionY()
        );
        this.scoreLabel.setString(this.score.toString());

        // Arrow selection UI: icons at bottom-left (32×32)
        this.arrowTypes = [
            { type: 'normal',    icon: 'assets/a-one.png',      cost: 1 },
            { type: 'explosive', icon: 'assets/a-explossive.png', cost: 6 },
            { type: 'triple',    icon: 'assets/a-3x.png',       cost: 3 }
        ];
        this.currentArrowType = 0;
        this.arrowIcons = [];
        var iconPadding = 10;
        var iconSize = 32;
        // Place icons slightly above bottom to allow stock display below
        var baseY = iconPadding * 2 + iconSize / 2;
        for (var i = 0; i < this.arrowTypes.length; i++) {
            var info = this.arrowTypes[i];
            var tex = cc.textureCache.addImage(info.icon);
            var icon = new cc.Sprite(tex);
            icon.setScale(iconSize / icon.getContentSize().width,
                          iconSize / icon.getContentSize().height);
            icon.setPosition(
                iconPadding + i * (iconSize + iconPadding) + iconSize / 2,
                baseY
            );
            this.addChild(icon, 1000);
            this.arrowIcons.push(icon);
        }
        this.updateArrowUI = function() {
            for (var j = 0; j < this.arrowIcons.length; j++) {
                this.arrowIcons[j].setColor(
                    j === this.currentArrowType
                        ? cc.color(255, 255, 255)
                        : cc.color(128, 128, 128)
                );
            }
        };
        this.updateArrowUI();

        // Initialize arrow stock inventory (ordinary, explosive, triple)
        // Initialize arrow stock inventory (ordinary, explosive, triple)
        this.arrowStock = [20, 0, 0];
        this.arrowStockLabels = [];
        this.arrowStockBg = [];
        var stockWidth = iconSize;
        var stockHeight = 16;
        var stockPadding = 2;
        for (var k = 0; k < this.arrowIcons.length; k++) {
            var ic = this.arrowIcons[k];
            var x = ic.getPositionX();
            // Draw background rectangle under icon
            var bg = new cc.DrawNode();
            var topY = baseY - iconSize / 2 - stockPadding;
            bg.drawRect(
                cc.p(x - stockWidth/2, topY - stockHeight),
                cc.p(x + stockWidth/2, topY),
                cc.color(0, 0, 0, 200), 0, cc.color(0, 0, 0, 200)
            );
            this.addChild(bg, 1000);
            this.arrowStockBg.push(bg);
            // Add label for stock count
            var lbl = new cc.LabelTTF(this.arrowStock[k].toString(), "Arial", 12);
            lbl.setColor(cc.color(255, 255, 255));
            lbl.setPosition(x, topY - stockHeight/2);
            this.addChild(lbl, 1001);
            this.arrowStockLabels.push(lbl);
        }
        this.updateArrowStockUI = function() {
            for (var m = 0; m < this.arrowStockLabels.length; m++) {
                this.arrowStockLabels[m].setString(this.arrowStock[m].toString());
            }
        };
        this.updateArrowStockUI();
        
        // Schedule auto-loading of regular arrows (1 per 2 seconds)
        this.schedule(function() {
            if (this.arrowStock[0] < 20) {  // Max 20 regular arrows
                this.arrowStock[0]++;
                this.updateArrowStockUI();
            }
        }.bind(this), 2.0);  // Every 2.0 seconds

        // Set arrow z-order to be above hero but below orcs
        Arrow.zOrder = 1;

        // Load waves configuration and start the waves
        var wavesConfig = cc.loader.getRes("waves.json");
        this.waves = (wavesConfig && wavesConfig.waves) || [];
        this.currentWaveIndex = 0;
        this.startNextWave();

        this.scheduleUpdate();

        return true;
    },

    update: function (dt) {

        // Update arrows with motion, including gravity, rotation, and removal handled by Arrow.update
        for (var a = this.arrows.length - 1; a >= 0; a--) {
            var arr = this.arrows[a];
            arr.update(dt);
            // Remove arrow from tracking if it was removed from the scene
            if (!arr.getParent()) {
                this.arrows.splice(a, 1);
                continue;
            }
            // Check collision with orcs
            for (var o = this.orcs.length - 1; o >= 0; o--) {
                var orc = this.orcs[o];
                if (orc.isDying) continue;
                var collision = typeof orc.checkCollisionWith === 'function'
                                ? orc.checkCollisionWith(arr)
                                : cc.rectIntersectsRect(
                                    orc.getBoundingBox(),
                                    arr.getBoundingBox()
                                  );
            if (collision) {
                        var hitPos = arr.getPosition();
                        arr.removeFromParent();
                        this.arrows.splice(a, 1);
                        if (arr.explosive) {
                            this.spawnExplosion(hitPos);
                            // Damage all enemies within explosion radius
                            var enemies = this.orcs.concat(this.dragons);
                            for (var j = enemies.length - 1; j >= 0; j--) {
                                var e = enemies[j];
                                if (e.isDying) continue;
                                var ep = e.getPosition();
                                if (cc.pDistance(ep, hitPos) <= arr.explosionRadius) {
                                    e.takeDamage(1);
                                    this.spawnBlood(ep);
                                    if (e.health <= 0) this.incrementScore(e.maxHealth);
                                }
                            }
                        } else {
                            this.spawnBlood(hitPos);
                            orc.takeDamage(1);
                            if (orc.health <= 0) this.incrementScore(orc.maxHealth);
                        }
                        break;
                    }
            }
            // Check collision with dragons
            for (var d = this.dragons.length - 1; d >= 0; d--) {
                var dragon = this.dragons[d];
                if (dragon.isDying) continue;
            if (cc.rectIntersectsRect(
                        dragon.getBoundingBox(),
                        arr.getBoundingBox()
                    )) {
                    var hitPosD = arr.getPosition();
                    arr.removeFromParent();
                    this.arrows.splice(a, 1);
                    if (arr.explosive) {
                        this.spawnExplosion(hitPosD);
                        var enemies = this.orcs.concat(this.dragons);
                        for (var j = enemies.length - 1; j >= 0; j--) {
                            var e = enemies[j];
                            if (e.isDying) continue;
                            var ep = e.getPosition();
                            if (cc.pDistance(ep, hitPosD) <= arr.explosionRadius) {
                                e.takeDamage(1);
                                this.spawnBlood(ep);
                                if (e.health <= 0) this.incrementScore(e.maxHealth);
                            }
                        }
                    } else {
                        this.spawnBlood(hitPosD);
                        dragon.takeDamage(1);
                        if (dragon.health <= 0) this.incrementScore(dragon.maxHealth);
                    }
                    break;
                }
            }
        }

        // Draw health bars for hit enemies
        this.drawHealthBars();
    },

    spawnBlood: function(pos) {
        var b = new Blood();
        b.setPosition(pos);
        this.addChild(b, 4);
    },

    /**
     * Spawn explosion effect at given position (circle) and fade it out.
     * @param {cc.Point} pos - Center of explosion
     */
    spawnExplosion: function(pos) {
        var explosion = new cc.DrawNode();
        explosion.drawDot(pos, 30, cc.color(255, 150, 0, 128));
        this.addChild(explosion, 5);
        explosion.runAction(cc.sequence(
            cc.fadeOut(0.5),
            cc.callFunc(function() { explosion.removeFromParent(); })
        ));
    },

    /**
     * Increment score by a given amount and animate coin.
     * @param {number} amount - Points to add for the kill
     */
    incrementScore: function(amount) {
        this.score += amount;
        this.scoreLabel.setString(this.score.toString());
        if (!this.coinSprite.getNumberOfRunningActions()) {
            var anim = new cc.Animation(this.coinFrames, 0.1);
            var act = new cc.Animate(anim);
            var seq = cc.sequence(
                act,
                cc.callFunc(function() {
                    this.coinSprite.setSpriteFrame(this.coinFrames[0]);
                }, this)
            );
            this.coinSprite.runAction(seq);
        }
    },

    startMoveDown: function () {
        this.isMoving = true;
        this.direction = 'down';

        var texture = cc.textureCache.addImage("assets/hero.png");
        var frameWidth = texture.width / 4;
        var frameHeight = texture.height / 4;

        this.moveFrames = [];
        var row = 0; // 1st row (index 0)

        for (var x = 0; x < 4; x++) {
            var frame = new cc.SpriteFrame(
                texture,
                cc.rect(x * frameWidth, row * frameHeight, frameWidth, frameHeight)
            );
            this.moveFrames.push(frame);
        }

        var moveAnim = new cc.Animation(this.moveFrames, 0.1);
        moveAnim.setRestoreOriginalFrame(false);
        var moveAnimate = new cc.Animate(moveAnim);

        var moveAction = cc.moveBy(0.1, cc.p(0, -5));

        var spawnActions = cc.spawn(moveAnimate, cc.repeat(moveAction, 4));

        var sequence = cc.sequence(
            spawnActions,
            cc.callFunc(function () {
                this.isMoving = false;
                // Return to first frame of row 1 after movement
                this.sprite.setSpriteFrame(this.frames[0]); // First frame of row 1
            }, this)
        );

        this.sprite.stopAllActions();
        this.sprite.setFlippedX(false);
        this.sprite.runAction(sequence);
    },

    shootArrow: function() {
        var arrow = new Arrow(this.hero.direction, this.hero.getPosition());
        this.addChild(arrow, Arrow.zOrder || 3);
        this.arrows.push(arrow);
        var angle = {up: 90, right: 0, down: -90, left: 180}[this.hero.direction];
    },
    spawnOrc: function() {
        var baseY = this.castle.getOrcBaseY();
        var baseX = cc.winSize.width + 50;
        var o = new Orc(this);
        o.init(this.orcTexture);
        var jitterX = baseX + (Math.random() * 40 - 20);
        var jitterY = baseY + (Math.random() * 20 - 10);
        o.setPosition(jitterX, jitterY);
        this.addChild(o, 3);
        this.orcs.push(o);
    },
    // Spawn a stronger orc with higher attackPower
    spawnBigOrc: function() {
        var baseY = this.castle.getOrcBaseY();
        var baseX = cc.winSize.width + 50;
        var o = new BigOrc(this);
        if (!o.init()) return;
        var jitterX = baseX + (Math.random() * 40 - 20);
        var jitterY = baseY + (Math.random() * 20 - 10);
        o.setPosition(jitterX, jitterY);
        this.addChild(o, 3);
        this.orcs.push(o);
    },
    spawnDeath: function() {
        var baseY = this.castle.getOrcBaseY();
        var baseX = cc.winSize.width + 50;
        var d = new Death(this);
        if (!d.init()) return;
        var jitterX = baseX + (Math.random() * 40 - 20);
        var jitterY = baseY + (Math.random() * 20 - 10);
        d.setPosition(jitterX, jitterY);
        this.addChild(d, 3);
        this.orcs.push(d);
    },

    spawnWizzard: function() {
        var baseY = this.castle.getOrcBaseY();
        var baseX = cc.winSize.width + 50;
        var w = new Wizzard(this);
        if (!w.init()) return;
        var jitterX = baseX + (Math.random() * 40 - 20);
        var jitterY = baseY + (Math.random() * 20 - 10);
        w.setPosition(jitterX, jitterY);
        this.addChild(w, 3);
        this.orcs.push(w);
    },

    spawnDragon: function() {
        var d = new cc.Dragon(this);
        var pos = d.getPosition();
        var jitterX = pos.x + (Math.random() * 40 - 20);
        var jitterY = pos.y + (Math.random() * 40 - 20);
        d.setPosition(jitterX, jitterY);
        this.addChild(d, 2);
        this.dragons.push(d);
    },
    startNextWave: function() {
        if (this.currentWaveIndex >= this.waves.length) {
            var label = new cc.LabelTTF("All waves complete!", "Arial", 36);
            label.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
            this.addChild(label, 1000);
            return;
        }
        var wave = this.waves[this.currentWaveIndex];
        var announcement = new cc.LabelTTF(wave.name, "Arial", 40);
        announcement.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        announcement.setColor(cc.color(255, 0, 0));
        this.addChild(announcement, 1000);
        announcement.runAction(cc.sequence(
            cc.delayTime(2),
            cc.fadeOut(1),
            cc.callFunc(function() { this.removeChild(announcement); }, this)
        ));
        var lastTime = 0;
        this.spawnScheduleComplete = false;
        wave.events.forEach(function(evt) {
            lastTime = Math.max(lastTime, evt.time);
            this.scheduleOnce(function() {
                for (var i = 0; i < evt.count; i++) {
                    if (evt.type === "orc") {
                        this.spawnOrc();
                    } else if (evt.type === "big-orc") {
                        this.spawnBigOrc();
                    } else if (evt.type === "wizzard") {
                        this.spawnWizzard();
                    } else if (evt.type === "death") {
                        this.spawnDeath();
                    } else if (evt.type === "dragon") {
                        this.spawnDragon();
                    }
                }
            }, evt.time / 1000);
        }, this);
        this.scheduleOnce(function() {
            this.spawnScheduleComplete = true;
        }, lastTime / 1000);
        var checkWaveDone = function() {
            if (this.spawnScheduleComplete && this.orcs.length === 0 && this.dragons.length === 0) {
                this.currentWaveIndex++;
                this.startNextWave();
                this.unschedule(checkWaveDone);
            }
        }.bind(this);
        this.schedule(checkWaveDone, 0.5);
    },
    // Keyboard input handling methods
    onKeyPressed: function(keyCode, event) {
        // Prevent default browser handling (e.g., Tab navigation)
        if (event && event._event) {
            event._event.preventDefault && event._event.preventDefault();
            event._event.stopPropagation && event._event.stopPropagation();
        }
        this.keys[keyCode] = true;
        if (keyCode === cc.KEY.tab) {
            this.currentArrowType = (this.currentArrowType + 1) % this.arrowTypes.length;
            this.updateArrowUI();
        }
    },

    onKeyReleased: function(keyCode, event) {
        console.log('Key released:', keyCode);
        this.keys[keyCode] = false;
        
        if (keyCode === cc.KEY['1'] || keyCode === cc.KEY.num1) {
            console.log('Trying to buy normal arrow');
            var c1 = this.arrowTypes[0].cost;
            console.log('Current score:', this.score, 'Cost:', c1);
            if (this.score >= c1) {
                console.log('Purchase successful');
                this.score -= c1;
                this.scoreLabel.setString(this.score.toString());
                this.arrowStock[0]++;
                this.currentArrowType = 0; // Select normal arrow
                this.updateArrowStockUI();
                this.updateArrowUI();
                console.log('New arrow count:', this.arrowStock[0]);
            } else {
                console.log('Not enough score to purchase');
            }
        } else if (keyCode === cc.KEY['2'] || keyCode === cc.KEY.num2) {
            console.log('Trying to buy explosive arrow');
            var c2 = this.arrowTypes[1].cost;
            if (this.score >= c2) {
                this.score -= c2;
                this.scoreLabel.setString(this.score.toString());
                this.arrowStock[1]++;
                this.currentArrowType = 1; // Select explosive arrow
                this.updateArrowStockUI();
                this.updateArrowUI();
            }
        } else if (keyCode === cc.KEY['3'] || keyCode === cc.KEY.num3) {
            console.log('Trying to buy triple arrow');
            var c3 = this.arrowTypes[2].cost;
            if (this.score >= c3) {
                this.score -= c3;
                this.scoreLabel.setString(this.score.toString());
                this.arrowStock[2]++;
                this.currentArrowType = 2; // Select triple arrow
                this.updateArrowStockUI();
                this.updateArrowUI();
            }
        }
    },
    
    onEnter: function() {
        this._super();
        
        // Enable keyboard input
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.onKeyPressed.bind(this),
            onKeyReleased: this.onKeyReleased.bind(this)
        }, this);
        
        this.scheduleUpdate();
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});