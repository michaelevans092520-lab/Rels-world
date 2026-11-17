// Pangea: one connected continent made of 8 regions (see REGIONS in data.js).
// Generated once from fixed noise, then hand-made places (Ember Key village, Mossreach city, camps,
// roads) are stamped on top. Everything is in tile units. No DOM here, so a server can build the same map.

import { fbm, hash2 } from './util.js';
import { REGIONS, REGION_MONSTERS } from './data.js';

export const T = {
  WATER: 0, SAND: 1, GRASS: 2, PATH: 3, FOREST: 4, DIRT: 5, STONE: 6, FLOWERS: 7, DEEP: 8,
  SNOW: 9, ASH: 10, LAVA: 11, SWAMP: 12, BOG: 13, CRYSTAL: 14, STAR: 15, COBBLE: 16, CORAL: 17,
};
export const MAP_W = 300, MAP_H = 250;
// Ember Key's hand-made layout was designed on a small map; this shifts it onto Pangea.
export const OX = 98, OY = 140;
const SOLID_TILES = new Set([T.WATER, T.DEEP, T.LAVA, T.BOG]);

export function buildWorld() {
  const W = MAP_W, H = MAP_H;
  const tiles = new Uint8Array(W * H), solid = new Uint8Array(W * H), region = new Uint8Array(W * H).fill(255);
  const objects = [];
  const idx = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x, y, t) => { if (inside(x, y)) tiles[idx(x, y)] = t; };
  const get = (x, y) => inside(x, y) ? tiles[idx(x, y)] : T.DEEP;
  const regAt = (x, y) => inside(x, y) ? region[idx(x, y)] : 255;
  const block = (x, y) => { if (inside(x, y)) solid[idx(x, y)] = 1; };
  const free = (x, y) => { if (inside(x, y)) solid[idx(x, y)] = 0; };
  const R = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]));

  // ---------- 1. land shape + which region each tile belongs to ----------
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wob = (fbm(x * 0.05, y * 0.05, 3) - 0.5);
    let best = 0, bd = 1e9;
    REGIONS.forEach((r, i) => {
      const d = Math.hypot(x - r.cx, y - r.cy) / r.r + wob * 0.35;
      if (d < bd) { bd = d; best = i; }
    });
    const m = bd / 1.45 + wob * 0.25;            // < 1 is land
    const i = idx(x, y);
    if (m > 1.08) { tiles[i] = T.DEEP; continue; }
    if (m > 1.0) { tiles[i] = T.WATER; continue; }
    region[i] = best;
    const id = REGIONS[best].id, n = fbm(x * 0.12, y * 0.12, 9), coast = m > 0.93;
    let t = T.GRASS;
    if (id === 'ember') t = coast ? T.SAND : n > 0.68 ? T.FLOWERS : T.GRASS;
    else if (id === 'mossreach') t = coast ? T.SAND : n > 0.7 ? T.FLOWERS : T.GRASS;
    else if (id === 'saltglass') t = coast ? T.SAND : n > 0.58 ? T.SAND : T.CRYSTAL;
    else if (id === 'duskfen') t = coast ? T.SWAMP : fbm(x * 0.09, y * 0.09, 17) > 0.62 ? T.BOG : T.SWAMP;
    else if (id === 'frostmere') t = T.SNOW;
    else if (id === 'cinder') t = coast ? T.ASH : fbm(x * 0.1, y * 0.1, 23) > 0.64 ? T.LAVA : T.ASH;
    else if (id === 'coral') t = coast ? T.SAND : fbm(x * 0.1, y * 0.1, 29) > 0.68 ? T.WATER : n > 0.5 ? T.CORAL : T.SAND;
    else if (id === 'starfall') t = n > 0.72 ? T.FLOWERS : T.STAR;
    tiles[i] = t;
  }

  const fill = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  const disc = (x0, y0, r, t) => { for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if ((x - x0) ** 2 + (y - y0) ** 2 <= r * r) set(x, y, t); };
  // 2-wide L-shaped road: along x first, then along y
  const path = (x0, y0, x1, y1) => {
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    const lay = (x, y) => { const t = get(x, y); if (t !== T.STONE && t !== T.COBBLE && t !== T.DIRT) set(x, y, T.PATH); };
    for (let x = x0; ; x += sx) { lay(x, y0); lay(x, y0 + 1); if (x === x1) break; }
    for (let y = y0; ; y += sy) { lay(x1, y); lay(x1 + 1, y); if (y === y1) break; }
  };

  // ---------- 2. Ember Key (starter region): south coast, dock, beaches ----------
  const E = (x, y) => [x + OX, y + OY];
  for (let y = 205; y < H; y++) for (let x = 112; x < 210; x++) {
    if (regAt(x, y) !== R.ember) continue;
    const edge = 221 + (fbm(x * 0.15, y * 0.1, 5) - 0.5) * 6;
    if (y > edge) { set(x, y, y > edge + 4 ? T.DEEP : T.WATER); region[idx(x, y)] = 255; }
    else if (y > edge - 4) set(x, y, T.SAND);
  }
  // Gloomwood: the dark forest in the east of Ember Key
  for (let y = 150; y < 218; y++) for (let x = 166; x < 215; x++) {
    if (regAt(x, y) !== R.ember) continue;
    const t = get(x, y); if (t !== T.GRASS && t !== T.FLOWERS) continue;
    if ((x - 170) / 6 + (fbm(x * 0.2, y * 0.2, 4) - 0.5) * 2 > 0.5) set(x, y, T.FOREST);
  }
  const L = {
    plaza: { x0: 46 + OX, y0: 46 + OY, x1: 59 + OX, y1: 55 + OY },
    yard: { x0: 43 + OX, y0: 22 + OY, x1: 62 + OX, y1: 35 + OY },
    arena: { x: 53 + OX, y: 14 + OY, r: 5 },
    catClearing: { x: 96 + OX, y: 38 + OY },
    dock: { x: 55 + OX, y: 84 + OY },
  };
  fill(L.plaza.x0, L.plaza.y0, L.plaza.x1, L.plaza.y1, T.STONE);
  fill(L.yard.x0, L.yard.y0, L.yard.x1, L.yard.y1, T.DIRT);
  disc(L.arena.x, L.arena.y, L.arena.r, T.DIRT);
  disc(L.catClearing.x, L.catClearing.y, 4, T.FLOWERS);
  path(...E(52, 36), ...E(52, 45));          // plaza → yard
  path(...E(52, 19), ...E(52, 21));          // yard → arena
  path(...E(60, 50), ...E(73, 50));          // plaza → Gloomwood edge
  path(...E(73, 50), ...E(90, 40));          // into the woods
  path(...E(27, 50), ...E(45, 50));          // west road
  path(...E(52, 56), ...E(52, 79));          // plaza → dock
  for (let y = 79; y <= 88; y++) for (let x = 54; x <= 56; x++) { set(x + OX, y + OY, T.PATH); region[idx(x + OX, y + OY)] = R.ember; }

  // ---------- 3. roads joining every region ----------
  path(137, 190, 137, 112);   // Ember Key west road → north to Mossreach
  path(137, 112, 150, 112);
  path(150, 112, 150, 50);    // Mossreach → Starfall
  path(150, 112, 230, 132);   // Mossreach → Coral Drift
  path(230, 132, 226, 54);    // Coral Drift → Cinder Isle
  path(125, 190, 78, 188);    // Ember Key → Saltglass
  path(78, 188, 70, 122);     // Saltglass → Duskfen
  path(70, 122, 76, 52);      // Duskfen → Frostmere
  path(76, 52, 150, 50);      // Frostmere → Starfall
  path(150, 50, 226, 54);     // Starfall → Cinder Isle

  // ---------- 4. buildings & props ----------
  const house = (x, y, w, h, roof, name, door = Math.floor(w / 2)) => {
    objects.push({ kind: 'house', x, y, w, h, roof, name, door });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) block(xx, yy);
    set(x + door, y + h, T.PATH);
  };
  const H0 = (x, y, ...a) => house(x + OX, y + OY, ...a);
  H0(39, 39, 6, 5, '#b4473a', "Rels' house");
  H0(61, 41, 6, 5, '#c8506a', "Willa's clinic");
  H0(61, 52, 7, 5, '#d49a2a', "Marta's store");
  H0(39, 54, 5, 4, '#5a7ab0', 'Pell cottage');
  H0(64, 27, 4, 4, '#3a6b4a', "Bram's hut");
  objects.push({ kind: 'well', x: 52 + OX, y: 50 + OY, w: 2, h: 2 });
  for (const [a, b] of [[52, 50], [53, 50], [52, 51], [53, 51]]) block(a + OX, b + OY);
  const sign = (x, y, text) => objects.push({ kind: 'sign', x, y, text });
  sign(51 + OX, 36 + OY, 'Training Yard');
  sign(72 + OX, 48 + OY, 'Gloomwood. Bats!');
  sign(44 + OX, 48 + OY, 'West: Saltglass. North: Mossreach');
  sign(57 + OX, 78 + OY, 'Dock');
  objects.push({ kind: 'boat', x: 54 + OX, y: 89 + OY, w: 3, h: 2 });

  const fence = (x, y) => { objects.push({ kind: 'fence', x, y }); block(x, y); };
  for (let x = L.yard.x0 - 1; x <= L.yard.x1 + 1; x++) if (x !== 52 + OX && x !== 53 + OX) { fence(x, L.yard.y0 - 1); fence(x, L.yard.y1 + 1); }
  for (let y = L.yard.y0; y <= L.yard.y1; y++) { fence(L.yard.x0 - 1, y); fence(L.yard.x1 + 1, y); }
  const stoneRing = (cx, cy, r, gapBelow) => {
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * (r + 1)), y = Math.round(cy + Math.sin(a) * (r + 1));
      if (gapBelow && y > cy + 3 && Math.abs(x - cx + 0.5) < 2.5) continue;
      if (get(x, y) === T.PATH) continue;
      objects.push({ kind: 'rock', x, y, big: true }); block(x, y);
    }
  };
  stoneRing(L.arena.x, L.arena.y, L.arena.r, true);

  // Mossreach: city of archers, plus a brute camp and a ninja hideout outside it
  const MX = 150, MY = 112;
  disc(MX, MY, 11, T.COBBLE);
  house(MX - 11, MY - 11, 6, 5, '#6b4a8a', 'Archery hall');
  house(MX + 4, MY - 11, 6, 5, '#3a6b8a', 'Fletcher');
  house(MX - 11, MY + 5, 5, 4, '#8a5a3a', 'Inn');
  house(MX + 5, MY + 6, 6, 4, '#4a7a4a', 'Market');
  sign(MX - 2, MY - 2, 'Mossreach · Lvl 10-20 · City of Archers');
  disc(124, 126, 5, T.DIRT); stoneRing(124, 126, 6, false);
  disc(170, 98, 4, T.DIRT);

  // a signpost at the heart of every other region
  for (const r of REGIONS) {
    if (r.id === 'ember' || r.id === 'mossreach') continue;
    disc(r.cx, r.cy, 2, T.PATH);
    sign(r.cx - 2, r.cy - 2, `${r.name} · Lvl ${r.lvl[0]}-${r.lvl[1]} · ${r.style}`);
  }

  // ---------- 5. trees, rocks and region decorations ----------
  const STYLE = { ember: 'oak', mossreach: 'oak', saltglass: 'crystal', duskfen: 'dead', frostmere: 'pine', cinder: 'charred', coral: 'palm', starfall: 'star' };
  const DENS = { ember: 0.025, mossreach: 0.03, saltglass: 0.035, duskfen: 0.06, frostmere: 0.08, cinder: 0.03, coral: 0.035, starfall: 0.03 };
  const near = (x, y, d, test) => { for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (test(get(x + dx, y + dy))) return true; return false; };
  const hard = t => t === T.PATH || t === T.STONE || t === T.DIRT || t === T.COBBLE || SOLID_TILES.has(t);
  const villageRing = (x, y) => x > 36 + OX && x < 70 + OX && y > 18 + OY && y < 60 + OY;
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const ri = regAt(x, y); if (ri === 255) continue;
    const t = get(x, y), id = REGIONS[ri].id;
    if (t === T.SAND && id !== 'coral') continue;
    if (hard(t) || near(x, y, 1, hard) || solid[idx(x, y)] || solid[idx(x, y + 1)]) continue;
    if (Math.abs(x - L.catClearing.x) < 4 && Math.abs(y - L.catClearing.y) < 4) continue;
    if (id === 'ember' && t !== T.FOREST && villageRing(x, y)) continue;
    if (Math.hypot(x - MX, y - MY) < 15) continue;
    const r = hash2(x, y, 21);
    let dens = DENS[id];
    if (t === T.FOREST) dens = fbm(x * 0.12, y * 0.12, 5) > 0.5 ? 0.24 : 0.09;
    if (id === 'frostmere' && fbm(x * 0.07, y * 0.07, 41) > 0.6) dens = 0.22;     // pine forests
    if (r < dens) { objects.push({ kind: 'tree', x, y, style: t === T.FOREST ? 'dark' : STYLE[id], v: hash2(x, y, 5) }); block(x, y); }
    else if (r > 0.992 - (id === 'cinder' || id === 'starfall' ? 0.006 : 0)) { objects.push({ kind: 'rock', x, y, big: r > 0.997 }); block(x, y); }
  }
  // winding gap to the cat clearing in Gloomwood
  for (let k = 0; k <= 12; k++) {
    const x = Math.round(90 + OX + (L.catClearing.x - 90 - OX) * k / 12), y = Math.round(40 + OY + (L.catClearing.y - 40 - OY) * k / 12 + Math.sin(k) * 1.2);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) free(x + dx, y + dy);
  }
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if ((o.kind === 'tree' || o.kind === 'rock') && !solid[idx(o.x, o.y)]) objects.splice(i, 1);
  }
  for (let i = 0; i < W * H; i++) if (SOLID_TILES.has(tiles[i])) solid[i] = 1;
  for (let y = 89; y <= 90; y++) for (let x = 54; x <= 56; x++) block(x + OX, y + OY);   // the moored boat

  // spatial index so drawing and lookups only touch nearby props
  const GRID = 16, grid = new Map();
  for (const o of objects) {
    const k = Math.floor(o.x / GRID) + ',' + Math.floor(o.y / GRID);
    if (!grid.has(k)) grid.set(k, []); grid.get(k).push(o);
  }
  const objectsIn = (x0, y0, x1, y1) => {
    const out = [];
    for (let cy = Math.floor(y0 / GRID) - 1; cy <= Math.floor(y1 / GRID); cy++)
      for (let cx = Math.floor(x0 / GRID) - 1; cx <= Math.floor(x1 / GRID); cx++) { const a = grid.get(cx + ',' + cy); if (a) for (const o of a) out.push(o); }
    return out;
  };

  // ---------- 6. people and monsters ----------
  const npcs = [
    { id: 'bram',  x: 50.5 + OX, y: 33.5 + OY },
    { id: 'willa', x: 64.5 + OX, y: 47.5 + OY },
    { id: 'marta', x: 64.5 + OX, y: 58.5 + OY, shop: true },
    { id: 'nana',  x: 54.8 + OX, y: 52.6 + OY },
    { id: 'finn',  x: 48.5 + OX, y: 47.5 + OY, wander: 3 },
  ];
  const spawns = [];
  const ring = (s, x0, y0, n, r) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; spawns.push({ ...s, x: x0 + Math.cos(a) * r, y: y0 + Math.sin(a) * r * 0.8 }); } };
  for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) spawns.push({ type: 'dummy', x: 46.5 + k * 4 + OX, y: 25.5 + j * 4 + OY });
  spawns.push({ type: 'colossus', x: 53 + OX, y: 13 + OY });
  ring({ type: 'slime' }, 40 + OX, 75 + OY, 5, 4); ring({ type: 'slime' }, 68 + OX, 75 + OY, 5, 4);
  ring({ type: 'bat' }, 84 + OX, 30 + OY, 4, 3); ring({ type: 'bat' }, 86 + OX, 56 + OY, 4, 3); ring({ type: 'bat' }, 100 + OX, 46 + OY, 3, 3);
  // the brutes and ninjas that used to live on Ember Key now guard Mossreach's outskirts
  ring({ type: 'brute' }, 124, 126, 4, 3);
  ring({ type: 'ninja' }, 170, 98, 3, 2.5);
  // region monsters: scattered on open, walkable ground
  const open = (x, y) => !solid[idx(Math.floor(x), Math.floor(y))] && !hard(get(Math.floor(x), Math.floor(y)));
  REGIONS.forEach((r, ri) => {
    const list = REGION_MONSTERS[r.id]; if (!list) return;
    list.forEach((m, mi) => {
      let placed = 0;
      for (let tries = 0; placed < m.n && tries < 400; tries++) {
        const a = hash2(ri * 7 + mi, tries, 61) * Math.PI * 2, d = 6 + hash2(ri, tries * 3 + mi, 62) * r.r * 0.9;
        const x = Math.floor(r.cx + Math.cos(a) * d) + 0.5, y = Math.floor(r.cy + Math.sin(a) * d) + 0.5;
        if (regAt(Math.floor(x), Math.floor(y)) !== ri || !open(x, y)) continue;
        if (r.id === 'mossreach' && Math.hypot(x - MX, y - MY) < 13) continue;
        spawns.push({ type: m.type, lvl: m.lvl, name: m.name, hue: m.hue || 0, x, y }); placed++;
      }
    });
  });

  // nudge any spawn that landed in a tree, rock or water onto the nearest open tile
  for (const s of spawns) {
    if (!solid[idx(Math.floor(s.x), Math.floor(s.y))]) continue;
    let done = false;
    for (let r = 1; r <= 6 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
      const x = Math.floor(s.x) + dx, y = Math.floor(s.y) + dy;
      if (inside(x, y) && !solid[idx(x, y)] && regAt(x, y) !== 255) { s.x = x + 0.5; s.y = y + 0.5; done = true; }
    }
  }

  return {
    W, H, tiles, solid, region, objects, objectsIn, npcs, spawns, landmarks: L,
    start: { x: 42.5 + OX, y: 45.2 + OY },
    respawn: { x: 50.5 + OX, y: 52.5 + OY },
    tileAt: (x, y) => get(Math.floor(x), Math.floor(y)),
    regionAt: (x, y) => { const i = regAt(Math.floor(x), Math.floor(y)); return i === 255 ? null : REGIONS[i]; },
    isSolid: (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return !inside(tx, ty) || solid[idx(tx, ty)] === 1; },
  };
}
