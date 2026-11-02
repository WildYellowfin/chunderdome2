import { createRequire } from 'node:module';
const sharp = createRequire('/Users/jamesmullen/Documents/Monge-desk/package.json')('sharp');
const { data, info } = await sharp(process.argv[2]).removeAlpha().raw().toBuffer({ resolveWithObject: true });
for (const x of process.argv[3].split(',').map(Number)) {
  const row = [];
  for (let y = 100; y < 300; y += 8) { const i = (y * info.width + x) * 3; row.push(`${y}:${data[i]},${data[i+1]},${data[i+2]}`); }
  console.log('x=' + x, row.join(' '));
}
