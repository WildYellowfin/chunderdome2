# Crop the source raster around a frame-unit box, upscale, and draw a frame-unit grid with labels to read positions.
# usage: gridcrop.py raster.png out.png x0 y0 x1 y1 step
import sys
from PIL import Image, ImageDraw
ras, out, x0, y0, x1, y1, step = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:8])
K = 1024 / 1000; S = 4
img = Image.open(ras).convert('RGB').crop((int(x0*K), int(y0*K), int(x1*K), int(y1*K)))
img = img.resize((img.width * S, img.height * S), Image.NEAREST); dr = ImageDraw.Draw(img)
gx = x0 - x0 % step + step
while gx < x1:
    X = (gx - x0) * K * S; dr.line([(X, 0), (X, img.height)], fill=(255, 0, 255), width=1); dr.text((X + 2, 2), str(int(gx)), fill=(255, 255, 255)); gx += step
gy = y0 - y0 % step + step
while gy < y1:
    Y = (gy - y0) * K * S; dr.line([(0, Y), (img.width, Y)], fill=(255, 0, 255), width=1); dr.text((2, Y + 2), str(int(gy)), fill=(255, 255, 255)); gy += step
img.save(out)
