/* All playfield graphics are Cocos2d nodes, sprites and generated vector shapes. */
(function () {
  'use strict';
  const C = { cyan: '#45f5e5', pink: '#ff4caa', violet: '#a781f8', dim: '#25345b' };
  const color = (hex, alpha = 255) => { const c = cc.color(hex); c.a = alpha; return c; };
  const point = (x,y) => cc.p(x,y);
  const line = (node, x1,y1,x2,y2, hex, width = .7, alpha = 255) => node.drawSegment(point(x1,y1),point(x2,y2),width,color(hex,alpha));
  const rect = (node,x,y,w,h,hex,alpha = 255) => node.drawRect(point(x,y),point(x+w,y+h),color(hex,alpha),0,color(hex,alpha));
  const glowLine = (node,x1,y1,x2,y2,hex,width = 1) => {
    line(node,x1,y1,x2,y2,hex,width*4,14); line(node,x1,y1,x2,y2,hex,width*2,30); line(node,x1,y1,x2,y2,hex,width,200);
  };
  window.NeonScene = cc.Scene.extend({
    onEnter: function () { this._super(); this.addChild(new NeonLayer()); }
  });
  const NeonLayer = cc.Layer.extend({
    ctor: function () {
      this._super(); this.clock = 0; this.spriteNodes = new Map(); this.particles = []; this.fireworks = []; this.fireworkTimer = 0; this.fireworkCount = 0; this.flash = 0;
      this.staticGraphics = new cc.DrawNode(); this.addChild(this.staticGraphics,0);
      this.stars = new cc.DrawNode(); this.addChild(this.stars,1);
      this.haze = new cc.DrawNode(); this.addChild(this.haze,2);
      this.entityLayer = new cc.Node(); this.addChild(this.entityLayer,3);
      this.fx = new cc.DrawNode(); this.addChild(this.fx,4);
      this.player = new cc.Sprite('assets/sprites/player.png'); this.player.setScale(1.45); this.entityLayer.addChild(this.player);
      this.drawCity();
      this.scheduleUpdate(); return true;
    },
    drawCity: function () {
      const g = this.staticGraphics;
      rect(g,0,0,900,620,'#060b18');
      // A subtle indigo sky, rendered in bands without external artwork.
      for (let y=140;y<620;y+=8) rect(g,0,y,900,8,`#${(8+Math.floor((620-y)/100)).toString(16).padStart(2,'0')}1025`);
      // Large neon horizon and an orbital halo.
      for (let r=142;r>128;r-=2) g.drawCircle(point(450,188),r,0,96,false,.5,color(C.pink,8));
      g.drawCircle(point(450,188),128,0,96,false,.7,color(C.pink,38));
      glowLine(g,32,133,868,133,C.pink,.65);
      // Deterministic skyline; windows and signs are generated shapes.
      let seed = 2089;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let x=-10;x<910;) {
        const width=26+Math.floor(rnd()*35), height=45+Math.floor(rnd()*91);
        rect(g,x,98,width,height,'#0b1329');
        line(g,x,98+height,x+width,98+height,'#29325b',.7,150);
        for (let wy=111;wy<98+height-8;wy+=12) for (let wx=x+7;wx<x+width-5;wx+=10) if(rnd()>.4) rect(g,wx,wy,3,5,rnd()>.5 ? C.pink : C.cyan,Math.floor(rnd()*55)+12);
        if(rnd()>.6) glowLine(g,x+width-4,108,x+width-4,98+height,C.violet,.5);
        if(height>100) { line(g,x+width/2,98+height,x+width/2,118+height,'#364161',.5); g.drawDot(point(x+width/2,118+height),1.4,color(C.pink,180)); }
        x += width+5;
      }
      rect(g,0,0,900,99,'#080f21');
      // Perspective grid beneath the ship.
      for(let x=-450;x<1400;x+=90) line(g,450+(x-450)*.13,98,x,0,C.violet,.5,35);
      for(const y of [0,22,41,57,70,80,89,95,98]) line(g,0,y,900,y,C.cyan,.45,30);
      line(g,24,108,876,108,C.pink,.6,50);
      // Edge rails and a boundary marking the defense line.
      for(const x of [24,876]) { line(g,x,130,x,586,C.cyan,.45,28); for(let y=145;y<585;y+=28) line(g,x-3,y,x+3,y,C.cyan,.5,70); }
      for (let x=40;x<870;x+=18) line(g,x,110,x+7,110,C.pink,.5,90);
      const cityLabel = new cc.LabelTTF('T O K I O   /   2 0 8 9', 'Courier New', 8); cityLabel.setPosition(450,16); cityLabel.setColor(color('#496183')); this.addChild(cityLabel,1);
    },
    spriteFor: function (entity, kind) {
      const key = `${kind}-${entity.id}`;
      let sprite = this.spriteNodes.get(key);
      if (!sprite) {
        const meta = kind === 'alien' ? neonSprites.aliens[entity.type] : neonSprites.powerups[entity.type];
        sprite = new cc.Sprite(`assets/sprites/${meta.file}`,cc.rect(0,0,meta.frameWidth,meta.frameHeight));
        sprite.setScale(kind === 'alien' ? 1.18 : 1.7);
        sprite.neonMeta = meta; this.entityLayer.addChild(sprite); this.spriteNodes.set(key,sprite);
      }
      sprite.setPosition(entity.x,entity.y);
      const m=sprite.neonMeta;
      const fps=kind==='alien' ? neonSprites.animation.alienFps : neonSprites.animation.powerupFps;
      const frame=Math.floor(this.clock*fps)%m.frames;
      if(sprite.neonFrame!==frame) { sprite.setTextureRect(cc.rect(frame*m.frameWidth,0,m.frameWidth,m.frameHeight)); sprite.neonFrame=frame; }
      return key;
    },
    burst: function (x,y,hex,count = 18) {
      for(let i=0;i<count;i++) {
        const angle=Math.random()*Math.PI*2,speed=40+Math.random()*180;
        this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.3+Math.random()*.4,hex,size:1+Math.random()*2});
      }
    },
    fireworkBurst: function (x,y,hex) {
      const count = 42;
      for(let i=0;i<count;i++) {
        const angle = i / count * Math.PI * 2;
        const speed = 90 + Math.random() * 95;
        this.particles.push({ x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
          life:.42+Math.random()*.13,hex,size:1.8,firework:true });
      }
    },
    update: function (delta) {
      const dt=Math.min(delta,.05); this.clock+=dt;
      const events=NeonUI.tick(dt), game=NeonUI.game;
      for(const event of events) {
        if(event.type==='explode') this.burst(event.x,event.y,C[event.color]);
        if(event.type==='hurt') { this.burst(event.x,event.y,C.pink,30); this.flash=.3; }
        if(event.type==='power') this.burst(game.player.x,game.player.y,C.cyan,25);
        if(event.type==='clear') { this.fireworkTimer = 0; this.fireworkCount = 0; this.fireworks = []; }
      }
      this.stars.clear();
      for(let i=0;i<78;i++) {
        const x=(i*137.51)%900,y=150+((i*93.17-this.clock*(3+i%3)+5000)%440);
        const alpha=45+Math.floor((Math.sin(this.clock*1.3+i)+1)*35);
        this.stars.drawDot(point(x,y),i%9===0?1.1:.6,color(i%3===0?C.pink:'#aac4f2',alpha));
      }
      this.haze.clear();
      for(let i=0;i<5;i++) { const y=220+((i*86+this.clock*7)%350); line(this.haze,35,y,865,y,C.violet,.5,7); }
      const seen=new Set();
      if(game.phase!=='splash') {
        for(const alien of game.aliens) seen.add(this.spriteFor(alien,'alien'));
        for(const drop of game.drops) seen.add(this.spriteFor(drop,'drop'));
      }
      if(game.phase==='splash') for(const id of ['preview-1','preview-2','preview-3']) seen.add(`alien-${id}`);
      for(const [key,sprite] of this.spriteNodes) if(!seen.has(key)) { sprite.removeFromParent(); this.spriteNodes.delete(key); }
      const isRun=!['splash','gameover','victory'].includes(game.phase);
      this.player.setVisible(isRun); this.player.setPosition(game.player.x,game.player.y);
      this.player.setOpacity(game.invulnerable>0 && Math.floor(this.clock*12)%2 ? 75 : 255);
      this.fx.clear();
      if(game.phase==='clear') {
        this.fireworkTimer -= dt;
        if(this.fireworkTimer<=0 && this.fireworkCount<8) {
          const index=this.fireworkCount++;
          const x=110+(index*137)%680;
          this.fireworks.push({ x,y:130,startY:130,targetY:310+(index*67)%200,
            age:0,duration:.28+(index%3)*.04,hex:[C.cyan,C.pink,C.violet,'#ffd071'][index%4] });
          this.fireworkTimer=.18;
        }
        this.fireworks=this.fireworks.filter(rocket => {
          rocket.age+=dt;
          const progress=Math.min(1,rocket.age/rocket.duration);
          rocket.y=rocket.startY+(rocket.targetY-rocket.startY)*progress;
          glowLine(this.fx,rocket.x,rocket.y-28,rocket.x,rocket.y,rocket.hex,1.1);
          this.fx.drawDot(point(rocket.x,rocket.y),2,color('#ffffff',255));
          if(progress>=1) { this.fireworkBurst(rocket.x,rocket.y,rocket.hex); return false; }
          return true;
        });
      } else {
        this.fireworks=[];
        this.particles=this.particles.filter(p=>!p.firework);
      }
      if(isRun) {
        const x=game.player.x,y=game.player.y;
        this.fx.drawPoly([point(x-5,y-19),point(x+5,y-19),point(x,y-33-Math.sin(this.clock*35)*5)],color(C.cyan,140),0,color(C.cyan,0));
        this.fx.drawDot(point(x,y-23),4,color('#d4ffff',160));
        if(game.invulnerable>0) this.fx.drawCircle(point(x,y),31,0,40,false,1,color(C.cyan,90));
      }
      for(const b of game.bullets) {
        const hex=b.owner==='player' ? b.piercing ? C.violet : C.cyan : C.pink;
        const length=b.owner==='player'?15:12;
        glowLine(this.fx,b.x,b.y-length/2,b.x,b.y+length/2,hex,1.3);
        this.fx.drawDot(point(b.x,b.y+length/2),1.3,color('#ffffff',230));
      }
      if(game.phase!=='paused') {
        this.particles=this.particles.filter(p => { p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy-=140*dt; return p.life>0; });
        this.flash=Math.max(0,this.flash-dt);
      }
      for(const p of this.particles) {
        if(p.firework) {
          const alpha=Math.min(255,p.life*650);
          line(this.fx,p.x-p.vx*.035,p.y-p.vy*.035,p.x,p.y,p.hex,2.5,alpha*.15);
          line(this.fx,p.x-p.vx*.022,p.y-p.vy*.022,p.x,p.y,p.hex,.9,alpha);
        } else rect(this.fx,p.x,p.y,p.size,p.size,p.hex,Math.min(255,p.life*550));
      }
      if(this.flash>0) rect(this.fx,0,0,900,620,C.pink,this.flash*70);
      if(game.phase==='splash') {
        // Sparse sprite sentries give the opening transmission its arcade identity.
        const positions=[{id:'preview-1',type:'squid',x:118,y:445},{id:'preview-2',type:'crab',x:780,y:365},{id:'preview-3',type:'insect',x:105,y:245}];
        for(const a of positions) { a.y+=Math.sin(this.clock+a.x)*7; const key=this.spriteFor(a,'alien'); this.spriteNodes.get(key).setOpacity(140); }
      }
    }
  });
})();
