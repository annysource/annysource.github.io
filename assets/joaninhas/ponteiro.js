/* Host and iframe cooperate without cancelling the user's click. */
(() => {
 let cleanup = null, burst = null;
 const frames = () => [...document.querySelectorAll('iframe[data-joaninhas]')];
 function relay(type) {
  if (window.parent !== window) window.parent.postMessage({type}, location.origin);
  else frames().forEach(frame => frame.contentWindow.postMessage({type}, new URL(frame.src, location.href).origin));
 }
 window.activateLadybugCursor = (size = 24) => {
  if (!Number.isFinite(size) || size < 24 || size > 10000) return;
  cleanup?.();
  const node = document.createElement('div'), style = document.createElement('style');
  node.setAttribute('aria-hidden','true'); node.dataset.ladybugCursor = '';
  Object.assign(node.style,{position:'fixed',left:'50%',top:'50%',width:size+'px',height:size+'px',pointerEvents:'none',zIndex:'2147483647',color:getComputedStyle(document.body).color,transform:'translate(-50%,-50%)'});
  const rows=['000001100000','000111111000','001101101100','011111111110','011011110110','111111111111','110000000011','111111111111','011011110110','011111111110','001101101100','000111111000'];
  let pixels=''; rows.forEach((row,y)=>[...row].forEach((p,x)=>{if(p==='1')pixels+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}));
  node.innerHTML=`<svg viewBox="0 0 12 12" width="${size}" height="${size}" fill="currentColor" shape-rendering="crispEdges">${pixels}</svg>`;
  document.body.appendChild(node);
  if(matchMedia('(pointer: fine)').matches){style.textContent='html,html *{cursor:none!important}';document.head.appendChild(style)}
  let popped=false,timer;
  const move=event=>{node.style.left=event.clientX+'px';node.style.top=event.clientY+'px'};
  const remove=()=>{clearTimeout(timer);node.remove();style.remove();document.removeEventListener('pointermove',move);document.removeEventListener('click',pop,true);document.removeEventListener('keydown',key);if(cleanup===remove){cleanup=null;burst=null}};
  const pop=(event,notify=true)=>{
   if(popped)return; popped=true;
   if(notify)relay('joaninhas:cursor-pop');
   if(event?.clientX!==undefined)move(event);
   style.remove();document.removeEventListener('pointermove',move);document.removeEventListener('click',pop,true);
   node.innerHTML='<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="15"/><path d="M24 0v7M24 41v7M0 24h7M41 24h7M7 7l5 5M36 36l5 5M7 41l5-5M36 12l5-5"/></svg>';
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)node.animate([{opacity:1},{opacity:0}],{duration:350});
   timer=setTimeout(remove,350);
  };
  const key=event=>{if(event.key==='Escape'){relay('joaninhas:cursor-dismiss');remove()}};
  document.addEventListener('pointermove',move);document.addEventListener('click',pop,true);document.addEventListener('keydown',key);
  cleanup=remove;burst=pop;window.popLadybugCursor=pop;
 };
 window.addEventListener('message',event=>{
  const type=event.data?.type;
  if(!['joaninhas:cursor','joaninhas:cursor-pop','joaninhas:cursor-dismiss'].includes(type))return;
  const fromParent=window.parent!==window&&event.source===window.parent&&event.origin===location.origin;
  const frame=frames().find(frame=>frame.contentWindow===event.source);
  if(!fromParent&&(!frame||event.origin!==new URL(frame.src,location.href).origin))return;
  if(type==='joaninhas:cursor'&&!fromParent)window.activateLadybugCursor(event.data.size);
  else if(type==='joaninhas:cursor-pop'){burst?.(null,false);if(!fromParent)frames().forEach(other=>other.contentWindow.postMessage({type},new URL(other.src,location.href).origin))}
  else if(type==='joaninhas:cursor-dismiss'){cleanup?.();if(!fromParent)frames().forEach(other=>other.contentWindow.postMessage({type},new URL(other.src,location.href).origin))}
 });
})();
