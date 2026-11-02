// West coast of a generated raster: for each row, where the open Pacific (dark teal from the left edge) meets land.
// Prints a smoothed polyline [[x,y],...] in 1000-wide frame units, from the horizon down.
import { createRequire } from 'node:module';
const sharp = createRequire('/Users/jamesmullen/Documents/Monge-desk/package.json')('sharp');
const [, , src, top] = process.argv;
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sea = (x, y) => { const i = (y * info.width + x) * 3; return data[i] < 90 && data[i + 2] >= data[i] - 5; };
const k = 1000 / info.width, rows = [];
for (let y = Math.round(+top / k); y < info.height; y += 3) {
  let x = 0, miss = 0;
  while (x < info.width) { if (sea(x, y)) miss = 0; else if (++miss >= 5) { x -= 4; break; } x++; }
  rows.push([x, y]);
}
const med = rows.map((r, i) => { const w = rows.slice(Math.max(0, i - 3), i + 4).map(q => q[0]).sort((a, b) => a - b); return [w[w.length >> 1], r[1]]; });
const sm = med.map((r, i) => { const w = med.slice(Math.max(0, i - 2), i + 3); return [w.reduce((s, q) => s + q[0], 0) / w.length, r[1]]; });
console.log(JSON.stringify(sm.map(([x, y]) => [+(x * k).toFixed(1), +(y * k).toFixed(1)])));
