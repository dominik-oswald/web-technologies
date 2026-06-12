/* ============================================================
   hearthead – ozzy  ·  site script
   - custom cursor (dot + ring)
   - nav active state (interior pages)
   - mobile nav overlay (interior pages)
   - landing: minimal orb (proximity-expand)
   - landing: card stacks + pointer drag + threshold release
   - project filter (with ?cat= URL support)
   - footer year
   ============================================================ */

(() => {
  'use strict';

  /* ----------------------------------------------------------
     0. Accent palette — random on landing reload, persists across pages
     ---------------------------------------------------------- */
  const PALETTES = [
    { accent: '#ff1493', pressed: '#a21462', pressedRing: '#8f1157' }, // hot pink
    { accent: '#ff5500', pressed: '#c44000', pressedRing: '#aa3800' }, // orange
    { accent: '#1a5cff', pressed: '#1040cc', pressedRing: '#0d33aa' }, // blue
    { accent: '#00c060', pressed: '#009044', pressedRing: '#007a37' }, // green
  ];
  const SESSION_KEY = 'hh-palette';
  let palette;
  if (document.body.classList.contains('page--landing')) {
    palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(palette));
  } else {
    const stored = sessionStorage.getItem(SESSION_KEY);
    palette = stored ? JSON.parse(stored) : PALETTES[0];
  }
  document.documentElement.style.setProperty('--color-accent', palette.accent);
  document.documentElement.style.setProperty('--cursor-pressed-fill', palette.pressed);
  document.documentElement.style.setProperty('--cursor-pressed-ring', palette.pressedRing);

  // Pre-compute accent as rgb() string for cursor detection
  const _ah = palette.accent;
  const accentRgb = `rgb(${parseInt(_ah.slice(1,3),16)}, ${parseInt(_ah.slice(3,5),16)}, ${parseInt(_ah.slice(5,7),16)})`;

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     0b. Thumbnail videos — seek to a random frame on load
     ---------------------------------------------------------- */
  document.querySelectorAll('video[preload="metadata"]').forEach((vid) => {
    const seek = () => {
      if (vid.duration && isFinite(vid.duration)) {
        vid.currentTime = Math.random() * Math.max(0, vid.duration - 15);
      }
    };
    if (vid.readyState >= 1) {
      seek();
    } else {
      vid.addEventListener('loadedmetadata', seek, { once: true });
    }
  });

  /* ----------------------------------------------------------
     0c. Videography cards — play on hover, pause on leave
     Called once at startup and again after PocketBase grid rebuild.
     ---------------------------------------------------------- */
  const initVideoHover = (root) => {
    // Local <video> cards — play on hover, pause on leave
    root.querySelectorAll('.project-card__img').forEach((vid) => {
      if (vid.tagName !== 'VIDEO') return;
      const card = vid.closest('.project-card');
      if (!card || card._videoHoverInit) return;
      card._videoHoverInit = true;
      card.addEventListener('mouseenter', () => { vid.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => { vid.pause(); });
    });

    // YouTube cards — inject muted autoplay iframe on hover, remove on leave
    root.querySelectorAll('.project-card').forEach((card) => {
      if (card._ytHoverInit) return;
      const videoUrl = card.dataset.galleryVideo || '';
      // match regular YT, youtu.be, embed, AND /shorts/ URLs
      const ytMatch = videoUrl.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
      if (!ytMatch) return;
      card._ytHoverInit = true;
      const ytId = ytMatch[1];
      const isPortrait = videoUrl.includes('/shorts/');
      const tMatch = videoUrl.match(/[?&]t=(\d+)/);
      const startSec = tMatch ? parseInt(tMatch[1], 10) : 0;
      const embedSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&start=${startSec}`;
      const media = card.querySelector('.project-card__media');
      if (!media) return;

      let frame = null;
      let hoverTimer = null;
      card.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => {
          if (frame) return;
          frame = document.createElement('iframe');
          frame.className = 'project-card__yt-frame' + (isPortrait ? ' project-card__yt-frame--portrait' : '');
          frame.setAttribute('allow', 'autoplay; fullscreen');
          frame.setAttribute('frameborder', '0');
          frame.src = embedSrc;
          media.appendChild(frame);
        }, 250); // only load iframe after deliberate hover, not accidental mouse-overs
      });
      card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        if (!frame) return;
        const f = frame;
        frame = null;
        setTimeout(() => { f.src = ''; f.remove(); }, 300);
      });
    });
  };
  initVideoHover(document);

  /* ----------------------------------------------------------
     1. Year
     ---------------------------------------------------------- */
  const yearStr = String(new Date().getFullYear());
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = yearStr;
  document.querySelectorAll('.year-mirror').forEach((el) => {
    el.textContent = yearStr;
  });

  /* ----------------------------------------------------------
     2. Active nav link (interior pages)
     ---------------------------------------------------------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const target = href.split('/').pop();
    if (target === path) link.classList.add('active');
  });

  /* ----------------------------------------------------------
     3. Mobile nav overlay (interior pages)
     ---------------------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  const setMenu = (open) => {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
    });
    mobileNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => setMenu(false))
    );
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setMenu(false);
      const orbEl = document.querySelector('.orb.is-open');
      if (orbEl) orbEl.classList.remove('is-open');
    }
  });

  /* ----------------------------------------------------------
     4. Custom cursor (+ shared pointer routing for orb proximity)
     ---------------------------------------------------------- */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const ringOuter = document.querySelector('.cursor-ring-outer');
  const orb = document.querySelector('.orb');

  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let updateOrbProximity = null;
  if (orb && finePointer) {
    const PROXIMITY = 130;
    let lastNear = false;
    updateOrbProximity = (clientX, clientY) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const near =
        Math.hypot(clientX - cx, clientY - cy) < PROXIMITY;
      if (near !== lastNear) {
        orb.classList.toggle('is-near', near);
        lastNear = near;
      }
    };

    window.addEventListener(
      'touchend',
      () => {
        orb.classList.remove('is-near');
        lastNear = false;
      },
      { passive: true }
    );
  }

  if (dot && ring && finePointer) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let lastMX = mouseX;
    let lastMY = mouseY;
    let velX = 0;
    let velY = 0;
    let ringX = mouseX;
    let ringY = mouseY;
    let outerX = mouseX;
    let outerY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;
    let swayX = 0;
    let swayY = 0;
    let outerSwayX = 0;
    let outerSwayY = 0;
    let ringRot = 0;

    window.addEventListener('mousemove', (e) => {
      velX = e.clientX - lastMX;
      velY = e.clientY - lastMY;
      lastMX = e.clientX;
      lastMY = e.clientY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.body.classList.toggle(
        'cursor-orb-hover',
        Boolean(e.target.closest && e.target.closest('.orb'))
      );
      document.body.classList.toggle(
        'cursor-stack-hover',
        Boolean(e.target.closest && e.target.closest('.stack-card'))
      );
      // Turn cursor black when over any accent-colored surface
      let _onAccent = Boolean(e.target.closest && e.target.closest('.orb__sector'));
      if (!_onAccent) {
        let _n = e.target;
        for (let _d = 0; _d < 6 && _n && _n !== document.documentElement; _d++, _n = _n.parentElement) {
          if (getComputedStyle(_n).backgroundColor === accentRgb) { _onAccent = true; break; }
        }
      }
      document.body.classList.toggle('cursor-on-accent', _onAccent);
      if (updateOrbProximity) updateOrbProximity(e.clientX, e.clientY);
    });

    const tick = () => {
      velX *= 0.82;
      velY *= 0.82;

      const now = performance.now();
      const breathe = 1 + Math.sin(now * 0.005) * 0.042;

      const speed = Math.hypot(velX, velY);
      const amp = Math.min(14, speed * 0.75);
      const ox =
        speed > 0.02 ? ((-velY / speed) * amp * 0.65) : 0;
      const oy =
        speed > 0.02 ? ((velX / speed) * amp * 0.65) : 0;
      swayX += (ox - swayX) * 0.55;
      swayY += (oy - swayY) * 0.55;
      outerSwayX += (-ox * 1.25 - outerSwayX) * 0.45;
      outerSwayY += (-oy * 1.25 - outerSwayY) * 0.45;

      if (speed > 2) {
        const targetDeg = (Math.atan2(velY, velX) * 180) / Math.PI;
        ringRot += (targetDeg - ringRot) * 0.09;
      } else {
        ringRot *= 0.94;
      }
      const rotApply = Math.max(-16, Math.min(16, ringRot * 0.2));

      const dotEase = 0.72;
      dotX += (mouseX - dotX) * dotEase;
      dotY += (mouseY - dotY) * dotEase;
      dot.style.transform =
        `translate3d(${dotX - swayX * 0.35}px, ${dotY - swayY * 0.35}px, 0) translate(-50%, -50%)`;

      const ringEase = 0.65;
      ringX += (mouseX - ringX) * ringEase;
      ringY += (mouseY - ringY) * ringEase;
      ring.style.transform =
        `translate3d(${ringX + swayX}px, ${ringY + swayY}px, 0) ` +
        `rotate(${rotApply}deg) scale(${breathe}) translate(-50%, -50%)`;

      if (ringOuter) {
        const outerEase = 0.55;
        outerX += (mouseX - outerX) * outerEase;
        outerY += (mouseY - outerY) * outerEase;
        const outerBreath = 1 + Math.sin(now * 0.006 + 1.1) * 0.05;
        ringOuter.style.transform =
          `translate3d(${outerX + outerSwayX}px, ${outerY + outerSwayY}px, 0) ` +
          `rotate(${-rotApply * 0.55}deg) scale(${outerBreath}) translate(-50%, -50%)`;
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const setPressed = (on) => {
      document.body.classList.toggle('cursor-pressed', on);
    };
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) setPressed(true);
    });
    window.addEventListener('mouseup', () => setPressed(false));
    window.addEventListener('blur', () => setPressed(false));

    document.addEventListener('mouseleave', () => {
      ring.style.opacity = '0';
      document.body.classList.remove('cursor-orb-hover');
      document.body.classList.remove('cursor-stack-hover');
      setPressed(false);
      if (ringOuter) ringOuter.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      ring.style.opacity = '1';
      if (ringOuter) ringOuter.style.opacity = '';
    });
  }

  /* ----------------------------------------------------------
     5. Landing — minimal orb (touch / click-to-toggle)
     ---------------------------------------------------------- */
  if (orb) {
    // Tap core to open dial; second tap on a quadrant follows its link (coarse pointers:
    // proximity hover is disabled so the dial stays closed until opened explicitly.)
    orb.addEventListener('click', (e) => {
      if (e.target.closest('a')) return; // links navigate
      e.stopPropagation();
      orb.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!orb.contains(e.target)) orb.classList.remove('is-open');
    });
  }

  /* ----------------------------------------------------------
     5b. Landing — ASCII water background (subtle)
     ---------------------------------------------------------- */
  const ascii = document.querySelector('.landing-ascii');
  if (ascii && !prefersReducedMotion) {
    // Gentle ramp + overlapping waves — smoother motion than harsh stepping
    const CHARS = ' ·.:~-=+*#';
    let cols = 0;
    let rows = 0;

    const coarseGrid =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 720px)').matches;
    const FRAME_MS = coarseGrid ? 72 : 42;

    const measure = () => {
      const cs = getComputedStyle(ascii);
      const probe = document.createElement('span');
      probe.style.cssText =
        'position:absolute;visibility:hidden;white-space:pre;font-family:' +
        cs.fontFamily + ';font-size:' + cs.fontSize + ';line-height:1;';
      probe.textContent = 'M';
      document.body.appendChild(probe);
      const charW = probe.getBoundingClientRect().width || 7;
      probe.remove();
      const charH = parseFloat(cs.fontSize) || 11;
      cols = Math.max(28, Math.ceil(window.innerWidth / charW) + 2);
      rows = Math.max(18, Math.ceil(window.innerHeight / charH) + 2);
    };

    measure();

    let rT;
    window.addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        measure();
        renderAscii();
      }, coarseGrid ? 260 : 160);
    });

    let t = 0;
    let asciiAccum = 0;
    let asciiLast = performance.now();

    const renderAscii = () => {
      const lines = new Array(rows);
      const mult = CHARS.length - 1;
      for (let y = 0; y < rows; y++) {
        let row = '';
        const yp = y * 0.042;
        const diag = (x, y) => (x + y) * 0.017;
        for (let x = 0; x < cols; x++) {
          const v =
            Math.sin(x * 0.036 + t * 0.58) * 1.05 +
            Math.sin(yp + t * 0.44) * 1.05 +
            Math.sin(diag(x, y) + t * 0.33);
          const n = (v + 3.1) / 6.2;
          const idx = Math.max(0, Math.min(mult, Math.round(n * mult)));
          row += CHARS[idx];
        }
        lines[y] = row;
      }
      ascii.textContent = lines.join('\n');
    };

    renderAscii();

    const asciiLoop = (now) => {
      if (!document.hidden && cols > 0 && rows > 0) {
        asciiAccum += now - asciiLast;
        asciiLast = now;
        let stepped = false;
        while (asciiAccum >= FRAME_MS) {
          asciiAccum -= FRAME_MS;
          t += 0.0045 * (FRAME_MS / (1000 / 60));
          stepped = true;
        }
        if (stepped) renderAscii();
      } else {
        asciiLast = performance.now();
        asciiAccum = 0;
      }
      requestAnimationFrame(asciiLoop);
    };
    requestAnimationFrame(asciiLoop);
  }

  /* ----------------------------------------------------------
     5c. Landing — shuffle stack order on every load
          Real cards first (shuffled), placeholders after (shuffled)
     ---------------------------------------------------------- */
  const shuffleArr = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  document.querySelectorAll('[data-stack]').forEach((container) => {
    const all = Array.from(container.querySelectorAll(':scope > .stack-card'));
    const real = all.filter(c => !c.hasAttribute('data-placeholder'));
    const placeholders = all.filter(c => c.hasAttribute('data-placeholder'));
    [...shuffleArr(real), ...shuffleArr(placeholders)].forEach((c, idx) => {
      c.setAttribute('data-i', idx);
      container.appendChild(c);
    });
  });

  /* ----------------------------------------------------------
     6. Landing — card stacks + drag-and-drop
     ---------------------------------------------------------- */
  const canvas = document.querySelector('.landing-canvas');
  const stacks = Array.from(document.querySelectorAll('.stack'));

  const layoutStacks = () => {
    if (!canvas || !stacks.length) return;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // four corner zones (relative to viewport). One stack per zone.
    if (!layoutStacks._zones) {
      const z = [
        { x: [0.05, 0.20], y: [0.06, 0.13] },
        { x: [0.80, 0.95], y: [0.06, 0.13] },
        { x: [0.05, 0.20], y: [0.62, 0.76] },
        { x: [0.80, 0.95], y: [0.62, 0.76] },
      ];
      for (let i = z.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [z[i], z[j]] = [z[j], z[i]];
      }
      layoutStacks._zones = z;
    }
    const zones = layoutStacks._zones;

    stacks.forEach((stack, sIdx) => {
      const z = zones[sIdx % zones.length];
      if (stack._fx === undefined) {
        stack._fx = z.x[0] + Math.random() * (z.x[1] - z.x[0]);
        stack._fy = z.y[0] + Math.random() * (z.y[1] - z.y[0]);
      }
      const px = stack._fx * W;
      const py = stack._fy * H;
      stack.style.setProperty('--x', `${px}px`);
      stack.style.setProperty('--y', `${py}px`);

      const LABEL_OFFSET = 0;

      const cs = getComputedStyle(stack);
      const cardW = parseFloat(cs.getPropertyValue('--card-w')) || 238;
      const cardH = cardW * 1.25;
      const margin = Math.max(12, Math.min(40, Math.round(Math.min(W, H) * 0.035)));
      const rotPad = 40;

      const minCX = margin + rotPad;
      const minCY = margin + rotPad;
      const maxCX = W - margin - rotPad - cardW;
      const maxCY = H - margin - rotPad - cardH;

      const cards = Array.from(stack.querySelectorAll('.stack-card'));
      cards.forEach((card, idx) => {
        if (card.classList.contains('is-loose')) return;
        if (card._offX === undefined) {
          card._offX = Math.random() * 6 - 3;
          card._offY = Math.random() * 6 - 3 - idx * 2;
          card._rot = Math.random() * 5 - 2.5;
        }
        let cx = px + card._offX;
        let cy = py + card._offY + LABEL_OFFSET;

        if (maxCX >= minCX && maxCY >= minCY) {
          cx = Math.min(Math.max(cx, minCX), maxCX);
          cy = Math.min(Math.max(cy, minCY), maxCY);
        } else {
          cx = Math.max(margin, (W - cardW) * 0.5);
          cy = Math.max(margin, (H - cardH) * 0.5);
        }

        card.style.setProperty('--cx', `${cx}px`);
        card.style.setProperty('--cy', `${cy}px`);
        card.style.setProperty('--rot', `${card._rot}deg`);
        card.style.setProperty('--z', String(idx + 1));
      });

      updateStackCount(stack);
    });
  };

  const updateStackCount = (stack) => {
    const remaining = stack.querySelectorAll(
      '.stack-card:not(.is-loose)'
    ).length;
    const out = stack.querySelector('[data-stack-count]');
    if (out) out.textContent = String(remaining).padStart(2, '0');
  };

  const isTopOfStack = (card) => {
    if (card.classList.contains('is-loose')) return true;
    const parent = card.closest('[data-stack]');
    if (!parent) return false;
    const sibs = Array.from(parent.querySelectorAll('.stack-card'))
      .filter((c) => !c.classList.contains('is-loose'));
    if (!sibs.length) return false;
    let top = sibs[0];
    for (const c of sibs) {
      if (Number(c.dataset.i) > Number(top.dataset.i)) top = c;
    }
    return top === card;
  };

  const clampOutsideOrb = (x, y) => {
    // keep loose cards from being trapped underneath the expanded orb
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const minR = 140;
    const dx = x - cx;
    const dy = y - cy;
    const d  = Math.hypot(dx, dy);
    if (d >= minR || d === 0) return { x, y };
    const k = minR / d;
    return { x: cx + dx * k, y: cy + dy * k };
  };

  const setupCardDrag = () => {
    document.querySelectorAll('.stack-card').forEach((card) => {
      let dragging = false;
      let pid = null;
      let sx = 0, sy = 0;
      let baseX = 0, baseY = 0;

      card.addEventListener('pointerdown', (e) => {
        if (!isTopOfStack(card)) return;
        e.preventDefault();
        if (card._returnTimer != null) { clearTimeout(card._returnTimer); card._returnTimer = null; }
        dragging = true;
        pid = e.pointerId;
        sx = e.clientX;
        sy = e.clientY;
        baseX = parseFloat(card.style.getPropertyValue('--cx')) || 0;
        baseY = parseFloat(card.style.getPropertyValue('--cy')) || 0;
        card.classList.add('is-dragging');
        try { card.setPointerCapture(pid); } catch (_) {}
      });

      card.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pid) return;
        card.style.setProperty('--dx', `${e.clientX - sx}px`);
        card.style.setProperty('--dy', `${e.clientY - sy}px`);
      });

      const release = () => {
        if (!dragging) return;
        dragging = false;
        try { card.releasePointerCapture(pid); } catch (_) {}
        pid = null;

        const dx = parseFloat(card.style.getPropertyValue('--dx')) || 0;
        const dy = parseFloat(card.style.getPropertyValue('--dy')) || 0;
        const dist = Math.hypot(dx, dy);
        card.classList.remove('is-dragging');

        // tap (essentially no movement) → navigate
        if (dist < 6) {
          card.style.setProperty('--dx', '0px');
          card.style.setProperty('--dy', '0px');
          const url = card.dataset.href;
          if (url) {
            window.setTimeout(() => {
              window.location.assign(url);
            }, 50);
          }
          return;
        }

        // released far enough → free the card; bake new position
        if (dist > 80) {
          const { x, y } = clampOutsideOrb(baseX + dx, baseY + dy);
          card.style.setProperty('--cx', `${x}px`);
          card.style.setProperty('--cy', `${y}px`);
          card.classList.add('is-loose');

          // refresh stack count
          const parent = card.closest('.stack');
          if (parent) updateStackCount(parent);

          // return to stack after 5 seconds of inactivity
          if (card._returnTimer != null) clearTimeout(card._returnTimer);
          card._returnTimer = setTimeout(() => {
            card._returnTimer = null;
            card.classList.remove('is-loose');
            layoutStacks();
            const p = card.closest('.stack');
            if (p) updateStackCount(p);
          }, 5000);
        }

        // snap back the live delta in any case
        card.style.setProperty('--dx', '0px');
        card.style.setProperty('--dy', '0px');
      };

      card.addEventListener('pointerup', release);
      card.addEventListener('pointercancel', release);

      // synthesised click after pointer events — suppress so we don't double-navigate
      card.addEventListener('click', (e) => e.preventDefault());

      // keyboard: Enter / Space opens the top card
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isTopOfStack(card) && card.dataset.href) {
            window.setTimeout(() => {
              window.location.assign(card.dataset.href);
            }, 50);
          }
        }
      });
    });
  };

  if (canvas && stacks.length) {
    // disable transitions for the very first paint so cards don't fly in
    // from (0,0); re-enable after the next frame.
    const allCards = document.querySelectorAll('.stack-card');
    allCards.forEach((c) => { c.style.transition = 'none'; });

    layoutStacks();
    setupCardDrag();

    requestAnimationFrame(() => {
      // force a reflow before clearing the inline transition override
      void canvas.offsetHeight;
      allCards.forEach((c) => { c.style.transition = ''; });
    });

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(layoutStacks, 180);
    });

    // PocketBase landing loader replaces stack cards asynchronously;
    // re-run shuffle, layout, and drag setup when it finishes.
    document.addEventListener('pb:landing-loaded', () => {
      document.querySelectorAll('[data-stack]').forEach((container) => {
        const all = Array.from(container.querySelectorAll(':scope > .stack-card'));
        const real = all.filter(c => !c.hasAttribute('data-placeholder'));
        const placeholders = all.filter(c => c.hasAttribute('data-placeholder'));
        [...shuffleArr(real), ...shuffleArr(placeholders)].forEach((c, idx) => {
          c.setAttribute('data-i', idx);
          container.appendChild(c);
        });
      });
      const newCards = document.querySelectorAll('.stack-card');
      newCards.forEach(c => { c.style.transition = 'none'; });
      layoutStacks();
      setupCardDrag();
      requestAnimationFrame(() => {
        void canvas.offsetHeight;
        newCards.forEach(c => { c.style.transition = ''; });
      });
    });
  }

  /* ----------------------------------------------------------
     6b. Landing — big centered category over orb; title stays on card
     ---------------------------------------------------------- */
  const THEME_BY_CAT = {
    illustration: 'Illustration',
    interaction: 'Interaction Design',
    photography: 'Photography',
    graphic: 'Graphic Design',
    video: 'Videography',
  };

  const hoverCategoryEl = document.querySelector('.landing-hover-category');
  if (hoverCategoryEl) {
    let hideTimer = null;

    const categoryLabelForCard = (card) => {
      const stack = card.closest('.stack');
      const cat = stack?.dataset.cat || '';
      return (
        THEME_BY_CAT[cat] ||
        (stack && stack.getAttribute('aria-label')) ||
        cat ||
        ''
      );
    };

    // Use capture-phase delegation so dynamically replaced cards (from pb-landing.js) are covered
    document.addEventListener('pointerenter', (e) => {
      const card = e.target.closest('.stack-card');
      if (!card) return;
      clearTimeout(hideTimer);
      const raw = categoryLabelForCard(card);
      hoverCategoryEl.textContent = raw ? `"${raw}"` : '';
      hoverCategoryEl.classList.add('is-visible');
    }, true);

    document.addEventListener('pointerleave', (e) => {
      if (!e.target.closest('.stack-card')) return;
      hideTimer = setTimeout(() => {
        hoverCategoryEl.classList.remove('is-visible');
      }, 80);
    }, true);
  }

  /* ----------------------------------------------------------
     7. Project filter (+ ?cat= URL support)
     ---------------------------------------------------------- */
  const filterBar = document.querySelector('.filter-bar');
  const countEl = document.querySelector('[data-filter-count]');

  const updateCount = (visible) => {
    if (!countEl) return;
    const total = document.querySelectorAll('.project-card').length;
    countEl.textContent =
      `${String(visible).padStart(2, '0')} / ${String(total).padStart(2, '0')} ITEMS`;
  };

  const archiveGridEl = document.querySelector('#archive-grid');

  const applyFilter = (category, updateUrl = false) => {
    if (!filterBar) return;
    const cards = document.querySelectorAll('.project-card');
    filterBar.querySelectorAll('.filter-bar__btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.filter === category)
    );
    let visible = 0;
    cards.forEach((card) => {
      const cats = (card.dataset.category || '').split(/\s+/);
      const show = category === 'all' || cats.includes(category);
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    document.querySelectorAll('.archive-grid__section').forEach((row) => {
      const sec = row.dataset.archiveSection;
      row.classList.toggle(
        'hidden',
        category !== 'all' && category !== sec
      );
      const bar = row.querySelector('.archive-section-bar');
      if (bar && sec) {
        bar.classList.toggle('archive-section-bar--active', category === sec);
      }
    });
    if (archiveGridEl) archiveGridEl.dataset.activeFilter = category;
    if (updateUrl) {
      const url = category === 'all'
        ? window.location.pathname
        : `${window.location.pathname}?cat=${encodeURIComponent(category)}`;
      history.replaceState(null, '', url);
    }
    updateCount(visible);
  };

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-bar__btn');
      if (!btn) return;
      applyFilter(btn.dataset.filter, true);
    });

    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    const validBtn = cat
      ? filterBar.querySelector(`.filter-bar__btn[data-filter="${cat}"]`)
      : null;
    if (validBtn) applyFilter(cat);
    else applyFilter('all');

    // Section-bar clicks — use event delegation so dynamically-added bars work too
    if (archiveGridEl) {
      archiveGridEl.addEventListener('click', (e) => {
        const bar = e.target.closest('.archive-section-bar');
        if (!bar) return;
        const sec = bar.closest('.archive-grid__section')?.dataset.archiveSection;
        if (sec) applyFilter(sec, true);
      });
    }
  }

  /* ----------------------------------------------------------
     7b. Archive — project detail modal
     ---------------------------------------------------------- */
  const projectModal = document.querySelector('#project-modal');
  const archiveGrid = document.querySelector('#archive-grid');

  const isYouTube = (url) => /(?:youtube\.com|youtu\.be)/i.test(url || '');
  const getYouTubeId = (url) => {
    const m = String(url || '').match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const ytEmbed = (id) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;

  if (projectModal && archiveGrid) {
    const titleEl = projectModal.querySelector('[data-modal-title]');
    const catEl = projectModal.querySelector('[data-modal-cat]');
    const metaEl = projectModal.querySelector('[data-modal-meta]');
    const closeBtn = projectModal.querySelector('.project-modal__close');
    const modalBody = projectModal.querySelector('[data-modal-body]');
    const defaultModalBodyTpl = document.getElementById('project-modal-default-body');
    const defaultBodyHTML = defaultModalBodyTpl ? defaultModalBodyTpl.innerHTML : '';
    const prevProjectBtn = document.querySelector('.project-modal__nav--prev');
    const nextProjectBtn = document.querySelector('.project-modal__nav--next');

    let currentCardEl = null;

    const getVisibleCards = () =>
      Array.from(archiveGrid.querySelectorAll('.project-card:not(.hidden)'));

    const syncNavBtns = () => {
      if (!prevProjectBtn || !nextProjectBtn) return;
      const cards = getVisibleCards();
      const idx = currentCardEl ? cards.indexOf(currentCardEl) : -1;
      prevProjectBtn.hidden = idx <= 0;
      nextProjectBtn.hidden = idx < 0 || idx >= cards.length - 1;
    };

    if (modalBody && defaultBodyHTML) modalBody.innerHTML = defaultBodyHTML;

    let galleryModalCleanup = null;

    const fillGalleryModal = (container, imagesCsv, videoSrc, detail) => {
      if (typeof galleryModalCleanup === 'function') {
        galleryModalCleanup();
        galleryModalCleanup = null;
      }

      const imgs = imagesCsv
        .split(/,(?=(?:\/api\/files\/|MEDIA\/|assets\/))/)
        .map((s) => s.trim())
        .filter(Boolean);
      container.replaceChildren();
      if (!imgs.length) return;

      const wrap = document.createElement('div');
      wrap.className = 'project-modal__gallery project-modal__gallery--stacked';

      const header = document.createElement('div');
      header.className = 'project-modal__gallery-header';

      const intro = document.createElement('div');
      intro.className = 'project-modal__gallery-intro';

      const titleHeading = document.createElement('h2');
      titleHeading.className = 'project-modal__gallery-title';
      titleHeading.id = 'project-modal-gallery-title';
      titleHeading.textContent = detail.title || 'Project';
      intro.appendChild(titleHeading);

      const extractYearNum = (raw) => {
        const s = String(raw || '').trim();
        const m = s.match(/\b(19|20)\d{2}\b/);
        if (m) return m[0];
        const digits = s.replace(/\D/g, '');
        return digits.length >= 4 ? digits.slice(0, 4) : digits;
      };

      const bubbles = document.createElement('div');
      bubbles.className = 'project-modal__meta-bubbles';

      const bubbleRows = [{ text: (detail.cat || 'Work').toUpperCase(), accentSolo: true }];
      const yearNum = extractYearNum(detail.year);
      if (yearNum) bubbleRows.push({ text: yearNum, accentSolo: false });

      bubbleRows.forEach(({ text, accentSolo }) => {
        const pill = document.createElement('span');
        pill.className = 'project-modal__bubble project-modal__bubble--solo';
        if (accentSolo) pill.classList.add('project-modal__bubble--solo-accent');
        const tv = document.createElement('span');
        tv.className = 'project-modal__bubble-val';
        tv.textContent = text;
        pill.appendChild(tv);
        bubbles.appendChild(pill);
      });
      if (bubbles.childElementCount) intro.appendChild(bubbles);

      const descEl = document.createElement('p');
      descEl.className = 'project-modal__gallery-desc' + (detail.description ? '' : ' project-modal__gallery-desc--empty');
      descEl.textContent = detail.description || 'No description yet.';
      intro.appendChild(descEl);

      header.appendChild(intro);

      const stage = document.createElement('div');
      stage.className = 'project-modal__gallery-stage';

      // Hero image + thumbnail strip
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'project-modal__gallery-media';

      const heroDiv = document.createElement('div');
      heroDiv.className = 'project-modal__gallery-hero';
      if (!videoSrc) heroDiv.classList.add('project-modal__gallery-hero--full');

      const heroImg = document.createElement('img');
      heroImg.className = 'project-modal__gallery-hero-img';
      heroImg.src = imgs[0];
      heroImg.alt = detail.title || '';
      heroImg.loading = 'eager';
      heroImg.fetchPriority = 'high';
      heroImg.decoding = 'async';
      heroDiv.appendChild(heroImg);

      const btnHeroPrev = document.createElement('button');
      btnHeroPrev.type = 'button';
      btnHeroPrev.className = 'project-modal__hero-nav project-modal__hero-nav--prev';
      btnHeroPrev.setAttribute('aria-label', 'Previous image');
      btnHeroPrev.innerHTML = '<span aria-hidden="true">&#8592;</span>';

      const btnHeroNext = document.createElement('button');
      btnHeroNext.type = 'button';
      btnHeroNext.className = 'project-modal__hero-nav project-modal__hero-nav--next';
      btnHeroNext.setAttribute('aria-label', 'Next image');
      btnHeroNext.innerHTML = '<span aria-hidden="true">&#8594;</span>';

      heroDiv.append(btnHeroPrev, btnHeroNext);
      mediaWrap.appendChild(heroDiv);

      let activeIdx = 0;
      const thumbEls = [];
      let rotateTimer = null;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const setActive = (i) => {
        activeIdx = i;
        heroImg.src = imgs[i];
        thumbEls.forEach((t, j) => t.classList.toggle('is-active', j === i));
      };

      const stopRotate = () => {
        if (rotateTimer != null) { window.clearInterval(rotateTimer); rotateTimer = null; }
      };

      const startRotate = () => {
        if (rotateTimer || imgs.length <= 1 || reduceMotion) return;
        rotateTimer = window.setInterval(() => {
          setActive((activeIdx + 1) % imgs.length);
        }, 3500);
      };

      if (imgs.length > 1) {
        const thumbsDiv = document.createElement('div');
        thumbsDiv.className = 'project-modal__gallery-thumbs';

        imgs.forEach((src, i) => {
          const thumb = document.createElement('div');
          thumb.className = 'project-modal__gallery-thumb' + (i === 0 ? ' is-active' : '');
          const tImg = document.createElement('img');
          tImg.src = src;
          tImg.alt = '';
          tImg.loading = 'lazy';
          tImg.decoding = 'async';
          thumb.appendChild(tImg);
          thumb.addEventListener('click', () => { stopRotate(); setActive(i); startRotate(); });
          thumbsDiv.appendChild(thumb);
          thumbEls.push(thumb);
        });

        mediaWrap.appendChild(thumbsDiv);
      }

      // Inline video embed — appears below the gallery at full stage width
      if (videoSrc) {
        const embedWrap = document.createElement('div');
        embedWrap.className = 'project-modal__gallery-video-embed';
        const ytId2 = isYouTube(videoSrc) ? getYouTubeId(videoSrc) : null;
        if (ytId2) {
          const embedIframe = document.createElement('iframe');
          embedIframe.src = `https://www.youtube.com/embed/${ytId2}?rel=0`;
          embedIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
          embedIframe.setAttribute('allowfullscreen', '');
          embedIframe.setAttribute('frameborder', '0');
          embedWrap.appendChild(embedIframe);
          galleryModalCleanup = () => { embedIframe.src = ''; };
        } else {
          const embedVideo = document.createElement('video');
          embedVideo.src = videoSrc;
          embedVideo.setAttribute('controls', '');
          embedVideo.setAttribute('playsinline', '');
          embedVideo.preload = 'metadata';
          embedWrap.appendChild(embedVideo);
          galleryModalCleanup = () => { try { embedVideo.pause(); } catch (_) {} };
        }
        mediaWrap.appendChild(embedWrap);
      }

      stage.appendChild(mediaWrap);

      heroDiv.addEventListener('mouseenter', stopRotate);
      heroDiv.addEventListener('mouseleave', startRotate);

      btnHeroPrev.addEventListener('click', (ev) => {
        ev.stopPropagation();
        stopRotate();
        setActive(((activeIdx - 1) + imgs.length) % imgs.length);
        startRotate();
      });
      btnHeroNext.addEventListener('click', (ev) => {
        ev.stopPropagation();
        stopRotate();
        setActive((activeIdx + 1) % imgs.length);
        startRotate();
      });

      // Lightbox
      const lightbox = document.createElement('div');
      lightbox.className = 'project-modal__gallery-lightbox';
      lightbox.setAttribute('hidden', '');
      lightbox.setAttribute('aria-hidden', 'true');

      const lbBackdrop = document.createElement('button');
      lbBackdrop.type = 'button';
      lbBackdrop.className = 'project-modal__gallery-lightbox__backdrop';
      lbBackdrop.setAttribute('aria-label', 'Close expanded gallery');

      const lbFigure = document.createElement('div');
      lbFigure.className = 'project-modal__gallery-lightbox__figure';

      const lbImg = document.createElement('img');
      lbImg.className = 'project-modal__gallery-lightbox__img';
      lbImg.alt = '';

      const lbVideo = document.createElement('video');
      lbVideo.className = 'project-modal__gallery-lightbox__video';
      lbVideo.setAttribute('controls', '');
      lbVideo.setAttribute('playsinline', '');
      lbVideo.setAttribute('muted', '');
      lbVideo.setAttribute('loop', '');
      lbVideo.preload = 'metadata';
      lbVideo.hidden = true;

      const lbIframe = document.createElement('iframe');
      lbIframe.className = 'project-modal__gallery-lightbox__iframe';
      lbIframe.setAttribute('allowfullscreen', '');
      lbIframe.setAttribute('allow', 'autoplay; fullscreen');
      lbIframe.setAttribute('frameborder', '0');
      lbIframe.hidden = true;
      lbIframe.style.display = 'none'; // belt-and-suspenders: CSS `display:block` overrides [hidden]

      const btnLbPrev = document.createElement('button');
      btnLbPrev.type = 'button';
      btnLbPrev.className =
        'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--prev';
      btnLbPrev.setAttribute('aria-label', 'Previous image');
      btnLbPrev.innerHTML = '<span aria-hidden="true">&#8592;</span>';

      const btnLbNext = document.createElement('button');
      btnLbNext.type = 'button';
      btnLbNext.className =
        'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--next';
      btnLbNext.setAttribute('aria-label', 'Next image');
      btnLbNext.innerHTML = '<span aria-hidden="true">&#8594;</span>';

      const btnLbClose = document.createElement('button');
      btnLbClose.type = 'button';
      btnLbClose.className = 'project-modal__gallery-lightbox__close';
      btnLbClose.setAttribute('aria-label', 'Exit expanded gallery');
      btnLbClose.innerHTML = '<span aria-hidden="true">&times;</span>';

      if (imgs.length <= 1) {
        btnLbPrev.hidden = true;
        btnLbNext.hidden = true;
      }

      lbFigure.append(lbImg, lbVideo, lbIframe);
      lightbox.append(lbBackdrop, btnLbPrev, lbFigure, btnLbNext, btnLbClose);
      projectModal.appendChild(lightbox);

      let lightboxOpen = false;

      const onLightboxKeydown = (e) => {
        if (!lightboxOpen) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); goLb(activeIdx - 1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); goLb(activeIdx + 1); }
      };

      const showLbEl  = (el) => { el.hidden = false; el.style.display = ''; };
      const hideLbEl  = (el) => { el.hidden = true;  el.style.display = 'none'; };

      const goLb = (i) => {
        const n = imgs.length;
        activeIdx = ((i % n) + n) % n;
        const src = imgs[activeIdx];
        const isVid = false; // video is shown as inline embed, not in lightbox
        if (isVid) {
          hideLbEl(lbImg);
          try { lbVideo.pause(); } catch (_) {}
          if (isYouTube(videoSrc)) {
            hideLbEl(lbVideo);
            lbIframe.src = ytEmbed(getYouTubeId(videoSrc));
            showLbEl(lbIframe);
          } else {
            hideLbEl(lbIframe);
            lbIframe.src = '';
            lbVideo.src = videoSrc;
            showLbEl(lbVideo);
            lbVideo.play().catch(() => {});
          }
        } else {
          lbImg.src = src;
          showLbEl(lbImg);
          hideLbEl(lbVideo);
          hideLbEl(lbIframe);
          lbIframe.src = '';
          try { lbVideo.pause(); } catch (_) {}
        }
        if (!isVid) heroImg.src = src;
        thumbEls.forEach((t, j) => t.classList.toggle('is-active', j === activeIdx));
      };

      const openLightbox = (startIdx = activeIdx) => {
        lightboxOpen = true;
        lightbox.removeAttribute('hidden');
        lightbox.setAttribute('aria-hidden', 'false');
        goLb(startIdx);
        document.addEventListener('keydown', onLightboxKeydown, true);
      };

      const closeLightbox = () => {
        if (!lightboxOpen) return;
        lightboxOpen = false;
        lightbox.setAttribute('hidden', '');
        lightbox.setAttribute('aria-hidden', 'true');
        try { lbVideo.pause(); } catch (_) {}
        lbIframe.src = '';
        lbIframe.hidden = true;
        document.removeEventListener('keydown', onLightboxKeydown, true);
      };

      wrap._closeGalleryLightbox = closeLightbox;

      heroDiv.addEventListener('click', () => openLightbox(activeIdx));

      lbBackdrop.addEventListener('click', closeLightbox);
      btnLbClose.addEventListener('click', closeLightbox);
      btnLbPrev.addEventListener('click', (ev) => { ev.stopPropagation(); goLb(activeIdx - 1); });
      btnLbNext.addEventListener('click', (ev) => { ev.stopPropagation(); goLb(activeIdx + 1); });
      lightbox.addEventListener('click', (ev) => ev.stopPropagation());

      wrap.append(header, stage);
      container.appendChild(wrap);

      startRotate();

      galleryModalCleanup = () => {
        stopRotate();
        document.removeEventListener('keydown', onLightboxKeydown, true);
        lightbox.remove();
        container.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (_) {} });
      };

      projectModal.setAttribute('aria-labelledby', 'project-modal-gallery-title');
    };

    let archiveGridClickReadyAt = 0;
    let closeAnimTimer = null;

    function closeProjectModal(instant = false) {
      if (typeof galleryModalCleanup === 'function') {
        galleryModalCleanup();
        galleryModalCleanup = null;
      }
      currentCardEl = null;
      if (prevProjectBtn) prevProjectBtn.hidden = true;
      if (nextProjectBtn) nextProjectBtn.hidden = true;
      document.body.style.overflow = '';
      projectModal.classList.remove('project-modal--gallery-mode');
      projectModal.setAttribute('aria-labelledby', 'project-modal-title');
      modalBody?.querySelectorAll('video').forEach((v) => {
        v.pause();
        try { v.currentTime = 0; } catch (_) {}
      });

      if (instant || projectModal.hidden) {
        projectModal.hidden = true;
        projectModal.classList.remove('is-entering', 'is-closing');
        return;
      }

      projectModal.classList.remove('is-entering');
      projectModal.classList.add('is-closing');
      if (closeAnimTimer) clearTimeout(closeAnimTimer);
      closeAnimTimer = setTimeout(() => {
        projectModal.hidden = true;
        projectModal.classList.remove('is-closing');
        closeAnimTimer = null;
      }, 240);
    }

    function openProjectModal() {
      if (closeAnimTimer) {
        clearTimeout(closeAnimTimer);
        closeAnimTimer = null;
        projectModal.classList.remove('is-closing');
      }
      projectModal.hidden = false;
      document.body.style.overflow = 'hidden';
      void projectModal.offsetHeight;
      projectModal.classList.add('is-entering');
      closeBtn?.focus({ preventScroll: true });
      setTimeout(() => projectModal.classList.remove('is-entering'), 420);
    }

    window.addEventListener('pageshow', () => {
      archiveGridClickReadyAt = performance.now() + 480;
      closeProjectModal(true);
    });

    /* Escape closes modal even if another listener consumes the event */
    /* Escape: expanded gallery first, then close modal */
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape') return;
        if (projectModal.hidden) return;
        const lb = projectModal.querySelector('.project-modal__gallery-lightbox');
        const gWrap = modalBody?.querySelector('.project-modal__gallery');
        if (
          lb &&
          !lb.hasAttribute('hidden') &&
          typeof gWrap?._closeGalleryLightbox === 'function'
        ) {
          gWrap._closeGalleryLightbox();
          e.preventDefault();
          return;
        }
        e.preventDefault();
        closeProjectModal();
      },
      true
    );

    projectModal.addEventListener('click', (e) => {
      if (!e.target.closest('[data-modal-dismiss]')) return;
      e.preventDefault();
      closeProjectModal();
    });

    const openFromCard = (card) => {
      if (!titleEl || !catEl || !metaEl) return;
      titleEl.textContent =
        card.querySelector('.project-card__title')?.textContent?.trim() ||
        'Project';
      catEl.textContent =
        card.querySelector('.project-card__cat')?.textContent?.trim() || '';
      const spans = card.querySelectorAll('.project-card__meta span');
      const lineA = spans[0]?.textContent?.trim() || '';
      const lineB = spans[1]?.textContent?.trim() || '';
      metaEl.textContent = lineB ? `${lineA} · ${lineB}` : lineA;

      if (modalBody) {
        const tplId = card.dataset.modalTemplate;
        const gallery = card.dataset.galleryImages;

        if (tplId) {
          if (typeof galleryModalCleanup === 'function') {
            galleryModalCleanup();
            galleryModalCleanup = null;
          }
          projectModal.classList.remove('project-modal--gallery-mode');
          projectModal.setAttribute('aria-labelledby', 'project-modal-title');
          const tpl = document.getElementById(tplId);
          modalBody.innerHTML = tpl ? tpl.innerHTML : defaultBodyHTML;
          requestAnimationFrame(() => {
            modalBody.querySelectorAll('video[autoplay]').forEach((v) => {
              v.play().catch(() => {});
            });
            modalBody.querySelectorAll('[data-press-carousel]').forEach((carousel) => {
              const track = carousel.querySelector('[data-press-track]');
              if (!track) return;
              const stage = carousel.closest('[data-press-stage]');
              const counter = carousel.closest('.op-press')?.querySelector('[data-press-counter]');
              const prevBtn = stage?.querySelector('[data-press-prev]');
              const nextBtn = stage?.querySelector('[data-press-next]');
              const slides = Array.from(track.querySelectorAll('.project-modal__carousel-slide-wrap'));
              const imgs = slides.map((s) => s.querySelector('img')?.src).filter(Boolean);
              const n = slides.length;
              if (!n) return;
              let pressIdx = 0;

              carousel.classList.add('project-modal__carousel--expandable');

              const syncPress = () => {
                const w = carousel.getBoundingClientRect().width || carousel.offsetWidth;
                if (!w) return;
                slides.forEach((s) => { s.style.flex = `0 0 ${w}px`; s.style.width = `${w}px`; });
                track.style.transform = `translate3d(-${pressIdx * w}px,0,0)`;
                if (counter) counter.textContent = `${String(pressIdx + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
              };
              const goPress = (i) => { pressIdx = ((i % n) + n) % n; syncPress(); if (lbOpen) lbImg.src = imgs[pressIdx] || ''; };
              prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); goPress(pressIdx - 1); });
              nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); goPress(pressIdx + 1); });

              // — lightbox —
              const lb = document.createElement('div');
              lb.className = 'project-modal__gallery-lightbox';
              lb.setAttribute('hidden', '');
              lb.setAttribute('aria-hidden', 'true');

              const lbBackdrop = document.createElement('button');
              lbBackdrop.type = 'button';
              lbBackdrop.className = 'project-modal__gallery-lightbox__backdrop';
              lbBackdrop.setAttribute('aria-label', 'Close expanded view');

              const lbFigure = document.createElement('div');
              lbFigure.className = 'project-modal__gallery-lightbox__figure';

              const lbImg = document.createElement('img');
              lbImg.className = 'project-modal__gallery-lightbox__img';
              lbImg.alt = '';

              const lbPrev = document.createElement('button');
              lbPrev.type = 'button';
              lbPrev.className = 'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--prev';
              lbPrev.setAttribute('aria-label', 'Previous');
              lbPrev.innerHTML = '<span aria-hidden="true">&#8592;</span>';
              if (n <= 1) lbPrev.hidden = true;

              const lbNext = document.createElement('button');
              lbNext.type = 'button';
              lbNext.className = 'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--next';
              lbNext.setAttribute('aria-label', 'Next');
              lbNext.innerHTML = '<span aria-hidden="true">&#8594;</span>';
              if (n <= 1) lbNext.hidden = true;

              const lbClose = document.createElement('button');
              lbClose.type = 'button';
              lbClose.className = 'project-modal__gallery-lightbox__close';
              lbClose.setAttribute('aria-label', 'Close');
              lbClose.innerHTML = '<span aria-hidden="true">&times;</span>';

              lbFigure.appendChild(lbImg);
              lb.append(lbBackdrop, lbPrev, lbFigure, lbNext, lbClose);
              projectModal.appendChild(lb);

              let lbOpen = false;

              const onLbKey = (e) => {
                if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
                if (e.key === 'ArrowLeft') { e.preventDefault(); goPress(pressIdx - 1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); goPress(pressIdx + 1); }
              };
              const openLb = () => {
                lbOpen = true;
                lbImg.src = imgs[pressIdx] || '';
                lb.removeAttribute('hidden');
                lb.setAttribute('aria-hidden', 'false');
                document.addEventListener('keydown', onLbKey, true);
              };
              const closeLb = () => {
                lbOpen = false;
                lb.setAttribute('hidden', '');
                lb.setAttribute('aria-hidden', 'true');
                document.removeEventListener('keydown', onLbKey, true);
              };

              carousel.addEventListener('click', () => openLb());
              lbBackdrop.addEventListener('click', closeLb);
              lbClose.addEventListener('click', closeLb);
              lbPrev.addEventListener('click', (e) => { e.stopPropagation(); goPress(pressIdx - 1); });
              lbNext.addEventListener('click', (e) => { e.stopPropagation(); goPress(pressIdx + 1); });
              lb.addEventListener('click', (e) => e.stopPropagation());

              const ro = new ResizeObserver(syncPress);
              ro.observe(carousel);
              requestAnimationFrame(syncPress);

              galleryModalCleanup = () => {
                document.removeEventListener('keydown', onLbKey, true);
                ro.disconnect();
                lb.remove();
              };
            });

            // — press grid lightbox (op-press-grid) —
            const pressGrid = modalBody.querySelector('.op-press-grid');
            if (pressGrid) {
              const gridImgs = Array.from(pressGrid.querySelectorAll('.op-press-grid__img'));
              const pgN = gridImgs.length;
              if (pgN) {
                let pgIdx = 0;

                const pgLb = document.createElement('div');
                pgLb.className = 'project-modal__gallery-lightbox';
                pgLb.setAttribute('hidden', '');
                pgLb.setAttribute('aria-hidden', 'true');

                const pgBackdrop = document.createElement('button');
                pgBackdrop.type = 'button';
                pgBackdrop.className = 'project-modal__gallery-lightbox__backdrop';
                pgBackdrop.setAttribute('aria-label', 'Close expanded view');

                const pgFigure = document.createElement('div');
                pgFigure.className = 'project-modal__gallery-lightbox__figure';

                const pgImg = document.createElement('img');
                pgImg.className = 'project-modal__gallery-lightbox__img';
                pgImg.alt = '';

                const pgPrev = document.createElement('button');
                pgPrev.type = 'button';
                pgPrev.className = 'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--prev';
                pgPrev.setAttribute('aria-label', 'Previous');
                pgPrev.innerHTML = '<span aria-hidden="true">&#8592;</span>';

                const pgNext = document.createElement('button');
                pgNext.type = 'button';
                pgNext.className = 'project-modal__gallery-lightbox__nav project-modal__gallery-lightbox__nav--next';
                pgNext.setAttribute('aria-label', 'Next');
                pgNext.innerHTML = '<span aria-hidden="true">&#8594;</span>';

                const pgClose = document.createElement('button');
                pgClose.type = 'button';
                pgClose.className = 'project-modal__gallery-lightbox__close';
                pgClose.setAttribute('aria-label', 'Close');
                pgClose.innerHTML = '<span aria-hidden="true">&times;</span>';

                pgFigure.appendChild(pgImg);
                pgLb.append(pgBackdrop, pgPrev, pgFigure, pgNext, pgClose);
                projectModal.appendChild(pgLb);

                const goPg = (i) => { pgIdx = ((i % pgN) + pgN) % pgN; pgImg.src = gridImgs[pgIdx].src; };

                const onPgKey = (e) => {
                  if (e.key === 'Escape') { e.preventDefault(); closePgLb(); }
                  if (e.key === 'ArrowLeft') { e.preventDefault(); goPg(pgIdx - 1); }
                  if (e.key === 'ArrowRight') { e.preventDefault(); goPg(pgIdx + 1); }
                };
                const openPgLb = (i) => {
                  goPg(i);
                  pgLb.removeAttribute('hidden');
                  pgLb.setAttribute('aria-hidden', 'false');
                  document.addEventListener('keydown', onPgKey, true);
                };
                const closePgLb = () => {
                  pgLb.setAttribute('hidden', '');
                  pgLb.setAttribute('aria-hidden', 'true');
                  document.removeEventListener('keydown', onPgKey, true);
                };

                gridImgs.forEach((img, i) => {
                  img.style.cursor = 'zoom-in';
                  img.addEventListener('click', () => openPgLb(i));
                });
                pgBackdrop.addEventListener('click', closePgLb);
                pgClose.addEventListener('click', closePgLb);
                pgPrev.addEventListener('click', (e) => { e.stopPropagation(); goPg(pgIdx - 1); });
                pgNext.addEventListener('click', (e) => { e.stopPropagation(); goPg(pgIdx + 1); });
                pgLb.addEventListener('click', (e) => e.stopPropagation());

                galleryModalCleanup = () => {
                  document.removeEventListener('keydown', onPgKey, true);
                  pgLb.remove();
                };
              }
            }
          });
        } else if (gallery) {
          projectModal.classList.add('project-modal--gallery-mode');
          fillGalleryModal(modalBody, gallery, card.dataset.galleryVideo || '', {
            title: titleEl.textContent,
            cat: catEl.textContent,
            metaLine: metaEl.textContent,
            year: card.dataset.detailYear || '',
            description: card.dataset.description || '',
          });
        } else if (card.dataset.galleryVideo) {
          if (typeof galleryModalCleanup === 'function') {
            galleryModalCleanup();
            galleryModalCleanup = null;
          }
          projectModal.classList.add('project-modal--gallery-mode');
          projectModal.setAttribute('aria-labelledby', 'project-modal-gallery-title');
          modalBody.replaceChildren();

          const voWrap = document.createElement('div');
          voWrap.className = 'project-modal__gallery project-modal__gallery--stacked';

          // Left column: title + metadata
          const voHeader = document.createElement('div');
          voHeader.className = 'project-modal__gallery-header';

          const voTitleEl = document.createElement('h2');
          voTitleEl.className = 'project-modal__gallery-title';
          voTitleEl.id = 'project-modal-gallery-title';
          voTitleEl.textContent = card.querySelector('.project-card__title')?.textContent?.trim() || 'Project';
          voHeader.appendChild(voTitleEl);

          const voBubbles = document.createElement('div');
          voBubbles.className = 'project-modal__meta-bubbles';
          const voYear = card.dataset.detailYear || '';
          const voCatText = (card.querySelector('.project-card__cat')?.textContent?.trim() || 'Work').toUpperCase();
          [{ text: voCatText, accentSolo: true }, ...(voYear ? [{ text: voYear, accentSolo: false }] : [])]
            .forEach(({ text, accentSolo }) => {
              const pill = document.createElement('span');
              pill.className = 'project-modal__bubble project-modal__bubble--solo' + (accentSolo ? ' project-modal__bubble--solo-accent' : '');
              const tv = document.createElement('span');
              tv.className = 'project-modal__bubble-val';
              tv.textContent = text;
              pill.appendChild(tv);
              voBubbles.appendChild(pill);
            });
          if (voBubbles.childElementCount) voHeader.appendChild(voBubbles);

          const voDesc = document.createElement('p');
          voDesc.className = 'project-modal__gallery-desc' + (card.dataset.description ? '' : ' project-modal__gallery-desc--empty');
          voDesc.textContent = card.dataset.description || 'No description yet.';
          voHeader.appendChild(voDesc);

          // Right column: video
          const voStage = document.createElement('div');
          voStage.className = 'project-modal__gallery-stage project-modal__gallery-stage--video';

          const voVideoSrc = card.dataset.galleryVideo;
          const voYtId = isYouTube(voVideoSrc) ? getYouTubeId(voVideoSrc) : null;

          if (voYtId) {
            const voIframe = document.createElement('iframe');
            voIframe.src = `https://www.youtube.com/embed/${voYtId}?rel=0`;
            voIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
            voIframe.setAttribute('allowfullscreen', '');
            voIframe.setAttribute('frameborder', '0');
            voIframe.className = 'project-modal__gallery-video';
            voStage.appendChild(voIframe);
            voWrap.append(voHeader, voStage);
            modalBody.appendChild(voWrap);
            galleryModalCleanup = () => { voIframe.src = ''; };
          } else {
            const voVideo = document.createElement('video');
            voVideo.src = voVideoSrc;
            voVideo.setAttribute('controls', '');
            voVideo.setAttribute('playsinline', '');
            voVideo.setAttribute('muted', '');
            voVideo.setAttribute('loop', '');
            voVideo.preload = 'metadata';
            voVideo.className = 'project-modal__gallery-video';
            voStage.appendChild(voVideo);
            voWrap.append(voHeader, voStage);
            modalBody.appendChild(voWrap);
            requestAnimationFrame(() => { voVideo.play().catch(() => {}); });
            galleryModalCleanup = () => { try { voVideo.pause(); } catch (_) {} };
          }
        } else {
          if (typeof galleryModalCleanup === 'function') {
            galleryModalCleanup();
            galleryModalCleanup = null;
          }
          projectModal.classList.add('project-modal--gallery-mode');
          projectModal.setAttribute('aria-labelledby', 'project-modal-gallery-title');
          modalBody.replaceChildren();

          const nmWrap = document.createElement('div');
          nmWrap.className = 'project-modal__gallery project-modal__gallery--stacked';

          const nmHeader = document.createElement('div');
          nmHeader.className = 'project-modal__gallery-header';

          const nmTitle = document.createElement('h2');
          nmTitle.className = 'project-modal__gallery-title';
          nmTitle.id = 'project-modal-gallery-title';
          nmTitle.textContent = card.querySelector('.project-card__title')?.textContent?.trim() || 'Project';
          nmHeader.appendChild(nmTitle);

          const nmBubbles = document.createElement('div');
          nmBubbles.className = 'project-modal__meta-bubbles';
          const nmCat = card.querySelector('.project-card__cat')?.textContent?.trim() || '';
          const nmYear = card.dataset.detailYear || '';
          [{ text: nmCat || 'Work', accentSolo: true }, ...(nmYear ? [{ text: nmYear, accentSolo: false }] : [])]
            .filter(({ text }) => text)
            .forEach(({ text, accentSolo }) => {
              const pill = document.createElement('span');
              pill.className = 'project-modal__bubble project-modal__bubble--solo' + (accentSolo ? ' project-modal__bubble--solo-accent' : '');
              const tv = document.createElement('span');
              tv.className = 'project-modal__bubble-val';
              tv.textContent = text;
              pill.appendChild(tv);
              nmBubbles.appendChild(pill);
            });
          if (nmBubbles.childElementCount) nmHeader.appendChild(nmBubbles);

          const nmDesc = document.createElement('p');
          nmDesc.className = 'project-modal__gallery-desc' + (card.dataset.description ? '' : ' project-modal__gallery-desc--empty');
          nmDesc.textContent = card.dataset.description || 'No description yet.';
          nmHeader.appendChild(nmDesc);

          const nmStage = document.createElement('div');
          nmStage.className = 'project-modal__gallery-stage project-modal__gallery-stage--content';
          nmStage.innerHTML = defaultBodyHTML;

          nmWrap.append(nmHeader, nmStage);
          modalBody.appendChild(nmWrap);
        }
      }

      currentCardEl = card;
      syncNavBtns();
      openProjectModal();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modalBody?.querySelector('.project-modal__gallery')?.syncGalleryLayout?.();
        });
      });

    };

    archiveGrid.addEventListener('click', (e) => {
      if (performance.now() < archiveGridClickReadyAt) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const card = e.target.closest('.project-card');
      if (!card || card.classList.contains('hidden')) return;
      e.preventDefault();
      openFromCard(card);
    });

    if (prevProjectBtn) {
      prevProjectBtn.addEventListener('click', () => {
        const cards = getVisibleCards();
        const idx = currentCardEl ? cards.indexOf(currentCardEl) : -1;
        if (idx > 0) openFromCard(cards[idx - 1]);
      });
    }
    if (nextProjectBtn) {
      nextProjectBtn.addEventListener('click', () => {
        const cards = getVisibleCards();
        const idx = currentCardEl ? cards.indexOf(currentCardEl) : -1;
        if (idx >= 0 && idx < cards.length - 1) openFromCard(cards[idx + 1]);
      });
    }

    // Arrow-key project navigation (only when no lightbox is open)
    document.addEventListener('keydown', (e) => {
      if (projectModal.hidden) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (document.activeElement?.matches?.('input,textarea,select,[contenteditable]')) return;
      const openLightbox = projectModal.querySelector(
        '.project-modal__gallery-lightbox:not([hidden])'
      );
      if (openLightbox) return;
      e.preventDefault();
      const cards = getVisibleCards();
      const idx = currentCardEl ? cards.indexOf(currentCardEl) : -1;
      if (e.key === 'ArrowLeft' && idx > 0) openFromCard(cards[idx - 1]);
      if (e.key === 'ArrowRight' && idx >= 0 && idx < cards.length - 1) openFromCard(cards[idx + 1]);
    }, true);

    closeProjectModal(true);
  }

  /* ----------------------------------------------------------
     8. Archive — project card cursor tilt
     Extracted so it can be called again after PocketBase grid rebuild.
     ---------------------------------------------------------- */
  const initCardTilt = (root) => {
    if (!finePointer || prefersReducedMotion) return;
    const TILT = 7;
    const lerp = (a, b, t) => a + (b - a) * t;

    root.querySelectorAll('.project-card:not([data-tilt-init])').forEach((card) => {
      card.dataset.tiltInit = '1';
      let raf = null;
      let targetRX = 0, targetRY = 0;
      let curRX = 0, curRY = 0;

      const step = () => {
        curRX = lerp(curRX, targetRX, 0.13);
        curRY = lerp(curRY, targetRY, 0.13);
        card.style.transform =
          `rotateX(${curRX}deg) rotateY(${curRY}deg) translateZ(8px)`;
        const moving =
          Math.abs(curRX - targetRX) > 0.02 ||
          Math.abs(curRY - targetRY) > 0.02;
        raf = moving ? requestAnimationFrame(step) : null;
      };

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width * 0.5)) / (r.width * 0.5);
        const dy = (e.clientY - (r.top + r.height * 0.5)) / (r.height * 0.5);
        targetRY = dx * TILT;
        targetRX = -dy * TILT;
        if (!raf) raf = requestAnimationFrame(step);
      });

      card.addEventListener('mouseleave', () => {
        targetRX = 0;
        targetRY = 0;
        if (!raf) raf = requestAnimationFrame(step);
      });
    });
  };
  initCardTilt(document);

  /* ----------------------------------------------------------
     9. PocketBase grid rebuild — re-init interactive features
     ---------------------------------------------------------- */
  document.addEventListener('pb:projects-loaded', () => {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    initVideoHover(grid);
    initCardTilt(grid);
    // Re-apply the currently active filter so counts update and
    // hidden/visible classes are set correctly on the new cards.
    const activeBtn = filterBar?.querySelector('.filter-bar__btn.active');
    applyFilter(activeBtn?.dataset.filter ?? 'all');
  });

  // Ensure static titles (HTML) also get break opportunities after underscores.
  // surround underscores with ZWSP so breaks don't leave trailing underscores
  const insertZWSP = (s) => String(s ?? '').replace(/_/g, (m) => '\u200B' + m + '\u200B');
  const applyTitleBreaks = () => {
    const sel = '.project-card__title, .project-card__meta span, .stack-card__title';
    document.querySelectorAll(sel).forEach((el) => {
      const txt = el.textContent ?? '';
      const updated = insertZWSP(txt);
      if (updated !== txt) el.textContent = updated;
    });
  };

  document.addEventListener('DOMContentLoaded', applyTitleBreaks);
  document.addEventListener('pb:landing-loaded', applyTitleBreaks);
  document.addEventListener('pb:projects-loaded', applyTitleBreaks);
})();
