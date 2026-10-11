(() => {
 const details = document.querySelector('#ladybug-pause');
 const frame = details?.querySelector('iframe[data-joaninhas]');
 if (!frame) return;
 const origin = new URL(frame.src, location.href).origin;
 details.addEventListener('toggle', () => {
  if (!details.open) frame.contentWindow.postMessage({type:'joaninhas:pause'}, origin);
 });
 if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
   if (!entries[0].isIntersecting) frame.contentWindow.postMessage({type:'joaninhas:pause'}, origin);
  }).observe(frame);
 }
 window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== origin) return;
  if (event.data?.type === 'joaninhas:resize' && Number.isFinite(event.data.height)) {
   const height = Math.max(240, Math.min(600, event.data.height)) + 'px';
   if (frame.style.height !== height) frame.style.height = height;
  }
 });
})();
