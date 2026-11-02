// Builds public/map.svg: an illustrated map of the drive from San Francisco to
// Dillon Beach. Each layer is plain SVG authored here, then composed by the
// Monge kernel (https://github.com/WildYellowfin/monge), which namespaces ids,
// checks fragments are safe, and writes a single native SVG.
//
//   MONGE_DIR=../monge bun map/build-map.ts
//
// Geography is real (lat/lon below), just stylised.

import { writeFileSync } from "fs";
import path from "path";

const MONGE_DIR = process.env.MONGE_DIR ?? path.resolve(import.meta.dir, "../../monge");
// Import the composition modules directly (the package index also loads sharp
// for PNG previews, which we don't need here).
const { composeSvg } = await import(path.join(MONGE_DIR, "src/svg.ts"));
const { svgFragment } = await import(path.join(MONGE_DIR, "src/fragment.ts"));

const W = 1600;
const H = 900;
const LAT_TOP = 38.46;
const LAT_BOTTOM = 37.69;
const K = H / ((LAT_TOP - LAT_BOTTOM) * 1.27); // px per degree of longitude
const LON_RIGHT = -122.12;
const LON_LEFT = LON_RIGHT - W / K;

type LL = [number, number]; // [lat, lon]
const px = ([lat, lon]: LL): [number, number] => [(lon - LON_LEFT) * K, (LAT_TOP - lat) * K * 1.27];
const f = (n: number) => Math.round(n * 10) / 10;

// Smooth closed/open path through points (Catmull-Rom → cubic Bézier).
function smooth(pts: [number, number][], closed = false, t = 0.5): string {
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f(p[1][0])},${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * t) / 3, p1[1] + ((p2[1] - p0[1]) * t) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * t) / 3, p2[1] - ((p3[1] - p1[1]) * t) / 3];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + " Z" : d;
}
const P = (pts: LL[], closed = false) => smooth(pts.map(px), closed);

// Seeded random so the art is deterministic.
let seed = 13;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---- Palette ----------------------------------------------------------------
const C = {
  sea: "#2b6f7a", seaDeep: "#1f5560", seaLight: "#3f8b92", foam: "#d7ece6",
  land: "#efe2c4", land2: "#e5d3ab", hill: "#b9bf86", hillDark: "#98a26a", forest: "#4f6b4a", forestDark: "#3a5238",
  ink: "#2a2a35", ember: "#e8673c", gold: "#f4c76b", red: "#c8452f", cream: "#fffaf1", night: "#17203a",
};

// ---- Coastline (north → south) ----------------------------------------------
const coast: LL[] = [
  [38.48, -123.16], [38.42, -123.12], [38.37, -123.09], [38.33, -123.07], [38.305, -123.065], [38.3, -123.035], [38.31, -123.015],
  [38.29, -122.99], [38.265, -122.975], [38.25, -122.968], [38.243, -122.985], [38.238, -122.996],
  [38.2, -122.97], [38.14, -122.968], [38.08, -122.98], [38.03, -122.995], [37.997, -123.022],
  [37.99, -122.975], [38.015, -122.925], [38.03, -122.875], [38.0, -122.835], [37.955, -122.79],
  [37.91, -122.72], [37.897, -122.69], [37.903, -122.65], [37.882, -122.612], [37.858, -122.58],
  [37.83, -122.535], [37.82, -122.495], [37.811, -122.478],
];
const sfCoast: LL[] = [[37.807, -122.476], [37.79, -122.49], [37.775, -122.512], [37.74, -122.507], [37.69, -122.505]];

const pacific = (() => {
  const pts = [...coast, ...sfCoast].map(px);
  const d = smooth(pts, false, 0.4);
  return `${d} L${f(pts[pts.length - 1][0])},${H + 10} L-10,${H + 10} L-10,-10 L${f(pts[0][0])},-10 Z`;
})();

const bay: LL[] = [
  [37.812, -122.478], [37.83, -122.478], [37.858, -122.483], [37.875, -122.455], [37.905, -122.49],
  [37.96, -122.485], [38.02, -122.5], [38.07, -122.47], [38.1, -122.37], [38.085, -122.25],
  [38.06, -122.2], [38.07, -122.08], [38.03, -122.06], [38.02, -122.2], [37.98, -122.36],
  [37.93, -122.37], [37.89, -122.315], [37.81, -122.31], [37.76, -122.23], [37.69, -122.16],
  [37.68, -122.385], [37.75, -122.385], [37.79, -122.39], [37.808, -122.415], [37.808, -122.448],
];
const tomales: LL[] = [
  [38.252, -122.985], [38.235, -122.965], [38.2, -122.93], [38.15, -122.88], [38.1, -122.83],
  [38.065, -122.8], [38.072, -122.792], [38.11, -122.815], [38.16, -122.862], [38.21, -122.912],
  [38.245, -122.95], [38.258, -122.962],
];

// ---- Route ------------------------------------------------------------------
const route: LL[] = [
  [37.762, -122.42], [37.785, -122.445], [37.8, -122.448], [37.807, -122.473], [37.83, -122.478],
  [37.857, -122.497], [37.89, -122.515], [37.93, -122.515], [37.97, -122.53], [38.02, -122.54],
  [38.08, -122.56], [38.13, -122.585], [38.18, -122.61], [38.232, -122.636], [38.245, -122.68],
  [38.24, -122.75], [38.233, -122.81], [38.245, -122.87], [38.247, -122.905], [38.25, -122.935],
  [38.252, -122.958],
];

const places = {
  sf: [37.765, -122.43] as LL,
  gg: [37.818, -122.478] as LL,
  tam: [37.924, -122.596] as LL,
  sanRafael: [37.973, -122.531] as LL,
  novato: [38.107, -122.57] as LL,
  petaluma: [38.233, -122.636] as LL,
  tomales: [38.247, -122.905] as LL,
  dillon: [38.252, -122.962] as LL,
  pointReyes: [37.997, -123.02] as LL,
  bodega: [38.31, -123.05] as LL,
  oakland: [37.81, -122.27] as LL,
};

// ---- Layers -----------------------------------------------------------------
const defs = `
<defs>
  <radialGradient id="sea" cx="20%" cy="45%" r="90%">
    <stop offset="0" stop-color="${C.seaLight}"/><stop offset=".6" stop-color="${C.sea}"/><stop offset="1" stop-color="${C.seaDeep}"/>
  </radialGradient>
  <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.land}"/><stop offset="1" stop-color="${C.land2}"/>
  </linearGradient>
</defs>`;

const base = `
${defs}
<rect width="${W}" height="${H}" fill="url(#land)"/>
<path d="${pacific}" fill="url(#sea)"/>
<path d="${P(bay, true)}" fill="${C.sea}"/>
<path d="${P(tomales, true)}" fill="${C.sea}"/>`;

// Shore foam: offset strokes of the coastline.
const shore = [0, 1, 2]
  .map((i) => `<path d="${smooth([...coast, ...sfCoast].map(px), false, 0.4)}" fill="none" stroke="${C.foam}" stroke-width="${1.6 - i * 0.4}" opacity="${0.75 - i * 0.22}" transform="translate(${-8 - i * 10},${i * 2})" stroke-dasharray="${i ? "14 10" : "none"}"/>`)
  .join("\n") +
  `<path d="${P(bay, true)}" fill="none" stroke="${C.foam}" stroke-width="1.2" opacity=".6"/>
<path d="${P(tomales, true)}" fill="none" stroke="${C.foam}" stroke-width="1" opacity=".6"/>`;

// Ocean wave glyphs in the open Pacific.
function waves(): string {
  const out: string[] = [];
  const coastXAt = (y: number) => {
    const pts = [...coast, ...sfCoast].map(px);
    let best = pts[0];
    for (const q of pts) if (Math.abs(q[1] - y) < Math.abs(best[1] - y)) best = q;
    return best[0];
  };
  for (let y = 40; y < H; y += 46) {
    for (let x = 30 + (y % 92 ? 40 : 0); x < W; x += 110) {
      const jx = x + rnd() * 40;
      const jy = y + rnd() * 16;
      if (jx > coastXAt(jy) - 60) continue;
      if (jx > 40 && jx < 520 && jy > 40 && jy < 250) continue; // title cartouche
      const s = 0.7 + rnd() * 0.6;
      out.push(`<path d="M${f(jx)},${f(jy)} q${f(9 * s)},${f(-7 * s)} ${f(18 * s)},0 t${f(18 * s)},0" fill="none" stroke="${C.foam}" stroke-width="1.6" stroke-linecap="round" opacity="${f(0.25 + rnd() * 0.3)}"/>`);
    }
  }
  return out.join("\n");
}

// Rolling hills as soft bumps on land.
function hills(): string {
  const groups: { at: LL; n: number; spread: number }[] = [
    { at: [37.93, -122.65], n: 10, spread: 70 }, // Marin
    { at: [38.06, -122.7], n: 12, spread: 90 }, // West Marin
    { at: [38.18, -122.8], n: 12, spread: 90 }, // Tomales hills
    { at: [38.3, -122.85], n: 10, spread: 90 }, // Sonoma coast
    { at: [38.3, -122.5], n: 8, spread: 90 }, // Sonoma
    { at: [37.88, -122.2], n: 8, spread: 80 }, // Berkeley hills
    { at: [38.1, -122.82], n: 6, spread: 40 }, // Inverness ridge
  ];
  const out: string[] = [];
  for (const g of groups) {
    const [cx, cy] = px(g.at);
    for (let i = 0; i < g.n; i++) {
      const x = cx + (rnd() - 0.5) * g.spread * 2;
      const y = cy + (rnd() - 0.5) * g.spread;
      const w = 40 + rnd() * 50;
      const h = 14 + rnd() * 16;
      const fill = rnd() > 0.5 ? C.hill : C.hillDark;
      out.push(`<path d="M${f(x - w / 2)},${f(y)} Q${f(x)},${f(y - h * 2)} ${f(x + w / 2)},${f(y)} Z" fill="${fill}" opacity=".85"/>`);
      out.push(`<path d="M${f(x - w / 4)},${f(y - h * 0.55)} Q${f(x)},${f(y - h * 1.1)} ${f(x + w / 5)},${f(y - h * 0.7)}" fill="none" stroke="${C.cream}" stroke-width="1.2" opacity=".4"/>`);
    }
  }
  return out.join("\n");
}

function tree(x: number, y: number, s = 1): string {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})"><rect x="-1.2" y="0" width="2.4" height="6" fill="#5b4632"/><path d="M0,-18 L8,-4 L4,-4 L10,4 L-10,4 L-4,-4 L-8,-4 Z" fill="${rnd() > 0.5 ? C.forest : C.forestDark}"/></g>`;
}
function forests(): string {
  const groves: { at: LL; n: number; spread: number }[] = [
    { at: [38.04, -122.85], n: 14, spread: 30 }, // Inverness ridge
    { at: [37.98, -122.78], n: 10, spread: 30 },
    { at: [37.9, -122.58], n: 9, spread: 30 }, // Muir Woods
    { at: [38.0, -122.62], n: 7, spread: 30 },
    { at: [38.33, -122.95], n: 6, spread: 30 },
  ];
  const out: string[] = [];
  for (const g of groves) {
    const [cx, cy] = px(g.at);
    const pts = Array.from({ length: g.n }, () => [cx + (rnd() - 0.5) * g.spread * 2.4, cy + (rnd() - 0.5) * g.spread] as const);
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) out.push(tree(x, y, 0.8 + rnd() * 0.5));
  }
  return out.join("\n");
}

// Mt Tam.
const tam = (() => {
  const [x, y] = px(places.tam);
  return `<path d="M${f(x - 60)},${f(y + 10)} L${f(x - 12)},${f(y - 38)} L${f(x)},${f(y - 30)} L${f(x + 14)},${f(y - 46)} L${f(x + 64)},${f(y + 10)} Z" fill="${C.hillDark}"/>
<path d="M${f(x - 12)},${f(y - 38)} L${f(x)},${f(y - 30)} L${f(x + 14)},${f(y - 46)} L${f(x + 24)},${f(y - 30)} L${f(x + 6)},${f(y - 22)} L${f(x - 6)},${f(y - 28)} L${f(x - 20)},${f(y - 28)} Z" fill="${C.cream}" opacity=".55"/>`;
})();

// Golden Gate Bridge, drawn side-on as an icon over the strait.
const bridge = (() => {
  const [x, y] = px([37.812, -122.477]);
  const w = 84;
  const tower = (tx: number) => `<g transform="translate(${tx},0)"><rect x="-3" y="-34" width="6" height="40" fill="${C.red}"/><rect x="-5" y="-26" width="10" height="2.5" fill="${C.red}"/><rect x="-5" y="-15" width="10" height="2.5" fill="${C.red}"/></g>`;
  return `<g transform="translate(${f(x)},${f(y + 6)})">
  <path d="M${-w / 2 - 10},0 H${w / 2 + 10}" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${-w / 2 - 10},0 Q${-w / 2 + 8},-10 ${-w / 4},-32 Q0,-2 ${w / 4},-32 Q${w / 2 - 8},-10 ${w / 2 + 10},0" fill="none" stroke="${C.red}" stroke-width="2"/>
  <path d="M${-w / 6},-14 V0 M0,-8 V0 M${w / 6},-14 V0 M${-w / 3},-22 V0 M${w / 3},-22 V0" stroke="${C.red}" stroke-width=".8"/>
  ${tower(-w / 4)}${tower(w / 4)}
</g>`;
})();

// SF skyline.
const skyline = (() => {
  const [x, y] = px([37.79, -122.39]);
  const b: string[] = [];
  const heights = [26, 40, 34, 58, 30, 46, 22, 36, 28];
  heights.forEach((h, i) => {
    const bx = x - 50 + i * 11;
    b.push(`<rect x="${f(bx)}" y="${f(y - h)}" width="10" height="${h}" fill="${i % 2 ? "#5b6178" : "#4a4f66"}"/>`);
    for (let w = 6; w < h - 4; w += 7) b.push(`<rect x="${f(bx + 3)}" y="${f(y - h + w)}" width="2" height="2.5" fill="${C.gold}" opacity=".9"/>`);
  });
  // Transamerica pyramid
  b.push(`<path d="M${f(x + 52)},${f(y)} L${f(x + 57)},${f(y - 72)} L${f(x + 62)},${f(y)} Z" fill="#6a7088"/>`);
  return b.join("\n");
})();

// Point Reyes lighthouse.
const lighthouse = (() => {
  const [x, y] = px(places.pointReyes);
  return `<g transform="translate(${f(x + 14)},${f(y - 6)})">
  <path d="M-80,-20 L0,-14 L0,-10 L-80,-4 Z" fill="${C.gold}" opacity=".35"/>
  <path d="M-6,8 L-4,-12 L4,-12 L6,8 Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/>
  <rect x="-4" y="-4" width="8" height="3" fill="${C.red}"/>
  <rect x="-5" y="-18" width="10" height="6" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/>
  <path d="M-6,-18 L0,-24 L6,-18 Z" fill="${C.red}"/>
</g>`;
})();

// Cows of West Marin dairies.
function cow(x: number, y: number, flip = false) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${flip ? -1 : 1},1)">
  <ellipse cx="0" cy="0" rx="10" ry="6" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/>
  <path d="M-4,-5 q3,3 0,8 M3,-3 q-3,2 1,6" stroke="${C.ink}" stroke-width="2.4" fill="none"/>
  <ellipse cx="11" cy="-3" rx="4" ry="3.2" fill="${C.cream}" stroke="${C.ink}" stroke-width="1"/>
  <path d="M-7,5 v5 M-3,5 v5 M4,5 v5 M8,5 v5" stroke="${C.ink}" stroke-width="1.4"/>
</g>`;
}
const cows = [[38.21, -122.76], [38.205, -122.72], [38.17, -122.78], [38.27, -122.8]]
  .map(([a, b], i) => { const [x, y] = px([a, b]); return cow(x, y, i % 2 === 1); }).join("\n");

// Whale + spout.
const whale = (() => {
  const [x, y] = [250, 640];
  return `<g transform="translate(${x},${y})" opacity=".9">
  <path d="M-60,0 Q-30,-34 20,-20 Q48,-12 56,4 Q20,14 -30,10 Q-50,8 -60,0 Z" fill="#1c4a54"/>
  <path d="M-60,0 L-84,-16 L-78,2 L-88,16 Z" fill="#1c4a54"/>
  <circle cx="36" cy="-6" r="2" fill="${C.cream}"/>
  <path d="M14,-22 q-6,-18 -16,-22 M14,-22 q2,-20 12,-26 M14,-22 q-14,-8 -24,-6" stroke="${C.foam}" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>`;
})();

// Compass rose.
const compass = (() => {
  const [x, y] = [150, 800];
  return `<g transform="translate(${x},${y})">
  <circle r="46" fill="none" stroke="${C.cream}" stroke-width="1.5" opacity=".7"/>
  <circle r="38" fill="none" stroke="${C.cream}" stroke-width=".8" opacity=".5" stroke-dasharray="2 4"/>
  <path d="M0,-56 L8,0 L0,56 L-8,0 Z" fill="${C.cream}"/>
  <path d="M0,-56 L8,0 L0,0 Z" fill="${C.ember}"/>
  <path d="M-56,0 L0,-7 L56,0 L0,7 Z" fill="${C.cream}" opacity=".8"/>
  <text y="-62" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-weight="700" fill="${C.cream}">N</text>
</g>`;
})();

// Route: casing + dashes.
const routeD = P(route);
const routeLayer = `
<path d="${routeD}" fill="none" stroke="${C.cream}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
<path d="${routeD}" fill="none" stroke="${C.ember}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="14 9"/>`;

// Car on the road near Novato.
const car = (() => {
  const [x, y] = px([38.03, -122.545]);
  return `<g transform="translate(${f(x + 2)},${f(y)}) rotate(-70)">
  <rect x="-16" y="-9" width="32" height="18" rx="6" fill="${C.night}"/>
  <rect x="-6" y="-7" width="12" height="14" rx="3" fill="#6f7fae"/>
  <circle cx="18" cy="-5" r="2.5" fill="${C.gold}"/><circle cx="18" cy="5" r="2.5" fill="${C.gold}"/>
  <path d="M20,-5 L52,-16 L52,6 Z M20,5 L52,-6 L52,16 Z" fill="${C.gold}" opacity=".18"/>
</g>`;
})();

// The Chunderdome itself: a geodesic dome with a flag and a fire.
const dome = (() => {
  const [x, y] = px(places.dillon);
  const cx = x - 8, cy = y - 34;
  const r = 34;
  const lines: string[] = [];
  for (const a of [0.25, 0.5, 0.75]) {
    const yy = r * a;
    const hw = Math.sqrt(r * r - yy * yy);
    lines.push(`M${f(-hw)},${f(-yy)} H${f(hw)}`);
  }
  for (let i = 1; i < 6; i++) {
    const t = (i / 6) * Math.PI;
    lines.push(`M${f(-Math.cos(t) * r)},0 L${f(-Math.cos(t) * r * 0.45)},${f(-r * 0.95)}`);
  }
  return `<defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>
<g transform="translate(${f(cx)},${f(cy)})">
  <ellipse cx="0" cy="4" rx="58" ry="10" fill="#000" opacity=".15"/>
  <circle r="80" cy="-10" fill="${C.gold}" opacity=".25" filter="url(#soft)"/>
  <path d="M${-r},0 A${r},${r} 0 0 1 ${r},0 Z" fill="${C.ember}" stroke="${C.ink}" stroke-width="2"/>
  <path d="${lines.join(" ")}" stroke="${C.cream}" stroke-width="1.4" opacity=".75" fill="none"/>
  <path d="M-8,0 Q0,-16 8,0 Z" fill="${C.night}"/>
  <path d="M0,${-r} V${-r - 26}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M0,${-r - 26} L24,${-r - 20} L0,${-r - 14} Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="1"/>
  <text x="9" y="${-r - 16.5}" font-family="Georgia, serif" font-size="8" font-weight="700" fill="${C.ink}" text-anchor="middle">II</text>
  <g transform="translate(46,0)">
    <path d="M-8,2 L8,-2 M-8,-2 L8,2" stroke="#5b4632" stroke-width="3" stroke-linecap="round"/>
    <path d="M0,-2 Q-7,-10 -2,-20 Q0,-12 4,-16 Q8,-8 0,-2 Z" fill="${C.ember}"/>
    <path d="M0,-3 Q-3,-8 0,-13 Q3,-8 0,-3 Z" fill="${C.gold}"/>
  </g>
  <g fill="${C.cream}" opacity=".9">
    <path d="M-62,2 L-50,-16 L-38,2 Z" fill="#6a8bb0" stroke="${C.ink}" stroke-width="1.2"/>
    <path d="M-58,4 L-48,-10 L-38,4 Z" fill="#7aa36a" stroke="${C.ink}" stroke-width="1.2" transform="translate(-14,6)"/>
  </g>
</g>`;
})();

// Stops along the way: dot + label + time.
function stop(at: LL, name: string, time: string, dx: number, dy: number, anchor = "start", big = false) {
  const [x, y] = px(at);
  return `<g>
  <circle cx="${f(x)}" cy="${f(y)}" r="${big ? 9 : 6}" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>
  <circle cx="${f(x)}" cy="${f(y)}" r="${big ? 4 : 2.5}" fill="${C.ember}"/>
  <text x="${f(x + dx)}" y="${f(y + dy)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="${big ? 26 : 19}" font-weight="700" fill="${C.ink}" paint-order="stroke" stroke="${C.cream}" stroke-width="5" stroke-linejoin="round">${name}</text>
  <text x="${f(x + dx)}" y="${f(y + dy + (big ? 22 : 19))}" text-anchor="${anchor}" font-family="Helvetica, Arial, sans-serif" font-size="${big ? 15 : 13}" font-weight="600" letter-spacing="1" fill="${C.ember}" paint-order="stroke" stroke="${C.cream}" stroke-width="4" stroke-linejoin="round">${time}</text>
</g>`;
}

function label(at: LL, text: string, opts: { dx?: number; dy?: number; size?: number; color?: string; italic?: boolean; spacing?: number; anchor?: string; rotate?: number } = {}) {
  const [x, y] = px(at);
  const { dx = 0, dy = 0, size = 14, color = C.ink, italic = false, spacing = 2, anchor = "middle", rotate = 0 } = opts;
  return `<text x="${f(x + dx)}" y="${f(y + dy)}" text-anchor="${anchor}" font-family="Georgia, serif" font-size="${size}" ${italic ? 'font-style="italic"' : ""} letter-spacing="${spacing}" fill="${color}" transform="rotate(${rotate} ${f(x + dx)} ${f(y + dy)})">${text}</text>`;
}

const labels = [
  label([38.05, -123.35], "PACIFIC  OCEAN", { size: 30, color: C.foam, italic: true, spacing: 10 }),
  label([37.86, -122.385], "SF Bay", { size: 15, color: C.foam, italic: true, spacing: 2 }),
  label([38.065, -122.33], "San Pablo Bay", { size: 14, color: C.foam, italic: true }),
  label([38.15, -122.875], "Tomales Bay", { size: 13, color: C.foam, italic: true, rotate: 44, dx: 2 }),
  label([38.34, -123.1], "Bodega Bay", { size: 14, color: C.foam, italic: true, dx: -130, dy: 30 }),
  label([37.97, -122.9], "Drakes Bay", { size: 13, color: C.foam, italic: true }),
  label(places.pointReyes, "Point Reyes", { size: 15, dx: -10, dy: 36, spacing: 1, color: C.cream }),
  label(places.tam, "Mt. Tamalpais", { size: 14, dx: -66, dy: 40, anchor: "end", italic: true, spacing: 1 }),
  label([37.812, -122.5], "Golden Gate", { size: 13, dx: -34, dy: 4, anchor: "end", italic: true, spacing: 1, color: C.ink }),
  label(places.oakland, "Oakland", { size: 15, spacing: 1 }),
  label([37.87, -122.26], "Berkeley", { size: 13, spacing: 1, color: "#6a6a6a" }),
  label([38.42, -122.74], "SONOMA", { size: 18, spacing: 8, color: "#8b8463" }),
  label([38.11, -122.68], "MARIN", { size: 20, spacing: 10, color: "#8b8463" }),
  label([38.2, -122.75], "the cows", { size: 12, italic: true, color: "#6a6a6a", dy: 26, spacing: 1 }),
].join("\n");

const stops = [
  stop(places.sf, "San Francisco", "FRI · 6:00 PM", 22, 8, "start", true),
  stop(places.sanRafael, "San Rafael", "~6:25", 16, 6),
  stop(places.petaluma, "Petaluma", "~7:00 · LAST GROCERIES", 14, -14),
  stop(places.tomales, "Tomales", "~7:20", 0, 32, "middle"),
].join("\n");

const dillonLabel = (() => {
  const [x, y] = px(places.dillon);
  return `<text x="${f(x + 30)}" y="${f(y - 132)}" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${C.ink}" paint-order="stroke" stroke="${C.cream}" stroke-width="6" stroke-linejoin="round">Dillon Beach</text>
<text x="${f(x + 30)}" y="${f(y - 110)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="1.5" fill="${C.ember}" paint-order="stroke" stroke="${C.cream}" stroke-width="4" stroke-linejoin="round">~7:30 PM · THE DOME RISES</text>`;
})();

const cartouche = `
<g transform="translate(64,64)">
  <rect width="440" height="170" rx="14" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>
  <rect x="8" y="8" width="424" height="154" rx="9" fill="none" stroke="${C.ember}" stroke-width="1.2" stroke-dasharray="4 4"/>
  <text x="220" y="44" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="5" fill="${C.ember}">THE ROAD TO</text>
  <text x="220" y="98" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="${C.ink}">Chunderdome II</text>
  <path d="M110,116 H330" stroke="${C.ink}" stroke-width="1"/>
  <text x="220" y="142" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-style="italic" fill="${C.ink}">Dillon Beach · November 13–15, 2026</text>
</g>`;

const scale = (() => {
  // 10 miles ≈ 0.1823° lon at this latitude
  const len = 0.1823 * K;
  const x = W - 60 - len, y = 70;
  return `<g transform="translate(${f(x)},${y})" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="${C.ink}">
  <rect width="${f(len / 2)}" height="6" fill="${C.ink}"/><rect x="${f(len / 2)}" width="${f(len / 2)}" height="6" fill="${C.cream}" stroke="${C.ink}"/>
  <text y="22">0</text><text x="${f(len)}" y="22" text-anchor="end">10 mi</text>
  <text x="${f(len / 2)}" y="-8" text-anchor="middle" font-style="italic">about 1½ hours of singalongs</text>
</g>`;
})();

const frame = `<defs><pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
  <circle cx="1" cy="1" r=".6" fill="#000" opacity=".05"/><circle cx="4" cy="4" r=".5" fill="#fff" opacity=".08"/>
</pattern></defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${C.ink}" stroke-width="3" rx="4"/>
<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${C.ink}" stroke-width="1" rx="2" opacity=".6"/>
<rect width="${W}" height="${H}" fill="url(#grain)"/>`;

const layers = [
  ["base", base],
  ["shore", shore],
  ["waves", waves()],
  ["hills", hills()],
  ["mt-tam", tam],
  ["forests", forests()],
  ["cows", cows],
  ["skyline", skyline],
  ["lighthouse", lighthouse],
  ["route", routeLayer],
  ["bridge", bridge],
  ["car", car],
  ["whale", whale],
  ["compass", compass],
  ["labels", labels],
  ["stops", stops],
  ["chunderdome", dome],
  ["dillon-label", dillonLabel],
  ["cartouche", cartouche],
  ["scale", scale],
  ["frame", frame],
] as const;

const svg = composeSvg({
  id: "chunderdome-ii-map",
  size: { width: W, aspectRatio: W / H },
  title: "The road to Chunderdome II",
  description: "Illustrated map of the drive from San Francisco over the Golden Gate Bridge, north through Marin and Petaluma, and west through Tomales to the Chunderdome at Dillon Beach.",
  fragments: layers.map(([name, markup]) => svgFragment(markup, { namespace: name, role: "artwork" })),
});

const out = path.resolve(import.meta.dir, "../public/map.svg");
writeFileSync(out, svg);
console.log(`Wrote ${out} (${(svg.length / 1024).toFixed(0)} KB)`);
