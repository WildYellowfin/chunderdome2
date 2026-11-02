# Compose poster map v2: Monge-traced v4 terrain (dome painted in) + native vector sky, haze,
# bathymetry (from Monge's own traced coastline), smoothed route, markers, plates and type.
import sys, re, json; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
D = __file__.rsplit('/',2)[0]
INK, CREAM, VERM, TEAL, OCHRE, OLIVE = '#14161b', '#efe6d4', '#dd4326', '#1d4b57', '#d6a03a', '#6f7440'
FONT = "'DIN Condensed', 'Oswald', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif"
K = 1000 / 1024

src = open(f'{D}/sources/terrain-v4-clean.svg').read()
terrain = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', src, flags=re.S)
# The painted dome, from Monge's 16-colour cartoon retrace of the same raster (exactly aligned), feathered in.
dome_detail = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', open(f'{D}/sources/dome-detail.svg').read(), flags=re.S)
# The coastline the art actually drew: open Pacific scanned row by row from the raster (scripts/coast.mjs).
coast = json.load(open(f'{D}/sources/coast-v4.json'))
ocean_d = (f'M{coast[0][0]},-400 ' + ' '.join(f'L{x},{y}' for x, y in coast)
           + f' L{coast[-1][0]},1650 L-400,1650 L-400,-400 Z')

sky = json.load(open(f'{D}/sources/skyline-v4.json'))
HORIZON = sky[0][1]
# Left of the ridges is open sea; the sun's reflection there is not sky.
sky = [[x, HORIZON if x < 262 else y] for x, y in sky]
sky_d = 'M0,0 ' + ' '.join(f'L{x},{y}' for x, y in sky) + ' L1000,0 Z'
below_d = 'M0,1250 ' + ' '.join(f'L{x},{y}' for x, y in sky) + ' L1000,1250 Z'

def smooth(pts):
    # Catmull-Rom through the route points, as cubic Béziers.
    p = [pts[0]] + pts + [pts[-1]]
    out = f'M{p[1][0]:.1f},{p[1][1]:.1f}'
    for i in range(1, len(p) - 2):
        a, b, c, d = p[i - 1], p[i], p[i + 1], p[i + 2]
        c1 = (b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6)
        c2 = (c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6)
        out += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {c[0]:.1f},{c[1]:.1f}'
    return out

ROUTE_PTS = [(37.77,-122.42),(37.795,-122.455),(37.810,-122.476),(37.84,-122.488),(37.88,-122.51),
  (37.95,-122.525),(38.04,-122.545),(38.13,-122.585),(38.233,-122.636),(38.243,-122.72),
  (38.242,-122.83),(38.247,-122.905),(38.252,-122.962)]
route = smooth([P(*q) for q in ROUTE_PTS])
sf, pet, dil = (P(*PLACES[k]) for k in ('sf', 'pet', 'dillon'))
DOME = (271, 378)

SIZE = 32
def plate(text, x, y, anchor):
    """Ink plate whose vertical centre sits on y; anchor 'left' puts its left edge at x, 'right' its right edge."""
    w = len(text) * (SIZE * 0.385 + 1) + 24; h = SIZE + 14
    x0 = x if anchor == 'left' else x - w
    return (f'<rect x="{x0:.0f}" y="{y - h/2:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{INK}"/>'
            f'<text x="{x0 + 12:.0f}" y="{y + SIZE*0.36:.0f}" font-size="{SIZE}" fill="{CREAM}">{text}</text>')

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
  <radialGradient id="dome-fade"><stop offset="0.62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="dome-feather" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <ellipse cx="{DOME[0]}" cy="{DOME[1] + 4}" rx="105" ry="72" fill="url(#dome-fade)"/>
  </mask>
  <filter id="feather" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  <mask id="offshore" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <rect width="1000" height="1250" fill="url(#offshore-fade)"/>
    <g filter="url(#feather)"><rect x="-60" y="900" width="600" height="420" fill="#000"/></g>
    <path d="{ocean_d}" fill="none" stroke="#000" stroke-width="30" stroke-linejoin="round"/>
  </mask>
  <clipPath id="above-horizon"><rect width="1000" height="{HORIZON}"/></clipPath>
</defs>
<g clip-path="url(#frame)">
  <g id="terrain" transform="scale({K})">{terrain}</g>
  <g id="bathymetry" clip-path="url(#sea)" mask="url(#offshore)" fill="none" stroke-linejoin="round">
    <rect width="1000" height="1250" fill="{TEAL}" stroke="none"/>{contours}
  </g>
  <g id="dome-detail" mask="url(#dome-feather)"><g transform="scale({K})">{dome_detail}</g></g>
  <rect id="haze-layer" clip-path="url(#land-and-sea)" y="{HORIZON - 70}" width="1000" height="{400 - HORIZON}" fill="url(#haze)"/>
  <g id="sky-layer" clip-path="url(#sky)">
    <rect width="1000" height="{HORIZON + 30}" fill="url(#dusk)"/>
    <circle cx="157" cy="{HORIZON}" r="64" fill="{VERM}" clip-path="url(#above-horizon)"/>
  </g>
  <circle id="dome-glow" cx="{DOME[0]}" cy="{DOME[1]}" r="95" fill="url(#glow)"/>
  <g id="route" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="{route}" stroke="{INK}" stroke-width="15"/>
    <path d="{route}" stroke="{VERM}" stroke-width="8"/>
  </g>
  <g id="markers">{marker(sf)}{marker(pet)}{marker(dil)}</g>
  <g id="labels" font-family="{FONT}" font-weight="700" letter-spacing="1">
    {plate('SAN FRANCISCO', sf[0] - 8, sf[1] + 40, 'right')}
    {plate('PETALUMA', pet[0] + 22, pet[1], 'left')}
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
