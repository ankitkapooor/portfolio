# Handwriting

The site sets handwritten text in **Ankit Hand** (`AnkitHand-Regular.ttf`, served
as `apps/portfolio/app/fonts/AnkitHand-Regular.woff2`). Phrases listed in
`phrases.json` also write themselves: pen paths traced through the font's own
letters drive a mask that reveals the real text stroke by stroke.

To add or change a written phrase, edit `phrases.json` (exact text as used on
the site), then regenerate:

```sh
# 1. Render each phrase in the font with browser shaping (needs Google Chrome)
node tools/handwriting/render.mjs tools/handwriting/AnkitHand-Regular.ttf \
  tools/handwriting/phrases.json /tmp/hand-render

# 2. Trace pen paths and write the site data
python tools/handwriting/trace_font.py tools/handwriting /tmp/hand-render \
  apps/portfolio/public/hand apps/portfolio/content/handwriting.ts
```

Step 2 needs `numpy`, `pillow`, `scipy`, and `scikit-image`. Text not listed in
`phrases.json` still renders in the font, just without the writing animation.

The signature is separate: see `tools/signature`.
