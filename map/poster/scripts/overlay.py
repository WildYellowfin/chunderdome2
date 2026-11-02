import sys; sys.path.insert(0, __file__.rsplit('/',1)[0]); from geo import *
img = sys.argv[1]
print(f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1500" width="1000" height="1500">
<image href="data:image/png;base64,{__import__("base64").b64encode(open(img,"rb").read()).decode()}" width="1000" height="1500" preserveAspectRatio="none"/>
<g fill="none" stroke="#ff00ff" stroke-width="3"><path d="{path(OCEAN)}"/><path d="{path(BAY)}"/></g>
<path d="{path(ROUTE, False)}" fill="none" stroke="#dd4326" stroke-width="6"/></svg>''')
