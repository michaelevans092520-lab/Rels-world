// Ember Key: the open-world map. Generated once from a fixed seed, then hand-placed
// landmarks (village, training yard, arena, Gloomwood, camps) are stamped on top.
// Everything is in tile units. No DOM here.

import { fbm, hash2 } from './util.js';

export const T = { WATER: 0, SAND: 1, GRASS: 2, PATH: 3, FOREST: 4, DIRT: 5, STONE: 6, FLOWERS: 7, DEEP: 8 };
export const MAP_W = 112, MAP_H = 92;

export function buildWorld() {
  const W = MAP_W, H = MAP_H;
  const tiles = new Uint8Array(W * H), solid = new Uint8Array(W * H);
  const objects = [];   // drawable props: { kind, x, y, w, h, ... } (tile coords, x/y = top-left)
  const idx = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x, y, t) => { if (inside(x, y)) tiles[idx(x, y)] = t; };
  const get = (x, y) => inside(x, y) ? tiles[idx(x, y)] : T.DEEP;
  const block = (x, y) => { if (inside(x, y)) solid[idx(x, y)] = 1; };
  const free = (x, y) => { if (inside(x, y)) solid[idx(x, y)] = 0; };

  // --- island shape: squashed ellipse roughed up by noise
  const cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - cx) / (W * 0.44), dy = (y - cy) / (H * 0.47);
    const d = Math.sqrt(dx * dx + dy * dy) + (fbm(x * 0.08, y * 0.08, 3) - 0.5) * 0.35;
    let t = d > 1.08 ? T.DEEP : d > 1.0 ? T.WATER : d > 0.93 ? T.SAND : T.GRASS;
    if (t === T.GRASS && fbm(x * 0.15, y * 0.15, 9) > 0.68) t = T.FLOWERS;
    tiles[idx(x, y)] = t;
  }
  // Gloomwood (east) gets dark forest floor
  for (let y = 14; y < 76; y++) for (let x = 72; x < W; x++)
    if (get(x, y) === T.GRASS || get(x, y) === T.FLOWERS) {
      const edge = (x - 72) / 6 + (fbm(x * 0.2, y * 0.2, 4) - 0.5) * 2;
      if (edge > 0.5) set(x, y, T.FOREST);
    }

  const fill = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  const disc = (x0, y0, r, t) => { for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if ((x - x0) ** 2 + (y - y0) ** 2 <= r * r) set(x, y, t); };
  // paths: 2 tiles wide, L-shaped
  const path = (x0, y0, x1, y1) => {
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    for (let x = x0; x !== x1 + sx; x += sx || 1) { if (get(x, y0) !== T.STONE) { set(x, y0, T.PATH); set(x, y0 + 1, T.PATH); } if (!sx) break; }
    for (let y = y0; y !== y1 + sy; y += sy || 1) { if (get(x1, y) !== T.STONE) { set(x1, y, T.PATH); set(x1 + 1, y, T.PATH); } if (!sy) break; }
  };

  // --- landmarks (tile coords)
  const L = {
    plaza: { x0: 46, y0: 46, x1: 59, y1: 55 },
    yard:  { x0: 43, y0: 22, x1: 62, y1: 35 },
    arena: { x: 53, y: 14, r: 5 },
    catClearing: { x: 96, y: 38 },
    bruteCamp: { x: 20, y: 52 },
    ninjaCamp: { x: 26, y: 24 },
    dock: { x: 55, y: 84 },
  };
  fill(L.plaza.x0, L.plaza.y0, L.plaza.x1, L.plaza.y1, T.STONE);
  fill(L.yard.x0, L.yard.y0, L.yard.x1, L.yard.y1, T.DIRT);
  disc(L.arena.x, L.arena.y, L.arena.r, T.DIRT);
  disc(L.catClearing.x, L.catClearing.y, 4, T.FLOWERS);
  disc(L.bruteCamp.x, L.bruteCamp.y, 6, T.DIRT);
  disc(L.ninjaCamp.x, L.ninjaCamp.y, 5, T.DIRT);
  path(52, 36, 52, 45);        // plaza → yard
  path(52, 19, 52, 21);        // yard → arena
  path(60, 50, 73, 50);        // plaza → Gloomwood edge
  path(73, 50, 90, 40);        // into the woods (winding stops short of the clearing)
  path(27, 50, 45, 50);        // plaza → brute camp
  path(26, 30, 26, 49);        // brute road → ninja camp
  path(52, 56, 52, 80);        // plaza → beach / dock
  // dock planks reach out over the water
  for (let y = 80; y <= 88; y++) { set(54, y, T.PATH); set(55, y, T.PATH); set(56, y, T.PATH); }

  // --- buildings (solid footprint, door on the bottom edge)
  const house = (x, y, w, h, roof, name, door = Math.floor(w / 2)) => {
    objects.push({ kind: 'house', x, y, w, h, roof, name, door });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) block(xx, yy);
    set(x + door, y + h, T.PATH);
  };
  house(39, 39, 6, 5, '#b4473a', "Rels' house");
  house(61, 41, 6, 5, '#c8506a', "Willa's clinic");
  house(61, 52, 7, 5, '#d49a2a', "Marta's store");
  house(39, 54, 5, 4, '#5a7ab0', 'Pell cottage');
  house(64, 27, 4, 4, '#3a6b4a', "Bram's hut");

  // well in the middle of the plaza
  objects.push({ kind: 'well', x: 52, y: 50, w: 2, h: 2 }); for (const [a, b] of [[52, 50], [53, 50], [52, 51], [53, 51]]) block(a, b);
  objects.push({ kind: 'sign', x: 51, y: 36, text: 'Training Yard' });
  objects.push({ kind: 'sign', x: 72, y: 48, text: 'Gloomwood. Bats!' });
  objects.push({ kind: 'sign', x: 44, y: 49, text: 'West road: brute camp' });
  objects.push({ kind: 'sign', x: 57, y: 79, text: 'Dock to Mossreach' });
  objects.push({ kind: 'boat', x: 54, y: 89, w: 3, h: 2 });

  // fence around the training yard (gaps north and south)
  const fence = (x, y) => { objects.push({ kind: 'fence', x, y }); block(x, y); };
  for (let x = L.yard.x0 - 1; x <= L.yard.x1 + 1; x++) {
    if (x !== 52 && x !== 53) { fence(x, L.yard.y0 - 1); fence(x, L.yard.y1 + 1); }
  }
  for (let y = L.yard.y0; y <= L.yard.y1; y++) { fence(L.yard.x0 - 1, y); fence(L.yard.x1 + 1, y); }

  // ring of standing stones round the arena (gap to the south)
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * Math.PI * 2, x = Math.round(L.arena.x + Math.cos(a) * (L.arena.r + 1)), y = Math.round(L.arena.y + Math.sin(a) * (L.arena.r + 1));
    if (y > L.arena.y + 3 && Math.abs(x - 52.5) < 2.5) continue;
    objects.push({ kind: 'rock', x, y, big: true }); block(x, y);
  }

  // --- trees: thin on grassland, dense in Gloomwood. Never on paths, plazas, dirt or the coast.
  const keepClear = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = get(x + dx, y + dy);
      if (t === T.PATH || t === T.STONE || t === T.DIRT || t === T.WATER || t === T.DEEP) return true;
    }
    return solid[idx(x, y)] || solid[idx(x, y + 1)];
  };
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const t = get(x, y); if (t !== T.GRASS && t !== T.FOREST && t !== T.FLOWERS) continue;
    if (keepClear(x, y)) continue;
    if (Math.abs(x - L.catClearing.x) < 4 && Math.abs(y - L.catClearing.y) < 4) continue;
    const r = hash2(x, y, 21);
    const dens = t === T.FOREST ? (fbm(x * 0.12, y * 0.12, 5) > 0.5 ? 0.24 : 0.09) : 0.025;
    // keep the village ring open
    if (t !== T.FOREST && x > 36 && x < 70 && y > 20 && y < 60) continue;
    if (r < dens) {
      objects.push({ kind: 'tree', x, y, dark: t === T.FOREST, v: hash2(x, y, 5) }); block(x, y);
    } else if (r > 0.992 && t !== T.FOREST) { objects.push({ kind: 'rock', x, y }); block(x, y); }
  }
  // a winding gap so the cat clearing is reachable: carve a corridor from the path end
  for (let k = 0; k <= 12; k++) {
    const x = Math.round(90 + (L.catClearing.x - 90) * k / 12), y = Math.round(40 + (L.catClearing.y - 40) * k / 12 + Math.sin(k) * 1.2);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) free(x + dx, y + dy);
  }
  // rocks round the camps
  for (const c of [L.bruteCamp, L.ninjaCamp]) for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2 + 0.3, x = Math.round(c.x + Math.cos(a) * 7), y = Math.round(c.y + Math.sin(a) * 6);
    if (get(x, y) === T.PATH || get(x, y + 1) === T.PATH || get(x + 1, y) === T.PATH) continue;
    objects.push({ kind: 'rock', x, y, big: true }); block(x, y);
  }
  // drop props that ended up on trees removed by corridors
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if ((o.kind === 'tree' || o.kind === 'rock') && !solid[idx(o.x, o.y)]) objects.splice(i, 1);
  }
  // water is solid; dock planks are walkable
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = get(x, y); if (t === T.WATER || t === T.DEEP) block(x, y);
  }
  for (let y = 89; y <= 90; y++) for (let x = 54; x <= 56; x++) block(x, y);   // the moored boat

  // --- who lives where
  const npcs = [
    { id: 'bram',  x: 50.5, y: 33.5 },
    { id: 'willa', x: 64.5, y: 47.5 },
    { id: 'marta', x: 64.5, y: 58.5, shop: true },
    { id: 'nana',  x: 54.8, y: 52.6 },
    { id: 'finn',  x: 48.5, y: 47.5, wander: 3 },
  ];
  const spawns = [];
  const ring = (type, x0, y0, n, r) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; spawns.push({ type, x: x0 + Math.cos(a) * r, y: y0 + Math.sin(a) * r * 0.8 }); } };
  // training dummies in neat rows
  for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) spawns.push({ type: 'dummy', x: 46.5 + k * 4, y: 25.5 + j * 4 });
  spawns.push({ type: 'colossus', x: 53, y: 13 });
  ring('slime', 40, 76, 5, 4); ring('slime', 68, 76, 5, 4);
  ring('bat', 84, 30, 4, 3); ring('bat', 86, 56, 4, 3); ring('bat', 100, 46, 3, 3);
  ring('brute', 20, 52, 4, 3);
  ring('ninja', 26, 24, 3, 2.5);

  return {
    W, H, tiles, solid, objects, npcs, spawns, landmarks: L,
    start: { x: 42.5, y: 45.2 },
    respawn: { x: 50.5, y: 52.5 },
    tileAt: (x, y) => get(Math.floor(x), Math.floor(y)),
    isSolid: (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return !inside(tx, ty) || solid[idx(tx, ty)] === 1; },
  };
}
