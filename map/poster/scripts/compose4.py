# Compose poster map v4 (adds the Golden Gate strait + bridge and a registered real-road route):
# was v3: Monge-traced v5 terrain (dome and model rocket painted in) + native vector sky, haze,
# bathymetry (from Monge's own traced coastline), smoothed route, markers, plates and type.
import sys, re, json; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
D = __file__.rsplit('/',2)[0]
INK, CREAM, VERM, TEAL, OCHRE, OLIVE = '#14161b', '#efe6d4', '#dd4326', '#1d4b57', '#d6a03a', '#6f7440'
FONT = "'DIN Condensed', 'Oswald', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif"
K = 1000 / 1024

src = open(f'{D}/sources/terrain-v5-clean.svg').read()
terrain = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', src, flags=re.S)
# The painted dome and rocket, from Monge's 16-colour cartoon retrace of the same raster (exactly aligned).
dome_detail = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', open(f'{D}/sources/detail-v5.svg').read(), flags=re.S)
# The coastline the art actually drew: open Pacific scanned row by row from the raster (scripts/coast.mjs).
coast = json.load(open(f'{D}/sources/coast-v5.json'))
ocean_d = (f'M{coast[0][0]},-400 ' + ' '.join(f'L{x},{y}' for x, y in coast)
           + f' L{coast[-1][0]},1650 L-400,1650 L-400,-400 Z')

sky = json.load(open(f'{D}/sources/skyline-v5.json'))
HORIZON = sky[0][1]
# Left of the ridges is open sea running to the horizon; the sun sets into it.
sky = [[x, HORIZON if x < 300 else y] for x, y in sky]
sky_d = 'M0,0 ' + ' '.join(f'L{x},{y}' for x, y in sky) + ' L1000,0 Z'
below_d = 'M0,1250 ' + ' '.join(f'L{x},{y}' for x, y in sky) + ' L1000,1250 Z'

def smooth(pts, before=None, after=None):
    # Catmull-Rom through the route points, as cubic Béziers; before/after set the end tangents.
    p = [before or pts[0]] + pts + [after or pts[-1]]
    out = f'M{p[1][0]:.1f},{p[1][1]:.1f}'
    for i in range(1, len(p) - 2):
        a, b, c, d = p[i - 1], p[i], p[i + 1], p[i + 2]
        c1 = (b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6)
        c2 = (c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6)
        out += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {c[0]:.1f},{c[1]:.1f}'
    return out

# Real road waypoints: SF via 19th Ave/Park Presidio, the bridge deck, US-101 through Marin to Petaluma,
# Bodega Ave/Tomales Rd west through Tomales, Dillon Beach Rd to Dillon Beach.
ROAD = [(37.765,-122.42),(37.8078,-122.4750),                       # SF -> south anchorage
        (37.8324,-122.4795),                                                          # north anchorage
        (37.885,-122.505),(37.925,-122.515),(37.97,-122.527),(38.03,-122.545),(38.10,-122.565),
        (38.17,-122.60),(38.235,-122.636),(38.245,-122.72),(38.24,-122.81),(38.247,-122.905),(38.252,-122.962)]
SOUTH, NORTH = 1, 2   # indices of the bridge anchorages in ROAD

# The art drew the Golden Gate about 40px south of the projection, so register the route to the art with a
# local displacement field: control points measured on raster-v5 (scripts/gridcrop.py), Gaussian falloff.
BRIDGE_S, BRIDGE_N = (738.0, 1124.0), (694.0, 1062.0)   # anchorages on the art's SF tip and Marin headland (poster-scale span)
CONTROLS = [(P(*ROAD[SOUTH]), BRIDGE_S), (P(*ROAD[NORTH]), BRIDGE_N), (P(*ROAD[0]), (786.0, 1170.0))]
def register(p, sigma=60.0):
    import math
    sx = sy = sw = 0.0
    for (c, t) in CONTROLS:
        w = math.exp(-((p[0]-c[0])**2 + (p[1]-c[1])**2) / (2 * sigma * sigma))
        sx += w * (t[0] - c[0]); sy += w * (t[1] - c[1]); sw += w
    k = 1 / max(1.0, sw)
    return (p[0] + sx * k, p[1] + sy * k)
ROUTE_XY = [register(P(*q)) for q in ROAD]
ROUTE_XY[SOUTH], ROUTE_XY[NORTH] = BRIDGE_S, BRIDGE_N

# Curves on land; the span is straight, and the curves leave each anchorage along the deck.
deck = (BRIDGE_N[0] - BRIDGE_S[0], BRIDGE_N[1] - BRIDGE_S[1])
a, b = ROUTE_XY[SOUTH - 1], ROUTE_XY[NORTH + 1]
head = smooth(ROUTE_XY[:SOUTH + 1], after=(a[0] + 1.6 * deck[0], a[1] + 1.6 * deck[1]))
tail = smooth(ROUTE_XY[NORTH:], before=(b[0] - 1.6 * deck[0], b[1] - 1.6 * deck[1]))
route = head + f' L{BRIDGE_N[0]},{BRIDGE_N[1]} ' + tail[tail.index('C'):]
sf, dil = ROUTE_XY[0], ROUTE_XY[-1]
DOME = (264, 371)

SIZE = 32
def plate(text, x, y, anchor):
    """Ink plate whose vertical centre sits on y; anchor 'left' puts its left edge at x, 'right' its right edge."""
    w = len(text) * (SIZE * 0.385 + 1) + 24; h = SIZE + 14
    x0 = x if anchor == 'left' else x - w
    return (f'<rect x="{x0:.0f}" y="{y - h/2:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{INK}"/>'
            f'<text x="{x0 + 12:.0f}" y="{y + SIZE*0.36:.0f}" font-size="{SIZE}" fill="{CREAM}">{text}</text>')

# The art closed the Golden Gate with a sandy neck; cut the strait back in (real width ~1.6 km = ~20 px here).
CHANNEL = 'M684,1086 C700,1088 712,1087 724,1085 C732,1083 740,1081 752,1080 L752,1101 C740,1101 732,1100 724,1100 C712,1101 700,1103 684,1104 Z'
SHORES = 'M703,1087.6 C712,1087 718,1086 731,1083.6 M703,1102.4 C712,1101.2 718,1100.2 731,1100'

def bridge():
    """Golden Gate Bridge in International Orange: deck on the route, two Art-Deco towers, main cable drape."""
    (sx, sy), (nx, ny) = BRIDGE_S, BRIDGE_N; H = 80.0; ORANGE = '#e3562a'
    at = lambda t: (sx + (nx - sx) * t, sy + (ny - sy) * t)
    t1, t2 = at(0.24), at(0.76); top1, top2 = (t1[0], t1[1] - H), (t2[0], t2[1] - H)
    mid = ((top1[0] + top2[0]) / 2, (top1[1] + top2[1]) / 2 + H * 0.62)
    cable = (f'M{sx:.1f},{sy - 3:.1f} Q{(sx + top1[0]) / 2 + 1:.1f},{(sy + top1[1]) / 2 + 6:.1f} {top1[0]:.1f},{top1[1]:.1f}'
             f' Q{2 * mid[0] - (top1[0] + top2[0]) / 2:.1f},{2 * mid[1] - (top1[1] + top2[1]) / 2:.1f} {top2[0]:.1f},{top2[1]:.1f}'
             f' Q{(nx + top2[0]) / 2 - 1:.1f},{(ny + top2[1]) / 2 + 6:.1f} {nx:.1f},{ny - 3:.1f}')
    hangers = ''
    for i in range(1, 6):
        t = 0.24 + 0.52 * i / 6; d = at(t)
        u = i / 6; cy = (1 - u) ** 2 * top1[1] + 2 * u * (1 - u) * (2 * mid[1] - (top1[1] + top2[1]) / 2) + u * u * top2[1]
        hangers += f'<line x1="{d[0]:.1f}" y1="{d[1] - 2:.1f}" x2="{d[0]:.1f}" y2="{cy + 1:.1f}"/>'
    def tower(base):
        x, y = base; w = 4.6; gap = 6.6
        legs = ''.join(f'<rect x="{x + o - w / 2:.1f}" y="{y - H:.1f}" width="{w}" height="{H + 1:.1f}"/>' for o in (-gap, gap))
        beams = ''.join(f'<rect x="{x - gap - w / 2:.1f}" y="{y - H * f:.1f}" width="{2 * gap + w:.1f}" height="3.4"/>' for f in (0.98, 0.72, 0.46))
        return legs + beams
    towers = tower(t1) + tower(t2)
    return (f'<g id="golden-gate-bridge">'
            f'<g fill="none" stroke="{INK}" stroke-width="5.4" stroke-linecap="round"><path d="{cable}"/></g>'
            f'<g stroke="{INK}" stroke-width="2.6">{hangers}</g>'
            f'<g fill="{INK}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round">{towers}</g>'
            f'<g fill="none" stroke="{ORANGE}" stroke-width="2.8" stroke-linecap="round"><path d="{cable}"/></g>'
            f'<g stroke="{ORANGE}" stroke-width="0.9">{hangers}</g>'
            f'<g fill="{ORANGE}">{towers}</g></g>')

def marker(p):
    return (f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="12" fill="{CREAM}" stroke="{INK}" stroke-width="5"/>'
            f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="4.5" fill="{VERM}"/>')

contours = ''.join(f'<path d="{ocean_d}" stroke="{CREAM}" stroke-width="{2*d+2.4}"/><path d="{ocean_d}" stroke="{TEAL}" stroke-width="{2*d}"/>'
                   for d in (118, 72, 34))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1250" width="1200" height="1500">
<title>Chunderdome II route map: San Francisco to Dillon Beach</title>
<defs>
  <clipPath id="frame"><rect width="1000" height="1250"/></clipPath>
  <clipPath id="sky"><path d="{sky_d}"/></clipPath>
  <clipPath id="land-and-sea"><path d="{below_d}"/></clipPath>
  <clipPath id="sea"><path d="{ocean_d}"/></clipPath>
  <linearGradient id="dusk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{HORIZON}">
    <stop offset="0" stop-color="#d9452a"/><stop offset="0.45" stop-color="#e2703a"/>
    <stop offset="0.8" stop-color="#e99a45"/><stop offset="1" stop-color="#efc068"/>
  </linearGradient>
  <linearGradient id="haze" gradientUnits="userSpaceOnUse" x1="0" y1="{HORIZON - 70}" x2="0" y2="330">
    <stop offset="0" stop-color="{CREAM}" stop-opacity="0.62"/><stop offset="0.45" stop-color="{CREAM}" stop-opacity="0.28"/>
    <stop offset="1" stop-color="{CREAM}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="offshore-fade" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="420">
    <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
  </linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#f6c45a" stop-opacity="0.55"/><stop offset="0.5" stop-color="#e48a3c" stop-opacity="0.22"/><stop offset="1" stop-color="#e48a3c" stop-opacity="0"/></radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  <radialGradient id="dome-fade"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="dome-feather" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <ellipse cx="{DOME[0]}" cy="{DOME[1] + 4}" rx="100" ry="66" fill="url(#dome-fade)"/>
    <g filter="url(#soft)"><path d="M352,410 L346,330 L380,190 L425,80 L470,60 L488,90 L440,200 L408,330 L404,410 Z" fill="#fff"/></g>
  </mask>
  <linearGradient id="strait-water" gradientUnits="userSpaceOnUse" x1="684" y1="0" x2="752" y2="0">
    <stop offset="0.3" stop-color="#1d4b57"/><stop offset="0.85" stop-color="#3c6f79"/>
  </linearGradient>
  <filter id="feather" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  <mask id="offshore" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <rect width="1000" height="1250" fill="url(#offshore-fade)"/>
    <g filter="url(#feather)"><rect x="-60" y="900" width="600" height="420" fill="#000"/></g>
    <path d="{ocean_d}" fill="none" stroke="#000" stroke-width="30" stroke-linejoin="round"/>
  </mask>
  <mask id="dry-land" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <rect width="1000" height="1250" fill="#fff"/><path d="{ocean_d}" fill="#000"/>
  </mask>
  <clipPath id="above-horizon"><rect width="1000" height="{HORIZON}"/></clipPath>
</defs>
<g clip-path="url(#frame)">
  <g id="terrain" transform="scale({K})">{terrain}</g>
  <g id="bathymetry" clip-path="url(#sea)" mask="url(#offshore)" fill="none" stroke-linejoin="round">
    <rect width="1000" height="1250" fill="{TEAL}" stroke="none"/>{contours}
  </g>
  <g id="golden-gate-strait">
    <path d="{CHANNEL}" fill="url(#strait-water)"/>
    <path d="{SHORES}" fill="none" stroke="{CREAM}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g id="dome-and-rocket" mask="url(#dome-feather)"><g transform="scale({K})">{dome_detail}</g></g>
  <rect id="haze-layer" clip-path="url(#land-and-sea)" mask="url(#dry-land)" y="{HORIZON - 70}" width="1000" height="{400 - HORIZON}" fill="url(#haze)"/>
  <g id="sky-layer" clip-path="url(#sky)">
    <rect width="1000" height="{HORIZON + 30}" fill="url(#dusk)"/>
    <circle cx="154" cy="{HORIZON}" r="60" fill="{VERM}" clip-path="url(#above-horizon)"/>
  </g>
  <g id="rocket-in-sky" clip-path="url(#sky)" mask="url(#dome-feather)"><g transform="scale({K})">{dome_detail}</g></g>
  <g id="route" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="{route}" stroke="{INK}" stroke-width="15"/>
    <path d="{route}" stroke="{VERM}" stroke-width="8"/>
  </g>
  {bridge()}
  <g id="markers">{marker(sf)}{marker(dil)}</g>
  <g id="labels" font-family="{FONT}" font-weight="700" letter-spacing="1">
    {plate('SAN FRANCISCO', sf[0] - 8, sf[1] + 40, 'right')}
    {plate('DILLON BEACH', dil[0] + 10, dil[1] + 50, 'right')}
  </g>
  <g id="title" font-family="{FONT}" font-weight="700" fill="{CREAM}">
    <text x="34" y="972" font-size="30" letter-spacing="1.5" fill="{OCHRE}">SF → DILLON BEACH · NOV 13–15</text>
    <text x="30" y="1102" font-size="152" letter-spacing="2">CHUNDER</text>
    <text x="30" y="1226" font-size="152" letter-spacing="2">DOME <tspan fill="{VERM}">II</tspan></text>
  </g>
</g>
</svg>'''
open(f'{D}/map.svg', 'w').write(svg)
