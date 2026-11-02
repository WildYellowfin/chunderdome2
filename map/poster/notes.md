# Notes: how map.svg was made

**Deliverables:** `map.svg` is the native SVG, 1200×1500 (viewBox 0 0 1000 1250), about 1.9 MB. `map.png` is 1600×2000. Brief: `brief.md`.

## Monge tools used (not Studio)

I used the newcomer CLI in the local checkout `~/Documents/Monge-desk` (`apps/surface/cli.ts`), through `scripts/monge.sh`. The session folder is `session/`. Monge-desk has no `.env.local`, so the wrapper reads `OPENAI_API_KEY` from `~/Documents/Monge/.env.local` and sets `MONGE_IMAGE_MODEL=gpt-image-2`. I didn't change any Monge code.

| Step | Command |
|---|---|
| Image generation, round 1 | `monge picture make map-v1 "<prompt-v1>" --size tall --keep-background --guide guide.svg --guide-notes "…"` |
| Image generation, round 2 | `monge picture make map-v2 "<prompt-v2>" --size tall --keep-background --guide guide-v2.svg --guide-notes "…"` |
| Image generation, round 3 (focal point) | `monge picture make dome "<prompt-dome>" --size wide --profile flat --colours 8` (cut out) |
| Vectorizing | `monge picture retrace map-v2 --profile cartoon --colours 12`, then `--profile flat --colours 6`, then `--profile flat --colours 8` (the one kept) |
| Vector recolour to the brief palette | `monge picture recolour map-v2 <#from> <#to>` ×8 and `monge picture recolour dome <#from> <#to>` ×7 |

**Recolour map for the terrain:** #d6a659→cream, #b48235→#e3c384 (ochre/cream tint), #a2742f→ochre, #584e24→olive, #3e3c1f→teal (the far ridges), #d88131→#e48a3c (sky), #446463→#3c6f79 (bay), #0f333d→teal.

## Iterations (3 image calls, 3 vectorize passes, 4 composite rounds)

1. **map-v1** (`sources/raster-v1.png`): a lovely style, but oblique perspective. The Golden Gate Bridge was drawn across the bay, and the guide's markers were copied into the art. Rejected.
2. **guide-v2**: the guide is now plotted from real lat/lon (`scripts/geo.py`, equirectangular with cos 38° correction). It has no route and no markers, and the prompt asks for plan view. **map-v2** (`sources/raster-v2.png`) follows the shorelines to within a few px. I checked this by overlaying the true shoreline vectors (`scripts/overlay.py`).
3. **Trace choice**: cartoon 12 was 5.3 MB of grain speckle. Flat 6 merged the sky into the land. **Flat 8** was kept, then despeckled (`scripts/despeckle.py` drops 692 tiny single-contour shapes) to give `sources/terrain-clean.svg`.
4. **dome**: the generated focal point, placed at poster scale on the Dillon Beach dunes.
5. **Composites** (`scripts/compose.py`):
   - Round 1: fonts fell back in the renderer and the title ran into Marin.
   - Round 2: DIN Condensed via headless Chrome; contours cut by hard masks.
   - Round 3: feathered masks, a banded dusk sky, despeckled terrain.
   - Round 4: the title block tightened so nothing touches the coast. Checked at 390px wide (`sources/check-390.png`).

## What's vector I drew on top (crisp, exact)

- Ocean bathymetry: 3 cream contours offset from the true coastline, feathered away from the title and the ocean label.
- Low vermilion sun on the sea horizon, and two dusk sky bands.
- The route as an exact polyline: SF → Golden Gate → US-101 → Petaluma → west via Tomales → Dillon Beach. It's vermilion with an ink casing.
- Markers and ink label plates: SAN FRANCISCO / FRI 6 PM, PETALUMA, DILLON BEACH. All labels are real `<text>`.
- "PACIFIC OCEAN", the subtitle and the title CHUNDER / DOME II are also real `<text>`.

## Caveats

- **Font:** the font stack is `'DIN Condensed', 'Oswald', 'Bebas Neue', 'Arial Narrow', Impact`. DIN Condensed ships with macOS and iOS, so it renders as designed on iPhone and Safari. On other platforms the app should load Oswald (a free Google font) so the condensed fallback holds. The PNG was rendered with headless Chrome because sharp/librsvg can't see macOS fonts. To re-render, use `scripts/render.sh map.svg map.png 1600 2000`.
- **Geography:** the shorelines are hand-plotted approximations of the real coast at this scale, not survey data.
- **Bodega Bay** sits near the horizon of the art, at the top left, and is not labelled, to keep the labels few.
- **Golden Gate:** there's only a small ink tower glyph from the art where the route crosses. I dropped my own bridge marks because they read as noise at this scale.

# v2 (after James's review)

The current `route-map.svg` and `route-map.png` come from **map-v4** and `scripts/compose2.py`. Everything above describes v1.

**Review notes and what changed:**

- **Dome looked glued on (clipping the ocean and route).** The dome is now painted *in* the terrain, in the same Monge image pass. `guide-v4.svg` marks its spot on the dunes north of the road, so the route and markers never touch it. Detail around the dome comes from a 16-colour cartoon retrace of the same raster, cut to the dome (`cutregion.py`) and feathered in. It's exactly aligned, because both traces come from the same pixels. A soft vector glow sits under it. A standalone dome (`prompt-dome-v2.txt`) read as a sticker again, so I rejected it.
- **Sunset looked wrong.** The sky is one split-fountain dusk gradient, clipped along the art's real skyline (`skyline.mjs` measures it from the raster). The sun is half-sunk into the sea horizon, above the art's own reflection strokes. The stacked stripes and the pasted semicircle are gone.
- **Recolouring flattened the ridges.** The v4 prompt asks for near, mid and far ridgelines with strong value steps. A cream haze layer (opacity 0.62 at the horizon, fading to 0 by mid-map) keeps far ridges pale and near ridges dark olive.
- **Labels.** "FRI 6 PM" and "PACIFIC OCEAN" are removed. The three plates are the same size, vertically centred on (or hung just below) their markers, and clear of the route.
- **Other quirks.**
  - Speckle: `despeckle.py` and `pinholes.py` (14k pinholes filled) remove the trace grain.
  - Stray teal blobs in the ridges are removed.
  - The route is a Catmull-Rom curve, with no kinks.
  - Bathymetry offsets the coastline the art actually drew (`coast.mjs` scans the open Pacific from the raster), so the contours never cut across land.

**Monge calls in v2:**
- `picture make map-v3` (rejected: coast drifted about 25px, flat land).
- `picture make map-v4` (kept).
- `picture retrace map-v4 --profile flat --colours 10`, then `picture recolour` ×10.
- `picture retrace map-v4 --profile cartoon --colours 16`, then `picture recolour` ×14, used for the dome detail only.
- `picture make dome2` (rejected).

**Rebuild:**
1. `python3 scripts/compose2.py` writes `map.svg` to the folder above `scripts/`.
2. `scripts/render.sh map.svg map.png 1600 2000` renders it with headless Chrome, for macOS fonts.

# v3 (after James's second review)

The current map comes from **map-v5** and `scripts/compose3.py`.

**Review notes and what changed:**

- **Drop Petaluma.** The marker and label are removed. The route keeps running SF → Golden Gate → US-101, then west on Tomales Rd, now through Tomales itself, and on to Dillon Beach.
- **The sun reflected on land.** The cause was in the art: in v4 the strip under the sun was beach. `guide-v5.svg` now extends open Pacific along the top-left horizon, and the prompt pins the glitter path to the water only. The cream haze layer is masked off the water too, so the sea can't read as land.
- **Model rockets.** A model rocket is mid-launch from the dunes just east of the dome. It's painted in the same Monge image pass as the terrain (`prompt-v5.txt`, with its smoke arc marked in the guide), so it matches the print style. The rocket and the upper trail sit above the vector sky. It stays clear of the route, the labels and the title.
- **Dome sharper.** There's no glow overlay now. The dome and rocket detail comes from the 16-colour cartoon retrace with a tighter feather, and the darkest struts are inked.
- **Clean-up.**
  - `detail.py` drops the traced sky inside the detail cut, so there's no halo around the trail.
  - `inland_water.py` drops teal specks that sit on land in the raster.
  - The skyline is de-spiked under the rocket trail.

**Monge calls in v3:**
- `picture make map-v5` (kept).
- `picture retrace map-v5 --profile flat --colours 10`, then `picture recolour` ×10.
- `picture retrace map-v5 --profile cartoon --colours 16`, then `picture recolour` ×15, used for the dome and rocket only.

**Rebuild:** run `python3 scripts/compose3.py`, then `scripts/render.sh map.svg map.png 1600 2000`.

# v4 (Golden Gate Bridge and a correct crossing)

The current map comes from `scripts/compose4.py`, using the same Monge art as v3 (map-v5).

**James's review: no bridge, and the route crossed in the wrong place.**

**Why:**
- The art (map-v5) drew the Golden Gate about 40px south of the lat/lon projection.
- It also closed the strait with a sandy neck, so the Pacific and the bay never met.
- The v3 route used raw projected points, so it jumped across open bay water east of where the art's strait would be.

**Fix:**
- **The strait:** cut back into the art as a vector edit. The `CHANNEL` path is ~16px wide (the real strait is ~1.6 km, about 20px here), with a gradient from Pacific teal to bay teal and cream shore lines. It sits at the narrow gap between the art's NW tip of SF and the Marin Headlands. I measured that with `scripts/gridcrop.py`, which overlays a frame-unit grid on the raster.
- **The route:** built from real road waypoints and projected with the same transform as the guide:
  - SF (37.765,-122.42), then the south anchorage (37.8078,-122.4750) and the north anchorage (37.8324,-122.4795).
  - US-101: Marin City, Corte Madera, San Rafael, Novato, Petaluma.
  - Then Bodega Ave/Tomales Rd through Tomales, and Dillon Beach Rd to Dillon Beach.
  - It's registered to the art with a local Gaussian displacement field. The control points are the two anchorages and SF, measured on the raster, so points far from the Golden Gate don't move.
  - The span between the anchorages is a straight line, and the curves leave each end along the deck.
- **The bridge:** native vector in International Orange (#e3562a) with ink outlines, matching the route and plates: two Art-Deco towers (legs plus three crossbeams), the main cable drape and hangers. It's drawn at poster scale (towers 80 units tall) so it reads at 390px. The route runs over the deck.
- **Verification:** `scripts/verify_route.py` samples the route every frame unit (1,155 samples). It classifies each sample against the raster's water (plus the strait cut) and fails on any water outside the bridge span. Result: 0 off-bridge samples on water, and the span crosses the strait (18 of 77 span samples over water; the rest are the approaches). The evidence overlay is `map/poster/route-check.png`. Green is on land, magenta is the bridge span, and cyan rings are the real coastline vertices.

**v4 bridge redraw.** The first v4 bridge stacked its towers diagonally and read as scribble, so it was redrawn as one deliberate drawing:
- **Deck:** straight, from the SF-tip anchorage (752,1118) to the Marin-tip anchorage (686,1068). It's the route's own width (8 orange inside a 3.5 ink edge), so the route stops at each anchorage and flows onto it.
- **Towers:** exactly two, upright in screen space, at 28% and 72% of the span. Each is 56 units tall, with stepped Art-Deco legs and four portal struts.
- **Cable:** one main cable, made of two side spans plus a main-span catenary with its low point at mid-span, and five vertical hangers.
- **Strokes:** International Orange with a thin ink outline, single-pass paths, no blur.
- **Strait:** widened slightly so water clearly joins ocean and bay on both sides of the deck.

`verify_route.py` now checks the route plus the deck line: 0 of 1,174 samples are on water off the bridge, and 30 deck samples are over the strait.

# v5 (one horizon)

The current map comes from `scripts/compose5.py`.

**James's review:** the water's horizon was a flat line, but the land beside it topped out lower, and the coast seemed to bend down away from it.

**Why:** in the Monge art, the land's skyline right of the sea sat 3–17px below the sea horizon, with sky-coloured pixels below the horizon line. The vector sky followed that measured skyline, so it dipped below the sea horizon over the land.

**Fix:**
- There is one horizon at y=176.8 across the full width.
- The sea runs flat to it as far as x=340, where the art's beach meets it.
- From there, two bands of distant hazy hills sit on that line and rise above it, never dipping below: the palest (#e9d8ae) rises 4–18 units and a nearer one (#dcc591) up to 7. The haze layer pales them further.
- The coast now runs up into the far hills at the horizon.
- The sky stops at the hill crest.
- The rocket's smoke trail is redrawn over the hills so it stays continuous.

**Check:** `scripts/check_horizon.py` scans 40 units below the horizon across the land side for any dusk-sky-coloured pixel. Result: 0. The debug crop with a 1px magenta horizon guide is `horizon-check.png`. The route check still passes (0 of 1,174 samples on water off the bridge).
