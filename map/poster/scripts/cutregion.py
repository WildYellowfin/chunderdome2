# Keep only the shapes of a Monge trace that overlap a box (trace pixel coords). usage: cutregion.py in.svg out.svg x0 y0 x1 y1
import re, sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from despeckle import TOK, ARGS
def bbox(d):
    toks = TOK.findall(d); i = 0; x = y = sx = sy = 0.0; xs = []; ys = []; cmd = None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd in 'Zz': x, y = sx, sy; continue
        n = ARGS[cmd.upper()]; v = [float(q) for q in toks[i:i+n]]; i += n; rel = cmd.islower(); U = cmd.upper()
        if U == 'H': x = x + v[0] if rel else v[0]
        elif U == 'V': y = y + v[0] if rel else v[0]
        else:
            pts = [(v[k] + (x if rel else 0), v[k+1] + (y if rel else 0)) for k in range(0, n, 2)]
            xs += [p[0] for p in pts]; ys += [p[1] for p in pts]; x, y = pts[-1]
            if U == 'M': sx, sy = x, y; cmd = 'l' if rel else 'L'
        xs.append(x); ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)
if __name__ == "__main__":
    src, out, x0, y0, x1, y1 = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:7])
    s = open(src).read(); head = re.match(r'.*?<svg[^>]*>', s, re.S).group(0); kept = []
    for m in re.finditer(r'<path d="([^"]*)"[^>]*/>', s):
        a, b, c, d = bbox(m.group(1))
        if c >= x0 and a <= x1 and d >= y0 and b <= y1 and (c - a) * (d - b) < (x1 - x0) * (y1 - y0) * 4: kept.append(m.group(0))
    open(out, 'w').write(head + '\n' + '\n'.join(kept) + '\n</svg>\n'); print('kept', len(kept))
