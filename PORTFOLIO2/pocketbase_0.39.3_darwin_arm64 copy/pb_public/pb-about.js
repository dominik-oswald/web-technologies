/* ============================================================
   PocketBase about-page loader  ·  hearthead – ozzy
   Fetches the first record in the `about` collection and
   updates DOM elements.  Falls back to the static HTML if
   PocketBase is unreachable or the collection is empty.
   ============================================================ */

(async () => {
  'use strict';

  const pbFile = (collectionId, recordId, filename) =>
    `/api/files/${collectionId}/${recordId}/${filename}`;

  let record;
  try {
    const res = await fetch(
      '/api/collections/about/records?perPage=1&sort=-updated',
      { credentials: 'same-origin' }
    );
    if (!res.ok) return;
    const json = await res.json();
    record = (json.items ?? [])[0];
  } catch {
    return;
  }

  if (!record) return;

  const $ = (sel) => document.querySelector(sel);

  // --- Heading ---
  if (record.heading) {
    const el = $('[data-about-heading]');
    if (el) el.textContent = record.heading;
  }

  // --- Lede ---
  if (record.lede) {
    const el = $('[data-about-lede]');
    if (el) el.textContent = record.lede;
  }

  // --- Body copy (HTML) ---
  if (record.copy) {
    const el = $('[data-about-copy]');
    if (el) el.innerHTML = record.copy;
  }

  // --- Portrait image ---
  if (record.portrait) {
    const el = $('[data-about-portrait]');
    if (el) {
      el.src = pbFile('about', record.id, record.portrait);
      el.onerror = null; // suppress fallback
    }
  }

  // --- Contact email ---
  if (record.email) {
    const emailLinks = document.querySelectorAll('[data-about-email]');
    emailLinks.forEach((el) => {
      el.href = `mailto:${record.email}`;
      const val = el.querySelector('.contact__link__value');
      if (val) val.textContent = record.email;
    });
  }

  // --- Instagram ---
  if (record.instagram) {
    const igLinks = document.querySelectorAll('[data-about-instagram]');
    igLinks.forEach((el) => {
      el.href = record.instagram;
    });
  }
})();
