import sys; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
gx, gy = P(*PLACES['gg'])
print(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1500" width="1000" height="1500">
<rect width="1000" height="1500" fill="#e3cf9f"/>
<path d="{path(OCEAN)}" fill="#1d4b57"/><path d="{path(BAY)}" fill="#4f8790"/>
<path d="M0,0 H1000 V200 L860,150 L700,185 L560,160 L420,190 L300,172 L0,172 Z" fill="#f0b25a"/>
<path d="M300,172 L420,190 L560,160 L700,185 L860,150 L1000,200 L1000,240 L840,215 L680,240 L520,222 L380,245 L300,230 Z" fill="#c9b48a"/>
<path d="M300,230 L380,245 L520,222 L680,240 L840,215 L1000,240 L1000,300 L820,272 L640,300 L470,282 L330,300 Z" fill="#7d8a6a"/>
<clipPath id="h"><rect width="1000" height="172"/></clipPath><circle cx="150" cy="172" r="62" fill="#dd4326" clip-path="url(#h)"/>
<path d="M200,372 a60,60 0 0 1 120,0 z" fill="#f4d58a" stroke="#14161b" stroke-width="3"/>
<rect x="{gx-14:.0f}" y="{gy-30:.0f}" width="5" height="30" fill="#14161b"/><rect x="{gx+8:.0f}" y="{gy-38:.0f}" width="5" height="30" fill="#14161b"/>
</svg>''')
