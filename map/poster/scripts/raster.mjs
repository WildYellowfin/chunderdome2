// usage: node raster.mjs in.svg out.png [width]
import { createRequire } from 'node:module';
const sharp = createRequire('/Users/jamesmullen/Documents/Monge-desk/package.json')('sharp');
const [, , src, out, w] = process.argv;
await sharp(src, { density: 144 }).resize(w ? +w : null).png().toFile(out);
