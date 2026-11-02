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
