# Drop water-coloured traced shapes that sit on land in the source raster (stray teal specks inland).
# usage: inland_water.py in.svg raster.png out.svg
import re, sys
from PIL import Image
sys.path.insert(0, __file__.rsplit('/',1)[0]); from cutregion import bbox
src, ras, out = sys.argv[1:4]; img = Image.open(ras).convert('RGB'); W, H = img.size
def is_water(x, y):
    r, g, b = img.getpixel((min(W - 1, max(0, int(x))), min(H - 1, max(0, int(y)))))
    return b >= r - 5 and r < 120
n = 0
def f(m):
    global n
    if not re.search(r'fill="#(1d4b57|3c6f79)"', m.group(0)): return m.group(0)
    a, b, c, d = bbox(m.group(1))
    if (c - a) * (d - b) > 40000: return m.group(0)
    probes = [((a + c) / 2, (b + d) / 2), (a + (c - a) * .3, (b + d) / 2), (a + (c - a) * .7, (b + d) / 2)]
    if not any(is_water(x, y) for x, y in probes): n += 1; return ''
    return m.group(0)
s = re.sub(r'<path d="([^"]*)"[^>]*/>\n?', f, open(src).read()); open(out, 'w').write(s); print('dropped', n)
