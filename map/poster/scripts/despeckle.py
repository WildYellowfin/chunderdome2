# Vector cleanup of a Monge flat trace: drop tiny single-contour shapes (grain speckle).
# usage: despeckle.py in.svg out.svg min_area
import re, sys
TOK = re.compile(r'[MmCcLlHhVvSsQqZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?')
ARGS = dict(M=2, L=2, C=6, S=4, Q=4, H=1, V=1, Z=0)

def bbox(d):
    toks = TOK.findall(d); i = 0; x = y = 0.0; sx = sy = 0.0; xs = []; ys = []; cmd = None; subpaths = 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd in 'Zz': x, y = sx, sy; continue
            if cmd in 'Mm': subpaths += 1
        n = ARGS[cmd.upper()]; vals = [float(v) for v in toks[i:i+n]]; i += n
        rel = cmd.islower(); U = cmd.upper()
        if U == 'H': x = x + vals[0] if rel else vals[0]
        elif U == 'V': y = y + vals[0] if rel else vals[0]
        else:
            pts = [(vals[k] + (x if rel else 0), vals[k+1] + (y if rel else 0)) for k in range(0, n, 2)]
            xs += [p[0] for p in pts]; ys += [p[1] for p in pts]; x, y = pts[-1]
            if U == 'M': sx, sy = x, y; cmd = 'l' if rel else 'L'
        xs.append(x); ys.append(y)
    return (max(xs) - min(xs)) * (max(ys) - min(ys)), subpaths

src, out, amin = sys.argv[1], sys.argv[2], float(sys.argv[3])
s = open(src).read(); dropped = 0
def keep(m):
    global dropped
    area, sub = bbox(m.group(1))
    if sub == 1 and area < amin: dropped += 1; return ''
    return m.group(0)
s = re.sub(r'<path d="([^"]*)"[^>]*/>\n?', keep, s)
open(out, 'w').write(s); print('dropped', dropped)
