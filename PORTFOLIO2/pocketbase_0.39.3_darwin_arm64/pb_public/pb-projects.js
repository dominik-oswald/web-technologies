/* ============================================================
   PocketBase project loader  ·  hearthead – ozzy
   Fetches the `projects` collection and rebuilds #archive-grid.
   Falls back silently to the hardcoded static HTML when:
     - PocketBase is unreachable
     - The collection is empty
   ============================================================ */

(async () => {
  'use strict';

  const grid = document.getElementById('archive-grid');
  if (!grid) return;

  const CATEGORY_ORDER = ['illustration', 'interaction', 'graphic', 'art', 'photography'];
  const CAT_LABELS = {
    illustration: 'Illustration',
    interaction:  'Interaction Design',
    graphic:      'Graphic Design',
    art:          'Art',
    photography:  'Videography',
  };

  /* -- helpers -------------------------------------------------- */
  const esc = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Surround underscores with zero-width spaces so browsers can break there
  // without leaving awkward trailing punctuation.
  // Use this for visible titles only; keep `alt` text free of ZWSP for screen readers.
  const insertBreaks = (s) => String(s ?? '').replace(/_/g, (m) => '\u200B' + m + '\u200B');
  const pbFile = (recordId, filename) =>
    `/api/files/projects/${recordId}/${filename}`;

  /* -- fetch ---------------------------------------------------- */
  let records;
  try {
    const res = await fetch(
      '/api/collections/projects/records?perPage=500&sort=+sort,+created',
      { credentials: 'same-origin' }
    );
    if (!res.ok) return;
    const json = await res.json();
    records = json.items ?? [];
  } catch {
    return; // PocketBase unreachable → keep static HTML
  }

  if (!records.length) return; // empty collection → keep static HTML

  /* -- group by category ---------------------------------------- */
  const byCategory = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
  records.forEach((rec) => {
    const cat = rec.select;
    if (byCategory[cat]) byCategory[cat].push(rec);
  });

  /* -- card builders -------------------------------------------- */
  const SHEET_STYLES = [
    '--dx:-10px;--dy:18px;--rot:-7deg',
    '--dx:8px;--dy:12px;--rot:5deg',
    '--dx:-6px;--dy:6px;--rot:-3deg',
    '--dx:5px;--dy:2px;--rot:4deg',
    '--dx:-2px;--dy:-6px;--rot:-2deg',
  ];

  function buildCard(rec) {
    const catLabel  = CAT_LABELS[rec.select] ?? 'Work';
    const rawTitle = rec.title ?? '';
    const safeTitle = esc(rawTitle); // for attributes / screen readers
    const breakTitle = insertBreaks(safeTitle); // visible title with break opportunities
    const files        = rec.gallery ?? [];
    const rawVideoUrl  = rec.video ?? '';
    // PocketBase file fields return plain filenames (no slash); convert to API URL
    const videoUrl = rawVideoUrl && !rawVideoUrl.includes('/')
      ? pbFile(rec.id, rawVideoUrl)
      : rawVideoUrl;
    const isStack   = rec.layout === 'gallery' && files.length > 1;
    const isVideo   = rec.layout === 'video';
    const fileUrls  = files.map((fn) => pbFile(rec.id, fn));
    const galleryCSV = fileUrls.join(',');

    const a = document.createElement('a');
    a.href = '#';
    a.dataset.category = rec.select ?? '';
    if (rec.year)        a.dataset.detailYear   = String(rec.year);
    if (rec.description) a.dataset.description  = rec.description.replace(/<[^>]*>/g, '').trim();
    if (galleryCSV)      a.dataset.galleryImages = galleryCSV;
    if (videoUrl)        a.dataset.galleryVideo  = videoUrl;

    let mediaHTML;

    if (isStack) {
      a.className = 'project-card project-card--stack';
      const sheetCount = Math.min(SHEET_STYLES.length, files.length);
      let sheetsHTML = '';
      for (let i = 0; i < sheetCount; i++) {
        // z:1 = bottom (shows last image), z:N = top (shows first/hero image)
        const zIdx   = i + 1;
        const imgIdx = sheetCount - 1 - i;
        const src    = fileUrls[imgIdx] ?? fileUrls[0];
        const isTop  = i === sheetCount - 1;
        sheetsHTML  += `<div class="archive-stack__sheet" style="--z:${zIdx};${SHEET_STYLES[i]}">
          <img loading="lazy" decoding="async" src="${esc(src)}" alt="${isTop ? safeTitle : ''}" />
        </div>`;
      }
      mediaHTML = `<div class="archive-stack" aria-hidden="true">${sheetsHTML}</div>`;

    } else if (isVideo) {
      a.className = 'project-card';
      const ytMatch = videoUrl.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
      const ytId = ytMatch ? ytMatch[1] : null;
      if (fileUrls.length) {
        mediaHTML = `<img class="project-card__img" loading="lazy" decoding="async" src="${esc(fileUrls[0])}" alt="${safeTitle}" />`;
      } else if (ytId) {
        // maxresdefault (1280×720) when available; onload checks naturalWidth to detect the
        // 120×90 "no HD thumbnail" placeholder YouTube returns instead of a 404, then falls back.
        mediaHTML = `<img class="project-card__img" loading="lazy" decoding="async" src="https://img.youtube.com/vi/${ytId}/maxresdefault.jpg" alt="${safeTitle}" onload="if(this.naturalWidth<=120)this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'" onerror="this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'">`;
      } else if (videoUrl) {
        mediaHTML = `<video class="project-card__img" src="${esc(videoUrl)}" muted preload="metadata" playsinline></video>`;
      } else {
        mediaHTML = `<div class="project-card__placeholder">${esc(catLabel)}</div>`;
      }

    } else {
      // single-image or interaction card
      a.className = 'project-card';
      mediaHTML = fileUrls.length
        ? `<img class="project-card__img" loading="lazy" decoding="async" src="${esc(fileUrls[0])}" alt="${safeTitle}" />`
        : `<div class="project-card__placeholder">${esc(catLabel)}</div>`;
    }

    a.innerHTML = `
      <div class="project-card__media">
        ${mediaHTML}
        <div class="project-card__overlay">
          <span class="project-card__title">${breakTitle}</span>
          <span class="project-card__cat">${esc(catLabel)}</span>
        </div>
      </div>
      <div class="project-card__meta"><span>${breakTitle}</span></div>`;

    const li = document.createElement('li');
    li.appendChild(a);
    return li;
  }

  /* -- rebuild the grid ----------------------------------------- */
  const frag = document.createDocumentFragment();

  CATEGORY_ORDER.forEach((cat) => {
    const catRecords = byCategory[cat];
    if (!catRecords.length) return;

    const sectionLi = document.createElement('li');
    sectionLi.className = 'archive-grid__section';
    sectionLi.dataset.archiveSection = cat;
    sectionLi.innerHTML = `<button type="button" class="archive-section-bar">${CAT_LABELS[cat]}</button>`;
    frag.appendChild(sectionLi);

    catRecords.forEach((rec) => frag.appendChild(buildCard(rec)));
  });

  grid.replaceChildren(frag);

  // Notify script.js that the grid has been rebuilt so it can re-run
  // video-hover and card-tilt setup, then reapply the current filter.
  document.dispatchEvent(new CustomEvent('pb:projects-loaded'));
})();
