(()=>{
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),game=new LadybugGame();
const start=document.querySelector('#start'),jump=document.querySelector('#jump'),pause=document.querySelector('#pause'),status=document.querySelector('#status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const countLabel=document.querySelector('#count'),distanceLabel=document.querySelector('#distance');
let ink;
// Desenho original em grade de pixels. As lacunas formam as pintinhas.
const rows=['000000000000','000001100000','000111111000','001101101100','011111111110','011011110110','111111111111','110000000011','111111111111','011011110110','011111111110','001101101100','000111111000','000001100000'];
const sprite=new Path2D();rows.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel==='1')sprite.rect(x*2,y*2-4,2,2)}));
function bug(x,y,t,size=24){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size/24,size/24);x=0;y=0;ctx.fill(sprite);const step=reduced.matches?0:Math.floor(t*10)%2;for(const ly of [2,12,22]){ctx.fillRect(x-4,y+ly+step*2,4,2);ctx.fillRect(x+24,y+ly-step*2,4,2)}ctx.restore()}
function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,900,190);ctx.setTransform(1,0,0,1,0,-110);ctx.fillStyle=ink;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;// Caule horizontal: contorno escalonado, textura de casca e pequenos ramos.
ctx.fillRect(0,250,900,3);ctx.fillRect(0,281,900,3);
for(let i=0;i<16;i++){const x=Math.round(((i*73-game.distance*10)%1050+1050)%1050)-60;
ctx.fillRect(x,258+(i%3)*6,28+(i%4)*5,2);ctx.fillRect(x+12,260+(i%3)*6,2,4);
if(i%4===0){ctx.fillRect(x+30,282,4,8);ctx.fillRect(x+34,288,14,3);ctx.fillRect(x+46,291,9,3)}}
for(const o of game.objects){if(o.type==='bug')bug(o.x,226,game.time);else {ctx.fillRect(Math.round(o.x),220,20,30);ctx.clearRect(Math.round(o.x)+4,224,12,20);ctx.fillRect(Math.round(o.x)+4,228,12,2)}}
if(game.state==='popping'){const p=game.popTime/.65;for(const pos of game.popPositions){const x=pos.x+pos.size/2,y=250-pos.size/2-pos.y;if(!reduced.matches){const r=pos.size/2+p*22;ctx.globalAlpha=1-p;const points=8;for(let k=0;k<points;k++){const angle=k*Math.PI*2/points;ctx.fillRect(Math.round(x+Math.cos(angle)*r),Math.round(y+Math.sin(angle)*r),3,3)}if(p<.45){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1}}}
else if(game.state!=='over'&&game.state!=='cursor')for(let i=game.count-1;i>=0;i--){const pos=game.follower(i);bug(pos.x,250-pos.size-pos.y,game.time-i*.105,pos.size)}
const countText='FILA '+String(game.count).padStart(2,'0'),distanceText=String(Math.floor(game.distance)).padStart(5,'0')+' m';
if(countLabel.textContent!==countText)countLabel.textContent=countText;if(distanceLabel.textContent!==distanceText)distanceLabel.textContent=distanceText;
}
let previous=null,accumulator=0,lastState='',dirty=true,frameId=null,lastPaint=-Infinity;
const active=()=>game.state==='running'||game.state==='popping';
function wake(){dirty=true;if(frameId===null){previous=null;accumulator=0;frameId=requestAnimationFrame(loop)}}
function loop(now){frameId=null;const dt=previous===null?0:Math.min((now-previous)/1000,.05);previous=now;if(active()){accumulator+=dt;while(accumulator>=1/120){game.update(1/120);accumulator-=1/120}}if(game.state!==lastState){lastState=game.state;dirty=true;if(game.state==='cursor'){status.textContent='Sua joaninha virou ponteiro! Clique para estourar.';start.textContent='Jogar de novo';start.disabled=false;jump.disabled=true;pause.disabled=true;const size=Math.max(...game.levels.map(level=>24*Math.pow(1.25,level)));window.activateLadybugCursor(size);if(window.parent!==window)window.parent.postMessage({type:'joaninhas:cursor',size},location.protocol==='file:'?'*':location.origin)}else if(game.state==='over'){status.textContent=`Fim do passeio! Você coletou ${game.collected} joaninha${game.collected!==1?'s':''}.`;start.textContent='Jogar de novo';start.disabled=false;jump.disabled=true;pause.disabled=true}else if(game.state==='popping'){status.textContent='Pop! A fila inteira estourou.';jump.disabled=true;pause.disabled=true}}if(dirty||(active()&&now-lastPaint>=1000/60-.5)){draw();dirty=false;lastPaint=now}if(active()&&!document.hidden)frameId=requestAnimationFrame(loop);else{previous=null;accumulator=0}}
start.onclick=()=>{game.start();start.disabled=true;jump.disabled=false;pause.disabled=false;pause.textContent='Pausar';pause.setAttribute('aria-pressed','false');status.textContent='Colete companhia e pule os obstáculos.';canvas.focus();wake()};
jump.onclick=()=>game.jump();canvas.addEventListener('pointerdown',()=>{if(game.state==='ready'||game.state==='over')start.click();else game.jump()});
canvas.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(game.state==='ready'||game.state==='over')start.click();else game.jump()}});
function setPause(){if(game.state!=='running'&&game.state!=='paused')return;game.state=game.state==='running'?'paused':'running';const paused=game.state==='paused';pause.textContent=paused?'Retomar':'Pausar';pause.setAttribute('aria-pressed',String(paused));jump.disabled=paused;status.textContent=paused?'Passeio pausado.':'Colete companhia e pule os obstáculos.';wake()}
pause.onclick=setPause;document.addEventListener('visibilitychange',()=>{if(document.hidden&&(game.state==='running'||game.state==='popping')){if(game.state==='running')setPause();else{game.state='over';wake()}}});
window.addEventListener('message',event=>{if(event.source===window.parent&&event.origin===location.origin&&event.data?.type==='joaninhas:pause'&&game.state==='running')setPause()});
window.addEventListener('blur',()=>{if(game.state==='running')setPause()});
const reportSize=()=>{if(window.parent!==window)window.parent.postMessage({type:'joaninhas:resize',height:Math.ceil(document.querySelector('.widget').getBoundingClientRect().height)},location.origin)};
new ResizeObserver(reportSize).observe(document.querySelector('.widget'));
const theme=document.querySelector('#theme');theme.onclick=()=>{const dark=document.body.classList.toggle('dark');theme.textContent=dark?'Tema claro':'Tema escuro';theme.setAttribute('aria-pressed',String(dark));ink=getComputedStyle(canvas).color;wake()};if(new URLSearchParams(location.search).get('theme')==='dark'){document.body.classList.add('dark');theme.textContent='Tema claro';theme.setAttribute('aria-pressed','true')}ink=getComputedStyle(canvas).color;reduced.addEventListener('change',wake);wake();
})();
