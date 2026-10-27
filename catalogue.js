/**
 * Catalogue: a card catalogue of 24 drawers, four rows of six, on short legs
 * under a capped top. The drawer under the pointer slides out, packed with
 * cards to the rim; its neighbours on the grid come out a little, the farther
 * the less, staggered outward from it on the 700ms lift curve. At rest one
 * drawer stands half out and another is ajar, and the half-open one is bright.
 * The slider is the stagger, in ms.
 *
 * The pattern: discrete items (Riffle). Tweens, a stagger by grid distance,
 * a falloff with a floor, and a hit test on the cabinet's front plane at rest,
 * which never moves, so a drawer sliding out from under the pointer cannot
 * flip the choice.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, rrect,
  tdone, tset, tval, tween, disposer, mk, place, pointer, poly, put, register, solid,
} = HL;

const COLS = 6, ROWS = 4, CW = 24, CH = 17, GAP = 2, M = 3, D = 50, LEG = 10, PULL = 30, CAP = 3;
const W = M * 2 + COLS * CW + (COLS - 1) * GAP, Z0 = LEG, Z1 = Z0 + M * 2 + ROWS * CH + (ROWS - 1) * GAP;
const REST = [[8, 0.55], [21, 0.14]], BRIGHT = 8, NEAR = [1, 0.26, 0.08];

/** Drawer i's cell on the front face: row and column, and its box in x and z. */
function cellOf(i) {
  const r = Math.floor(i / COLS), c = i % COLS, x0 = M + c * (CW + GAP), z1 = Z1 - M - r * (CH + GAP);
  return { r, c, x0, x1: x0 + CW, z0: z1 - CH, z1, xc: x0 + CW / 2 };
}
const restOf = (i) => (REST.find((p) => p[0] === i) || [i, 0])[1];
const gridDist = (a, b) => Math.abs(cellOf(a).r - cellOf(b).r) + Math.abs(cellOf(a).c - cellOf(b).c);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  // Fitted with the front drawers fully out, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-4, -4, 0], [W + 4, -4, 0], [-4, D + PULL + 2, 0], [W + 4, D + PULL + 2, 0], [-4, -4, Z1 + CAP], [W + 4, -4, Z1 + CAP], [-4, D + PULL + 2, Z1]], 200, 166);
  const P = proj(C), front = facing(C);
  /** A ring of {u, v} samples laid on a plane parallel to the front, at depth y. */
  const onFace = (ring, y) => ring.map((q) => P(q.u, y, q.v));

  const g = mk("g", {}, svg);

  // Four legs, far to near, then the carcass and its cap.
  const legs = [[5, 5], [W - 5, 5], [5, D - 5], [W - 5, D - 5]].sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const [x, y] of legs) {
    const [r, i] = rings(x - 3, y - 3, x + 3, y + 3, 1.4, 0.6);
    put(solid(g), prism(P, front, r, i, 0, LEG + 1));
  }
  const [br, bi] = rings(0, 0, W, D, 2.4, 1.2);
  put(solid(g), prism(P, front, br, bi, Z0, Z1));
  const [cr, ci] = rings(-1.6, -1.6, W + 1.6, D + 1.6, 3, 1.6);
  put(solid(g), prism(P, front, cr, ci, Z1, Z1 + CAP));
  // The openings stay on the carcass when a drawer leaves them.
  for (let i = 0; i < ROWS * COLS; i++) {
    const k = cellOf(i);
    mk("path", { d: poly(onFace(rrect(k.x0, k.z0, k.x1, k.z1, 1.6, 4), D)), class: "nf lo" }, g);
  }

  // Drawers, bottom row first and left to right: an upper or nearer one paints over the rest.
  const order = [...Array(ROWS * COLS).keys()].sort((a, b) => cellOf(b).r - cellOf(a).r || cellOf(a).c - cellOf(b).c);
  const drawers = [];
  for (const i of order) {
    const grp = mk("g", {}, g), tray = solid(grp);
    const cards = mk("path", { class: "nf lo" }, grp), lid = mk("path", { class: "nf" }, grp);
    const label = mk("path", { class: "nf lo" }, grp), knob = mk("circle", { r: 1.25, class: "dot m" }, grp);
    drawers[i] = { k: cellOf(i), tray, cards, lid, label, knob, s: tween(restOf(i)), drawn: NaN };
  }

  /** Drawer i pulled out by s (0 to 1): an open tray in front of its opening, its cards packed to the rim. */
  function draw(i, s) {
    const dr = drawers[i], { k } = dr, y = D + s * PULL, out = y - D;
    if (s === dr.drawn) return;
    dr.drawn = s;
    if (out < 1.4) {
      put(dr.tray, { sil: "", crease: "" });
      dr.cards.setAttribute("d", "");
      dr.lid.setAttribute("d", poly(onFace(rrect(k.x0 + 0.5, k.z0 + 0.5, k.x1 - 0.5, k.z1 - 0.5, 1.4, 4), y)));
    } else {
      const b = Math.min(1.3, out / 2 - 0.1);
      const [r, inner] = rings(k.x0 + 0.5, D, k.x1 - 0.5, y, 1.4, b);
      put(dr.tray, prism(P, front, r, inner, k.z0 + 0.5, k.z1 - 0.5));
      let d = "";
      for (let cy = D + b + 1.6; cy < y - b - 0.6; cy += 2.2) d += "M" + P(k.x0 + 0.5 + b, cy, k.z1 - 0.5) + "L" + P(k.x1 - 0.5 - b, cy, k.z1 - 0.5);
      dr.cards.setAttribute("d", d);
      dr.lid.setAttribute("d", "");
    }
    dr.label.setAttribute("d", poly(onFace(rrect(k.xc - 5.5, k.z1 - 6.6, k.xc + 5.5, k.z1 - 3.2, 1.1, 3), y)));
    place(dr.knob, P(k.xc, y, k.z0 + 4.8));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    drawers.forEach((dr, i) => { draw(i, tval(dr.s, now)); if (!tdone(dr.s, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  /** One bright place: the chosen drawer's tray and knob, or the half-open one at rest. */
  function brighten(a) {
    drawers.forEach((dr, i) => {
      dr.tray.sil.classList.toggle("hi", i === a);
      dr.knob.setAttribute("class", i === a ? "dot" : "dot m");
    });
  }

  // The hit test reads the front plane at rest: the pointer is taken onto the
  // plane y = D, which no drawer ever moves, and the cell there is the choice.
  const o = P(0, D, 0), ex = P(1, D, 0), ez = P(0, D, 1);
  const ux = [ex[0] - o[0], ex[1] - o[1]], uz = [ez[0] - o[0], ez[1] - o[1]], det = ux[0] * uz[1] - ux[1] * uz[0];
  function hit([px, py]) {
    const qx = px - o[0], qy = py - o[1];
    const x = (qx * uz[1] - qy * uz[0]) / det, z = (ux[0] * qy - ux[1] * qx) / det;
    if (x < 0 || x > W || z < Z0 || z > Z1) return -1;
    const c = clamp(Math.floor((x - M + GAP / 2) / (CW + GAP)), 0, COLS - 1);
    const r = clamp(Math.floor((Z1 - M + GAP / 2 - z) / (CH + GAP)), 0, ROWS - 1);
    return r * COLS + c;
  }

  let act = -1;
  /** Pulls drawer a and its neighbours (-1 sends them home). The stagger spreads from the drawer chosen, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    drawers.forEach((dr, i) => {
      const to = a < 0 ? restOf(i) : NEAR[gridDist(i, a)] ?? 0;
      tset(dr.s, to, now, gridDist(i, from) * stag);
    });
    brighten(a < 0 ? BRIGHT : a);
    read.textContent = a < 0 ? "rest" : "drawer " + String(a + 1).padStart(2, "0");
    B.wake();
  }

  brighten(BRIGHT);
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "catalogue",
  means: "A card catalogue: the drawer under the pointer slides out full of cards, and its neighbours follow it, the farther the less.",
  rules: [1, 2, 3, 5],
  range: [0, 45, 90],
  tour: [[147, 110], [230, 225], [258, 165], null],
  mount,
});
