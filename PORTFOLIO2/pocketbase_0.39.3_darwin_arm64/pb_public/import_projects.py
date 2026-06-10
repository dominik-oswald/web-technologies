#!/usr/bin/env python3
"""
One-time importer: hearthead-ozzy portfolio  ->  PocketBase `projects` collection.

What it does
------------
- Parses projects.html and finds every project card.
- Keeps only REAL projects (media under MEDIA/...). Drops the dummy
  `assets/projects/*.jpg` placeholder cards.
- Seeds exactly ONE placeholder record in the `art` category (since both real
  art cards were placeholders and you asked to keep the category populated).
- Gallery (stack) projects: uploads their images, in order, into PocketBase.
- Video projects: created with an EMPTY video_url for you to paste a YouTube
  link into later (your videos aren't on YouTube yet, so nothing to migrate).
- OPTICAL_PRIME: imported as a normal record; its description + credits are
  pulled from the page's modal template.

Run it from the folder that contains BOTH projects.html and your MEDIA/ folder.

    pip install requests beautifulsoup4
    python import_projects.py            # dry run first (prints plan, writes nothing)
    python import_projects.py --commit   # actually create the records
"""

import argparse
import html
import os
import re
import sys

import requests
from bs4 import BeautifulSoup

# ----------------------------------------------------------------------------
# CONFIG — edit these
# ----------------------------------------------------------------------------
PB_URL         = "http://127.0.0.1:8090"     # your PocketBase URL
ADMIN_EMAIL    = "dominikph.oswald@gmail.com"           # your superuser email
ADMIN_PASSWORD = "%dR9T&jYTPFKzc4H!3BZgva04"             # your superuser password
COLLECTION     = "projects"

HTML_FILE   = "projects.html"   # path to your archive page
MEDIA_ROOT  = "."               # folder that contains the MEDIA/ directory
                                # (use "." if MEDIA/ sits next to this script)

VALID_CATEGORIES = {"illustration", "interaction", "graphic", "photography", "art"}
IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp", ".gif")
# ----------------------------------------------------------------------------


def auth_token():
    """Authenticate as superuser and return the auth token."""
    r = requests.post(
        f"{PB_URL}/api/collections/_superusers/auth-with-password",
        json={"identity": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"[auth failed] {r.status_code}: {r.text}")
    return r.json()["token"]


def split_gallery(value):
    """Split a data-gallery-images value into paths.

    Splitting on every comma breaks paths that contain a stray comma (a few of
    your folder names do). Each real path starts with 'MEDIA/', so we split
    only before each 'MEDIA/' — robust against commas inside a path.
    """
    value = html.unescape(value.strip())
    parts = re.split(r",(?=MEDIA/)", value)
    return [p.strip() for p in parts if p.strip()]


def clean_title(text):
    return html.unescape(text.strip()) if text else ""


def parse_cards(soup):
    """Yield a dict describing every REAL project card."""
    for a in soup.select("a.project-card"):
        title_el = a.select_one(".project-card__title") or a.select_one(".project-card__meta span")
        title = clean_title(title_el.get_text()) if title_el else "Untitled"

        cats = [c for c in (a.get("data-category", "").split()) if c in VALID_CATEGORIES]
        year = a.get("data-detail-year", "").strip()

        gallery_attr = a.get("data-gallery-images")
        video_attr = a.get("data-gallery-video")

        # Classify media
        if gallery_attr:
            images = split_gallery(gallery_attr)
            yield {"title": title, "cats": cats, "year": year,
                   "layout": "gallery", "images": images, "video": True if False else False}
        elif video_attr:
            yield {"title": title, "cats": cats, "year": year,
                   "layout": "video", "images": [], "video": True}
        else:
            # single-image card: real only if it points at MEDIA/
            img = a.select_one("img.project-card__img") or a.select_one("img")
            src = html.unescape(img.get("src", "")) if img else ""
            if src.startswith("MEDIA/"):
                yield {"title": title, "cats": cats, "year": year,
                       "layout": "single", "images": [src], "video": False}
            # else: placeholder (assets/projects/...) -> skipped


def optical_prime_extras(soup):
    """Pull description + credits from the OPTICAL_PRIME modal template."""
    tpl = soup.select_one("#optical-prime-modal")
    if not tpl:
        return "", ""
    ps = tpl.select(".op-text__p")
    desc = clean_title(ps[0].get_text()) if ps else ""
    credits = ""
    for p in ps:
        t = clean_title(p.get_text())
        if "cooperation" in t.lower() or "with" in t.lower():
            credits = t
    return desc, credits


def build_record(card, soup):
    """Return (fields_dict, list_of_image_paths)."""
    fields = {
        "title": card["title"],
        "categories": card["cats"] or [],
        "layout": card["layout"],
    }
    if card["year"]:
        fields["year"] = card["year"]

    if card["title"].strip('"').upper().startswith("OPTICAL_PRIME"):
        desc, credits = optical_prime_extras(soup)
        if desc:
            fields["description"] = desc
        if credits:
            fields["credits"] = credits

    return fields, card["images"] if card["layout"] != "video" else []


def create_record(token, fields, image_paths, dry):
    """POST one record, uploading any gallery images in order."""
    parts = []
    for k, v in fields.items():
        if k == "categories":
            for cat in v:
                parts.append(("categories", (None, cat)))
        else:
            parts.append((k, (None, str(v))))

    open_files = []
    missing = []
    for p in image_paths:
        full = os.path.join(MEDIA_ROOT, p)
        if os.path.isfile(full):
            fh = open(full, "rb")
            open_files.append(fh)
            parts.append(("gallery", (os.path.basename(full), fh, "application/octet-stream")))
        else:
            missing.append(p)

    if dry:
        for fh in open_files:
            fh.close()
        return None, missing

    try:
        r = requests.post(
            f"{PB_URL}/api/collections/{COLLECTION}/records",
            headers={"Authorization": token},
            files=parts,
            timeout=120,
        )
    finally:
        for fh in open_files:
            fh.close()

    if r.status_code not in (200, 201):
        return f"ERROR {r.status_code}: {r.text[:200]}", missing
    return "ok", missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true", help="actually write records")
    args = ap.parse_args()
    dry = not args.commit

    with open(HTML_FILE, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    cards = list(parse_cards(soup))
    token = auth_token()

    print(f"\n{'DRY RUN — nothing will be written' if dry else 'COMMITTING'}\n" + "-" * 50)

    gallery_n = video_n = 0
    needs_youtube = []
    all_missing = []

    for card in cards:
        fields, images = build_record(card, soup)
        result, missing = create_record(token, fields, images, dry)
        all_missing += missing

        tag = card["layout"]
        if tag == "video":
            video_n += 1
            needs_youtube.append(card["title"])
        else:
            gallery_n += 1

        status = "(planned)" if dry else (result or "")
        extra = f" [{len(images)} imgs]" if images else ""
        miss = f"  ⚠ {len(missing)} missing files" if missing else ""
        print(f"  {tag:8} {card['title'][:40]:42}{extra}{miss} {status}")

    # Seed one art placeholder
    ph = {"title": "Untitled (Art)", "categories": ["art"], "layout": "single",
          "description": "Placeholder — art work coming soon."}
    res, _ = create_record(token, ph, [], dry)
    print(f"  {'art-ph':8} {'Untitled (Art) [placeholder]':42} {'(planned)' if dry else res}")

    print("-" * 50)
    print(f"Gallery/single projects: {gallery_n}")
    print(f"Video projects:          {video_n}  (need YouTube links pasted in)")
    print(f"Art placeholder:         1")
    if needs_youtube:
        print("\nPaste a YouTube link into video_url for these records:")
        for t in needs_youtube:
            print(f"  - {t}")
    if all_missing:
        print(f"\n⚠ {len(all_missing)} image file(s) not found on disk (check MEDIA_ROOT / paths):")
        for m in all_missing[:20]:
            print(f"  - {m}")
    if dry:
        print("\nLooks right? Re-run with  --commit  to create the records.")


if __name__ == "__main__":
    main()
