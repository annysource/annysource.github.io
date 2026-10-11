/* Motor determinístico independente da apresentação. Coordenadas lógicas: 900 × 300. */
(function(root){
class LadybugGame{
 constructor(random=Math.random){this.random=random;this.reset()}
 reset(){this.state='ready';this.time=0;this.distance=0;this.y=0;this.vy=0;this.count=1;this.smallFollowers=0;this.largeFollowers=0;this.extraLargeFollowers=0;this.levels=[];this.collected=0;this.objects=[];this.history=[{t:0,y:0}];this.nextSpawn=1.5;this.popTime=0;this.popPositions=[]}
 start(){this.reset();this.state='running'}
 jump(){if(this.state==='running'&&this.y===0)this.vy=570}
 collect(){
 this.collected++;this.smallFollowers++;
 if(this.smallFollowers===5){this.smallFollowers=0;let level=1;
 while(this.levels.includes(level)){this.levels.splice(this.levels.indexOf(level),1);level++}
 this.levels.push(level);this.levels.sort((a,b)=>a-b);
 }
 this.largeFollowers=this.levels.filter(l=>l===1).length;this.extraLargeFollowers=this.levels.filter(l=>l===2).length;
 this.count=1+this.smallFollowers+this.levels.length;
 if(this.levels.some(l=>24*Math.pow(1.25,l)>190))this.state='cursor';
 }
 size(i){return i<=this.smallFollowers?24:24*Math.pow(1.25,this.levels[i-this.smallFollowers-1])}
 follower(i){const spacing=Math.min(36,205/Math.max(1,this.count-1));const speed=Math.min(330,190+this.time*1.5);const target=this.time-i*spacing/speed;const item=this.history.find(h=>h.t>=target)||this.history[this.history.length-1];return{x:240-i*Math.min(36,205/Math.max(1,this.count-1)),y:item.y,size:this.size(i)}}
 hit(a,b){return a.x<b.x+b.w&&a.x+(a.w||24)>b.x&&a.y<b.y+b.h&&a.y+(a.h||24)>b.y}
 burst(){this.popPositions=Array.from({length:this.count},(_,i)=>this.follower(i));this.state='popping';this.popTime=0}
 update(dt){
 if(this.state==='popping'){this.popTime+=dt;if(this.popTime>=.65)this.state='over';return}
 if(this.state!=='running')return;
 this.time+=dt;const speed=Math.min(330,190+this.time*1.5);this.distance+=speed*dt/10;
 this.vy-=1500*dt;this.y=Math.max(0,this.y+this.vy*dt);if(this.y===0)this.vy=0;
 this.history.push({t:this.time,y:this.y});const oldest=this.time-(this.count+1)*.16;while(this.history.length>1&&this.history[1].t<oldest)this.history.shift();
 this.nextSpawn-=dt;if(this.nextSpawn<=0){const obstacle=this.random()<.4;this.objects.push({type:obstacle?'obstacle':'bug',x:930,w:obstacle?20:24,h:obstacle?30:24});this.nextSpawn=1.5+this.random()*.8}
 for(const obj of this.objects){obj.x-=speed*dt;if(obj.taken)continue;
 if(obj.type==='bug'){if(this.hit({x:240,y:250-this.size(0)-this.y,w:this.size(0),h:this.size(0)},{x:obj.x,y:250-obj.h,w:obj.w,h:obj.h})){obj.taken=true;this.collect();if(this.state==='cursor'){this.objects=[];return}}}
 else {for(let i=0;i<this.count;i++){const p=this.follower(i);if(this.hit({x:p.x,y:250-p.size-p.y,w:p.size,h:p.size},{x:obj.x,y:250-obj.h,w:obj.w,h:obj.h})){this.burst();return}}}
 }
 this.objects=this.objects.filter(o=>o.x>-40&&!o.taken);
 }
}
if(typeof module!=='undefined'&&module.exports)module.exports=LadybugGame;else root.LadybugGame=LadybugGame;
})(typeof globalThis!=='undefined'?globalThis:this);

