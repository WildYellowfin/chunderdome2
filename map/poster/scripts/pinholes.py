# Fill pinholes in a Monge trace: drop tiny inner subpaths (holes) that let a lower layer show through as specks.
# usage: pinholes.py in.svg out.svg max_hole_area
import re, sys
TOK = re.compile(r'[MmCcLlHhVvSsQqZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?')
ARGS = dict(M=2, L=2, C=6, S=4, Q=4, H=1, V=1, Z=0)

def subpaths(d):
    """Split into subpaths, each as (absolute start, body tokens with the start command removed, bbox area)."""
    toks = TOK.findall(d); i = 0; x = y = sx = sy = 0.0; cmd = None; subs = []
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd in 'Zz':
                x, y = sx, sy; subs[-1]['body'].append('Z'); continue
        n = ARGS[cmd.upper()]; v = [float(q) for q in toks[i:i+n]]; raw = toks[i:i+n]; i += n
        rel = cmd.islower(); U = cmd.upper()
        if U == 'M':
            x, y = (x + v[0], y + v[1]) if rel else (v[0], v[1]); sx, sy = x, y
            subs.append(dict(start=(x, y), body=[], xs=[x], ys=[y]))
            cmd = 'l' if rel else 'L'; continue
        if U == 'H': x = x + v[0] if rel else v[0]
        elif U == 'V': y = y + v[0] if rel else v[0]
        else:
            pts = [(v[k] + (x if rel else 0), v[k+1] + (y if rel else 0)) for k in range(0, n, 2)]
            subs[-1]['xs'] += [p[0] for p in pts]; subs[-1]['ys'] += [p[1] for p in pts]; x, y = pts[-1]
        subs[-1]['body'].append(cmd + ','.join(raw))
    for s in subs: s['area'] = (max(s['xs']) - min(s['xs'])) * (max(s['ys']) - min(s['ys']))
    return subs

src, out, amax = sys.argv[1], sys.argv[2], float(sys.argv[3]); filled = 0
def fix(m):
    global filled
    subs = subpaths(m.group(1))
    if len(subs) < 2: return m.group(0)
    keep = [subs[0]] + [s for s in subs[1:] if s['area'] >= amax]
    filled += len(subs) - len(keep)
    d = ''.join(f"M{s['start'][0]:.2f},{s['start'][1]:.2f}" + ''.join(s['body']) for s in keep)
    return m.group(0).replace(m.group(1), d)
s = re.sub(r'<path d="([^"]*)"', fix, open(src).read())
open(out, 'w').write(s); print('filled', filled)
