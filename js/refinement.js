


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

/* Selected Publications: continuous seamless loop. */
(() => {
  document.querySelectorAll('.vibe-highlights').forEach(section => {
    const track = section.querySelector('.vibe-highlight-track');
    if (!track || track.dataset.loopReady) return;
    const originals = [...track.children];
    if (originals.length < 2) return;
    track.dataset.loopReady = 'true';
    track.style.scrollSnapType = 'none';
    track.style.scrollBehavior = 'auto';
    track.style.overflowAnchor = 'none';

    // A second copy makes the end connect visually to the beginning.
    const clones = originals.map(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(e => e.tabIndex = -1);
      track.append(clone);
      return clone;
    });

    let period = 0;
    let position = track.scrollLeft;
    let last = 0;
    let hovered = false;
    let focused = false;
    let dragging = false;
    let visible = true;
    let ready = false;
    let holdUntil = 0;
    const speed = 28; // pixels per second

    function measure() {
      period = clones[0].getBoundingClientRect().left - originals[0].getBoundingClientRect().left;
      position = track.scrollLeft;
    }

    function write(value) {
      if (period <= 0) return;
      position = ((value % period) + period) % period;
      track.scrollLeft = position;
    }

    const buttons = [...section.querySelectorAll('[data-direction]')];
    buttons.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const step = originals[0].getBoundingClientRect().width + gap;
        write(track.scrollLeft + Number(button.dataset.direction) * step);
        holdUntil = performance.now() + 2500;
      });
    });
    section.setAttribute('data-enhanced', '');

    section.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovered = true; });
    section.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hovered = false; });
    section.addEventListener('focusin', e => { focused = e.target.matches(':focus-visible'); });
    section.addEventListener('focusout', () => setTimeout(() => {
      focused = section.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    }, 0));
    track.addEventListener('pointerdown', () => { dragging = true; });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointercancel', () => { dragging = false; });
    track.addEventListener('wheel', () => { holdUntil = performance.now() + 2500; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    }).observe(section);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
    window.addEventListener('resize', measure);

    Promise.all([...track.querySelectorAll('img')].map(img => {
      img.loading = 'eager';
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    })).then(() => { measure(); ready = true; });

    function tick(now) {
      const dt = last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      if (ready && visible && !document.hidden && !hovered && !focused && !dragging && now >= holdUntil && period > 0) {
        // Keep fractional positions: rounding every frame can make slow scrolling stutter.
        if (Math.abs(track.scrollLeft - position) > 2) position = track.scrollLeft;
        write(position + speed * dt);
      } else position = track.scrollLeft;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();

