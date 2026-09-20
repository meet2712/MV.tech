# Website font

`inter-latin-site.woff2` is generated from `inter-latin-var.woff2` by retaining the
400–900 weight range, omitting thin weights that the website does not use.
It keeps all 230 mapped characters,
all 518 glyphs, and the complete 14–32 optical-size axis. The original font
remains available for social-image generation and brand assets.

Regenerate with FontTools and Brotli installed in a Python environment:

```sh
python -m fontTools.varLib.instancer fonts/inter-latin-var.woff2 wght=400:900 --output=fonts/inter-latin-site.woff2
```

If a website style later needs a weight below 400, expand this range and
update the `@font-face` declaration in `css/input.css`. The generated page
preload in `scripts/build.mjs` must point to the same file as that declaration.

Both files are covered by `LICENSE-Inter-OFL.txt`.

Validation compared all 518 glyphs at the eight website weights (400–750) and
three optical sizes (14, 17, 32): 12,432 glyph instances. Advance widths were
identical; maximum outline rounding was 0.326 font units out of 2,048 units per
em. The website font is 55,636 bytes, down from 72,920 bytes (23.7%).
