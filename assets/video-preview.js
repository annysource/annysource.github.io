(() => {
  const preview = document.querySelector('[data-video-preview]');
  if (!preview) return;

  const frameContainer = preview.querySelector('[data-video-frame]');
  const playButton = preview.querySelector('[data-video-play]');
  const videoId = preview.dataset.youtubeId;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');
  let pointerInside = false;
  let focusInside = false;
  let explicitlyStarted = false;
  let currentMuted;

  const showVideo = muted => {
    if (frameContainer.querySelector('iframe') && currentMuted === muted) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${encodeURIComponent(videoId)}&controls=1&playsinline=1&rel=0`;
    iframe.title = preview.dataset.videoTitle || 'Vídeo do projeto no YouTube';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.loading = 'eager';
    frameContainer.replaceChildren(iframe);
    frameContainer.hidden = false;
    preview.classList.add('video-preview-playing');
    currentMuted = muted;
  };

  const stopVideo = () => {
    frameContainer.replaceChildren();
    frameContainer.hidden = true;
    preview.classList.remove('video-preview-playing');
    currentMuted = undefined;
  };

  const syncPlayback = () => {
    if (pointerInside || focusInside) {
      if (!reduceMotion.matches && !frameContainer.querySelector('iframe')) showVideo(true);
    } else if (hoverCapable.matches || !explicitlyStarted) {
      stopVideo();
    }
  };

  preview.addEventListener('pointerenter', event => {
    if (!hoverCapable.matches || event.pointerType === 'touch') return;
    pointerInside = true;
    syncPlayback();
  });

  preview.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    pointerInside = false;
    syncPlayback();
  });

  preview.addEventListener('focusin', () => {
    focusInside = true;
    syncPlayback();
  });

  preview.addEventListener('focusout', () => {
    window.setTimeout(() => {
      focusInside = preview.contains(document.activeElement);
      syncPlayback();
    }, 0);
  });

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches && !explicitlyStarted) stopVideo();
    else syncPlayback();
  });

  playButton.addEventListener('click', () => {
    explicitlyStarted = true;
    showVideo(false);
  });
})();
