# Verify the route against the art: sample it densely, classify each sample as land/water on the source raster
# (plus the strait cut into the vector), and require water only on the bridge span. Writes an evidence overlay.
# usage: verify_route.py map.png raster.png out.png
import re, sys, math
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import compose4 as c
from geo import P, OCEAN, BAY
from matplotlib.path import Path as MPath
final, ras, out = sys.argv[1:4]
src = Image.open(ras).convert('RGB'); KR = 1024 / 1000
strait = MPath([(684,1086),(724,1085),(752,1080),(752,1101),(724,1100),(684,1104)])
def water(x, y):
    if strait.contains_point((x, y)): return True
    r, g, b = src.getpixel((int(x * KR), int(y * KR)))
    return b >= g - 3 and b >= r + 15

def samples(d, step=1.0):
    toks = re.findall(r'[MLC]|-?\d+\.?\d*', d); i = 0; cur = None; pts = []; cmd = None
    while i < len(toks):
        if toks[i] in 'MLC': cmd = toks[i]; i += 1; continue
        if cmd == 'M': cur = (float(toks[i]), float(toks[i+1])); i += 2; pts.append(cur)
        elif cmd == 'L':
            nxt = (float(toks[i]), float(toks[i+1])); i += 2
            n = max(1, int(math.dist(cur, nxt) / step)); pts += [(cur[0] + (nxt[0]-cur[0]) * k / n, cur[1] + (nxt[1]-cur[1]) * k / n) for k in range(1, n + 1)]; cur = nxt
        else:
            c1, c2, e = [(float(toks[i+j]), float(toks[i+j+1])) for j in (0, 2, 4)]; i += 6
            n = max(1, int((math.dist(cur, c1) + math.dist(c1, c2) + math.dist(c2, e)) / step))
            for k in range(1, n + 1):
                t = k / n; u = 1 - t
                pts.append((u**3*cur[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*e[0], u**3*cur[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*e[1]))
            cur = e
    return pts

def on_span(p):
    (sx, sy), (nx, ny) = c.BRIDGE_S, c.BRIDGE_N; dx, dy = nx - sx, ny - sy
    t = ((p[0]-sx)*dx + (p[1]-sy)*dy) / (dx*dx + dy*dy)
    return 0 <= t <= 1 and abs((p[0]-sx)*dy - (p[1]-sy)*dx) / math.hypot(dx, dy) < 1.5

pts = samples(c.route)
bad = [p for p in pts if water(*p) and not on_span(p)]
span = [p for p in pts if on_span(p)]
span_water = [p for p in span if water(*p)]
mid = ((c.BRIDGE_S[0] + c.BRIDGE_N[0]) / 2, (c.BRIDGE_S[1] + c.BRIDGE_N[1]) / 2)
print(f'samples {len(pts)}; off-bridge samples on water: {len(bad)}; bridge-span samples: {len(span)}, '
      f'of which over water: {len(span_water)}; strait at span midpoint: {strait.contains_point(mid)}')

img = Image.open(final).convert('RGB'); S = img.width / 1000; dr = ImageDraw.Draw(img, 'RGBA')
for poly, col in ((OCEAN, (0, 255, 255, 255)), (BAY, (0, 255, 255, 255))):
    for q in poly:
        x, y = P(*q); dr.ellipse([x*S-3, y*S-3, x*S+3, y*S+3], outline=col, width=2)
for p in pts:
    col = (255, 0, 0, 255) if p in bad else (255, 0, 255, 255) if on_span(p) else (0, 220, 0, 255)
    dr.point((p[0]*S, p[1]*S), fill=col)
for x, y in [c.BRIDGE_S, c.BRIDGE_N]: dr.ellipse([x*S-6, y*S-6, x*S+6, y*S+6], outline=(255, 0, 255, 255), width=3)
dr.rectangle([0, 0, 760, 120], fill=(0, 0, 0, 170))
dr.text((14, 12), 'Route check (green = on land, magenta = bridge span, red = off-bridge water)', fill=(255, 255, 255))
dr.text((14, 40), f'{len(pts)} samples; off-bridge on water: {len(bad)}; span over strait water: {len(span_water)}/{len(span)}', fill=(255, 255, 255))
dr.text((14, 68), 'cyan rings = real coastline vertices (geo.py) projected; art is registered at the Golden Gate', fill=(255, 255, 255))
img.save(out)
sys.exit(1 if bad or not span_water else 0)
