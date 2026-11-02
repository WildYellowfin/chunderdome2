// Measure the skyline (sky above, ridges/sea below) of a generated raster; print it as JSON in 1000-wide frame units.
import { createRequire } from 'node:module';
const sharp = createRequire('/Users/jamesmullen/Documents/Monge-desk/package.json')('sharp');
const { data, info } = await sharp(process.argv[2]).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sky = (x, y) => { const i = (y * info.width + x) * 3; return data[i] > 195 && data[i + 2] < 64; };
const pts = [];
for (let x = 0; x < info.width; x += 4) {
  let y = 60, miss = 0;
  while (y < 400) { if (sky(x, y) || sky(Math.min(x + 1, info.width - 1), y)) { miss = 0; } else if (++miss >= 4) { y -= 3; break; } y++; }
  pts.push([x, y]);
}
// median-of-5 to drop specks, then 3-tap smooth
const med = pts.map((p, i) => [p[0], pts.slice(Math.max(0, i - 2), i + 3).map(q => q[1]).sort((a, b) => a - b)[Math.min(2, Math.floor(Math.min(i + 3, pts.length) - Math.max(0, i - 2)) >> 1)]]);
const sm = med.map((p, i) => [p[0], (med[Math.max(0, i - 1)][1] + 2 * p[1] + med[Math.min(med.length - 1, i + 1)][1]) / 4]);
const k = 1000 / info.width;
console.log(JSON.stringify(sm.map(([x, y]) => [+(x * k).toFixed(1), +(y * k).toFixed(1)]).concat([[1000, +(sm.at(-1)[1] * k).toFixed(1)]])));
