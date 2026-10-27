// The Archive Room: build script.
// Writes ../archive-room.html, one self-contained page. Static art is built here once
// with the anatomy kit; the page only moves pre-built groups with transforms.
// Run:  node src/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// `--white`: a grey-white variant with flap fronts over sliding shelves, written to its own file.
const WHITE = process.argv.includes("--white");
const OUT = join(HERE, "..", WHITE ? "archive-room-white.html" : "archive-room.html");

// ---------------------------------------------------------------------------
// World (1 unit ≈ 1 cm). x and y on the floor, z up. Viewer sits at +x +y.
// An L-shaped corner: the sideboard stands along the left (it faces +x), the
// desk along the back (it faces +y), so the two face opposite ways.
// ---------------------------------------------------------------------------
const AZIMUTH = 40;
const ELEVATION = 32;

// Sideboard: 3 rows × 4 columns of big drawers on slim tapered legs.
const COLS = 4;
const ROWS = 3;
const CELL = { w: 40, h: 30, gap: 2.4, m: 4 };
const CAB_L = CELL.m * 2 + COLS * CELL.w + (COLS - 1) * CELL.gap; // 175.2, along y
const CAB = { x: 0, y: 8, w: 56, d: CAB_L, r: 2.4 };
const LEG_H = 22;
const BODY_Z1 = LEG_H + CELL.m * 2 + ROWS * CELL.h + (ROWS - 1) * CELL.gap; // 124.8
const TOP_Z = BODY_Z1 + 3.6;
const FRONT = CAB.x + CAB.w; // 56: the carcass front plane (x)
const FACE_X = FRONT + 1.6; // drawer fronts
const N = COLS * ROWS;
const SLIDE = 40;
const TAB_X = FRONT - 10; // the project's own card stands near the front of its drawer
// Drawer 01 is top-left as seen: on the +x face, screen-left is larger y.
const cellOf = (i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const y1 = CAB.y + CAB.d - CELL.m - c * (CELL.w + CELL.gap);
  const z1 = BODY_Z1 - CELL.m - r * (CELL.h + CELL.gap);
  return { i, r, c, y0: y1 - CELL.w, y1, z0: z1 - CELL.h, z1, yc: y1 - CELL.w / 2, zc: z1 - CELL.h / 2 };
};
const CELLS = Array.from({ length: N }, (_, i) => cellOf(i));

// Preview card: hidden behind the sideboard, it rises above its top over the hovered column.
const CARD = { x: -4.4, t: 1.4, w: 84, h: 90, yc: CAB.y + CAB_L / 2, z0: 30, rise: 100 };
CARD.dy = [CAB.y + 3 + CARD.w / 2 - CARD.yc, CAB.y + CAB_L - 3 - CARD.w / 2 - CARD.yc];

// Desk: a thin top on an apron and four tapered legs.
const DESK = { x: 112, y: 4, w: 136, d: 64, r: 3, z: 70, t: 3.5 };
const DESK_TOP = DESK.z + DESK.t; // 73.5
const APRON = { x: DESK.x + 5, y: DESK.y + 5, w: DESK.w - 10, d: DESK.d - 10, r: 2, z: 62.5 };
const DESK_LEGS = [[DESK.x + 7, DESK.y + 7], [DESK.x + DESK.w - 7, DESK.y + 7], [DESK.x + 7, DESK.y + DESK.d - 7], [DESK.x + DESK.w - 7, DESK.y + DESK.d - 7]];
const CASE = { x: 152, y: 16, w: 38, d: 32, r: 4 };
const CASE_FRONT = CASE.y + CASE.d; // 48
const CASE_TOP = 118;
const KB = { x: 147, y: 52, w: 46, d: 11, r: 2.2 };
const BIN = { x: 268, y: 32, r: 12, h: 27 };
const RUG = { cx: 182, cy: 124, r: 62 };
const CHAIR_HOME = [180, 108];

// ---------------------------------------------------------------------------
// Camera: fit every extreme pose (card risen over either end, drawers pulled,
// chair anywhere on the rug).
// ---------------------------------------------------------------------------
const WIDTH = 1000;
const fitPoints = [
  ...k.boxCorners({ x: -2, y: CAB.y - 2, w: FACE_X + SLIDE + 6, d: CAB_L + 4 }, 0, TOP_Z + 2),
  ...k.boxCorners({ x: CARD.x, y: CAB.y + 2, w: 2, d: CAB_L - 4 }, TOP_Z, CARD.z0 + CARD.h + CARD.rise + 2),
  ...k.boxCorners({ x: RUG.cx - RUG.r, y: RUG.cy - RUG.r, w: RUG.r * 2, d: RUG.r * 2 }, 0, 2),
  ...k.boxCorners({ x: RUG.cx - 40, y: RUG.cy - 40, w: 80, d: 80 }, 0, 84),
  ...k.boxCorners({ x: DESK.x, y: 0, w: DESK.w, d: DESK.d }, 0, CASE_TOP),
  ...k.boxCorners({ x: BIN.x - BIN.r, y: BIN.y - BIN.r, w: BIN.r * 2, d: BIN.r * 2 }, 0, BIN.h),
];
const cam = { pad: 0, azimuth: AZIMUTH, elevation: ELEVATION };
const unit = k.fitProjection(fitPoints, 1000, 1000, cam);
const flatPts = fitPoints.map((p) => k.iso(p, unit));
const spanX = Math.max(...flatPts.map((p) => p[0])) - Math.min(...flatPts.map((p) => p[0]));
const spanY = Math.max(...flatPts.map((p) => p[1])) - Math.min(...flatPts.map((p) => p[1]));
const PAD = 26;
const HEIGHT = Math.round(((WIDTH - PAD * 2) * spanY) / spanX + PAD * 2);
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { ...cam, pad: PAD });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const box = (x0, y0, z0, x1, y1, z1, r = 0.6, steps = 3, bevel = 0) =>
  k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r }, z0, z1 - z0, P, steps, bevel);
const planeY = (y) => k.sideMatrix([0, y], 0, P, "left"); // local (x, -z) on the plane y
const planeX = (x) => k.sideMatrix([x, 0], 0, P, "right"); // local (-y, -z) on the plane x
const flat = (x0, z0, x1, z1, r, steps = 6) =>
  k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const flatX = (y0, z0, y1, z1, r, steps = 6) => flat(-y1, z0, -y0, z1, r, steps); // a rounded rect on a +x face
const path3 = (pts, closed = false) => k.pathOf(pts.map(at), closed);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const r2 = (v) => Math.round(v * 100) / 100;
const halo = (plan, h = 6, z = 0) => `<path class="iso-halo${z ? " halo-desk" : ""}" d="${k.haloOf(plan, z, h, P)}"/>`;

function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// A tapered round leg (or vase body): the hull of its foot and head circles.
function taper(cx, cy, r0, r1, z0, z1, { tone = "mid", n = 24, cls = "" } = {}) {
  const circle = (r, z) => Array.from({ length: n }, (_, i) => at([cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2), z]));
  const head = circle(r1, z1);
  const body = k.pathOf(convexHull([...circle(r0, z0), ...head]), true);
  return `<g class="iso-solid${cls ? " " + cls : ""}"><path class="iso-fill" d="${body}"/><path class="iso-shade" data-shade="2" d="${body}"/><path class="iso-top" d="${k.pathOf(head, true)}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${body}"/></g>`;
}

// A disc along x (a knob on a +x face): the hull of its back and front circles.
function discX(cy, cz, r, x0, x1, { tone = "mid", n = 36 } = {}) {
  const circle = (x) => Array.from({ length: n }, (_, i) => at([x, cy + r * Math.cos((i / n) * Math.PI * 2), cz + r * Math.sin((i / n) * Math.PI * 2)]));
  const front = circle(x1);
  const b = k.pathOf(convexHull([...circle(x0), ...front]), true);
  const f = k.pathOf(front, true);
  return `<g class="iso-solid"><path class="iso-fill" d="${b}"/><path class="iso-shade" data-shade="1" d="${b}"/><path class="iso-top" d="${f}"/><path class="iso-line iso-crease" data-tone="lo" d="${f}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${b}"/></g>`;
}

// Rounded 3D polyline: fillet every corner with a quadratic arc, then sample.
function rounded3(points, radius = 4, samples = 6) {
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const len = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    const la = len(a, b);
    const lb = len(b, c);
    const r = Math.min(radius, la * 0.48, lb * 0.48);
    const p0 = b.map((v, j) => v + ((a[j] - v) * r) / la);
    const p1 = b.map((v, j) => v + ((c[j] - v) * r) / lb);
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const u = 1 - t;
      out.push(p0.map((v, j) => u * u * v + 2 * u * t * b[j] + t * t * p1[j]));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
const cableSvg = (pts) => {
  const d = path3(rounded3(pts));
  return `<g class="cable"><path class="cable-o" d="${d}"/><path class="cable-i" d="${d}"/></g>`;
};

// A recess in a vertical face: the opening, its visible inner walls and a back.
// axis "y": a +y face at `at0`, the opening given in (x, z); axis "x": a +x face, the opening in (y, z).
let clips = 0;
function recess({ a0, a1, z0, z1, r, depth }, axis, at0, back = "", backClass = "rc-well", inside = "") {
  const id = `rc-${clips++}`;
  const ring = k.roundedPlan({ x: a0, y: z0, w: a1 - a0, d: z1 - z0, r }, 6);
  const ca = (a0 + a1) / 2;
  const cz = (z0 + z1) / 2;
  const pt = (a, off, z) => (axis === "y" ? [a, at0 - off, z] : [at0 - off, a, z]);
  const { sinA, cosA } = k.cameraOf(P);
  const tops = [];
  const sides = [];
  ring.forEach(([aa, az], index) => {
    const [ba, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(ba - aa, bz - az) || 1;
    let [na, nz] = [(bz - az) / length, -(ba - aa) / length];
    if (na * (ca - (aa + ba) / 2) + nz * (cz - (az + bz) / 2) < 0) [na, nz] = [-na, -nz];
    // A wall is seen when its inward normal points at the viewer: up, or toward the near side.
    const seen = axis === "y" ? na * cosA : na * sinA;
    if (seen <= 0 && nz <= 0) return;
    const quad = k.pathOf([at(pt(aa, 0, az)), at(pt(ba, 0, bz)), at(pt(ba, depth, bz)), at(pt(aa, depth, az))], true);
    (nz >= Math.abs(na) ? tops : sides).push(quad);
  });
  const shape = axis === "y" ? flat(a0, z0, a1, z1, r) : flatX(a0, z0, a1, z1, r);
  const plane = (d) => (axis === "y" ? planeY(at0 - d) : planeX(at0 - d));
  return [
    `<clipPath id="${id}"><path transform="${plane(0)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<g transform="${plane(depth)}"><path class="${backClass}" d="${shape}"/>${back}</g>`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    sides.length ? `<path class="iso-shade" data-shade="1" d="${sides.join("")}"/>` : "",
    inside,
    `</g>`,
    `<g transform="${plane(0)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// A thin card standing in the plane x: a rectangle with an optional tab, given in (y, z).
function cardOutlineX(x, y0, y1, z0, z1, tab) {
  const pts = [[x, y1, z0], [x, y0, z0], [x, y0, z1]];
  if (tab) pts.push([x, tab[0] - 0.8, z1], [x, tab[0], z1 + tab[2]], [x, tab[1], z1 + tab[2]], [x, tab[1] + 0.8, z1]);
  pts.push([x, y1, z1]);
  return path3(pts, true);
}

// ---------------------------------------------------------------------------
// Round rug: plain, with a woven border ring.
// ---------------------------------------------------------------------------
function rug() {
  const { cx, cy, r } = RUG;
  const out = [];
  out.push(`<g class="rug">${S(k.cylinder(cx, cy, r, 0, 1.2, P, 96, 0.5), { tone: "mid", crease: "faint" })}`);
  out.push(L(k.ring(cx, cy, r - 6, 1.2, P, 96), { tone: "lo" }));
  out.push(L(k.ring(cx, cy, r - 9, 1.2, P, 96), { tone: "faint" }));
  out.push(`</g>`);
  return out.join("");
}

// ---------------------------------------------------------------------------
// Preview card: a thin index card behind the sideboard. The page raises it
// above the top and slides it to the hovered column.
// ---------------------------------------------------------------------------
function card() {
  const { x, t, w, h, yc, z0 } = CARD;
  const y0 = yc - w / 2;
  const y1 = yc + w / 2;
  const fx = x + t; // front face
  const out = [];
  out.push(S(box(x, y1 - 24, z0 + h - 1, fx, y1 - 6, z0 + h + 6.4, 1.4, 3), { tone: "mid" }));
  out.push(S(box(x, y0, z0, fx, y1, z0 + h, 1.8, 4, 0.5), { tone: "hi", crease: "lo" }));
  const face = [];
  face.push(`<path class="iso-line" data-tone="hi" d="${flatX(y0 + 3, z0 + 3, y1 - 3, z0 + h - 3, 2)}"/>`);
  // In the face plane, local u = -y: text and images read left to right on screen.
  const u0 = -(y1 - 7);
  const img = { z1: z0 + h - 25, w: w - 14, hh: h - 33 };
  face.push(`<text class="card-title" data-card="title" x="${u0}" y="${-(z0 + h - 11.8)}" font-size="6.8"></text>`);
  face.push(`<text class="card-meta" data-card="meta" x="${u0}" y="${-(z0 + h - 19.4)}" font-size="4.3"></text>`);
  face.push(`<clipPath id="card-img-clip"><path d="${flat(u0, img.z1 - img.hh, u0 + img.w, img.z1, 1.8)}"/></clipPath>`);
  face.push(`<image data-card="img" clip-path="url(#card-img-clip)" x="${u0}" y="${-img.z1}" width="${img.w}" height="${img.hh}" preserveAspectRatio="xMidYMid slice" href=""/>`);
  face.push(`<path class="iso-line" data-tone="hi" d="${flat(u0, img.z1 - img.hh, u0 + img.w, img.z1, 1.8)}"/>`);
  face.push(`<text class="card-num" data-card="num" x="${-(y1 - 15)}" y="${-(z0 + h + 1.4)}" font-size="4.3" text-anchor="middle"></text>`);
  out.push(`<g transform="${planeX(fx)}">${face.join("")}</g>`);
  return out.join("");
}

// ---------------------------------------------------------------------------
// The sideboard.
// ---------------------------------------------------------------------------
const drawerInfo = [];
function drawer(cell) {
  const { i, y0, y1, z0, z1, yc } = cell;
  const out = [];
  // Box: floor, back wall, far side wall (the +y side faces us, so it comes last).
  const wallTop = z1 - 6;
  const cardTop = z1 - 10;
  const bx0 = 6;
  const bx1 = FRONT - 1.4;
  out.push(S(box(bx0, y0 + 1.4, z0 + 0.8, bx1, y1 - 1.4, z0 + 1.8, 0.4, 2), { tone: "lo" }));
  out.push(S(box(bx0, y0 + 1.4, z0 + 0.8, bx0 + 1, y1 - 1.4, wallTop, 0.4, 2), { tone: "lo" }));
  out.push(S(box(bx0, y0 + 1.4, z0 + 0.8, bx1, y0 + 2.4, wallTop, 0.4, 2), { tone: "lo" }));
  // The packed index cards: one block whose top shows every card's edge.
  const cy0 = y0 + 2.6;
  const cy1 = y1 - 2.6;
  out.push(S(box(bx0 + 2, cy0, z0 + 1.8, bx1 - 1.4, cy1, cardTop, 0.3, 2), { tone: "hi", crease: "lo" }));
  const edges = [];
  for (let x = bx0 + 3.4; x < bx1 - 1.6; x += 1.7) edges.push(k.lineOnTop([x, cy0], [x, cy1], cardTop, P));
  out.push(L(edges.join(""), { tone: "faint" }));
  // One guide card with a tab, a little proud of the rest.
  const tabY = y0 + 8 + (i % 3) * 7;
  const guide = cardOutlineX(24, cy0, cy1, cardTop, cardTop + 1.4, [tabY, tabY + 8, 2.2]);
  out.push(`<path class="guide-card" d="${guide}"/>`, L(guide, { tone: "mid" }));
  // The project's own card, numbered. Only its top shows until it is lifted.
  const tz0 = z0 + 1.8;
  const tz1 = z1 - 2.6;
  const clipId = `tab-clip-${i}`;
  const tab = [];
  tab.push(`<clipPath id="${clipId}"><path d="${k.pathOf([[cy0 - 6, cardTop], [cy1 + 6, cardTop], [cy1 + 6, tz1 + 10], [cy0 - 6, tz1 + 10]].map(([y, z]) => at([TAB_X, y, z])), true)}"/></clipPath>`);
  const d = cardOutlineX(TAB_X, y0 + 5, y1 - 5, tz0, tz1);
  const num = `<g transform="${planeX(TAB_X)}"><text class="tab-num" x="${-yc}" y="${-(cardTop + 1.6)}" font-size="7.4" text-anchor="middle">${String(i + 1).padStart(2, "0")}</text></g>`;
  tab.push(`<g data-tab-clip clip-path="url(#${clipId})"><path class="tab-card" d="${d}"/>${num}${L(d, { tone: "hi" })}</g>`);
  out.push(`<g class="tab" data-front-folder="${i}">${tab.join("")}</g>`);
  // The near side wall and its runner.
  out.push(S(box(bx0, y1 - 2.4, z0 + 0.8, bx1, y1 - 1.4, wallTop, 0.4, 2), { tone: "lo" }));
  out.push(S(box(bx0 + 3, y1 - 1.4, z0 + 6, bx1, y1 - 0.5, z0 + 8.4, 0.3, 2), { tone: "mid", crease: "none" }));
  // Front: one bevelled panel and a round wooden knob. Nothing else.
  const front = [];
  front.push(S(box(FRONT - 1.4, y0 + 0.3, z0 + 0.3, FACE_X, y1 - 0.3, z1 - 0.3, 1.2, 4, 0.9), { tone: "hi", crease: "lo" }));
  front.push(`<g transform="${planeX(FACE_X)}"><path class="iso-line" data-tone="faint" d="${flatX(y0 + 2.4, z0 + 2.4, y1 - 2.4, z1 - 2.4, 1.2)}"/></g>`);
  if (WHITE) {
    // Steel-cabinet front: a recessed slot pull near the top and a small label holder under it.
    front.push(recess({ a0: yc - 8, a1: yc + 8, z0: z1 - 8.6, z1: z1 - 5.4, r: 1.4, depth: 1.6 }, "x", FACE_X, "", "rc-deep"));
    front.push(`<g transform="${planeX(FACE_X)}"><path class="lbl-card" d="${flatX(yc - 5, z1 - 14, yc + 5, z1 - 10.8, 0.4)}"/><path class="iso-line" data-tone="lo" d="${flatX(yc - 5, z1 - 14, yc + 5, z1 - 10.8, 0.4)}"/></g>`);
  } else {
    const kz = cell.zc + 3;
    front.push(discX(yc, kz, 1.2, FACE_X, FACE_X + 1.4, { tone: "mid", n: 24 }));
    front.push(discX(yc, kz, 3, FACE_X + 1.4, FACE_X + 3.6, { tone: "hi", n: 40 }));
  }
  out.push(`<g class="drawer-front" data-front="${i}">${front.join("")}</g>`);

  // Clip: the opening swept toward the viewer (+x), so nothing inside the carcass shows.
  const o = [[FRONT, y0, z0], [FRONT, y1, z0], [FRONT, y1, z1], [FRONT, y0, z1]];
  const hull = convexHull([...o, ...o.map(([x, y, z]) => [x + 400, y, z])].map(at));
  const clip = `<clipPath id="dclip-${i}"><path d="${k.pathOf(hull, true)}"/></clipPath>`;
  drawerInfo.push({ i, channel: convexHull([...o, ...o.map(([x, y, z]) => [x + SLIDE + 6, y, z])].map(at)).map(([x, y]) => [r2(x), r2(y)]) });
  return `${clip}<g class="drawer-slot" clip-path="url(#dclip-${i})"><g class="drawer" data-drawer="${i}" tabindex="-1" role="button">${out.join("")}</g></g>`;
}

function sideboard() {
  const out = [];
  out.push(halo({ x: CAB.x - 4, y: CAB.y - 4, w: CAB.w + 8, d: CAB.d + 8, r: 6 }, 8));
  // Four slim tapered legs.
  for (const [x, y] of byDepth(k.corners(CAB, 7))) out.push(taper(x, y, 1.7, 2.7, 0, LEG_H + 0.5, { cls: "leg" }));
  // Carcass with a soft bevel.
  out.push(S(k.slabOf(CAB, LEG_H, BODY_Z1 - LEG_H, P, 6, 1.2), { tone: "mid" }));
  // A slot recess behind every drawer (seen when it is pulled).
  for (const cell of CELLS) out.push(recess({ a0: cell.y0, a1: cell.y1, z0: cell.z0, z1: cell.z1, r: 0.8, depth: 50 }, "x", FRONT, "", "rc-deep"));
  // Drawers: bottom row first; within a row, the back (right on screen) first.
  const order = [...CELLS].sort((a, b) => b.r - a.r || a.y0 - b.y0);
  for (const cell of order) out.push(drawer(cell));
  // The top slab, and two books and a vase left on it.
  const top = { x: CAB.x - 1.6, y: CAB.y - 1.6, w: CAB.w + 3.2, d: CAB.d + 3.2, r: 3 };
  out.push(S(k.slabOf(top, BODY_Z1, TOP_Z - BODY_Z1, P, 6, 1), { tone: "hi", crease: "lo" }));
  out.push(books(28, 52));
  out.push(vase(26, 150));
  return `<g class="cabinet">${out.join("")}</g>`;
}

function books(cx, cy) {
  const out = [halo({ x: cx - 14, y: cy - 10, w: 28, d: 20, r: 2 }, 1.2, TOP_Z)];
  const tilt = (a, w, d) => k.roundedPlan({ x: -w / 2, y: -d / 2, w, d, r: 0.8 }, 2).map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  out.push(S(k.extrude(tilt(0.06, 26, 18), TOP_Z, 3.2, P, { bevel: 0.3 }), { tone: "mid", crease: "lo" }));
  out.push(S(k.extrude(tilt(-0.12, 22, 15), TOP_Z + 3.2, 2.6, P, { bevel: 0.3 }), { tone: "hi", crease: "lo" }));
  return out.join("");
}

function vase(cx, cy) {
  const out = [halo({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 6 }, 1.4, TOP_Z)];
  out.push(taper(cx, cy, 4.2, 5.6, TOP_Z, TOP_Z + 11, { tone: "hi" }));
  out.push(taper(cx, cy, 5.6, 2.4, TOP_Z + 11, TOP_Z + 15, { tone: "hi" }));
  out.push(S(k.cylinder(cx, cy, 2.4, TOP_Z + 15, 3.2, P, 20), { tone: "hi", crease: "lo" }));
  // One branch: a stem that ends in its top leaf, leaves set along it.
  const base = TOP_Z + 18.2;
  const stem = [[cx, cy, base], [cx + 1, cy - 1.5, base + 12], [cx + 3, cy - 4, base + 24], [cx + 6.5, cy - 6.5, base + 33]];
  const leaf = ([x, y, z], dx, dy, dz, w) => {
    const tip = [x + dx, y + dy, z + dz];
    const len = Math.hypot(dx, dy) || 0.01;
    const side = [(-dy / len) * w, (dx / len) * w];
    const mid = [x + dx / 2 + side[0], y + dy / 2 + side[1], z + dz / 2];
    const mid2 = [x + dx / 2 - side[0], y + dy / 2 - side[1], z + dz / 2];
    return path3(rounded3([[x, y, z], mid, tip, mid2, [x, y, z]], 1.6, 4), true);
  };
  const leaves = [leaf(stem[1], -4, 3, 4, 1.4), leaf(stem[1], 4, -3, 5, 1.4), leaf(stem[2], -4, 2, 5, 1.3), leaf(stem[2], 4, -3, 4, 1.3), leaf(stem[3], 1, -1, 5, 1.2)];
  // The stem's root goes down into the vase's mouth.
  out.push(`<path class="rc-deep" d="${k.ring(cx, cy, 1.7, base, P, 20)}"/>`);
  out.push(L(path3(rounded3(stem, 6, 6)), { tone: "hi", free: "start" }));
  for (const d of leaves) out.push(`<path class="leaf" d="${d}"/>`, L(d, { tone: "hi" }));
  return out.join("");
}

// ---------------------------------------------------------------------------
// Desk: four tapered legs (each its own item so the chair sorts between them)
// and the top with the apron and everything on it.
// ---------------------------------------------------------------------------
const deskLeg = ([x, y]) => taper(x, y, 1.6, 2.6, 0, APRON.z + 0.5, { cls: "leg" });

function deskTopItem() {
  const out = [];
  out.push(S(k.slabOf(APRON, APRON.z, DESK.z - APRON.z, P, 4, 0.4), { tone: "mid" }));
  // A slim drawer in the apron front, with a small knob.
  const ay = APRON.y + APRON.d;
  out.push(`<g transform="${planeY(ay)}">${L(flat(164, APRON.z + 1.6, 206, DESK.z - 1.6, 1.4), { tone: "lo" })}</g>`);
  out.push(D([at([185, ay, (APRON.z + DESK.z) / 2])], { size: 0.7, tone: "hi" }));
  const plan = { x: DESK.x, y: DESK.y, w: DESK.w, d: DESK.d, r: DESK.r };
  out.push(S(k.slabOf(plan, DESK.z, DESK.t, P, 6, 1.2), { tone: "hi", crease: "lo" }));
  // Cable grommet; the computer's cable drops into it.
  out.push(L(k.ring(140, 42, 2.6, DESK_TOP, P, 24), { tone: "lo" }) + L(k.ring(140, 42, 1.5, DESK_TOP, P, 20), { tone: "faint" }));
  out.push(cableSvg([[CASE.x + 0.5, 42, 80], [146, 42, 77.5], [142.6, 42, DESK_TOP + 0.6], [141.6, 42, DESK_TOP + 0.6]]));
  out.push(computer());
  out.push(keyboard());
  out.push(mouse());
  out.push(plant());
  return out.join("");
}

function computer() {
  const out = [];
  out.push(halo(CASE, 6, DESK_TOP));
  out.push(S(k.slabOf(k.insetPlan(CASE, 2.4), DESK_TOP, 2.4, P, 6), { tone: "lo" }));
  out.push(S(k.slabOf(CASE, DESK_TOP + 2.4, CASE_TOP - DESK_TOP - 2.4, P, 8, 1.4), { tone: "hi", crease: "lo" }));
  const BEZEL = { x0: 157, x1: 185, z0: 88, z1: 113, r: 3.4, depth: 1.4 };
  const CRT = { x0: 159.4, x1: 182.6, z0: 90.4, z1: 110.6, r: 4, depth: 3 };
  const scan = [];
  for (let z = CRT.z0 + 0.9; z < CRT.z1; z += 1.25) scan.push(`M${CRT.x0} ${(-z).toFixed(2)}H${CRT.x1}`);
  const glass = [
    `<path class="crt-scan" d="${scan.join("")}"/>`,
    `<text class="crt-text" x="${CRT.x0 + 3.2}" y="${-(CRT.z1 - 6.2)}" font-size="3.2">archive_</text>`,
    `<text class="crt-text crt-sub" x="${CRT.x0 + 3.2}" y="${-(CRT.z1 - 10.4)}" font-size="2.5">who am i?</text>`,
    `<rect class="crt-cursor" x="${CRT.x0 + 3.2}" y="${-(CRT.z0 + 6)}" width="1.9" height="3"/>`,
    `<path class="crt-glint" d="M${CRT.x0 + 2.8} ${-(CRT.z1 - 8.4)}Q${CRT.x0 + 3.2} ${-(CRT.z1 - 3.2)} ${CRT.x0 + 8.4} ${-(CRT.z1 - 2.6)}"/>`,
  ].join("");
  const inner = recess({ a0: CRT.x0, a1: CRT.x1, z0: CRT.z0, z1: CRT.z1, r: CRT.r, depth: CRT.depth }, "y", CASE_FRONT - BEZEL.depth, glass, "crt-glass");
  out.push(`<g class="screen">${recess({ a0: BEZEL.x0, a1: BEZEL.x1, z0: BEZEL.z0, z1: BEZEL.z1, r: BEZEL.r, depth: BEZEL.depth }, "y", CASE_FRONT, "", "rc-bezel", inner)}</g>`);
  // One slot and the power light.
  out.push(recess({ a0: 170, a1: 184, z0: 80, z1: 82.2, r: 1, depth: 2 }, "y", CASE_FRONT, "", "rc-deep"));
  out.push(`<g class="led">${D([at([160, CASE_FRONT, 81.1])], { size: 0.75, tone: "hi" })}</g>`);
  return `<g class="computer" data-part="computer" tabindex="0" role="button" aria-label="Computer: about this archive">${out.join("")}</g>`;
}

function keyboard() {
  const out = [];
  out.push(halo(KB, 2, DESK_TOP));
  out.push(S(k.slabOf(KB, DESK_TOP, 2.2, P, 6, 0.5), { tone: "hi", crease: "lo" }));
  // Keys as shallow slots: three rows and the space bar.
  const top = DESK_TOP + 2.2;
  const keys = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 11; c++) keys.push(k.planOutline({ x: KB.x + 2.6 + c * 3.75, y: KB.y + 1.6 + r * 2.3, w: 3, d: 1.6, r: 0.4 }, top, P, 2));
  }
  keys.push(k.planOutline({ x: KB.x + 12, y: KB.y + 1.6 + 3 * 2.3, w: 18, d: 1.6, r: 0.6 }, top, P, 2));
  out.push(L(keys.join(""), { tone: "lo" }));
  return out.join("");
}

function mouse() {
  const m = { x: 198, y: 54, w: 5.4, d: 8.4, r: 2.6 };
  const out = [halo(m, 1.4, DESK_TOP)];
  out.push(S(k.slabOf(m, DESK_TOP, 2.6, P, 6, 0.4), { tone: "hi", crease: "lo" }));
  out.push(L(k.lineOnTop([m.x + m.w / 2, m.y], [m.x + m.w / 2, m.y + 3.4], DESK_TOP + 2.6, P) + k.lineOnTop([m.x + 0.4, m.y + 3.4], [m.x + m.w - 0.4, m.y + 3.4], DESK_TOP + 2.6, P), { tone: "lo" }));
  return out.join("");
}

function plant() {
  const [cx, cy] = [232, 20];
  const out = [halo({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 6 }, 1.4, DESK_TOP)];
  out.push(taper(cx, cy, 4, 5.4, DESK_TOP, DESK_TOP + 10, { tone: "hi" }));
  out.push(`<path class="soil" d="${k.ring(cx, cy, 4.8, DESK_TOP + 10, P, 24)}"/>`);
  out.push(L(k.ring(cx, cy, 4.8, DESK_TOP + 10, P, 24), { tone: "lo" }));
  const base = DESK_TOP + 10;
  const leaves = [[-8, -4, 19, 2.4], [7, -7, 22, 2.2], [-3, 8, 17, 2.4], [8, 5, 15, 2.0], [-6, 6, 24, 2.0], [2, -9, 26, 2.2], [0, 1, 28, 2.0]].map(([dx, dy, h, w]) => ({ dx, dy, h, w }));
  leaves.sort((a, b) => k.depthOf([cx + a.dx, cy + a.dy, base + a.h], P) - k.depthOf([cx + b.dx, cy + b.dy, base + b.h], P));
  for (const { dx, dy, h, w } of leaves) {
    const tip = [cx + dx, cy + dy, base + h];
    const ctrl = [cx + dx * 0.15, cy + dy * 0.15, base + h * 0.9];
    const len = Math.hypot(dx, dy) || 1;
    const side = [-dy / len, dx / len];
    const left = [];
    const right = [];
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      const u = 1 - t;
      const p = [0, 1, 2].map((j) => u * u * [cx, cy, base][j] + 2 * u * t * ctrl[j] + t * t * tip[j]);
      const half = w * Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - t * 0.35);
      left.push([p[0] + side[0] * half, p[1] + side[1] * half, p[2]]);
      right.push([p[0] - side[0] * half, p[1] - side[1] * half, p[2]]);
    }
    const d = path3([...left, ...right.reverse()], true);
    out.push(`<path class="leaf" d="${d}"/>`, `<path class="iso-line leaf-edge" data-tone="hi" d="${d}"/>`);
  }
  return out.join("");
}

// A plain round bin with a rolled rim.
function bin() {
  const { x, y, r, h } = BIN;
  const out = [halo({ x: x - r - 2, y: y - r - 2, w: (r + 2) * 2, d: (r + 2) * 2, r: r + 2 }, 4)];
  out.push(taper(x, y, r - 1.2, r, 0, h - 2.2, { tone: "mid" }));
  out.push(S(k.cylinder(x, y, r + 0.6, h - 2.2, 2.2, P, 64), { tone: "hi", crease: "lo" }));
  const mouth = k.ring(x, y, r - 0.6, h, P, 48);
  out.push(`<path class="rc-deep" d="${mouth}"/>`, L(mouth, { tone: "lo" }));
  return out.join("");
}

// ---------------------------------------------------------------------------
// Assemble.
// ---------------------------------------------------------------------------
const legItems = DESK_LEGS.map((p, n) => ({ id: `leg${n}`, p }));
const deskHalo = halo({ x: DESK.x + 2, y: DESK.y + 3, w: DESK.w - 4, d: DESK.d - 4, r: 3 }, 6);
const svgBody = [
  `<g class="layer-floor">${rug()}${deskHalo}</g>`,
  `<g class="card" data-part="card">${card()}</g>`,
  sideboard(),
  `<g class="lift-layer" data-part="lift"></g>`,
  `<g class="floor-items" data-part="items">`,
  ...legItems.filter((l) => l.p[1] < 40).map((l) => `<g data-item="${l.id}">${deskLeg(l.p)}</g>`),
  `<g data-item="chairLow" class="chair" data-part="chair"></g>`,
  ...legItems.filter((l) => l.p[1] >= 40).map((l) => `<g data-item="${l.id}">${deskLeg(l.p)}</g>`),
  `<g data-item="top">${deskTopItem()}</g>`,
  `<g data-item="chairHigh" class="chair" data-part="chair"></g>`,
  `<g data-item="bin">${bin()}</g>`,
  `</g>`,
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  className: "room",
  label:
    "An isometric archive room drawn in cream lines on red, in a quiet Scandinavian style: a long sideboard of twelve big drawers on slim legs holds the projects, one drawer each; across the corner a thin desk carries a boxy computer that holds the designer's ID card; a shell chair stands on a round rug in front of it, with a plain round bin beside the desk.",
  body: svgBody,
});

// Geometry the page needs, in viewBox units.
const legBox = ([x, y], id) => ({ id, x0: x - 3, x1: x + 3, y0: y - 3, y1: y + 3, z0: 0, z1: APRON.z });
const GEO = {
  P,
  width: WIDTH,
  height: HEIGHT,
  cols: COLS,
  rows: ROWS,
  cells: CELLS,
  cab: { x: CAB.x, y: CAB.y, d: CAB.d, front: FRONT, face: FACE_X, z0: LEG_H, z1: BODY_Z1, top: TOP_Z },
  drawers: [...drawerInfo].sort((a, b) => a.i - b.i),
  slide: SLIDE,
  card: CARD,
  tabX: TAB_X,
  rug: RUG,
  white: WHITE,
  deskFront: DESK.y + DESK.d,
  chairHome: CHAIR_HOME,
  obstacles: [
    ...DESK_LEGS.map((p, n) => legBox(p, `leg${n}`)),
    { id: "top", x0: DESK.x, x1: DESK.x + DESK.w, y0: DESK.y, y1: DESK.y + DESK.d, z0: APRON.z, z1: 128 },
    { id: "bin", x0: BIN.x - BIN.r - 1, x1: BIN.x + BIN.r + 1, y0: BIN.y - BIN.r - 1, y1: BIN.y + BIN.r + 1, z0: 0, z1: BIN.h },
  ],
};

const css = readFileSync(join(HERE, "page.css"), "utf8") + (WHITE ? readFileSync(join(HERE, "white.css"), "utf8") : "");
const data = readFileSync(join(HERE, "data.js"), "utf8");
const live = readFileSync(join(HERE, "live.js"), "utf8");
const kit = readFileSync(join(HERE, "kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");
const shell = readFileSync(join(HERE, "shell.html"), "utf8");

const html = shell
  .replace("/*DATA*/", () => data)
  .replace("/*CSS*/", () => k.ISO_CSS + css)
  .replace("<!--SVG-->", () => svg)
  .replace("/*SCRIPT*/", () => `${kit}\nconst GEO = ${JSON.stringify(GEO)};\n${live}`.replace(/<\/(script)/gi, "<\\/$1"));

writeFileSync(OUT, html);
// The white version is the site's home page (GitHub Pages serves index.html).
if (WHITE) writeFileSync(join(HERE, "..", "index.html"), html);
console.log(`wrote ${OUT} · viewBox ${WIDTH}×${HEIGHT} · ${(html.length / 1024).toFixed(0)} KB · scale ${P.scale.toFixed(3)}`);
