const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const svg = fs.readFileSync(process.argv[2], 'utf8'); const [x0, y0, x1, y1] = JSON.parse(process.env.BOX);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const r = await p.evaluate(([x0, y0, x1, y1]) => {
    const svg = document.querySelector('svg'); const out = [];
    [...document.querySelectorAll('path')].forEach((el, i) => {
      const bb = el.getBBox(); if (bb.x < x0 || bb.y < y0 || bb.x + bb.width > x1 || bb.y + bb.height > y1) return;
      const pts = []; const pt = svg.createSVGPoint();
      for (let y = Math.floor(bb.y); y <= bb.y + bb.height; y += 1) for (let x = Math.floor(bb.x); x <= bb.x + bb.width; x += 1) {
        pt.x = x + 0.5; pt.y = y + 0.5; if (el.isPointInFill(pt)) pts.push([x, y]); }
      out.push({ i, f: el.getAttribute('fill'), pts });
    }); return out;
  }, [x0, y0, x1, y1]);
  fs.writeFileSync(process.argv[3], JSON.stringify(r)); await b.close();
})();
