# Compose the final poster map: Monge-traced terrain + Monge dome + native vector overlays and type.
import sys, re; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
D = __file__.rsplit('/',2)[0]
INK, CREAM, VERM, TEAL, OCHRE, OLIVE = '#14161b', '#efe6d4', '#dd4326', '#1d4b57', '#d6a03a', '#6f7440'
FONT = "'DIN Condensed', 'Oswald', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif"

def inner(name):
    s = open(f'{D}/session/pictures/{name}.svg').read()
    return re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', s, flags=re.S)

terrain = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', open(f'{D}/sources/terrain-clean.svg').read(), flags=re.S)
dome = inner('dome')
ocean, coast = path(OCEAN), path(OCEAN)
sf, pet, dil, gg = (P(*PLACES[k]) for k in ('sf', 'pet', 'dillon', 'gg'))

contours = ''.join(f'<path d="{coast}" stroke="{CREAM}" stroke-width="{2*d+2.4}"/><path d="{coast}" stroke="{TEAL}" stroke-width="{2*d}"/>'
                   for d in (128, 78, 38))

def tag(x, y, text, sub=None, anchor='start', size=34):
    w = len(text) * (size * 0.385 + 1) + 22
    x0 = x if anchor == 'start' else x - w
    h = size + 14 + (size * 0.8 if sub else 0)
    out = f'<rect x="{x0:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{INK}"/>'
    out += f'<text x="{x0+12:.0f}" y="{y+size+3:.0f}" font-size="{size}" fill="{CREAM}">{text}</text>'
    if sub:
        out += f'<text x="{x0+12:.0f}" y="{y+size*1.75+5:.0f}" font-size="{size*0.72:.0f}" fill="{OCHRE}">{sub}</text>'
    return out

def marker(p):
    return f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="12" fill="{CREAM}" stroke="{INK}" stroke-width="5"/><circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="4.5" fill="{VERM}"/>'

route = path(ROUTE, False)
dw = 300; dh = dw * 1024 / 1536
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1250" width="1200" height="1500">
<title>Chunderdome II route map: San Francisco to Dillon Beach</title>
<defs>
  <filter id="feather" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  <clipPath id="frame"><rect width="1000" height="1250"/></clipPath>
  <clipPath id="sea"><path d="{ocean}"/></clipPath>
  <clipPath id="belowHorizon"><rect y="174" width="1000" height="1100"/></clipPath>
  <linearGradient id="fadeIn" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse" x2v="0"><stop offset="0" stop-color="#000"/></linearGradient>
  <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="470"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
  <mask id="offshore" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <rect width="1000" height="1250" fill="url(#fade)"/>
    <path d="{coast}" fill="none" stroke="#000" stroke-width="34" stroke-linejoin="round"/>
  </mask>
  <mask id="quiet" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1250">
    <rect width="1000" height="1250" fill="#fff"/><g filter="url(#feather)"><rect x="-60" y="900" width="590" height="420" fill="#000"/><rect x="50" y="560" width="50" height="340" fill="#000"/></g>
  </mask>
</defs>
<g clip-path="url(#frame)">
  <g id="terrain" transform="scale({1000/1024})">{terrain}</g>
  <g id="sky-bands"><rect width="1000" height="44" fill="#dd5a33"/><rect y="44" width="1000" height="44" fill="#e27139"/></g>
  <g id="bathymetry" clip-path="url(#sea)" mask="url(#offshore)" fill="none" stroke-linejoin="round">
    <rect width="1000" height="1250" fill="{TEAL}" stroke="none"/><g mask="url(#quiet)">{contours}</g>
  </g>
  <g id="sun" clip-path="url(#horizonClip)">
    <circle cx="190" cy="168" r="50" fill="{VERM}"/>
  </g>
  <g id="route" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="{route}" stroke="{INK}" stroke-width="15"/>
    <path d="{route}" stroke="{VERM}" stroke-width="8"/>
  </g>
  <g id="dome" transform="translate({dil[0]-dw*0.42:.1f},{dil[1]-dh*0.86:.1f}) scale({dw/1536})">{dome}</g>
  <g id="markers">{marker(sf)}{marker(pet)}{marker(dil)}</g>
  <g id="labels" font-family="{FONT}" font-weight="700" letter-spacing="1">
    {tag(sf[0]-18, sf[1]+16, 'SAN FRANCISCO', 'FRI 6 PM', anchor='end')}
    {tag(pet[0]+20, pet[1]+14, 'PETALUMA')}
    {tag(dil[0]+24, dil[1]+18, 'DILLON BEACH')}
    <text x="80" y="880" font-size="30" letter-spacing="10" fill="{CREAM}" opacity="0.9" transform="rotate(-90 80 880)">PACIFIC OCEAN</text>
  </g>
  <g id="title" font-family="{FONT}" font-weight="700" fill="{CREAM}">
    <text x="34" y="972" font-size="30" letter-spacing="1.5" fill="{OCHRE}">SF → DILLON BEACH · NOV 13–15</text>
    <text x="30" y="1102" font-size="152" letter-spacing="2">CHUNDER</text>
    <text x="30" y="1226" font-size="152" letter-spacing="2">DOME <tspan fill="{VERM}">II</tspan></text>
  </g>
</g>
</svg>'''
svg = svg.replace('clip-path="url(#horizonClip)"', 'clip-path="url(#aboveHorizon)"').replace('<clipPath id="belowHorizon"><rect y="174" width="1000" height="1100"/></clipPath>', '<clipPath id="aboveHorizon"><rect width="1000" height="176"/></clipPath>')
svg = re.sub(r'\s*<linearGradient id="fadeIn".*?</linearGradient>', '', svg)
open(f'{D}/map.svg', 'w').write(svg)
