# Navigation content (single source)

All primary categories, mega-menu copy, CTAs, images, announcements, secondary links and mobile bar items live in:

**`web/src/content/navigation.json`**

Header, drawer, footer, category pages, sitemap and structured data all read from `web/src/lib/navigation.ts`, which loads that file.

## Edit without touching templates

1. Change labels, headlines, sublines, link descriptors, CTAs or image paths in `navigation.json`.
2. Set `"enabled": false` to hide a category everywhere.
3. Optional: host a copy of the JSON and set `NEXT_PUBLIC_NAV_CONFIG_URL` (wire-up ready in comments) for remote edits without a code change.

## Primary order

Suits → Shirts → Polos → Trousers → Khakis → Jeans → Outerwear → Knitwear → Accessories
