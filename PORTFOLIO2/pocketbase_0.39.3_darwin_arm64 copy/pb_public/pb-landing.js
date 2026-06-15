/* ============================================================
   PocketBase landing loader  ·  hearthead – ozzy
   Fetches the `projects` collection and rebuilds the landing
   page stacks to match what's in the database.
   Falls back silently to hardcoded HTML when PocketBase is
   unreachable or the collection is empty.
   ============================================================ */

(async () => {
  'use strict';

  if (!document.body.classList.contains('page--landing')) return;

  // Map each stack's data-cat value to the PocketBase select field value
  const STACK_TO_PB = {
    illustration: 'illustration',
    interaction:  'interaction',
    graphic:      'graphic',
    art:          'art',
    video:        'photography', // video stack = photography/videography category
  };

  // Which archive URL each stack links to
  const STACK_TO_HREF = {
    illustration: 'projects.html?cat=illustration',
    interaction:  'projects.html?cat=interaction',
    graphic:      'projects.html?cat=graphic',
    art:          'projects.html?cat=art',
    video:        'projects.html?cat=photography',
  };

  const pbFile = (id, fn) => `/api/files/projects/${id}/${fn}`;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  // Surround underscores with zero-width spaces so browsers can break there
  // without leaving awkward trailing punctuation.
  const insertBreaks = (s) => String(s ?? '').replace(/_/g, (m) => '\u200B' + m + '\u200B');

  let records;
  try {
    const res = await fetch(
      '/api/collections/projects/records?perPage=500&sort=+sort,+created',
      { credentials: 'same-origin' }
    );
    if (!res.ok) return;
    records = (await res.json()).items ?? [];
  } catch {
    return; // PocketBase unreachable → keep static HTML
  }

  if (!records.length) return;

  // Group records by their PocketBase select value
  const byPbCat = {};
  records.forEach((rec) => {
    if (!byPbCat[rec.select]) byPbCat[rec.select] = [];
    byPbCat[rec.select].push(rec);
  });

  let updated = false;

  document.querySelectorAll('.stack[data-cat]').forEach((stackEl) => {
    const stackCat = stackEl.dataset.cat;
    const pbCat = STACK_TO_PB[stackCat];
    if (!pbCat) return;

    const recs = byPbCat[pbCat];
    if (!recs?.length) return; // no records → keep static HTML for this stack

    const container = stackEl.querySelector('[data-stack]');
    if (!container) return;

    const href = STACK_TO_HREF[stackCat] || 'projects.html';
    const frag = document.createDocumentFragment();

    recs.slice(0, 5).forEach((rec, i) => {
      const files  = rec.gallery ?? [];
      const vidUrl = rec.video ?? '';
      const title  = rec.title || '';

      // Thumbnail priority: gallery image → YouTube thumb → local video → placeholder
      let mediaSrc = '';
      let isLocalVid = false;

      if (files.length) {
        mediaSrc = pbFile(rec.id, files[0]);
      } else {
        const ytM = vidUrl.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
        if (ytM) {
          mediaSrc = `https://img.youtube.com/vi/${ytM[1]}/mqdefault.jpg`;
        } else if (vidUrl) {
          mediaSrc = vidUrl;
          isLocalVid = true;
        }
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stack-card';
      btn.dataset.i = i;
      btn.dataset.href = href;
      btn.dataset.title = title;

      const escapedTitle = esc(title);
      const breakTitle = insertBreaks(escapedTitle);
      let mediaHTML;
      if (isLocalVid) {
        mediaHTML = `<video loading="lazy" src="${esc(mediaSrc)}" muted preload="metadata" playsinline></video>`;
      } else if (mediaSrc) {
        const eager = i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
        mediaHTML = `<img ${eager} decoding="async" src="${esc(mediaSrc)}" alt="${escapedTitle}" onerror="this.outerHTML='<div class=&quot;stack-card__placeholder&quot;>${escapedTitle}</div>'" />`;
      } else {
        mediaHTML = `<div class="stack-card__placeholder">${escapedTitle}</div>`;
      }

      btn.innerHTML = `
        <div class="stack-card__frame">
          <div class="stack-card__media">${mediaHTML}</div>
          <span class="stack-card__overlay" aria-hidden="true">
            <span class="stack-card__title">"${breakTitle}"</span>
          </span>
        </div>`;

      frag.appendChild(btn);
    });

    container.replaceChildren(frag);
    updated = true;
  });

  if (updated) {
    document.dispatchEvent(new CustomEvent('pb:landing-loaded'));
  }
})();
