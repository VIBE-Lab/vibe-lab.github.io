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


/* Latest News: gentle manual-controllable scrolling, no duplicated news records. */
(() => {
  document.querySelectorAll('.vibe-sidebar-news').forEach(section => {
    const viewport = section.querySelector('.vibe-news-viewport');
    const toggle = section.querySelector('.vibe-news-toggle');
    if (!viewport || !toggle) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = motion.matches, hovered = false, visible = true, holdUntil = 0, last = 0, frame = 0, scrollPosition = viewport.scrollTop, endReachedAt = 0;
    const now = Date.now();
    section.querySelectorAll('time[datetime]').forEach(time => {
      const stamp = new Date(time.dateTime + 'T00:00:00').getTime();
      const age = now - stamp;
      const badge = time.parentElement.querySelector('.vibe-news-new');
      if (badge) badge.hidden = !(Number.isFinite(stamp) && age >= 0 && age < 30 * 86400000);
    });
    const update = () => {
      const overflow = viewport.scrollHeight > viewport.clientHeight + 2;
      toggle.hidden = !overflow;
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', (paused ? 'Start' : 'Pause') + ' automatic news scrolling');
    };
    toggle.addEventListener('click', () => { paused = !paused; last = 0; update(); });
    section.addEventListener('mouseenter', () => { hovered = true; });
    section.addEventListener('mouseleave', () => { hovered = false; last = 0; });
    ['wheel','touchstart','pointerdown','keydown'].forEach(name => viewport.addEventListener(name, () => { holdUntil = performance.now() + 15000; }, {passive:true}));
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; last = 0; }).observe(section);
    motion.addEventListener('change', e => { if(e.matches) paused = true; last = 0; update(); });
    document.addEventListener('visibilitychange', () => { last = 0; });
    const tick = stamp => {
      const dt = last ? Math.min((stamp-last)/1000, .25) : 0;
      last = stamp;
      const focused = viewport.contains(document.activeElement);
      const max = viewport.scrollHeight - viewport.clientHeight;
      if (!paused && !hovered && !focused && visible && !document.hidden && stamp >= holdUntil && max > 2) {
        if (Math.abs(scrollPosition - viewport.scrollTop) > 2) scrollPosition = viewport.scrollTop;
        if (viewport.scrollTop >= max - 1) {
          if (!endReachedAt) endReachedAt = stamp;
          else if (stamp - endReachedAt >= 3500) { viewport.scrollTop = 0; scrollPosition = 0; endReachedAt = 0; holdUntil = stamp + 1500; }
        } else { endReachedAt = 0; scrollPosition = Math.min(max, scrollPosition + dt * 14); viewport.scrollTop = scrollPosition; }
      } else { scrollPosition = viewport.scrollTop; }

    };
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(viewport);
    update(); frame = setInterval(() => tick(performance.now()), 50);
    window.addEventListener('pagehide', () => clearInterval(frame));
    window.addEventListener('pageshow', event => { if (event.persisted) { last=0; frame=setInterval(() => tick(performance.now()), 50); } });
  });
})();
