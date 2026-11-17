// Draws the game state. Reads from Game, never changes it.
import { T, OX, OY } from '../core/world.js';
import { ENEMIES, SWORDS, ITEMS, NPCS } from '../core/data.js';
import { hash2 } from '../core/util.js';
import * as S from './sprites.js';

const CHUNK = 16;
const GROUND = {
  [T.DEEP]: ['#1b4a6e', '#1d4f73'], [T.WATER]: ['#2a6f97', '#2e779f'], [T.SAND]: ['#e2c98f', '#dcc187'],
  [T.GRASS]: ['#5f9e4a', '#5a9746', '#64a44e'], [T.FLOWERS]: ['#62a24c', '#5c9c48'], [T.PATH]: ['#c8a46e', '#c19d68'],
  [T.FOREST]: ['#2f5a33', '#2b5530', '#33603a'], [T.DIRT]: ['#a5815a', '#9e7b55'], [T.STONE]: ['#a9a39a', '#b1aba2'],
  [T.SNOW]: ['#e9eef5', '#e2e8f0', '#f2f5fa'], [T.ASH]: ['#4a4048', '#433a42', '#4f454d'], [T.LAVA]: ['#e0531f', '#ea6224'],
  [T.SWAMP]: ['#4a5a3a', '#45553a', '#506040'], [T.BOG]: ['#2f4030', '#2b3b2c'], [T.CRYSTAL]: ['#cfe6ee', '#c4dde8', '#d8eef4'],
  [T.STAR]: ['#3b3a78', '#363570', '#42418a'], [T.COBBLE]: ['#9a948c', '#8f8a83', '#a39d95'], [T.CORAL]: ['#f2b8b0', '#eeb0a8'],
};

export class Renderer {
  constructor(canvas, game) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.g = game;
    this.cam = { x: game.player.x, y: game.player.y };
    this.chunks = new Map(); this.splats = []; this.pops = []; this.walk = new Map();
    this.minimap = null;
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = this.cv.clientWidth; this.H = this.cv.clientHeight; this.dpr = dpr;
    this.cv.width = Math.round(this.W * dpr); this.cv.height = Math.round(this.H * dpr);
    // about 13 tiles across a phone held upright, more on wider screens
    const ts = Math.round(Math.max(30, Math.min(52, Math.min(this.W / 12.5, this.H / 13))));
    if (ts !== this.ts) { this.ts = ts; this.chunks.clear(); }
  }
  toScreen(x, y) { return [(x - this.cam.x) * this.ts + this.W / 2, (y - this.cam.y) * this.ts + this.H / 2]; }
  screenToWorld(px, py) { return [(px - this.W / 2) / this.ts + this.cam.x, (py - this.H / 2) / this.ts + this.cam.y]; }

  onEvent(e) {
    const t = this.g.t;
    if (e.type === 'hit') {
      const ent = e.on === 'player' ? null : this.g.enemies.find(x => x.id === e.id);
      const h = e.on === 'player' ? 1.6 : S.enemyHeight(ent ? ent.type : '') * 0.7;
      this.splats.push({ x: e.x + (Math.random() - 0.5) * 0.3, y: e.y, h, dmg: e.dmg, t0: t, on: e.on, id: e.id });
    } else if (e.type === 'pickup') this.pops.push({ x: e.x, y: e.y, t0: t, text: `+${e.n}` , item: e.item });
  }

  // ---------- ground, cached per 16×16 chunk ----------
  chunk(cx, cy) {
    const key = cx + ',' + cy; let ch = this.chunks.get(key);
    if (ch) return ch;
    const ts = this.ts, w = this.g.world, cv = document.createElement('canvas');
    cv.width = cv.height = CHUNK * ts;
    const c = cv.getContext('2d');
    for (let ty = 0; ty < CHUNK; ty++) for (let tx = 0; tx < CHUNK; tx++) {
      const x = cx * CHUNK + tx, y = cy * CHUNK + ty, t = w.tileAt(x, y), cols = GROUND[t] || GROUND[T.DEEP];
      const px = tx * ts, py = ty * ts, h = hash2(x, y, 1);
      c.fillStyle = cols[Math.floor(h * cols.length)]; c.fillRect(px, py, ts, ts);
      const r = (k) => hash2(x, y, k);
      if (t === T.GRASS || t === T.FLOWERS || t === T.FOREST) {
        c.fillStyle = t === T.FOREST ? 'rgba(10,30,15,0.35)' : 'rgba(30,70,30,0.35)';
        for (let k = 0; k < 3; k++) c.fillRect(px + r(k + 3) * ts, py + r(k + 9) * ts, ts * 0.05, ts * 0.16);
        if (t === T.FLOWERS) for (let k = 0; k < 3; k++) {
          c.fillStyle = ['#ffd84a', '#ff8fb1', '#fff4ea', '#b48cff'][Math.floor(r(k + 20) * 4)];
          c.beginPath(); c.arc(px + r(k + 30) * ts, py + r(k + 40) * ts, ts * 0.055, 0, 7); c.fill();
        }
      } else if (t === T.WATER || t === T.DEEP) {
        c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = Math.max(1, ts * 0.04);
        if (h > 0.6) { c.beginPath(); c.moveTo(px + ts * 0.2, py + ts * 0.5); c.quadraticCurveTo(px + ts * 0.4, py + ts * 0.35, px + ts * 0.6, py + ts * 0.5); c.stroke(); }
        // foam where water meets land
        c.fillStyle = 'rgba(255,255,255,0.28)';
        const land = (dx, dy) => { const n = w.tileAt(x + dx, y + dy); return n !== T.WATER && n !== T.DEEP; };
        if (land(0, -1)) c.fillRect(px, py, ts, ts * 0.12);
        if (land(0, 1)) c.fillRect(px, py + ts * 0.88, ts, ts * 0.12);
        if (land(-1, 0)) c.fillRect(px, py, ts * 0.12, ts);
        if (land(1, 0)) c.fillRect(px + ts * 0.88, py, ts * 0.12, ts);
      } else if (t === T.SNOW || t === T.CRYSTAL) {
        c.fillStyle = t === T.SNOW ? 'rgba(160,180,210,0.35)' : 'rgba(120,200,230,0.5)';
        for (let k = 0; k < 2; k++) c.fillRect(px + r(k + 3) * ts, py + r(k + 9) * ts, ts * 0.12, ts * 0.05);
        if (t === T.CRYSTAL && h > 0.8) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(px + ts * 0.5, py + ts * 0.3, ts * 0.06, ts * 0.06); }
      } else if (t === T.ASH || t === T.SWAMP || t === T.CORAL) {
        c.fillStyle = t === T.ASH ? 'rgba(255,120,60,0.18)' : t === T.SWAMP ? 'rgba(20,30,15,0.35)' : 'rgba(255,255,255,0.35)';
        for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(px + r(k + 5) * ts, py + r(k + 7) * ts, ts * 0.045, 0, 7); c.fill(); }
      } else if (t === T.LAVA) {
        c.fillStyle = 'rgba(255,214,90,0.55)';
        for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(px + r(k + 5) * ts, py + r(k + 7) * ts, ts * 0.12, 0, 7); c.fill(); }
        const solidN = (dx, dy) => w.tileAt(x + dx, y + dy) !== T.LAVA;
        c.fillStyle = 'rgba(40,20,20,0.55)';
        if (solidN(0, -1)) c.fillRect(px, py, ts, ts * 0.1); if (solidN(0, 1)) c.fillRect(px, py + ts * 0.9, ts, ts * 0.1);
        if (solidN(-1, 0)) c.fillRect(px, py, ts * 0.1, ts); if (solidN(1, 0)) c.fillRect(px + ts * 0.9, py, ts * 0.1, ts);
      } else if (t === T.BOG) {
        c.fillStyle = 'rgba(140,170,100,0.35)';
        if (h > 0.5) { c.beginPath(); c.arc(px + ts * 0.4, py + ts * 0.5, ts * 0.1, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(80,100,60,0.6)';
        const dry = (dx, dy) => w.tileAt(x + dx, y + dy) !== T.BOG;
        if (dry(0, -1)) c.fillRect(px, py, ts, ts * 0.1); if (dry(0, 1)) c.fillRect(px, py + ts * 0.9, ts, ts * 0.1);
        if (dry(-1, 0)) c.fillRect(px, py, ts * 0.1, ts); if (dry(1, 0)) c.fillRect(px + ts * 0.9, py, ts * 0.1, ts);
      } else if (t === T.STAR) {
        c.fillStyle = 'rgba(20,20,60,0.4)';
        for (let k = 0; k < 3; k++) c.fillRect(px + r(k + 3) * ts, py + r(k + 9) * ts, ts * 0.05, ts * 0.16);
        if (h > 0.7) { c.fillStyle = '#fff3a8'; c.beginPath(); c.arc(px + r(31) * ts, py + r(32) * ts, ts * 0.04, 0, 7); c.fill(); }
      } else if (t === T.COBBLE) {
        c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1;
        c.strokeRect(px + 0.5, py + 0.5, ts / 2, ts / 2); c.strokeRect(px + ts / 2 + 0.5, py + ts / 2 + 0.5, ts / 2 - 1, ts / 2 - 1);
      } else if (t === T.STONE) {
        c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1; c.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
      } else if (t === T.PATH || t === T.DIRT || t === T.SAND) {
        c.fillStyle = 'rgba(0,0,0,0.08)';
        for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(px + r(k + 5) * ts, py + r(k + 7) * ts, ts * 0.05, 0, 7); c.fill(); }
      }
    }
    // dock planks
    if (cx * CHUNK <= 56 + OX && cx * CHUNK + CHUNK > 54 + OX && cy * CHUNK + CHUNK > 80 + OY) {
      for (let y = 80 + OY; y <= 88 + OY; y++) for (let x = 54 + OX; x <= 56 + OX; x++) {
        const px = (x - cx * CHUNK) * ts, py = (y - cy * CHUNK) * ts;
        if (px < 0 || py < 0 || px >= CHUNK * ts || py >= CHUNK * ts) continue;
        c.fillStyle = '#8a5f38'; c.fillRect(px, py, ts, ts);
        c.fillStyle = '#6b4a2b'; c.fillRect(px, py + ts * 0.45, ts, ts * 0.08); c.fillRect(px, py + ts * 0.95, ts, ts * 0.05);
      }
    }
    this.chunks.set(key, cv);
    return cv;
  }

  buildMinimap() {
    const w = this.g.world, cv = document.createElement('canvas'), k = 3;
    cv.width = w.W * k; cv.height = w.H * k;
    const c = cv.getContext('2d');
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) { c.fillStyle = (GROUND[w.tileAt(x, y)] || GROUND[T.DEEP])[0]; c.fillRect(x * k, y * k, k, k); }
    for (const o of w.objects) {
      c.fillStyle = o.kind === 'tree' ? TREE_MINI[o.style] || '#2e5e2a' : o.kind === 'house' ? '#e8dcc4' : o.kind === 'rock' ? '#777' : null;
      if (!c.fillStyle || o.kind === 'fence') continue;
      c.fillRect(o.x * k, o.y * k, (o.w || 1) * k, (o.h || 1) * k);
    }
    this.minimap = cv;
  }
  drawMinimap(mc) {
    if (!this.minimap) this.buildMinimap();
    const c = mc.getContext('2d'), R = mc.width / 2, k = 3, zoom = 1.3, p = this.g.player;
    c.clearRect(0, 0, mc.width, mc.height);
    c.save(); c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.clip();
    c.fillStyle = '#1b4a6e'; c.fillRect(0, 0, mc.width, mc.height);
    c.translate(R, R); c.scale(zoom, zoom); c.translate(-p.x * k, -p.y * k);
    c.drawImage(this.minimap, 0, 0);
    const dot = (x, y, col, r = 2.2) => { c.fillStyle = col; c.beginPath(); c.arc(x * k, y * k, r, 0, 7); c.fill(); };
    for (const e of this.g.enemies) if (!e.dead) dot(e.x, e.y, '#ff4b3b', 1.8);
    for (const n of this.g.npcs) dot(n.x, n.y, '#ffd84a');
    if (!this.g.flags.catHome) dot(this.g.cat.x, this.g.cat.y, this.g.quests.cat.stage >= 1 ? '#ff9a3a' : 'rgba(0,0,0,0)');
    c.restore();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(R, R, 3, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,244,234,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.stroke();
  }

  // ---------- frame ----------
  draw(dt) {
    const c = this.c, g = this.g, p = g.player, ts = this.ts;
    // camera eases toward Rels, clamped to the map
    this.cam.x += (p.x - this.cam.x) * Math.min(1, dt * 8);
    this.cam.y += (p.y - 0.4 - this.cam.y) * Math.min(1, dt * 8);
    const hw = this.W / 2 / ts, hh = this.H / 2 / ts;
    this.cam.x = Math.max(hw, Math.min(g.world.W - hw, this.cam.x));
    this.cam.y = Math.max(hh, Math.min(g.world.H - hh, this.cam.y));
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#1b4a6e'; c.fillRect(0, 0, this.W, this.H);
    const x0 = this.cam.x - hw - 1, y0 = this.cam.y - hh - 1, x1 = this.cam.x + hw + 1, y1 = this.cam.y + hh + 3;
    for (let cy = Math.max(0, Math.floor(y0 / CHUNK)); cy <= Math.floor(y1 / CHUNK); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / CHUNK)); cx <= Math.floor(x1 / CHUNK); cx++) {
        if (cx * CHUNK >= g.world.W || cy * CHUNK >= g.world.H) continue;
        const [sx, sy] = this.toScreen(cx * CHUNK, cy * CHUNK);
        c.drawImage(this.chunk(cx, cy), Math.round(sx), Math.round(sy));
      }

    // collect everything that stands up, then draw back to front
    const list = [];
    const inView = (x, y, m = 2) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + 4;
    for (const o of g.world.objectsIn(x0 - 8, y0 - 2, x1 + 2, y1 + 4)) {
      if (!inView(o.x, o.y, (o.w || 1) + 2)) continue;
      const by = o.kind === 'house' ? o.y + o.h : o.kind === 'well' ? o.y + 1.9 : o.kind === 'boat' ? o.y + 1.4 : o.y + 0.85;
      list.push([by, 'obj', o]);
    }
    for (const d of g.drops) if (inView(d.x, d.y)) list.push([d.y - 0.3, 'drop', d]);
    for (const e of g.enemies) if (inView(e.x, e.y, 4) && (!e.dead || g.t - e.deathT < 0.6)) list.push([e.y, 'enemy', e]);
    for (const n of g.npcs) if (inView(n.x, n.y)) list.push([n.y, 'npc', n]);
    if (!g.flags.catHome && inView(g.cat.x, g.cat.y)) list.push([g.cat.y, 'cat', g.cat]);
    list.push([p.y, 'player', p]);
    list.sort((a, b) => a[0] - b[0]);

    // target ring goes under everything
    const tgt = p.target && g.enemies.find(e => e.id === p.target);
    if (tgt) {
      const [sx, sy] = this.toScreen(tgt.x, tgt.y), r = (tgt.type === 'colossus' ? 1.0 : 0.45) * ts;
      c.strokeStyle = '#ffd84a'; c.lineWidth = 2; c.setLineDash([6, 4]); c.lineDashOffset = -g.t * 20;
      c.beginPath(); c.ellipse(sx, sy, r, r * 0.4, 0, 0, 7); c.stroke(); c.setLineDash([]);
    }

    for (const [, kind, o] of list) {
      if (kind === 'obj') this.drawObj(o);
      else if (kind === 'drop') this.at(o.x, o.y, () => { S.shadow(c, 0.2, 0.06, 0.2); c.translate(0, -0.15 - Math.sin(g.t * 3 + o.id) * 0.04); S.itemIcon(c, ITEMS[o.item].icon, 0.28); });
      else if (kind === 'enemy') this.drawEnemy(o);
      else if (kind === 'npc') this.drawNpc(o);
      else if (kind === 'cat') this.at(o.x, o.y, () => S.cat(c, g.t, o.moving, S.dirOf(p.x - o.x, 0)));
      else this.drawPlayer();
    }

    // floating hit splats (red = hit, blue = miss)
    this.splats = this.splats.filter(s => g.t - s.t0 < 1.1);
    for (const s of this.splats) {
      let x = s.x, y = s.y;
      if (s.on === 'player') { x = p.x; y = p.y; }
      else { const e = g.enemies.find(e => e.id === s.id); if (e && !e.dead) { x = e.x; y = e.y; } }
      const [sx, sy] = this.toScreen(x, y - s.h), k = (g.t - s.t0) / 1.1, r = ts * 0.32;
      c.globalAlpha = k > 0.75 ? 1 - (k - 0.75) * 4 : 1;
      c.fillStyle = s.dmg ? (s.on === 'player' ? '#c8243c' : '#b4231d') : '#2f6fd6';
      c.beginPath();
      for (let a = 0; a < 10; a++) { const rad = a % 2 ? r * 0.82 : r; c.lineTo(sx + Math.cos(a * Math.PI / 5) * rad, sy - k * 6 + Math.sin(a * Math.PI / 5) * rad); }
      c.closePath(); c.fill();
      c.font = `700 ${Math.round(ts * 0.36)}px 'Trebuchet MS', system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.fillText(String(s.dmg), sx, sy - k * 6 + 1);
      c.globalAlpha = 1;
    }
    this.pops = this.pops.filter(q => g.t - q.t0 < 1);
    for (const q of this.pops) {
      const k = (g.t - q.t0), [sx, sy] = this.toScreen(q.x, q.y - 0.6 - k * 0.8);
      c.globalAlpha = 1 - k; c.font = `700 ${Math.round(ts * 0.34)}px system-ui, sans-serif`; c.textAlign = 'center';
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeText(q.text, sx, sy);
      c.fillStyle = q.item === 'coins' ? '#ffcf3a' : '#fff'; c.fillText(q.text, sx, sy); c.globalAlpha = 1;
    }
    // red flash when knocked out
    if (p.dead) { c.fillStyle = `rgba(120,0,0,${0.35 + 0.1 * Math.sin(g.t * 6)})`; c.fillRect(0, 0, this.W, this.H); }
  }

  at(x, y, fn) {
    const [sx, sy] = this.toScreen(x, y), c = this.c;
    c.save(); c.translate(sx, sy); c.scale(this.ts, this.ts); fn(); c.restore();
  }
  drawObj(o) {
    const c = this.c, t = this.g.t;
    if (o.kind === 'tree') {
      // see-through when Rels walks behind it
      const p = this.g.player, behind = Math.abs(o.x + 0.5 - p.x) < 1.3 && o.y + 0.85 > p.y && o.y + 0.85 - p.y < 2.2;
      if (behind) c.globalAlpha = 0.45;
      this.at(o.x + 0.5, o.y + 0.85, () => S.tree(c, o, t));
      c.globalAlpha = 1;
    }
    else if (o.kind === 'rock') this.at(o.x + 0.5, o.y + 0.8, () => S.rock(c, o));
    else if (o.kind === 'fence') this.at(o.x + 0.5, o.y + 0.8, () => S.fence(c));
    else if (o.kind === 'sign') this.at(o.x + 0.5, o.y + 0.8, () => S.sign(c, o.text));
    else if (o.kind === 'well') this.at(o.x + 1, o.y + 1.9, () => S.well(c));
    else if (o.kind === 'boat') this.at(o.x + 1.5, o.y + 1.4, () => S.boat(c, t));
    else if (o.kind === 'house') {
      this.at(o.x, o.y + o.h, () => S.house(c, o));
    }
  }
  walkPhase(id, x, y, dt) {
    let w = this.walk.get(id); if (!w) { w = { x, y, ph: 0 }; this.walk.set(id, w); }
    w.ph += Math.hypot(x - w.x, y - w.y) * 5.5; w.x = x; w.y = y; return w.ph;
  }
  drawPlayer() {
    const g = this.g, p = g.player, sw = SWORDS[p.sword];
    const swing = g.t - p.swingT < 0.35 ? (g.t - p.swingT) / 0.35 : -1;
    const ph = this.walkPhase('rels', p.x, p.y);
    this.at(p.x, p.y, () => {
      if (p.dead) { this.c.rotate(-1.3); this.c.translate(0.4, 0.2); }
      S.person(this.c, { dir: S.dirOf(p.fx, p.fy), walk: ph, moving: p.moving, t: g.t,
        shirt: S.REL.shirt, hair: S.REL.hair, skin: S.REL.skin, pants: S.REL.pants, shoes: S.REL.crocs, flowers: true,
        ponytail: true, tie: S.REL.tie, catPrint: true, sword: sw, swing, catHat: g.flags.catHome });
    });
  }
  drawNpc(n) {
    const g = this.g, look = NPC_LOOK[n.id], ph = this.walkPhase(n.id, n.x, n.y);
    this.at(n.x, n.y, () => S.person(this.c, { dir: S.dirOf(n.fx, n.fy), walk: ph, moving: n.moving, t: g.t, shoes: '#3a2a20', pants: '#4a3e5a', ...look }));
    // quest marker: ! = new quest, ? = ready to hand in
    const mark = questMark(g, n.id);
    const [sx, sy] = this.toScreen(n.x, n.y - (look.kid ? 1.75 : 2.0));
    const c = this.c, fs = Math.round(this.ts * 0.42);
    c.font = `700 ${Math.round(this.ts * 0.3)}px system-ui, sans-serif`; c.textAlign = 'center';
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(look.name, sx, sy + this.ts * 0.15); c.fillStyle = '#fff4ea'; c.fillText(look.name, sx, sy + this.ts * 0.15);
    if (mark) {
      const b = Math.sin(g.t * 4) * 3;
      c.font = `900 ${fs}px system-ui, sans-serif`; c.lineWidth = 4; c.strokeStyle = '#14090f';
      c.strokeText(mark, sx, sy - fs * 0.6 + b); c.fillStyle = mark === '?' ? '#7fe0ff' : '#ffd84a'; c.fillText(mark, sx, sy - fs * 0.6 + b);
    }
  }
  drawEnemy(e) {
    const g = this.g, c = this.c, d = e.d;
    const hurt = g.t - e.hurtT < 0.15 ? 1 - (g.t - e.hurtT) / 0.15 : 0;
    this.at(e.x, e.y, () => {
      if (e.dead) { const k = (g.t - e.deathT) / 0.6; c.globalAlpha = 1 - k; c.translate(0, -k * 0.3); c.rotate(k * 0.8); }
      const f = (e.hue ? `hue-rotate(${e.hue}deg) ` : '') + (hurt ? `brightness(${1 + hurt * 2})` : '');
      if (f) c.filter = f;
      S.enemy(c, e, g.t, hurt, e.type === 'bat' ? '#c9a6ff' : '#ffb36b');
      c.filter = 'none';
    });
    if (e.dead) return;
    const targeted = g.player.target === e.id, showBar = e.hp < d.hp || targeted;
    if (!showBar) return;
    const [sx, sy] = this.toScreen(e.x, e.y - S.enemyHeight(e.type) - 0.15), bw = this.ts * (e.type === 'colossus' ? 1.6 : 0.9);
    c.fillStyle = '#b4231d'; c.fillRect(sx - bw / 2, sy, bw, 5);
    c.fillStyle = '#2fbf4a'; c.fillRect(sx - bw / 2, sy, bw * Math.max(0, e.hp / d.hp), 5);
    if (targeted) {
      c.font = `700 ${Math.round(this.ts * 0.3)}px system-ui, sans-serif`; c.textAlign = 'center';
      const lvl = d.lvl, cl = g.combatLevel(), col = lvl > cl + 5 ? '#ff6a5a' : lvl < cl - 5 ? '#7fe07f' : '#ffd84a';
      const label = `${d.name} (lvl ${lvl})`;
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeText(label, sx, sy - 6); c.fillStyle = col; c.fillText(label, sx, sy - 6);
    }
  }
}

const TREE_MINI = { oak: '#2e5e2a', dark: '#183020', pine: '#2a4a3a', dead: '#3a3428', palm: '#3a7a3a', crystal: '#8fd0e8', charred: '#2a2224', star: '#8a7ad8' };
const NPC_LOOK = Object.fromEntries(Object.entries(NPCS).map(([k, v]) => [k, { ...v, ponytail: k === 'willa' }]));

export function questMark(g, id) {
  const q = g.quests;
  if (id === 'bram') {
    if (q.training.stage === 0 || q.training.stage === 2) return q.training.stage ? '?' : '!';
    if (q.training.stage === 3 && q.test.stage === 0) return '!';
    if (q.test.stage === 2 && g.count('headband')) return '?';
  }
  if (id === 'willa') { if (q.wings.stage === 0) return '!'; if (q.wings.stage === 1 && g.count('wing') >= 3) return '?'; }
  if (id === 'nana') { if (q.cat.stage === 0) return '!'; if (q.cat.stage === 2) return '?'; }
  return null;
}
