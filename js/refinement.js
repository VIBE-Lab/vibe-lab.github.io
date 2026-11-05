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
    let paused = false, hovered = false, visible = true, holdUntil = 0, last = 0, frame = 0, scrollPosition = viewport.scrollTop, endReachedAt = 0;
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

/* Selected Publications: automatic card scrolling. Keep existing arrow handlers. */
(() => {
  document.querySelectorAll('.vibe-highlights').forEach(section => {
    const track = section.querySelector('.vibe-highlight-track');
    if (!track || track.dataset.autoScrollReady) return;
    track.dataset.autoScrollReady = 'true';

    let direction = 1;
    let timer;
    let hovered = false;
    let keyboardFocus = false;
    let visible = true;
    let touching = false;
    let frame = 0;
    let moving = false;

    // Avoid scroll-snap fighting the intermediate animation positions.
    track.style.scrollSnapType = 'none';
    track.style.scrollBehavior = 'auto';

    function stopMotion() {
      cancelAnimationFrame(frame);
      moving = false;
    }

    function glideTo(target) {
      stopMotion();
      const from = track.scrollLeft;
      const start = performance.now();
      moving = true;
      function tick(now) {
        const progress = Math.min(1, (now - start) / 1400);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        track.scrollLeft = from + (target - from) * eased;
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { moving = false; schedule(); }
      }
      frame = requestAnimationFrame(tick);
    }

    const imagesReady = Promise.all([...track.querySelectorAll('img')].map(img => {
      img.loading = 'eager';
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    }));

    function schedule() {
      clearTimeout(timer);
      if (hovered || keyboardFocus || touching || !visible || document.hidden || moving) return;
      timer = setTimeout(async () => {
        await imagesReady;
        if (hovered || keyboardFocus || touching || !visible || document.hidden) return;
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        if (max > 2) {
          if (track.scrollLeft >= max - 2) direction = -1;
          else if (track.scrollLeft <= 2) direction = 1;
          const card = track.firstElementChild;
          const step = card.getBoundingClientRect().width +
            (parseFloat(getComputedStyle(track).columnGap) || 0);
          glideTo(Math.max(0, Math.min(max, track.scrollLeft + direction * step)));
        }
        schedule();
      }, 6000);
    }

    section.addEventListener('pointerenter', e => {
      if (e.pointerType === 'mouse') { hovered = true; stopMotion(); schedule(); }
    });
    section.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse') { hovered = false; schedule(); }
    });
    section.addEventListener('focusin', e => {
      keyboardFocus = e.target.matches(':focus-visible');
      schedule();
    });
    section.addEventListener('focusout', () => setTimeout(() => {
      keyboardFocus = section.contains(document.activeElement) &&
        document.activeElement.matches(':focus-visible');
      schedule();
    }, 0));
    section.addEventListener('click', schedule);
    track.addEventListener('pointerdown', () => { touching = true; stopMotion(); schedule(); });
    window.addEventListener('pointerup', () => { touching = false; schedule(); });
    window.addEventListener('pointercancel', () => { touching = false; schedule(); });
    track.addEventListener('wheel', () => { stopMotion(); schedule(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { stopMotion(); schedule(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (!visible) stopMotion();
        schedule();
      }).observe(section);
    }
    imagesReady.then(schedule);
  });
})();

