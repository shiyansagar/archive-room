# The Archive Room: the prompt

Paste everything below the line into Claude Code (with the `anatomy` and `hairline` skills installed), in an empty folder. It reproduces this repo: an isometric design archive in which a Scandinavian sideboard of 12 drawers holds 12 projects. The build makes two self-contained HTML files, red and grey-white.

---

Use the `anatomy` skill as the build system, and borrow `hairline`'s pointer-response rules (hit-test rest poses, not moving geometry; spring motion; neighbour falloff). Size: HERO. Give me the estimate first, then build it.

## Concept: "The Archive Room"
A personal design archive drawn as one isometric room. The drawing is the navigation: every drawer is one project.

## Build setup
- `src/build.mjs` (Node, no dependencies) uses the anatomy kit (`src/kit/iso-kit.mjs`: `fitProjection`, `slabOf`, `extrude`, `cylinder`, `solidSvg`, `sideMatrix`, `translateAlong`, `haloOf`) to draw the SVG. It inlines `shell.html`, `page.css`, `data.js` and `live.js` into one self-contained HTML file.
- `node src/build.mjs` writes `archive-room.html`, the red version.
- `node src/build.mjs --white` writes `archive-room-white.html`, the grey-white version, which also loads `src/white.css`.
- Content lives only in `src/data.js` as `window.ARCHIVE = { projects: [12], about: {...} }`, with a comment header explaining how to edit it.

## Camera and style
- Camera: azimuth 40°, elevation 32°. Solids are painted back to front: sideboard rows from bottom to top, and nearer columns later within a row.
- Red version:
  - flat `#DF5061` page;
  - `#FFFDEE` strokes;
  - red tonal fills in four shades;
  - exactly one lit cream accent at a time.
- White version:
  - page `#ECECEA`;
  - furniture white `#FFFFFF`, `#F4F4F2` and shades `#D3D3D0`–`#EEEEEB`;
  - graphite lines `#262626` / `#7A7A78` / `#B9B9B6`;
  - black feet `#232323`;
  - the one lit accent is graphite with white lines;
  - every stroke 0.5px.
- Furniture is minimal and Scandinavian: rounded slab tops, tapered round legs, no wall and no clutter.

## The scene
1. **Sideboard (left), facing opposite to the desk.**
   - 3 rows × 4 columns = 12 big drawers, cell 40 × 30 units with a 2.4 gap.
   - Carcass is 56 deep × 175 wide on four tapered legs (height 22), with a thin top slab.
   - Each drawer front is plain. In the red version it has two small round knobs. In the white version it has a recessed slot pull plus a small white label holder, like a steel filing cabinet.
   - Inside every drawer: a floor, walls, a block of file cards, and one tab card numbered 01–12.
   - On top: a stack of books and a bud vase with one stem.
2. **Desk (right).**
   - Thin top, apron with a slim drawer, four tapered legs.
   - A boxy retro computer with a CRT screen (with scanlines), a keyboard with key slots, a mouse and a small plant.
   - A cable runs through a grommet.
3. **Shell chair** with four splayed legs on a **round rug**, plus a **round bin** beside the desk.

## Interactions
- **Drawer hover:**
  - the drawer slides out on a spring (k 175, c 21);
  - its neighbours follow with falloff by grid distance [1, 0.18, 0.05], staggered 45ms;
  - a preview card (title, year, category) rises from behind the sideboard above the hovered column.
  - Hit-test fixed bands on the drawer fronts' rest positions, never the moving drawers.
- **Drawer click:**
  - the tab card lifts and tips up out of the drawer (an affine tip about its bottom edge);
  - it then flies (FLIP, 980ms, `cubic-bezier(.62,0,.2,1)`) from its exact on-screen corners to a full-screen project page, crossfading card face to page with a sheen;
  - the room dims, blurs and scales to 0.95 behind it.
  - The page has a hero image, title, role/tools/year/category, description, a gallery of 4, a process strip of 3, and prev/next.
  - ✕ or Esc closes it and reverses the flight; focus is restored and scroll is locked while it is open.
- **Computer:** hover lights the screen (the one accent); click raises a flippable ID card (`about`: photo, name, title, disciplines, ID number, signature, bio, email, socials).
- **Chair:**
  - drag it, but only within the rug, never through desk legs, desk top or bin (separating-axis checks against obstacle boxes);
  - depth-sort the chair against desk parts with a topological sort;
  - double-click or R turns it.
- **Keyboard:** roving tabindex over the drawers (arrows ±1 / ±4), Enter opens, visible focus.
- **Idle tour:** after 6s idle, peek through the project drawers one by one; any input stops it.
- **Reduced motion:** no springs or flights, only instant state changes. Pause all animation when the figure is offscreen.

## Frame
Corner text in a small mono face:
- top left "Fig. 01";
- top right "THE ARCHIVE";
- bottom left the hint "hover a drawer · click the computer · drag the chair";
- bottom right a live readout ("12 drawers · rest", "drawer 03 / 12 · open", the chair gap, and so on).

The figure is sized to `min(1120px, 94vw, 84svh × aspect)`.

## Content
- Fill all 12 projects with believable sample content across the categories logo, poster, merch, music, video and design: title, year, role, tools, and a 1–2 sentence description.
- Use free placeholder photos from Lorem Picsum with stable seeds, e.g. `https://picsum.photos/seed/arc-01c/1200/840` (cover), `.../arc-01g0/800/600` (gallery ×4), `.../arc-01p0/600/600` (process ×3), and `.../arc-portrait/400/500` for the ID card.
- An empty string falls back to a drawn placeholder in the palette.

## Verify before you hand it over
- Run at desktop and at 390px wide. Check:
  - hover, open/close flight, ID card flip;
  - chair drag limits and depth order;
  - keyboard, reduced motion;
  - no console errors.
- Run the line-end check: no stroke may end in mid-air (0 floating ends).
- Serve the folder locally with `python -m http.server 8080` and give me the links.
