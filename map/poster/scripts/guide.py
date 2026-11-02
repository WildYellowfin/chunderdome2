import sys; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
x,y = P(*PLACES['dillon']); gx,gy = P(*PLACES['gg'])
print(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1500" width="1000" height="1500">
<rect width="1000" height="1500" fill="#e3cf9f"/>
<path d="{path(OCEAN)}" fill="#1d4b57"/><path d="{path(BAY)}" fill="#4f8790"/>
<rect width="1000" height="240" fill="#e9a25a"/><circle cx="160" cy="235" r="55" fill="#dd4326"/>
<path d="M{x-45:.0f},{y-8:.0f} a45,45 0 0 1 90,0 z" fill="#f4d58a" stroke="#14161b" stroke-width="3"/>
<rect x="{gx-14:.0f}" y="{gy-30:.0f}" width="5" height="30" fill="#14161b"/><rect x="{gx+8:.0f}" y="{gy-38:.0f}" width="5" height="30" fill="#14161b"/>
</svg>''')
