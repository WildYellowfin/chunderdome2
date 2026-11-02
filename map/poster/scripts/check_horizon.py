# One-horizon check: no sky-coloured pixel may appear below the sea horizon anywhere across the width.
# Draws a 1px guide on the horizon into a debug crop. usage: check_horizon.py map.png out.png
import sys, json
from PIL import Image, ImageDraw
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import compose5 as c
img = Image.open(sys.argv[1]).convert('RGB'); S = img.width / 1000
H = c.HORIZON
sky_like = lambda p: p[0] > 200 and 90 < p[1] < 190 and p[2] < 95   # the dusk gradient: orange/ochre, low blue
bad = []
for X in range(0, img.width):
    for Y in range(int((H + 1.5) * S), int((H + 40) * S)):
        if sky_like(img.getpixel((X, Y))): bad.append((X, Y))
# the sun's glitter on the water is warm too; it lies on the sea, left of the far coast
bad = [(x, y) for x, y in bad if x / S >= c.X0]
print(f'horizon y={H} (frame); land side x>={c.X0}: sky-coloured pixels below horizon: {len(bad)}')
crop = img.crop((0, int((H - 90) * S), img.width, int((H + 70) * S))); d = ImageDraw.Draw(crop)
d.line([(0, int(90 * S)), (crop.width, int(90 * S))], fill=(255, 0, 255), width=1)
for x, y in bad[:500]: d.point((x, y - int((H - 90) * S)), fill=(0, 255, 0))
d.text((8, 6), f'magenta = horizon (y={H}); green = sky pixels below it on land: {len(bad)}', fill=(20, 20, 20))
crop.save(sys.argv[2]); sys.exit(1 if bad else 0)
