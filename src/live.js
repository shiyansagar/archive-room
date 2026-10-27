// ===========================================================================
// The Archive Room · live layer.
// Static art is pre-built SVG. This script only moves groups (transforms),
// toggles the one lit accent, rebuilds the chair when it turns, and runs the
// project page and ID card transitions. Kit functions (iso, extrude, …) are
// inlined above this script; GEO comes from the build.
// ===========================================================================
const DATA = window.ARCHIVE || { projects: [], about: {} };
const PROJECTS = DATA.projects;
const ABOUT = DATA.about || {};
const N = GEO.cells.length;
const COLS = GEO.cols;
const CELLS = GEO.cells;
const hasProject = (i) => !!PROJECTS[i];
const P = GEO.P;
const W = GEO.width;
const H = GEO.height;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const stage = $("[data-stage]");
const figure = $("[data-figure]");
const svg = $(".room");
const readout = $("[data-readout]");
const status = $("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
figure.style.setProperty("--aspect", String(W / H));
// The room is centred as a whole.
function centreShelf() {}
// Touch screens have no hover: say "tap" in the hint.
if (matchMedia("(hover: none)").matches) $("[data-corner=hint]").textContent = "tap a drawer · tap the computer · drag the chair";

const pad2 = (n) => String(n).padStart(2, "0");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const NS = "http://www.w3.org/2000/svg";

// ---------------------------------------------------------------------------
// Placeholder art (used wherever an image path is left empty).
// ---------------------------------------------------------------------------
const RED = GEO.white ? "#3A3A39" : "#DF5061";
const CREAM = GEO.white ? "#FAFAF8" : "#FFFDEE";
const DEEP = GEO.white ? "#262626" : "#B02F45";
function svgUri(body, w, h, bg = RED) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}
function rng(seed) {
  let t = 0;
  for (const ch of String(seed)) t = Math.imul(t ^ ch.charCodeAt(0), 2654435761);
  return () => ((t = Math.imul(t ^ (t >>> 15), 2246822507) ^ Math.imul(t ^ (t >>> 13), 3266489909)) >>> 0) / 4294967296;
}
function art(kind, seed, w = 800, h = 560) {
  const r = rng(kind + seed);
  const st = `fill="none" stroke="${CREAM}" stroke-width="${Math.max(2, w / 220)}" stroke-linecap="round" stroke-linejoin="round"`;
  const cx = w / 2;
  const cy = h / 2;
  const m = Math.min(w, h);
  let b = "";
  const grid = () => {
    let g = "";
    for (let x = w / 12; x < w; x += w / 12) g += `<path d="M${x} 0V${h}" stroke="${CREAM}" stroke-opacity=".12"/>`;
    for (let y = h / 8; y < h; y += h / 8) g += `<path d="M0 ${y}H${w}" stroke="${CREAM}" stroke-opacity=".12"/>`;
    return g;
  };
  b += grid();
  if (kind === "logo") {
    const R = m * (0.22 + r() * 0.06);
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" ${st}/><circle cx="${cx}" cy="${cy}" r="${R * 0.62}" fill="${CREAM}"/>`;
    b += `<path d="M${cx - R * 0.3} ${cy + R * 0.25}L${cx} ${cy - R * 0.35}L${cx + R * 0.3} ${cy + R * 0.25}" fill="none" stroke="${RED}" stroke-width="${m / 40}" stroke-linecap="round" stroke-linejoin="round"/>`;
    b += `<path d="M${cx - R * 1.9} ${cy + R * 1.45}H${cx + R * 1.9}" ${st}/>`;
  } else if (kind === "poster") {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) b += `<rect x="${w * 0.12}" y="${h * (0.14 + i * 0.1)}" width="${w * (0.3 + r() * 0.45)}" height="${h * 0.05}" fill="${CREAM}"/>`;
    b += `<circle cx="${w * (0.6 + r() * 0.15)}" cy="${h * 0.68}" r="${m * (0.2 + r() * 0.08)}" fill="${CREAM}"/><circle cx="${w * 0.3}" cy="${h * 0.76}" r="${m * 0.1}" ${st}/>`;
  } else if (kind === "merch") {
    const s = m * 0.36;
    b += `<path d="M${cx - s * 0.45} ${cy - s * 0.9}L${cx - s} ${cy - s * 0.6}L${cx - s * 1.1} ${cy - s * 0.1}L${cx - s * 0.7} ${cy}L${cx - s * 0.7} ${cy + s}L${cx + s * 0.7} ${cy + s}L${cx + s * 0.7} ${cy}L${cx + s * 1.1} ${cy - s * 0.1}L${cx + s} ${cy - s * 0.6}L${cx + s * 0.45} ${cy - s * 0.9}Q${cx} ${cy - s * 0.6} ${cx - s * 0.45} ${cy - s * 0.9}Z" ${st}/>`;
    b += `<circle cx="${cx}" cy="${cy + s * 0.2}" r="${s * 0.26}" fill="${CREAM}"/>`;
  } else if (kind === "music") {
    const R = m * 0.36;
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${DEEP}" stroke="${CREAM}" stroke-width="${m / 160}"/>`;
    for (let i = 1; i < 7; i++) b += `<circle cx="${cx}" cy="${cy}" r="${R * (0.4 + i * 0.085)}" fill="none" stroke="${CREAM}" stroke-opacity=".35"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="${R * 0.3}" fill="${CREAM}"/><circle cx="${cx}" cy="${cy}" r="${R * 0.04}" fill="${RED}"/>`;
  } else if (kind === "video") {
    b += `<rect x="${w * 0.14}" y="${h * 0.2}" width="${w * 0.72}" height="${h * 0.6}" rx="${m * 0.03}" ${st}/>`;
    for (let x = w * 0.18; x < w * 0.84; x += w * 0.06) b += `<rect x="${x}" y="${h * 0.23}" width="${w * 0.03}" height="${h * 0.04}" fill="${CREAM}"/><rect x="${x}" y="${h * 0.73}" width="${w * 0.03}" height="${h * 0.04}" fill="${CREAM}"/>`;
    b += `<path d="M${cx - m * 0.08} ${cy - m * 0.11}L${cx + m * 0.12} ${cy}L${cx - m * 0.08} ${cy + m * 0.11}Z" fill="${CREAM}"/>`;
  } else {
    b += `<rect x="${w * 0.16}" y="${h * 0.18}" width="${w * 0.33}" height="${h * 0.64}" ${st}/><rect x="${w * 0.51}" y="${h * 0.18}" width="${w * 0.33}" height="${h * 0.64}" ${st}/>`;
    for (let i = 0; i < 6; i++) b += `<path d="M${w * 0.21} ${h * (0.3 + i * 0.07)}H${w * (0.3 + r() * 0.14)}" ${st}/>`;
    b += `<circle cx="${w * 0.675}" cy="${h * 0.42}" r="${m * 0.12}" fill="${CREAM}"/>`;
  }
  return svgUri(b, w, h, r() > 0.7 ? DEEP : RED);
}
function portrait() {
  const b = `<circle cx="200" cy="190" r="78" fill="none" stroke="${CREAM}" stroke-width="5"/><path d="M70 500C78 380 140 312 200 312S322 380 330 500" fill="none" stroke="${CREAM}" stroke-width="5"/><path d="M168 186h.1M232 186h.1" stroke="${CREAM}" stroke-width="10" stroke-linecap="round"/><path d="M176 226Q200 244 224 226" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"/>`;
  return svgUri(b, 400, 500);
}
const SIGNATURE_PATH = "M8 52C20 18 34 10 38 26S26 64 44 50 60 14 66 30 60 56 76 44 94 22 102 34 98 54 116 44 132 30 140 40 136 54 152 46 176 34 184 38";
const imageOf = (src, kind, seed, w, h) => (src && String(src).trim() ? src : art(kind, seed, w, h));
const coverOf = (p) => imageOf(p.coverImage, p.category, p.id + "cover", 800, 560);

// ---------------------------------------------------------------------------
// Screen-space helpers.
// ---------------------------------------------------------------------------
function toView(clientX, clientY) {
  const r = svg.getBoundingClientRect();
  return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H];
}
function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function hull(points) {
  const s = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const p of s) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const proj = (p) => iso(p, P);
// Floor-plane delta from a screen delta (affine, so any horizontal plane works).
const CAM = cameraOf(P);
function floorDelta(dsx, dsy) {
  const a = dsx / CAM.k;
  const b = dsy / (CAM.sinE * CAM.k);
  return [a * CAM.sinA + b * CAM.cosA, -a * CAM.cosA + b * CAM.sinA];
}

// Hit areas, from rest poses only (they never move with the parts).
// Each drawer's band is its cell on the front face (half the rails around it);
// edge rows and columns reach out to the cabinet's own edges.
const CAB = GEO.cab;
const HIT = CELLS.map((cell, i) => {
  const g = 1.2;
  const yL = cell.c === 0 ? CAB.y + CAB.d + 1 : cell.y1 + g; // left on screen
  const yR = cell.c === COLS - 1 ? CAB.y - 1 : cell.y0 - g;
  const z0 = cell.r === GEO.rows - 1 ? 0 : cell.z0 - g;
  const z1 = cell.r === 0 ? CAB.top + 2 : cell.z1 + g;
  const x = CAB.face;
  const pts = [[x, yL, z0], [x, yR, z0], [x, yR, z1], [x, yL, z1]];
  if (cell.c === 0) pts.push([0, yL, z0], [0, yL, z1]);
  if (cell.r === 0) pts.push([0, yL, z1], [0, yR, z1]);
  return { band: hull(pts.map(proj)), channel: GEO.drawers[i].channel };
});
const cardDy = (i) => clamp(CELLS[i].yc - GEO.card.yc, GEO.card.dy[0], GEO.card.dy[1]);
function cardPoly(i) {
  const c = GEO.card;
  const y0 = c.yc + cardDy(i) - c.w / 2;
  const z0 = c.z0 + c.rise;
  return hull([[c.x, y0, z0], [c.x, y0 + c.w, z0], [c.x, y0 + c.w, z0 + c.h + 7], [c.x, y0, z0 + c.h + 7]].map(proj));
}

// ---------------------------------------------------------------------------
// Springs.
// ---------------------------------------------------------------------------
function spring(s, target, dt, k, c, calm) {
  if (calm) {
    s.x = target;
    s.v = 0;
    return false;
  }
  const steps = 4;
  const h = dt / steps;
  for (let n = 0; n < steps; n++) {
    const a = k * (target - s.x) - c * s.v;
    s.v += a * h;
    s.x += s.v * h;
  }
  if (Math.abs(target - s.x) < 5e-4 && Math.abs(s.v) < 5e-4) {
    s.x = target;
    s.v = 0;
    return false;
  }
  return true;
}
const follow = (x, target, dt, tau, calm) => (calm ? target : x + (target - x) * (1 - Math.exp(-dt / tau)));

// ---------------------------------------------------------------------------
// Drawers: hover answers with a falloff by distance and a stagger by distance.
// ---------------------------------------------------------------------------
const REST_I = 5;
const REST_AJAR = 0.13;
const FALLOFF = [1, 0.18, 0.05];
const gridDist = (a, b) => Math.abs(CELLS[a].r - CELLS[b].r) + Math.abs(CELLS[a].c - CELLS[b].c);
const STEP_MS = 45;
const drawerEls = $$("[data-drawer]").sort((a, b) => a.dataset.drawer - b.dataset.drawer);
const frontEls = $$("[data-front]").sort((a, b) => a.dataset.front - b.dataset.front);
const D = Array.from({ length: N }, (_, i) => ({ x: i === REST_I ? REST_AJAR : 0, v: 0, t: i === REST_I ? REST_AJAR : 0, pending: null, drawn: -1 }));
let hovered = null; // drawer index under the pointer / focus
let openIndex = null; // drawer whose project page is open
let clock = 0;

function setDrawerTargets(active, from = active) {
  const now = clock;
  for (let i = 0; i < N; i++) {
    let value;
    if (openIndex !== null) value = i === openIndex ? 1 : 0;
    else if (active === null) value = i === REST_I ? REST_AJAR : 0;
    else value = FALLOFF[gridDist(i, active)] ?? 0;
    const anchor = from ?? REST_I;
    const delay = still.matches ? 0 : (gridDist(i, anchor) * STEP_MS) / 1000;
    if (value === D[i].t && !D[i].pending) continue;
    D[i].pending = { value, at: now + delay };
  }
  wake();
}

// Exactly one lit accent: a drawer front, or the screen.
const screenEl = $(".screen");
const computerEl = $("[data-part=computer]");
let litKey = "";
function setLit(kind, index) {
  const key = `${kind}:${index}`;
  if (key === litKey) return;
  litKey = key;
  frontEls.forEach((el, i) => el.classList.toggle("is-lit", kind === "drawer" && i === index));
  screenEl.classList.toggle("is-lit", kind === "screen");
  for (const el of $$("[data-part=chair]")) el.toggleAttribute("data-lit", kind === "chair");
}

// ---------------------------------------------------------------------------
// Preview card.
// ---------------------------------------------------------------------------
const cardEl = $("[data-part=card]");
const cardImg = $("[data-card=img]");
const cardTitle = $("[data-card=title]");
const cardMeta = $("[data-card=meta]");
const cardNum = $("[data-card=num]");
const CARD = { s: { x: 0, v: 0 }, z: { x: 0, v: 0 }, ts: 0, tz: 0, shown: -1 };
const TITLE_MAX = GEO.card.w - 14;
function fillCard(i) {
  if (CARD.shown === i) return;
  CARD.shown = i;
  const p = PROJECTS[i] || { title: `Project ${pad2(i + 1)}`, year: "", category: "" };
  cardImg.setAttribute("href", coverOf(p));
  cardTitle.textContent = p.title;
  cardTitle.removeAttribute("textLength");
  cardTitle.removeAttribute("lengthAdjust");
  try {
    if (cardTitle.getComputedTextLength() > TITLE_MAX) {
      cardTitle.setAttribute("textLength", String(TITLE_MAX));
      cardTitle.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  } catch {}
  cardMeta.textContent = `${p.year} · ${p.category}`.toUpperCase();
  cardNum.textContent = pad2(i + 1);
}

// ---------------------------------------------------------------------------
// Chair: built here from kit solids so it can turn and its casters swivel.
// ---------------------------------------------------------------------------
const chairLowEl = $("[data-item=chairLow]");
const chairHighEl = $("[data-item=chairHigh]");
chairLowEl.setAttribute("tabindex", "0");
chairLowEl.setAttribute("role", "button");
chairLowEl.setAttribute("aria-label", "Shell chair. Drag it, or use the arrow keys to slide it across the rug; R turns it.");
const CH = {
  x: GEO.chairHome[0], y: GEO.chairHome[1], vx: 0, vy: 0,
  tx: GEO.chairHome[0], ty: GEO.chairHome[1],
  th: { x: 0, v: 0 }, tth: 0,
  dragging: false, moved: false,
};
const solid = (paths, o) => solidSvg(paths, o);
const rot = ([a, b], t) => [a * Math.cos(t) - b * Math.sin(t), a * Math.sin(t) + b * Math.cos(t)];
const ringR = (plan, t, steps = 3) => roundedPlan(plan, steps).map((p) => rot(p, t));
/** A tapered round leg: the hull of its foot and head circles. */
function legSvg(cx, cy, r0, r1, z0, z1) {
  const ring = (r, z) => Array.from({ length: 18 }, (_, n) => iso([cx + r * Math.cos((n / 18) * Math.PI * 2), cy + r * Math.sin((n / 18) * Math.PI * 2), z], P));
  const d = pathOf(hull([...ring(r0, z0), ...ring(r1, z1)]), true);
  return `<g class="iso-solid"><path class="iso-fill" d="${d}"/><path class="iso-shade" data-shade="2" d="${d}"/><path class="iso-line iso-edge" data-tone="mid" d="${d}"/></g>`;
}
const SEAT_Z = 42;
function chairMarkup(theta) {
  const low = [];
  const high = [];
  low.push(`<path class="iso-halo" d="${haloOf({ x: -22, y: -22, w: 44, d: 44, r: 22 }, 0, 3, P)}"/>`);
  // Four slim legs, splayed a touch, far to near.
  const legs = [[-15, -14], [15, -14], [-15, 13], [15, 13]].map(([a, b]) => {
    const head = rot([a, b], theta);
    const foot = rot([a * 1.14, b * 1.14], theta);
    return { depth: depthOf([head[0], head[1], 0], P), head, foot };
  }).sort((a, b) => a.depth - b.depth);
  for (const l of legs) {
    // A splayed leg is the hull of a small foot circle and a larger head circle offset from it.
    const ring = (c, r, z) => Array.from({ length: 18 }, (_, n) => iso([c[0] + r * Math.cos((n / 18) * Math.PI * 2), c[1] + r * Math.sin((n / 18) * Math.PI * 2), z], P));
    const d = pathOf(hull([...ring(l.foot, 1.4, 0), ...ring(l.head, 2.2, SEAT_Z)]), true);
    low.push(`<g class="iso-solid"><path class="iso-fill" d="${d}"/><path class="iso-shade" data-shade="2" d="${d}"/><path class="iso-line iso-edge" data-tone="mid" d="${d}"/></g>`);
  }
  // The shell: a soft seat with a lip.
  const seat = ringR({ x: -20, y: -19, w: 40, d: 38, r: 10 }, theta, 8);
  low.push(`<g class="cushion">${solid(extrude(seat, SEAT_Z, 4.2, P, { bevel: 1.4 }), { tone: "hi", crease: "lo", inner: lineSvg(ringSeam(seat, SEAT_Z + 1.6, P), { tone: "faint" }) })}</g>`);
  // The back of the shell rises from the seat's rear edge.
  const back = ringR({ x: -19, y: 14.6, w: 38, d: 4.4, r: 2.2 }, theta, 6);
  const lip = [[-15, SEAT_Z + 8], [15, SEAT_Z + 8], [15, SEAT_Z + 33], [-15, SEAT_Z + 33]].map(([x, z]) => {
    const [px, py] = rot([x, 19], theta);
    return iso([px, py, z], P);
  });
  high.push(`<g class="cushion">${solid(extrude(back, SEAT_Z + 3, 35, P, { bevel: 1.4 }), { tone: "hi", crease: "lo", inner: lineSvg(pathOf(lip, true), { tone: "faint" }) })}</g>`);
  return { low: low.join(""), high: high.join("") };
}
// Footprint boxes of the chair at (x, y, theta), for collisions and depth.
function chairBoxes(x, y, theta) {
  const ext = (plan) => {
    const pts = roundedPlan(plan, 1).map((p) => rot(p, theta));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  };
  const s = ext({ x: -21, y: -20, w: 42, d: 40, r: 0 });
  const b = ext({ x: -19, y: 14.6, w: 38, d: 4.4, r: 0 });
  return {
    low: { x0: x + s[0], x1: x + s[1], y0: y + s[2], y1: y + s[3], z0: 0, z1: SEAT_Z + 4.2 },
    high: { x0: x + b[0], x1: x + b[1], y0: y + b[2], y1: y + b[3], z0: SEAT_Z + 3, z1: SEAT_Z + 38 },
  };
}
const OBST = GEO.obstacles;
const overlap3 = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0 && a.z0 < b.z1 && a.z1 > b.z0;
// The chair stays on the round rug: its centre within the rug, less its own reach.
const RUG = GEO.rug;
const REACH = RUG.r - 22;
const onRug = (x, y) => Math.hypot(x - RUG.cx, y - RUG.cy) <= REACH;
function chairValid(x, y, theta) {
  if (!onRug(x, y)) return false;
  const b = chairBoxes(x, y, theta);
  return !OBST.some((o) => overlap3(b.low, o) || overlap3(b.high, o));
}
// Move the chair's target toward (gx, gy) in small steps, sliding along anything it meets.
function steerChair(gx, gy) {
  const dist = Math.hypot(gx - RUG.cx, gy - RUG.cy);
  if (dist > REACH) {
    gx = RUG.cx + ((gx - RUG.cx) / dist) * REACH;
    gy = RUG.cy + ((gy - RUG.cy) / dist) * REACH;
  }
  const th = Math.max(Math.abs(CH.tth), Math.abs(CH.th.x)) * Math.sign(CH.tth || CH.th.x || 1);
  let dx = gx - CH.tx;
  let dy = gy - CH.ty;
  const steps = Math.ceil(Math.hypot(dx, dy) / 1.2);
  for (let n = 0; n < steps; n++) {
    const sx = dx / (steps - n);
    const sy = dy / (steps - n);
    if (chairValid(CH.tx + sx, CH.ty, th)) CH.tx += sx;
    if (chairValid(CH.tx, CH.ty + sy, th)) CH.ty += sy;
    dx = gx - CH.tx;
    dy = gy - CH.ty;
  }
}

// Painter's order for the desk, bin and chair: a topological sort over
// separating planes (above wins, nearer in y wins, nearer in x wins).
const itemEls = $$("[data-item]", $("[data-part=items]"));
const BASE = itemEls.map((el) => el.dataset.item);
const staticBox = Object.fromEntries(OBST.map((o) => [o.id, o]));
function boxOf(id) {
  if (id === "chairLow" || id === "chairHigh") {
    const b = chairBoxes(CH.x, CH.y, CH.th.x);
    return id === "chairLow" ? b.low : b.high;
  }
  return staticBox[id === "top" ? "top" : id];
}
function screenBox(b) {
  const pts = [];
  for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) pts.push(proj([x, y, z]));
  return [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
}
function drawnBefore(a, b) {
  if (b.z0 >= a.z1) return true;
  if (a.z0 >= b.z1) return false;
  if (b.y0 >= a.y1) return true;
  if (a.y0 >= b.y1) return false;
  if (b.x0 >= a.x1) return true;
  if (a.x0 >= b.x1) return false;
  return null;
}
let order = BASE.join(",");
function sortItems() {
  const boxes = BASE.map(boxOf);
  const sb = boxes.map(screenBox);
  const n = BASE.length;
  const edges = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const [a, b] = [sb[i], sb[j]];
      if (a[1] <= b[0] || b[1] <= a[0] || a[3] <= b[2] || b[3] <= a[2]) continue;
      const r = drawnBefore(boxes[i], boxes[j]);
      if (r === null) continue;
      const [from, to] = r ? [i, j] : [j, i];
      edges[from].push(to);
      indeg[to]++;
    }
  }
  const out = [];
  const ready = [];
  for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
  while (ready.length) {
    ready.sort((a, b) => a - b);
    const i = ready.shift();
    out.push(i);
    for (const j of edges[i]) if (!--indeg[j]) ready.push(j);
  }
  if (out.length !== n) return;
  const next = out.map((i) => BASE[i]).join(",");
  if (next === order) return;
  order = next;
  const host = $("[data-part=items]");
  const frag = document.createDocumentFragment();
  for (const i of out) frag.append(itemEls[i]);
  host.append(frag);
}

let chairDrawn = NaN;
function drawChair(force = false) {
  const thKey = Math.round(CH.th.x * 400) / 400;
  if (force || thKey !== chairDrawn) {
    const m = chairMarkup(CH.th.x);
    chairLowEl.innerHTML = m.low;
    chairHighEl.innerHTML = m.high;
    chairDrawn = thKey;
  }
  const t = translateAlong(P, [CH.x, CH.y, 0]);
  chairLowEl.setAttribute("transform", t);
  chairHighEl.setAttribute("transform", t);
  sortItems();
}

// ---------------------------------------------------------------------------
// Readout and announcements.
// ---------------------------------------------------------------------------
let lastRead = "";
function say(text) {
  if (text !== lastRead) readout.textContent = lastRead = text;
}
function announce(text) {
  status.textContent = text;
}
function readoutNow() {
  if (openIndex !== null) {
    const p = PROJECTS[openIndex];
    return `drawer ${pad2(openIndex + 1)} / ${pad2(N)} · open`;
  }
  if (badgeOpen) return "computer · about this archive";
  if (CH.dragging || chairFocus) {
    // Gap between the seat's front edge and the desk's front edge (1 unit = 1 cm).
    const front = Math.min(...roundedPlan({ x: -19, y: -19, w: 38, d: 36, r: 6 }, 2).map((p) => rot(p, CH.th.x)[1]));
    const gap = (CH.y + front - GEO.deskFront) / 100;
    return gap >= 0 ? `chair · ${gap.toFixed(2)} m from desk` : `chair · tucked ${(-gap).toFixed(2)} m under desk`;
  }
  if (hovered !== null) {
    const p = PROJECTS[hovered] || {};
    return hasProject(hovered) ? `drawer ${pad2(hovered + 1)} / ${pad2(N)} · ${p.title} · ${p.year}` : `drawer ${pad2(hovered + 1)} / ${pad2(N)} · empty`;
  }
  if (hoverComputer) return "computer · about this archive";
  if (touring) return `idle · drawer ${pad2(tourAt + 1)} / ${pad2(N)}`;
  return `${N} drawers · rest`;
}

// ---------------------------------------------------------------------------
// Loop.
// ---------------------------------------------------------------------------
let frame = 0;
let last = 0;
let visible = true;
let lift = { t: 0, target: 0, v: 0, index: null, done: null };
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  const calm = still.matches;
  let busy = false;
  // Tour.
  if (touring) {
    busy = true;
    tourClock += dt;
    if (tourClock >= tourNext) stepTour();
  }
  // Drawers.
  for (let i = 0; i < N; i++) {
    const d = D[i];
    if (d.pending && clock >= d.pending.at) {
      d.t = d.pending.value;
      d.pending = null;
    }
    if (d.pending) busy = true;
    if (spring(d, d.t, dt, 175, 21, calm)) busy = true;
    if (Math.abs(d.x - d.drawn) > 1e-4) {
      d.drawn = d.x;
      if (d.x === 0) drawerEls[i].removeAttribute("transform");
      else drawerEls[i].setAttribute("transform", translateAlong(P, [d.x * GEO.slide, 0, 0]));
    }
  }
  // Card.
  const sMoving = spring(CARD.s, CARD.ts, dt, 150, 20, calm);
  const zMoving = spring(CARD.z, CARD.tz, dt, 130, 21, calm);
  if (sMoving || zMoving) busy = true;
  cardEl.setAttribute("transform", translateAlong(P, [0, CARD.z.x, CARD.s.x * GEO.card.rise]));
  // Chair: a spring toward the steered target; turn spring; casters trail the motion.
  const px = CH.x;
  const py = CH.y;
  const sx = { x: CH.x, v: CH.vx };
  const sy = { x: CH.y, v: CH.vy };
  const mx = spring(sx, CH.tx, dt, 240, 24, calm);
  const my = spring(sy, CH.ty, dt, 240, 24, calm);
  const th = Math.abs(CH.th.x) > Math.abs(CH.tth) ? CH.th.x : CH.tth;
  if (chairValid(sx.x, CH.y, th)) CH.x = sx.x;
  else sx.v = 0;
  if (chairValid(CH.x, sy.x, th)) CH.y = sy.x;
  else sy.v = 0;
  CH.vx = sx.v;
  CH.vy = sy.v;
  const tm = spring(CH.th, CH.tth, dt, 120, 14, calm);
  const vx = (CH.x - px) / dt;
  const vy = (CH.y - py) / dt;
  const speed = Math.hypot(vx, vy);
  if (mx || my || tm || speed > 4) {
    busy = true;
    drawChair();
  }
  // Folder lift.
  if (lift.index !== null) {
    const moving = spring(lift, lift.target, dt, 150, 21, calm);
    placeLift();
    if (moving) busy = true;
    if (lift.done && Math.abs(lift.x - lift.target) < 0.03 && Math.abs(lift.v) < 0.25) {
      const fn = lift.done;
      lift.done = null;
      fn();
    }
  }
  say(readoutNow());
  frame = busy && visible ? requestAnimationFrame(tick) : 0;
}
function wake() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
document.addEventListener("visibilitychange", () => {
  visible = !document.hidden;
  if (visible) wake();
});
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting && !document.hidden;
  if (visible) wake();
}, { rootMargin: "120px 0px" }).observe(stage);

// ---------------------------------------------------------------------------
// Hover state.
// ---------------------------------------------------------------------------
let hoverComputer = false;
function choose(next) {
  if (openIndex !== null) return;
  if (next === hovered) return;
  const from = hovered ?? next;
  hovered = next;
  if (next !== null) {
    setDrawerTargets(next, next);
    if (hasProject(next)) {
      // Lowered behind the cabinet first if it has to change column far.
      fillCard(next);
      CARD.ts = 1;
      CARD.tz = cardDy(next);
    } else CARD.ts = 0;
    setLit("drawer", next);
  } else {
    setDrawerTargets(null, from);
    CARD.ts = 0;
    if (!hoverComputer && !badgeOpen) setLit("drawer", REST_I);
  }
  wake();
}
function hoverScreen(on) {
  if (on === hoverComputer) return;
  hoverComputer = on;
  screenEl.classList.toggle("blink", on || touring);
  if (on) {
    choose(null);
    setLit("screen");
  } else if (!badgeOpen && hovered === null) setLit("drawer", touring ? tourAt : REST_I);
  wake();
}

// Which drawer does this point choose? Rest bands first; the open drawer keeps
// its channel and its card (target pose), so nothing flickers as it moves.
function pickDrawer(pt) {
  for (let i = 0; i < N; i++) if (inPoly(pt, HIT[i].band)) return i;
  if (hovered !== null) {
    // The pulled drawer, its card and the gap between them stay one hover area,
    // so the pointer can travel from a drawer to its card without losing it.
    if (!HIT[hovered].reach) HIT[hovered].reach = hull([...HIT[hovered].channel, ...cardPoly(hovered)]);
    if (inPoly(pt, HIT[hovered].reach)) return hovered;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pointer.
// ---------------------------------------------------------------------------
let downAt = null;
function overChair(e) {
  return !!(e.target.closest && e.target.closest("[data-part=chair]"));
}
function overComputer(e) {
  return !!(e.target.closest && e.target.closest("[data-part=computer]"));
}
svg.addEventListener("pointermove", (e) => {
  if (busyOverlay()) return;
  idle();
  if (CH.dragging) return dragMove(e);
  if (e.pointerType !== "mouse") return;
  const pt = toView(e.clientX, e.clientY);
  const onChair = overChair(e);
  const i = onChair ? null : pickDrawer(pt);
  choose(i);
  hoverScreen(i === null && !onChair && overComputer(e));
});
svg.addEventListener("pointerleave", (e) => {
  if (CH.dragging || e.pointerType !== "mouse") return;
  choose(null);
  hoverScreen(false);
});
svg.addEventListener("pointerdown", (e) => {
  if (busyOverlay()) return;
  idle();
  downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (overChair(e)) {
    e.preventDefault();
    dragStart(e);
  }
});
svg.addEventListener("pointerup", (e) => {
  if (CH.dragging) return dragEnd(e);
  if (!downAt || busyOverlay()) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 8) return;
  const pt = toView(e.clientX, e.clientY);
  const i = pickDrawer(pt);
  if (i !== null) {
    if (e.pointerType !== "mouse" && hovered !== i) {
      choose(i); // first tap previews, second tap opens
      return;
    }
    openedByKey = false;
    openProject(i, drawerEls[i]);
    return;
  }
  if (overComputer(e)) {
    openBadge(computerEl);
    return;
  }
  if (e.pointerType !== "mouse") {
    choose(null);
    hoverScreen(false);
  }
});
svg.addEventListener("dblclick", (e) => {
  if (!overChair(e)) return;
  e.preventDefault();
  turnSeat();
});
function turnSeat() {
  const seq = [0, 0.38, -0.38];
  const at = seq.findIndex((v) => Math.abs(v - CH.tth) < 1e-3);
  const next = seq[(at + 1) % seq.length];
  if (chairValid(CH.tx, CH.ty, next)) CH.tth = next;
  wake();
}

// Chair drag: world-space on the floor plane.
let dragFrom = null;
function dragStart(e) {
  CH.dragging = true;
  CH.moved = false;
  choose(null);
  hoverScreen(false);
  const pt = toView(e.clientX, e.clientY);
  dragFrom = { pt, x: CH.tx, y: CH.ty, id: e.pointerId };
  try {
    svg.setPointerCapture(e.pointerId);
  } catch {}
  document.body.classList.add("dragging");
  setLit("chair");
  announce("Moving the chair.");
  wake();
}
function dragMove(e) {
  const pt = toView(e.clientX, e.clientY);
  const [dx, dy] = floorDelta(pt[0] - dragFrom.pt[0], pt[1] - dragFrom.pt[1]);
  if (Math.hypot(dx, dy) > 0.5) CH.moved = true;
  steerChair(dragFrom.x + dx, dragFrom.y + dy);
  wake();
}
function dragEnd(e) {
  CH.dragging = false;
  downAt = null;
  try {
    svg.releasePointerCapture(e.pointerId);
  } catch {}
  document.body.classList.remove("dragging");
  if (!chairFocus) setLit("drawer", REST_I);
  announce("Chair placed.");
  wake();
}
svg.addEventListener("pointercancel", (e) => {
  if (CH.dragging) dragEnd(e);
});

// ---------------------------------------------------------------------------
// Keyboard.
// ---------------------------------------------------------------------------
// Roving tabindex: one drawer is in the tab order (01 first), arrows move between them.
const rove = (i) => drawerEls.forEach((el, n) => el.setAttribute("tabindex", n === i ? "0" : "-1"));
rove(0);
drawerEls.forEach((el, i) => {
  el.addEventListener("focus", () => rove(i));
  el.setAttribute("aria-label", hasProject(i) ? `Drawer ${pad2(i + 1)} of ${pad2(N)}: ${PROJECTS[i].title}, ${PROJECTS[i].year}. Press Enter to open.` : `Drawer ${pad2(i + 1)} of ${pad2(N)}: empty.`);
  el.addEventListener("focus", () => {
    if (quietFocus) return;
    idle();
    hoverScreen(false);
    choose(i);
  });
  el.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[e.key];
    if (step) {
      e.preventDefault();
      const next = i + step;
      const sameRow = Math.abs(step) === 1 ? Math.floor(next / COLS) === Math.floor(i / COLS) : true;
      if (next >= 0 && next < N && sameRow) drawerEls[next].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      drawerEls[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      drawerEls[N - 1].focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openedByKey = true;
      openProject(i, el);
    } else if (e.key === "Escape") {
      el.blur();
    }
  });
  el.addEventListener("blur", () => {
    setTimeout(() => {
      if (!drawerEls.includes(document.activeElement) && openIndex === null) choose(null);
    }, 0);
  });
});
computerEl.addEventListener("focus", () => {
  idle();
  hoverScreen(true);
});
computerEl.addEventListener("blur", () => {
  if (!badgeOpen) hoverScreen(false);
});
computerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openBadge(computerEl);
  }
});
let chairFocus = false;
chairLowEl.addEventListener("focus", () => {
  chairFocus = true;
  idle();
  choose(null);
  hoverScreen(false);
  setLit("chair");
  say(readoutNow());
});
chairLowEl.addEventListener("blur", () => {
  chairFocus = false;
  if (!CH.dragging) setLit("drawer", REST_I);
  say(readoutNow());
});
chairLowEl.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 12 : 5;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[e.key]) {
    e.preventDefault();
    idle();
    steerChair(CH.tx + moves[e.key][0], CH.ty + moves[e.key][1]);
    wake();
  } else if (e.key === "r" || e.key === "R") {
    turnSeat();
  }
});

// ---------------------------------------------------------------------------
// Idle tour: after 6 s untouched, drawers breathe open one after another.
// ---------------------------------------------------------------------------
let touring = false;
let tourAt = 0;
let tourClock = 0;
let tourNext = 0;
let tourStep = -1;
let idleTimer = 0;
function idle() {
  if (touring) stopTour();
  clearTimeout(idleTimer);
  if (still.matches) return;
  idleTimer = setTimeout(startTour, 6000);
}
function startTour() {
  if (openIndex !== null || badgeOpen || CH.dragging || hovered !== null || hoverComputer || document.activeElement?.closest?.("[data-drawer],[data-part=computer]")) {
    idle();
    return;
  }
  touring = true;
  tourStep = -1;
  tourAt = REST_I;
  tourClock = 0;
  tourNext = 0;
  screenEl.classList.add("blink");
  wake();
}
const tourList = () => CELLS.map((c) => c.i).filter(hasProject);
function stepTour() {
  const list = tourList();
  const M = list.length || 1;
  tourStep = (tourStep + 1) % (M + 2);
  tourAt = list[tourStep] ?? REST_I;
  if (tourStep >= M) {
    // A breath between laps: everything home.
    for (let i = 0; i < N; i++) D[i].pending = { value: 0, at: clock };
    setLit("drawer", REST_I);
    CARD.ts = 0;
    tourNext = tourClock + 1.1;
    if (tourStep === M + 1) tourStep = -1;
    tourAt = REST_I;
    return;
  }
  for (let i = 0; i < N; i++) D[i].pending = { value: i === tourAt ? 0.26 : gridDist(i, tourAt) === 1 ? 0.04 : 0, at: clock + (i === tourAt ? 0 : 0.08) };
  setLit("drawer", tourAt);
  // The card peeks out beside the breathing drawer.
  fillCard(tourAt);
  CARD.ts = 0.4;
  CARD.tz = cardDy(tourAt);
  tourNext = tourClock + 1.05;
}
function stopTour() {
  touring = false;
  if (hovered === null) CARD.ts = 0;
  screenEl.classList.toggle("blink", hoverComputer);
  setDrawerTargets(hovered, hovered ?? REST_I);
  if (hovered === null && !hoverComputer && !badgeOpen) setLit("drawer", REST_I);
}

// ---------------------------------------------------------------------------
// Project page: the front folder lifts out of the drawer, its page curls
// forward and fills the screen; closing plays it all backwards.
// ---------------------------------------------------------------------------
const liftLayer = $("[data-part=lift]");
const flyHost = $("[data-fly]");
const projectEl = $("[data-project]");
const pageEl = $("[data-page]");
const closeBtn = $("[data-close]");
let liftEl = null;
let liftShadow = null;
let returnFocus = null;
let openedByKey = false;
let quietFocus = false;
let transitioning = false;
let phase = "rest";
const busyOverlay = () => transitioning || openIndex !== null || badgeOpen;

function pageMarkup(p, i) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const gallery = (p.gallery?.length ? p.gallery : ["", "", "", ""]).map((src, n) => `<figure><img alt="${esc(p.title)}, image ${n + 1}" src="${imageOf(src, p.category, p.id + "g" + n, 800, 600)}"></figure>`).join("");
  const process = (p.process?.length ? p.process : ["", "", ""]).map((src, n) => `<div><figure><img alt="${esc(p.title)}, process ${n + 1}" src="${imageOf(src, ["design", "poster", "logo"][n % 3], p.id + "p" + n, 600, 600)}"></figure><div class="pp-cap">process ${pad2(n + 1)}</div></div>`).join("");
  return `
    <p class="pp-kicker"><span>drawer ${pad2(i + 1)} / ${pad2(N)}</span><span>${esc(p.category)}</span><span>${esc(p.year)}</span></p>
    <div class="pp-hero"><img alt="${esc(p.title)} cover" src="${coverOf(p)}"></div>
    <h1 class="pp-title" id="project-title">${esc(p.title)}</h1>
    <dl class="pp-meta">
      <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
      <div><dt>Tools</dt><dd>${esc(p.tools)}</dd></div>
      <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
      <div><dt>Category</dt><dd>${esc(p.category)}</dd></div>
    </dl>
    <p class="pp-desc">${esc(p.description)}</p>
    <h2 class="pp-h">Gallery</h2>
    <div class="pp-grid">${gallery}</div>
    <h2 class="pp-h">Process</h2>
    <div class="pp-process">${process}</div>
    <nav class="pp-nav" aria-label="Other drawers">
      <button type="button" data-step="-1">← drawer ${pad2(((i - 1 + PROJECTS.length) % PROJECTS.length) + 1)}</button>
      <button type="button" data-step="1">drawer ${pad2(((i + 1) % PROJECTS.length) + 1)} →</button>
    </nav>`;
}

// Affine matrix that lifts and tilts the folder plane (y = fy) about its foot.
const AX = axisVector(P, [1, 0, 0]);
const AY = axisVector(P, [0, 1, 0]);
const AZ = axisVector(P, [0, 0, 1]);
function liftAffine(i, t, offX) {
  const z0 = CELLS[i].z0 + 1.8;
  return tipAffine(proj([GEO.tabX + offX, 0, z0]), 0.42 * t, 52 * t, offX);
}
// A plane x = const tipped by phi about a line along y through C0: its basis (ey, ez)
// becomes (ey, sinφ·ex + cosφ·ez); then raised by dz and moved by offX along x.
function tipAffine(C0, phi, dz = 0, offX = 0) {
  const ez2 = [Math.sin(phi) * AX[0] + Math.cos(phi) * AZ[0], Math.sin(phi) * AX[1] + Math.cos(phi) * AZ[1]];
  const det = AY[0] * AZ[1] - AZ[0] * AY[1];
  const inv = [AZ[1] / det, -AY[1] / det, -AZ[0] / det, AY[0] / det];
  const a = AY[0] * inv[0] + ez2[0] * inv[1];
  const b = AY[1] * inv[0] + ez2[1] * inv[1];
  const c = AY[0] * inv[2] + ez2[0] * inv[3];
  const d = AY[1] * inv[2] + ez2[1] * inv[3];
  const [ox, oy] = axisVector(P, [offX, 0, 0]);
  const e = C0[0] - (a * C0[0] + c * C0[1]) + AZ[0] * dz + ox;
  const f = C0[1] - (b * C0[0] + d * C0[1]) + AZ[1] * dz + oy;
  return [a, b, c, d, e, f];
}
const applyAff = ([a, b, c, d, e, f], [x, y]) => [a * x + c * y + e, b * x + d * y + f];
function placeLift() {
  if (!liftEl) return;
  const i = lift.index;
  const off = D[i].x * GEO.slide;
  const t = clamp(lift.x ?? 0, 0, 1.2);
  liftEl.setAttribute("transform", `matrix(${liftAffine(i, t, off).join(" ")})`);
  liftShadow.setAttribute("opacity", String(clamp(t, 0, 1) * 0.55));
  const c = proj([GEO.tabX + off, CELLS[i].yc, CELLS[i].z1 - 10]);
  const s = 1 + 0.6 * clamp(t, 0, 1);
  liftShadow.setAttribute("transform", `translate(${c[0]} ${c[1]}) scale(${s}) translate(${-c[0]} ${-c[1]})`);
}
function raiseFolder(i) {
  const node = $(`[data-front-folder="${i}"]`);
  liftEl = node;
  lift.home = node.parentNode;
  lift.next = node.nextSibling;
  const cell = CELLS[i];
  const fx = GEO.tabX;
  const zt = cell.z1 - 10;
  liftShadow = document.createElementNS(NS, "path");
  liftShadow.setAttribute("class", "iso-halo");
  liftShadow.setAttribute("d", pathOf([[fx - 3, cell.y0 + 5, zt], [fx + 4, cell.y0 + 5, zt], [fx + 4, cell.y1 - 5, zt], [fx - 3, cell.y1 - 5, zt]].map(proj), true));
  liftShadow.setAttribute("opacity", "0");
  // The shadow falls on the cards behind, so it lives inside the drawer.
  drawerEls[i].insertBefore(liftShadow, node);
  const clipped = node.querySelector("[data-tab-clip]");
  lift.clip = clipped.getAttribute("clip-path");
  clipped.removeAttribute("clip-path");
  // The card being lifted is now the one lit thing.
  node.classList.add("is-lit");
  setLit("card", i);
  liftLayer.append(node);
  lift.index = i;
  lift.x = 0;
  lift.v = 0;
}
function lowerFolder() {
  if (!liftEl) return;
  lift.home.insertBefore(liftEl, lift.next);
  liftEl.removeAttribute("transform");
  liftEl.classList.remove("is-lit");
  liftEl.style.opacity = "";
  liftEl.querySelector("[data-tab-clip]").setAttribute("clip-path", lift.clip);
  liftShadow.remove();
  liftEl = null;
  liftShadow = null;
  lift.index = null;
}
function waitLift(target) {
  return new Promise((resolve) => {
    lift.target = target;
    lift.done = resolve;
    wake();
  });
}
const waitDrawer = (i, value) =>
  new Promise((resolve) => {
    const check = () => (Math.abs(D[i].x - value) < 0.03 && !D[i].pending ? resolve() : requestAnimationFrame(check));
    wake();
    check();
  });

// The flight: one sheet starts exactly on the lifted card (its three corners on
// screen), turns toward the reader and grows into the page; the room sinks back.
const scrollbarW = (() => {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;top:-999px;width:100px;height:100px;overflow-y:scroll";
  document.body.append(probe);
  const w = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return w;
})();
function cardCorners(i) {
  const cell = CELLS[i];
  const tz0 = cell.z0 + 1.8;
  const tz1 = cell.z1 - 2.6;
  const aff = liftAffine(i, clamp(lift.x ?? 1, 0, 1.2), D[i].x * GEO.slide);
  const m = svg.getScreenCTM();
  const toClient = (pt) => {
    const [x, y] = applyAff(aff, pt);
    return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  };
  // Left on screen is the larger y on a +x face.
  return {
    tl: toClient(proj([GEO.tabX, cell.y1 - 5, tz1])),
    tr: toClient(proj([GEO.tabX, cell.y0 + 5, tz1])),
    bl: toClient(proj([GEO.tabX, cell.y1 - 5, tz0])),
  };
}
function buildFly(markup, i) {
  flyHost.innerHTML = "";
  const sheet = document.createElement("div");
  sheet.className = "fly-card";
  sheet.innerHTML = `<div class="fly-page sheet-copy" style="padding-right:${scrollbarW}px"><div class="project-page">${markup}</div></div><div class="fly-face"><span>${pad2(i + 1)}</span></div><div class="fly-sheen"></div>`;
  flyHost.append(sheet);
  return sheet;
}
function flight(sheet, i, forward) {
  const vw = innerWidth;
  const vh = innerHeight;
  const { tl, tr, bl } = cardCorners(i);
  const from = `matrix(${(tr[0] - tl[0]) / vw}, ${(tr[1] - tl[1]) / vw}, ${(bl[0] - tl[0]) / vh}, ${(bl[1] - tl[1]) / vh}, ${tl[0]}, ${tl[1]})`;
  const mid = `translate(${vw * 0.17}px, ${vh * 0.1}px) scale(0.64) rotateX(7deg) rotateZ(-0.8deg)`;
  const opts = { duration: 980, easing: "cubic-bezier(.62,0,.2,1)", fill: "both", direction: forward ? "normal" : "reverse" };
  const room = $("[data-figure]");
  const anims = [
    sheet.animate([{ transform: from, offset: 0 }, { transform: mid, offset: 0.52 }, { transform: "translate(0px, 0px) scale(1)", offset: 1 }], opts),
    sheet.animate([{ boxShadow: "0 1px 2px #4a0c1c00" }, { boxShadow: "0 50px 90px -30px #4a0c1c99", offset: 0.55 }, { boxShadow: "0 0 0 #4a0c1c00" }], opts),
    sheet.querySelector(".fly-face").animate([{ opacity: 1 }, { opacity: 1, offset: 0.18 }, { opacity: 0, offset: 0.48 }, { opacity: 0 }], opts),
    sheet.querySelector(".fly-page").animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1, offset: 0.62 }, { opacity: 1 }], opts),
    sheet.querySelector(".fly-sheen").animate([{ transform: "translateX(-60%)", opacity: 0 }, { opacity: 0.6, offset: 0.45 }, { transform: "translateX(60%)", opacity: 0 }], opts),
    room.animate([{ transform: "scale(1)", opacity: 1, filter: "blur(0px)" }, { transform: "scale(0.95)", opacity: 0.35, filter: "blur(2px)" }], { ...opts, easing: "cubic-bezier(.4,0,.2,1)" }),
  ];
  return Promise.all(anims.map((a) => a.finished)).then(() => anims);
}
let roomAnims = [];
async function openProject(i, from) {
  if (transitioning || openIndex !== null || badgeOpen) return;
  const p = PROJECTS[i];
  if (!p) {
    announce(`Drawer ${pad2(i + 1)} is empty.`);
    return;
  }
  transitioning = true;
  if (touring) stopTour();
  clearTimeout(idleTimer);
  returnFocus = from || drawerEls[i];
  hovered = i;
  openIndex = i;
  setLit("drawer", i);
  CARD.ts = 0;
  setDrawerTargets(i, i);
  announce(`Opening drawer ${pad2(i + 1)}, ${p.title}.`);
  const markup = pageMarkup(p, i);
  pageEl.innerHTML = markup;
  document.body.classList.add("locked");
  if (still.matches) {
    showProject(true);
    transitioning = false;
    return;
  }
  phase = "drawer";
  await waitDrawer(i, 1);
  raiseFolder(i);
  phase = "lift";
  await waitLift(1);
  const sheet = buildFly(markup, i);
  liftEl.style.opacity = "0";
  phase = "fly";
  roomAnims = await flight(sheet, i, true);
  phase = "open";
  showProject(false);
  flyHost.innerHTML = "";
  transitioning = false;
}
function showProject(fade) {
  projectEl.hidden = false;
  projectEl.scrollTop = 0;
  projectEl.classList.remove("settled");
  requestAnimationFrame(() => projectEl.classList.add("settled"));
  if (fade) requestAnimationFrame(() => projectEl.classList.add("show"));
  else {
    projectEl.style.transition = "none";
    projectEl.classList.add("show");
    projectEl.offsetHeight;
    projectEl.style.transition = "";
  }
  closeBtn.focus({ preventScroll: true });
  say(readoutNow());
}
async function closeProject() {
  if (transitioning || openIndex === null) return;
  transitioning = true;
  const i = openIndex;
  const markup = pageEl.innerHTML;
  if (still.matches || !liftEl) {
    projectEl.classList.remove("show");
    await new Promise((r) => setTimeout(r, still.matches ? 0 : 280));
    projectEl.hidden = true;
    finishClose(i);
    return;
  }
  const sheet = buildFly(markup, i);
  projectEl.hidden = true;
  projectEl.classList.remove("show");
  roomAnims.forEach((a) => a.cancel());
  phase = "fly-back";
  await flight(sheet, i, false).then((anims) => anims.forEach((a) => a.cancel()));
  liftEl.style.opacity = "";
  flyHost.innerHTML = "";
  phase = "drop";
  await waitLift(0);
  phase = "rest";
  lowerFolder();
  finishClose(i);
}
function finishClose(i) {
  lowerFolder();
  openIndex = null;
  hovered = null;
  document.body.classList.remove("locked");
  transitioning = false;
  setDrawerTargets(null, i);
  setLit("drawer", REST_I);
  announce("Drawer closed.");
  // Keyboard users come back to the drawer previewed; pointer users to a closed drawer.
  if (returnFocus) {
    quietFocus = !openedByKey;
    returnFocus.focus({ preventScroll: true });
    quietFocus = false;
  }
  idle();
  wake();
}
closeBtn.addEventListener("click", closeProject);
pageEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]");
  if (!b || openIndex === null) return;
  // Swap to the neighbouring drawer in place: the drawer behind changes too.
  const i = (openIndex + Number(b.dataset.step) + PROJECTS.length) % PROJECTS.length;
  const p = PROJECTS[i];
  if (!p) return;
  lowerFolder();
  openIndex = i;
  hovered = i;
  returnFocus = drawerEls[i];
  for (let n = 0; n < N; n++) {
    D[n].t = n === i ? 1 : 0;
    D[n].x = D[n].t;
    D[n].pending = null;
  }
  setLit("drawer", i);
  raiseFolder(i);
  lift.x = 1;
  lift.target = 1;
  pageEl.innerHTML = pageMarkup(p, i);
  projectEl.scrollTop = 0;
  announce(`Drawer ${pad2(i + 1)}, ${p.title}.`);
  wake();
});

// ---------------------------------------------------------------------------
// ID card: rises out of the screen, flips in 3D, sinks back on a click outside.
// ---------------------------------------------------------------------------
const badgeLayer = $("[data-badge-layer]");
const badgePos = $("[data-badge-pos]");
const badge = $("[data-badge]");
const flipBtn = $("[data-flip]");
let badgeOpen = false;
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
function barcode(text) {
  let x = 0;
  const bars = [];
  const seed = rng(text);
  for (let n = 0; n < 46; n++) {
    const w = 1 + Math.floor(seed() * 3);
    if (n % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="40"/>`);
    x += w;
  }
  return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars.join("")}</svg>`;
}
function fillBadge() {
  const a = ABOUT;
  $("[data-badge-front]").innerHTML = `
    <div class="bd-slot"></div>
    <div class="bd-head"><span>The Archive</span><span>staff</span></div>
    <div class="bd-row">
      <div class="bd-photo"><img alt="Portrait of ${esc(a.name)}" src="${a.photo ? esc(a.photo) : portrait()}"></div>
      <div class="bd-id">ID<br>${esc(a.idNumber)}<br><br>ACCESS<br>all drawers</div>
    </div>
    <h2 class="bd-name">${esc(a.name)}</h2>
    <p class="bd-title">${esc(a.title)}</p>
    <ul class="bd-list">${(a.disciplines || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    <dl class="bd-meta"><div><dt>issued</dt><dd>${new Date().getFullYear()}</dd></div><div><dt>drawers</dt><dd>${pad2(N)}</dd></div><div><dt>projects</dt><dd>${pad2(PROJECTS.length)}</dd></div></dl>
    <div class="bd-bar">${barcode(a.idNumber || "archive")}<span class="bd-id">${esc(a.idNumber)}</span></div>`;
  $("[data-badge-back]").innerHTML = `
    <div class="bd-slot"></div>
    <div class="bd-head"><span>About this archive</span><span>${esc(a.idNumber)}</span></div>
    <p class="bd-bio">${esc(a.bio)}</p>
    <div class="bd-sign">${a.signature ? `<img alt="Signature" src="${esc(a.signature)}">` : `<svg viewBox="0 0 190 70" aria-label="Signature"><path d="${SIGNATURE_PATH}"/></svg>`}</div>
    <p class="bd-small">${esc(a.name)} · ${esc(a.title)}</p>
    <div class="bd-links">
      <a href="mailto:${esc(a.email)}"><span>${esc(a.email)}</span><span>✉</span></a>
      ${(a.socials || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener"><span>${esc(s.label)}</span><span>↗</span></a>`).join("")}
    </div>`;
}
fillBadge();
function badgeFrom() {
  const s = screenEl.getBoundingClientRect();
  const b = badgePos.getBoundingClientRect();
  const dx = s.left + s.width / 2 - (b.left + b.width / 2);
  const dy = s.top + s.height / 2 - (b.top + b.height / 2);
  const k = Math.max(0.06, (s.width * 0.7) / b.width);
  return `translate(${dx}px, ${dy}px) scale(${k}) rotateX(62deg)`;
}
async function openBadge(from) {
  if (busyOverlay()) return;
  transitioning = true;
  if (touring) stopTour();
  clearTimeout(idleTimer);
  returnFocus = from;
  badgeOpen = true;
  choose(null);
  hoverScreen(true);
  setLit("screen");
  badge.classList.remove("flipped");
  badgeLayer.hidden = false;
  document.body.classList.add("locked");
  announce("About this archive. Click the card to flip it; click outside or press Escape to close.");
  say(readoutNow());
  requestAnimationFrame(() => badgeLayer.classList.add("show"));
  if (!still.matches) {
    const a = badgePos.animate(
      [
        { transform: badgeFrom(), opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.18 },
        { transform: "translate(0, -2%) scale(1.02) rotateX(-6deg)", offset: 0.72 },
        { transform: "none", opacity: 1, offset: 1 },
      ],
      { duration: 760, easing: "cubic-bezier(.3,.7,.2,1)", fill: "both" },
    );
    await a.finished;
    a.cancel();
  }
  transitioning = false;
  flipBtn.focus({ preventScroll: true });
}
async function closeBadge() {
  if (!badgeOpen || transitioning) return;
  transitioning = true;
  badgeLayer.classList.remove("show");
  if (!still.matches) {
    const a = badgePos.animate(
      [
        { transform: badge.classList.contains("flipped") ? "rotateY(0deg)" : "none", opacity: 1, offset: 0 },
        { transform: badgeFrom(), opacity: 0, offset: 1 },
      ],
      { duration: 560, easing: "cubic-bezier(.5,0,.75,0)", fill: "both" },
    );
    await a.finished;
    a.cancel();
  }
  badgeLayer.hidden = true;
  badge.classList.remove("flipped");
  badgeOpen = false;
  transitioning = false;
  document.body.classList.remove("locked");
  hoverScreen(false);
  hoverComputer = false;
  setLit("drawer", REST_I);
  announce("Card closed.");
  if (returnFocus) returnFocus.focus({ preventScroll: true });
  idle();
}
const flip = () => {
  badge.classList.toggle("flipped");
  announce(badge.classList.contains("flipped") ? "Back of the card." : "Front of the card.");
};
badgeLayer.addEventListener("click", (e) => {
  if (transitioning) return;
  if (e.target.closest("a")) return;
  if (e.target.closest("[data-flip]")) return flip();
  if (e.target.closest("[data-badge]")) return flip();
  closeBadge();
});

// Escape, and a small focus trap for both dialogs.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (openIndex !== null) closeProject();
    else if (badgeOpen) closeBadge();
    return;
  }
  if (e.key !== "Tab") return;
  const host = openIndex !== null ? projectEl : badgeOpen ? badgeLayer : null;
  if (!host) return;
  const list = $$("button, a[href]", host).filter((el) => el.offsetParent !== null || el === closeBtn);
  if (!list.length) return;
  const first = list[0];
  const lastEl = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    lastEl.focus();
  } else if (!e.shiftKey && document.activeElement === lastEl) {
    e.preventDefault();
    first.focus();
  } else if (!host.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
  }
});

// ---------------------------------------------------------------------------
// Start.
// ---------------------------------------------------------------------------
centreShelf();
$$("[data-front-folder]").forEach((el) => { if (!hasProject(Number(el.dataset.frontFolder))) el.style.display = "none"; });
setLit("drawer", REST_I);
fillCard(REST_I);
CARD.shown = -1;
drawChair(true);
for (let i = 0; i < N; i++) {
  D[i].drawn = -1;
}
wake();
idle();
// Test hook for the checks (not used by the page itself).
window.__archive = { D, CARD, CH, HIT, cardPoly, toView, pick: (x, y) => pickDrawer(toView(x, y)), choose, openProject, closeProject, openBadge, closeBadge, steerChair, turnSeat, get state() { return { hovered, openIndex, badgeOpen, touring, order, phase }; } };
