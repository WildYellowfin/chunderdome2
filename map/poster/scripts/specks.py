# Find trace specks: water-coloured holes on land in the v6 terrain, and the open water near the horizon.
# usage: python3 compose6.py analyse; render sources/terrain-analyse-v6.svg at 2000x2500 to a PNG
#        (water is magenta there); python3 specks.py that.png  -> writes sources/specks-v6.json
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
D = __file__.rsplit('/', 2)[0]
S = 2.0  # render pixels per poster unit
a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
water = (a[:, :, 0] > 150) & (a[:, :, 2] > 150) & (a[:, :, 1] < 120)
lab, n = ndimage.label(water, structure=np.ones((3, 3)))
sizes = ndimage.sum(water, lab, range(1, n + 1))
main = 1 + int(np.argmax(sizes))
PALETTE = ['#9c9356', '#cfae66', '#e3c88f', '#6f7440', '#474c2c', '#efe6d4', '#d9a95a', '#2f3a22']
pal = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in PALETTE])

def runs_path(mask, y0=0):
    out = []
    for r in range(mask.shape[0]):
        row = mask[r]
        if not row.any(): continue
        d = np.diff(np.concatenate([[0], row.astype(int), [0]]))
        for s, e in zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]):
            out.append(f'M{s / S:.1f},{(r + y0) / S:.2f}h{(e - s) / S:.1f}v{0.6:.1f}h{-(e - s) / S:.1f}Z')
    return ''.join(out)

patches = []
objs = ndimage.find_objects(lab)
for k in range(1, n + 1):
    if k == main: continue
    sl = objs[k - 1]
    y0, y1 = max(0, sl[0].start - 6), min(a.shape[0], sl[0].stop + 6)
    x0, x1 = max(0, sl[1].start - 6), min(a.shape[1], sl[1].stop + 6)
    m = lab[y0:y1, x0:x1] == k
    grown = ndimage.binary_dilation(m, iterations=2)
    ring = ndimage.binary_dilation(m, iterations=5) & ~grown & ~water[y0:y1, x0:x1]
    px = a[y0:y1, x0:x1][ring]
    if not len(px): continue
    idx = np.argmin(((px[:, None, :] - pal[None]) ** 2).sum(-1), axis=1)
    fill = PALETTE[np.bincount(idx, minlength=len(PALETTE)).argmax()]
    sub = np.zeros((y1 - y0, a.shape[1]), bool); sub[:, x0:x1] = grown
    patches.append({'fill': fill, 'd': runs_path(sub, y0), 'at': [round(x0 / S), round(y0 / S)], 'px': int(m.sum())})

# Open water from the horizon down to y=400 (glints included): keeps the haze layer off the whole sea, not just the scanned coast.
top = np.zeros(water.shape, bool); top[:800] = ndimage.binary_fill_holes(ndimage.binary_dilation(lab == main, iterations=1)[:800])
json.dump({'patches': patches, 'sea_top': runs_path(top)}, open(f'{D}/sources/specks-v6.json', 'w'))
print(len(patches), 'patches;', sum(p['px'] for p in patches), 'px')
