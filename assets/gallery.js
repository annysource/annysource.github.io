(() => {
 const dialog = document.querySelector('.lightbox');
 if (!dialog || typeof dialog.showModal !== 'function') return;
 let photos = [], index = 0, trigger;
 const show = () => {
  const link = photos[index], image = link.querySelector('img');
  dialog.querySelector('img').src = link.href;
  dialog.querySelector('img').alt = image.alt;
  dialog.querySelector('figcaption').textContent = link.dataset.caption || '';
  dialog.querySelector('[data-photo-position]').textContent = `${index + 1} / ${photos.length}`;
  dialog.querySelector('[data-photo-prev]').disabled = photos.length < 2;
  dialog.querySelector('[data-photo-next]').disabled = photos.length < 2;
 };
 const step = delta => { index = (index + delta + photos.length) % photos.length; show(); };
 document.addEventListener('click', event => {
  const link = event.target.closest('a[data-gallery]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); trigger = link;
  photos = [...link.closest('.photo-gallery').querySelectorAll('a[data-gallery]')];
  index = photos.indexOf(link); show(); dialog.showModal();
 });
 dialog.querySelector('[data-photo-close]').onclick = () => dialog.close();
 dialog.querySelector('[data-photo-prev]').onclick = () => step(-1);
 dialog.querySelector('[data-photo-next]').onclick = () => step(1);
 dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
 });
 dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
 dialog.addEventListener('close', () => trigger?.focus());
})();
