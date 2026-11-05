(() => {
  document.querySelectorAll('.vibe-highlights').forEach(section => {
    const track = section.querySelector('.vibe-highlight-track');
    const buttons = [...section.querySelectorAll('[data-direction]')];
    if (!track || !buttons.length) return;
    section.setAttribute('data-enhanced', '');
    const update = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      buttons.forEach(button => {
        button.disabled = Number(button.dataset.direction) < 0
          ? track.scrollLeft <= 2 : track.scrollLeft >= max - 2;
      });
    };
    buttons.forEach(button => button.addEventListener('click', () => {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({left: Number(button.dataset.direction) * step, behavior: reduced ? 'auto' : 'smooth'});
    }));
    track.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    update();
  });
})();
