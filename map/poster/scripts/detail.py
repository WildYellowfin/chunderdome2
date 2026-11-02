# Prepare the dome + rocket detail cut from Monge's cartoon retrace:
# drop sky-coloured shapes above the skyline (the vector sky replaces them) and ink the dome's darkest struts.
# usage: detail.py in.svg skyline.json out.svg
import re, sys, json
sys.path.insert(0, __file__.rsplit('/',1)[0]); from cutregion import bbox
src, skyf, out = sys.argv[1:4]; K = 1000 / 1024
sky = json.load(open(skyf))
def skyline_at(x_trace):
    x = x_trace * K; best = min(sky, key=lambda p: abs(p[0] - x)); return best[1] / K
NOZZLE = (440, 146)  # the rocket's exhaust flame, frame units: keep its warm shapes
SKY = {'#f0a53a', '#e48a3c', '#dd4326', '#e3c88f', '#d9b877'}
s = open(src).read(); dropped = inked = 0
def f(m):
    global dropped, inked
    tag = m.group(0); fill = re.search(r'fill="(#[0-9a-f]{6})"', tag).group(1)
    a, b, c, d = bbox(m.group(1)); cx = (a + c) / 2
    cy = (b + d) / 2
    near_nozzle = ((cx * K - NOZZLE[0]) ** 2 + (cy * K - NOZZLE[1]) ** 2) ** 0.5 < 24
    if fill in SKY and cy < skyline_at(cx) and not near_nozzle: dropped += 1; return ''
    if fill == '#18343d' and 220 < cx < 480 and 340 < (b + d) / 2 < 480: inked += 1; return tag.replace(fill, '#14161b')
    return tag
s = re.sub(r'<path d="([^"]*)"[^>]*/>', f, s); open(out, 'w').write(s); print('dropped', dropped, 'inked', inked)
