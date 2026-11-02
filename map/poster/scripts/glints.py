# Classify the traced shapes on the sun's glitter path by what the source raster shows under them.
# usage: BOX='[0,170,360,290]' node scripts/shape_samples.cjs sources/terrain-v5-clean.svg samples.json
#        python3 scripts/glints.py samples.json   -> sources/glints-v6.json {shape index: new fill}
import json, sys
from PIL import Image
D = __file__.rsplit('/', 2)[0]
r = Image.open(f'{D}/sources/raster-v5.png').convert('RGB'); out = {}
for o in json.load(open(sys.argv[1])):
    if o['f'] in ('#3c6f79', '#1d4b57', '#dd4326') or not o['pts']: continue
    px = [r.getpixel((x, y)) for x, y in o['pts']]
    sea = sum(1 for c in px if c[2] > c[0] - 10 and c[0] < 110) / len(px)
    red = sum(1 for c in px if c[0] > 150 and c[1] < 130 and c[2] < 110) / len(px)
    sand = sum(1 for c in px if c[0] > 170 and c[1] > 140) / len(px)
    if sea + red >= 0.4 and sand < 0.1: out[o['i']] = '#dd4326' if red >= 0.3 else '#1d4b57'
json.dump(out, open(f'{D}/sources/glints-v6.json', 'w')); print(out)
