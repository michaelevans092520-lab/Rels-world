// The game simulation. Pure logic, no DOM and no drawing, so a server can run the same code later.
// Each frame:  game.step(dt, input)  → then read game.events (hit splats, messages, sounds, dialogs).

import { TICK, ITEMS, SWORDS, ENEMIES, SHOP, QUESTS, scaledEnemy } from './data.js';
import { buildWorld, OX, OY } from './world.js';
import { rng, randInt, clamp, levelFor, XP_TABLE } from './util.js';

const SKILLS = ['attack', 'strength', 'defence', 'hitpoints'];
const STYLES = { accurate: 'attack', aggressive: 'strength', defensive: 'defence' };
const INV_SIZE = 24;
const MELEE = 1.45;                  // reach in tiles

export class Game {
  constructor(saved) {
    this.world = buildWorld();
    this.r = rng(Date.now() & 0xffffffff);
    this.t = 0; this.tickAcc = 0; this.tick = 0;
    this.events = [];
    this.nextId = 1;
    const w = this.world;
    this.player = {
      id: 'rels', x: w.start.x, y: w.start.y, fx: 0, fy: 1, moving: false, swingT: -9,
      hp: 10, xp: { attack: 0, strength: 0, defence: 0, hitpoints: XP_TABLE[10] },
      style: 'accurate', inv: Array(INV_SIZE).fill(null), coins: 25,
      swords: ['old'], sword: 'old', target: null, lastSwing: -99, dead: 0, regen: 0,
    };
    this.quests = {}; for (const k in QUESTS) this.quests[k] = { stage: 0, count: 0 };
    this.flags = { catFollowing: false, catHome: false, seenIntro: false };
    this.cat = { x: w.landmarks.catClearing.x + 0.5, y: w.landmarks.catClearing.y + 0.5, found: false };
    this.enemies = w.spawns.map(s => this.makeEnemy(s));
    this.npcs = w.npcs.map(n => ({ ...n, hx: n.x, hy: n.y, fx: 0, fy: 1, wt: 0 }));
    this.drops = [];
    if (saved) this.load(saved);
    this.player.hp = Math.min(this.player.hp, this.maxHp());
  }

  // ---------- helpers ----------
  emit(e) { this.events.push(e); }
  msg(text, color) { this.emit({ type: 'msg', text, color }); }
  lvl(skill) { return levelFor(this.player.xp[skill]); }
  maxHp() { return this.lvl('hitpoints'); }
  combatLevel() {
    const a = this.lvl('attack'), s = this.lvl('strength'), d = this.lvl('defence'), h = this.lvl('hitpoints');
    return Math.floor(0.25 * (d + h) + 0.325 * (a + s));
  }
  curSword() { return SWORDS[this.player.sword] || SWORDS.old; }
  makeEnemy(s) {
    const d = scaledEnemy(s.type, s.lvl, s.name);
    return { id: this.nextId++, type: s.type, d, hue: s.hue || 0, x: s.x, y: s.y, sx: s.x, sy: s.y, hp: d.hp, fx: 0, fy: 1,
             aggro: false, lastHit: -99, dead: false, respawnAt: 0, hurtT: -9, wander: null, wanderT: this.r() * 4 };
  }

  // ---------- inventory ----------
  count(id) { return this.player.inv.reduce((n, s) => n + (s && s.id === id ? s.n : 0), 0); }
  addItem(id, n = 1) {
    if (id === 'coins') { this.player.coins += n; return true; }
    const inv = this.player.inv, def = ITEMS[id];
    if (def.stack) { const s = inv.find(s => s && s.id === id); if (s) { s.n += n; return true; } }
    for (let k = 0; k < (def.stack ? 1 : n); k++) {
      const i = inv.indexOf(null); if (i < 0) { this.msg('Your bag is full.', '#ff8a7a'); return false; }
      inv[i] = { id, n: def.stack ? n : 1 };
    }
    return true;
  }
  removeItem(id, n = 1) {
    const inv = this.player.inv;
    for (let i = 0; i < inv.length && n > 0; i++) {
      const s = inv[i]; if (!s || s.id !== id) continue;
      const take = Math.min(n, s.n); s.n -= take; n -= take; if (s.n <= 0) inv[i] = null;
    }
  }
  useSlot(i) {
    const s = this.player.inv[i]; if (!s) return;
    const def = ITEMS[s.id];
    if (def.heal) {
      if (this.player.hp >= this.maxHp()) { this.msg('You are already at full health.'); return; }
      this.player.hp = Math.min(this.maxHp(), this.player.hp + def.heal);
      this.removeItem(s.id, 1);
      this.msg(`You ${s.id === 'potion' ? 'drink the potion' : 'eat the apple'}. +${def.heal} HP`, '#8ff0a0');
      this.emit({ type: 'sfx', name: 'heal' });
    } else this.msg(def.info || def.name);
  }
  sellSlot(i) {
    const s = this.player.inv[i]; if (!s) return;
    const def = ITEMS[s.id]; if (!def.value || def.quest) { this.msg("Marta won't buy that."); return; }
    const gain = def.value * s.n; this.player.coins += gain; this.player.inv[i] = null;
    this.msg(`Sold ${s.n} × ${def.name} for ${gain} coins.`, '#ffcf3a'); this.emit({ type: 'sfx', name: 'coin' });
  }
  buy(entry) {
    const p = this.player;
    if (entry.sword) {
      const sw = SWORDS[entry.sword];
      if (p.swords.includes(entry.sword)) { p.sword = entry.sword; this.msg(`${sw.name} equipped.`); return; }
      if (p.coins < sw.price) { this.msg('Not enough coins.', '#ff8a7a'); return; }
      p.coins -= sw.price; p.swords.push(entry.sword); p.sword = entry.sword;
      this.msg(`Bought and equipped ${sw.name}!`, '#ffcf3a');
    } else {
      if (p.coins < entry.price) { this.msg('Not enough coins.', '#ff8a7a'); return; }
      if (this.addItem(entry.id, 1)) { p.coins -= entry.price; this.msg(`Bought 1 × ${ITEMS[entry.id].name}.`); }
    }
    this.emit({ type: 'sfx', name: 'coin' });
  }
  equip(id) { if (this.player.swords.includes(id)) { this.player.sword = id; this.msg(`${SWORDS[id].name} equipped.`); } }
  setStyle(s) { if (STYLES[s]) { this.player.style = s; this.msg(`Combat style: ${s} (trains ${STYLES[s]}).`); } }

  giveXp(skill, amt) {
    const p = this.player, before = this.lvl(skill);
    p.xp[skill] += Math.round(amt);
    this.emit({ type: 'xp', skill, amt: Math.round(amt) });
    const after = this.lvl(skill);
    if (after > before) {
      this.emit({ type: 'level', skill, lvl: after });
      this.msg(`Congratulations! Your ${skill} level is now ${after}.`, '#ffd84a');
      if (skill === 'hitpoints') p.hp += after - before;
    }
  }

  // ---------- movement & collision ----------
  moveBody(b, dx, dy, r = 0.3) {
    const w = this.world;
    const blocked = (x, y) => w.isSolid(x - r, y - r) || w.isSolid(x + r, y - r) || w.isSolid(x - r, y + r) || w.isSolid(x + r, y + r);
    if (dx && !blocked(b.x + dx, b.y)) b.x += dx;
    if (dy && !blocked(b.x, b.y + dy)) b.y += dy;
  }
  face(b, dx, dy) { const l = Math.hypot(dx, dy); if (l > 0.01) { b.fx = dx / l; b.fy = dy / l; } }

  // ---------- main step ----------
  step(dt, input) {
    this.t += dt;
    const p = this.player;
    if (p.dead) {
      if (this.t > p.dead) this.respawn();
    } else {
      this.updatePlayer(dt, input);
    }
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateNpcs(dt);
    this.updateCat(dt);
    const reg = this.world.regionAt(p.x, p.y);
    if (reg && reg.id !== this.regionId) { const first = !this.regionId; this.regionId = reg.id; if (!first) this.emit({ type: 'region', region: reg }); }
    this.tickAcc += dt;
    while (this.tickAcc >= TICK) { this.tickAcc -= TICK; this.tick++; this.onTick(); }
    // drop pickup by walking over it
    if (!p.dead) for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (Math.hypot(d.x - p.x, d.y - p.y) < 0.75 && this.t - d.t > 0.4) {
        if (this.addItem(d.item, d.n)) {
          this.drops.splice(i, 1);
          this.emit({ type: 'pickup', item: d.item, n: d.n, x: d.x, y: d.y });
          this.emit({ type: 'sfx', name: d.item === 'coins' ? 'coin' : 'pickup' });
          if (d.item === 'wing' && this.quests.wings.stage === 1 && this.count('wing') >= 3) this.msg('You have 3 bat wings. Take them to Willa.', '#9fd8ff');
        }
      } else if (this.t - d.t > 120) this.drops.splice(i, 1);
    }
  }

  updatePlayer(dt, input) {
    const p = this.player;
    let mx = input.mx || 0, my = input.my || 0;
    const mag = Math.min(1, Math.hypot(mx, my));
    const tgt = p.target && this.enemies.find(e => e.id === p.target && !e.dead);
    if (p.target && !tgt) p.target = null;
    if (mag > 0.15) {
      // joystick moves you; walking well away from the target drops it
      const sp = 4.4 * mag;
      this.moveBody(p, mx / Math.hypot(mx, my) * sp * dt, my / Math.hypot(mx, my) * sp * dt);
      this.face(p, mx, my); p.moving = true;
      if (tgt && Math.hypot(tgt.x - p.x, tgt.y - p.y) > 7) p.target = null;
    } else if (tgt) {
      // auto-walk to the target (like clicking a monster in OSRS)
      const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy);
      this.face(p, dx, dy);
      if (d > MELEE - 0.25) { this.moveBody(p, dx / d * 4.4 * dt, dy / d * 4.4 * dt); p.moving = true; } else p.moving = false;
    } else p.moving = false;

    if (input.attack) this.pickTarget();
    if (input.tapEnemy) { const e = this.enemies.find(e => e.id === input.tapEnemy && !e.dead); if (e) { p.target = e.id; this.emit({ type: 'target', id: e.id }); } }
    if (input.interact) this.interact();
    if (input.tapNpc) this.talk(input.tapNpc);
  }

  pickTarget() {
    const p = this.player; let best = null, bd = 6.5;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      // prefer things in front of Rels
      const score = d - (d > 0 ? (dx * p.fx + dy * p.fy) / d : 0) * 0.8;
      if (d < 6.5 && score < bd) { bd = score; best = e; }
    }
    if (best) { p.target = best.id; this.emit({ type: 'target', id: best.id }); }
    else if (this.t - p.swingT > 0.4) { p.swingT = this.t; this.emit({ type: 'sfx', name: 'swish' }); }
  }

  onTick() {
    const p = this.player;
    // player swings on ticks; sword speed = ticks between swings
    const tgt = p.target && this.enemies.find(e => e.id === p.target && !e.dead);
    if (tgt && !p.dead && Math.hypot(tgt.x - p.x, tgt.y - p.y) <= MELEE && this.tick - p.lastSwing >= this.curSword().spd) {
      p.lastSwing = this.tick; p.swingT = this.t;
      this.playerHit(tgt);
    }
    // enemies swing back
    for (const e of this.enemies) {
      if (e.dead || p.dead) continue;
      const d = e.d;
      if (!d.maxHit || !e.aggro) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) <= MELEE + 0.1 && this.tick - e.lastHit >= 3) {
        e.lastHit = this.tick; e.swingT = this.t;
        this.enemyHit(e);
      }
    }
    // slow natural healing
    if (!p.dead && p.hp < this.maxHp() && ++p.regen >= 10) { p.regen = 0; p.hp++; }
    // respawns
    for (const e of this.enemies) if (e.dead && this.t >= e.respawnAt) {
      Object.assign(e, { x: e.sx, y: e.sy, hp: e.d.hp, dead: false, aggro: false, hurtT: -9 });
      this.emit({ type: 'spawn', id: e.id });
    }
  }

  playerHit(e) {
    const p = this.player, d = e.d, sw = this.curSword();
    const sb = p.style === 'accurate' ? 3 : p.style === 'aggressive' ? 0 : 1;
    const att = (this.lvl('attack') + 8 + sb) * (sw.acc + 64), def = (d.def + 9) * 64;
    const chance = att > def ? 1 - (def + 2) / (2 * (att + 1)) : att / (2 * (def + 1));
    const strB = p.style === 'aggressive' ? 3 : 0;
    const max = 1 + Math.floor((this.lvl('strength') + 8 + strB) * (sw.dmg * 10 + 64) / 640);
    let dmg = this.r() < chance ? randInt(this.r, 1, max) : 0;
        dmg = Math.min(dmg, e.hp);
    e.hp -= dmg; e.hurtT = this.t; e.aggro = true;
    this.emit({ type: 'hit', x: e.x, y: e.y, dmg, on: 'enemy', id: e.id });
    this.emit({ type: 'sfx', name: dmg ? 'hit' : 'miss' });
    if (dmg) { this.giveXp(STYLES[p.style], dmg * 4); this.giveXp('hitpoints', dmg * 1.33); }
    if (e.hp <= 0) this.killEnemy(e);
  }

  enemyHit(e) {
    const p = this.player, d = e.d;
    const att = (d.lvl + 9) * 64, def = (this.lvl('defence') + 9 + (p.style === 'defensive' ? 3 : 0)) * 64;
    const chance = att > def ? 1 - (def + 2) / (2 * (att + 1)) : att / (2 * (def + 1));
    const dmg = this.r() < chance ? randInt(this.r, 1, d.maxHit) : 0;
    p.hp -= dmg;
    this.emit({ type: 'hit', x: p.x, y: p.y, dmg, on: 'player' });
    if (dmg) this.emit({ type: 'sfx', name: 'hurt' });
    if (p.hp <= 0) this.die();
  }

  killEnemy(e) {
    const d = e.d;
    e.dead = true; e.respawnAt = this.t + d.respawn; e.deathT = this.t;
    if (this.player.target === e.id) this.player.target = null;
    this.giveXp(STYLES[this.player.style], d.xp);
    this.emit({ type: 'kill', id: e.id, x: e.x, y: e.y, kind: e.type });
    this.emit({ type: 'sfx', name: d.boss ? 'boss' : 'kill' });
    for (const [item, a, b, chance] of d.drops) {
      if (this.r() > chance) continue;
      if (item === 'trophy' && (this.quests.test.stage !== 1 || this.count('trophy'))) continue;
      this.drops.push({ id: this.nextId++, item, n: randInt(this.r, a, b), x: e.x + (this.r() - 0.5) * 0.8, y: e.y + (this.r() - 0.5) * 0.6, t: this.t });
    }
    const q = this.quests.training;
    if (e.type === 'dummy' && q.stage === 1) {
      q.count++;
      this.msg(`Dummies broken: ${Math.min(q.count, 5)} / 5`, '#9fd8ff');
      if (q.count >= 5) { q.stage = 2; this.msg('Training done! Go back to Coach Bram.', '#9fd8ff'); this.emit({ type: 'quest' }); }
    }
    if (e.type === 'colossus') {
      this.msg('The Straw Colossus falls apart!', '#ffd84a');
      if (this.quests.test.stage === 1) { this.quests.test.stage = 2; this.msg('Something dropped from the straw. Pick it up!', '#9fd8ff'); this.emit({ type: 'quest' }); }
    }
  }

  die() {
    const p = this.player;
    p.hp = 0; p.dead = this.t + 2.5; p.target = null;
    for (const e of this.enemies) e.aggro = false;
    this.emit({ type: 'died' });
    this.msg('Oh dear, you were knocked out! You wake up in the village.', '#ff8a7a');
  }
  respawn() {
    const p = this.player, w = this.world;
    p.dead = 0; p.hp = this.maxHp(); p.x = w.respawn.x; p.y = w.respawn.y;
  }

  updateEnemy(e, dt) {
    if (e.dead) return;
    const d = e.d, p = this.player;
    if (!d.speed) return;
    const dp = Math.hypot(p.x - e.x, p.y - e.y), home = Math.hypot(e.sx - e.x, e.sy - e.y);
    if (!p.dead && d.aggro && dp < d.aggro && this.combatLevel() < d.lvl * 2 + 4) e.aggro = true;
    if (e.aggro && (p.dead || home > 11 || dp > 13)) { e.aggro = false; e.hp = d.hp; }
    let tx = null, ty = null, sp = d.speed;
    if (e.aggro && !p.dead) { if (dp > MELEE - 0.3) { tx = p.x; ty = p.y; } else this.face(e, p.x - e.x, p.y - e.y); }
    else if (home > 0.5 && !e.wander) { tx = e.sx; ty = e.sy; }
    else {
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 2 + this.r() * 4;
        e.wander = this.r() < 0.6 ? { x: e.sx + (this.r() - 0.5) * 4, y: e.sy + (this.r() - 0.5) * 4 } : null;
      }
      if (e.wander) { tx = e.wander.x; ty = e.wander.y; sp *= 0.45; }
    }
    if (tx !== null) {
      const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy);
      if (l < 0.15) { e.wander = null; e.moving = false; return; }
      const ox = e.x, oy = e.y;
      this.moveBody(e, dx / l * sp * dt, dy / l * sp * dt, e.type === 'colossus' ? 0.6 : 0.3);
      this.face(e, dx, dy); e.moving = true;
      if (Math.abs(e.x - ox) + Math.abs(e.y - oy) < 1e-4) e.wander = null;   // bumped into something
    } else e.moving = false;
  }

  updateNpcs(dt) {
    for (const n of this.npcs) {
      if (!n.wander) { this.face(n, this.player.x - n.x, this.player.y - n.y); continue; }
      n.wt -= dt;
      if (n.wt <= 0) { n.wt = 2 + this.r() * 3; n.goal = { x: n.hx + (this.r() - 0.5) * n.wander * 2, y: n.hy + (this.r() - 0.5) * n.wander * 2 }; }
      if (n.goal) {
        const dx = n.goal.x - n.x, dy = n.goal.y - n.y, l = Math.hypot(dx, dy);
        if (l > 0.1) { this.moveBody(n, dx / l * 1.6 * dt, dy / l * 1.6 * dt); this.face(n, dx, dy); n.moving = true; }
        else { n.goal = null; n.moving = false; }
      }
    }
  }

  updateCat(dt) {
    const c = this.cat, p = this.player;
    if (this.flags.catHome) {
      // cat rides on Rels' head now; keep its position in sync for drawing
      c.x = p.x; c.y = p.y; return;
    }
    if (this.flags.catFollowing) {
      const dx = p.x - p.fx * 0.9 - c.x, dy = p.y - p.fy * 0.9 - c.y, l = Math.hypot(dx, dy);
      if (l > 6) { c.x = p.x; c.y = p.y; }
      else if (l > 0.3) { const sp = Math.min(6, l * 4); c.x += dx / l * sp * dt; c.y += dy / l * sp * dt; c.moving = true; }
      else c.moving = false;
    }
  }

  // ---------- talking & interacting ----------
  nearestNpc(r = 2) {
    let best = null, bd = r;
    for (const n of this.npcs) { const d = Math.hypot(n.x - this.player.x, n.y - this.player.y); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  interactHint() {
    const p = this.player;
    const n = this.nearestNpc(); if (n) return { label: 'Talk', npc: n.id };
    if (!this.flags.catFollowing && !this.flags.catHome && Math.hypot(this.cat.x - p.x, this.cat.y - p.y) < 2) return { label: 'Pet cat' };
    for (const o of this.world.objectsIn(p.x - 3, p.y - 3, p.x + 3, p.y + 3)) {
      if ((o.kind === 'sign' && Math.hypot(o.x + 0.5 - p.x, o.y + 0.5 - p.y) < 1.8) ||
          (o.kind === 'boat' && Math.hypot(o.x + 1.5 - p.x, o.y - p.y) < 2.5) ||
          (o.kind === 'well' && Math.hypot(o.x + 1 - p.x, o.y + 1 - p.y) < 2)) return { label: o.kind === 'sign' ? 'Read' : 'Look', obj: o };
    }
    return null;
  }
  interact() {
    const h = this.interactHint(); if (!h) return;
    if (h.npc) return this.talk(h.npc);
    if (h.label === 'Pet cat') return this.findCat();
    const o = h.obj;
    if (o.kind === 'sign') this.msg(`The sign says: "${o.text}"`);
    else if (o.kind === 'well') this.msg('You peer into the well. A coin glints far below. Not worth the climb.');
    else if (o.kind === 'boat') this.dialog('Boat', this.quests.test.stage === 3
      ? ["A little sailboat bobs at the dock.", "You don't need it to reach Mossreach: the road north goes all the way there on foot."]
      : ["A little sailboat bobs at the dock.", "One day it might carry you to faraway lands. For now the whole world is one big continent, so walk!"]);
  }
  findCat() {
    const q = this.quests.cat;
    if (q.stage === 0) { this.msg('A ginger cat! It hisses and hides. Maybe Nana Pell knows whose it is.'); return; }
    if (q.stage === 1) {
      q.stage = 2; this.flags.catFollowing = true;
      this.dialog('Your cat', ['*mrrp!*', 'Your cat rubs against your legs, then trots after you.', 'Take it back to Nana Pell in the village.']);
      this.emit({ type: 'sfx', name: 'meow' }); this.emit({ type: 'quest' });
    }
  }
  dialog(name, lines, extra = {}) { this.emit({ type: 'dialog', name, lines, ...extra }); }

  talk(id) {
    const n = this.npcs.find(n => n.id === id); if (!n) return;
    if (Math.hypot(n.x - this.player.x, n.y - this.player.y) > 2.5) { this.msg('Walk closer to talk.'); return; }
    const Q = this.quests, p = this.player, say = (lines, extra) => this.dialog(npcName(id), lines, { npc: id, ...extra });
    if (id === 'bram') {
      const tr = Q.training, ts = Q.test;
      if (tr.stage === 0) { tr.stage = 1; tr.count = 0; this.emit({ type: 'quest' });
        return say(["Rels! Ready to train? Anyone heading out into the big world needs to know how to use a sword.",
          "Break 5 straw dummies. Tap Attack near one, and keep swinging.", "Quest started: Training Day"]); }
      if (tr.stage === 1) return say([`${tr.count} of 5 dummies so far. Keep at it!`, 'Tip: change your combat style in the Skills panel to train different skills.']);
      if (tr.stage === 2) { tr.stage = 3; if (!p.swords.includes('iron')) p.swords.push('iron'); p.sword = 'iron'; p.coins += 50; this.giveXp('attack', 120);
        this.emit({ type: 'quest' }); this.emit({ type: 'sfx', name: 'quest' });
        return say(['Not bad at all! Here, take this. An Iron Edge, sharper than that old blade.', 'Quest complete: Training Day', 'Reward: Iron Edge, 50 coins, 120 Attack XP']); }
      if (ts.stage === 0) { ts.stage = 1; this.emit({ type: 'quest' });
        return say(['One last test before you head out into the world.', 'North of the yard is the old arena. The Straw Colossus lives there. Big, slow, and it hits hard.',
          'Bring potions from Marta, and train up first if you need to. Quest started: The Final Test']); }
      if (ts.stage === 1) return say(['The Colossus is in the arena, north of the yard. Bring potions!']);
      if (ts.stage === 2) {
        if (!this.count('trophy')) return say(["You beat it? Then where's the proof? Something must have dropped. Go and look in the arena."]);
        ts.stage = 3; this.removeItem('trophy', 1); if (!p.swords.includes('tide')) p.swords.push('tide'); p.coins += 300; this.giveXp('strength', 400);
        this.emit({ type: 'quest' }); this.emit({ type: 'sfx', name: 'quest' });
        return say(["The Colossus's horn! You really did it. Nobody has beaten that old straw heap in years.",
          "You're ready for the rest of the world now. Take my old Tide Cutter. You've earned it.",
          'Quest complete: The Final Test', 'Reward: Tide Cutter, 300 coins, 400 Strength XP']);
      }
      return say(["You're ready, Rels. The whole world is out there. Mossreach is up the road north. Be careful!"]);
    }
    if (id === 'willa') {
      const q = Q.wings;
      if (q.stage === 0) { q.stage = 1; this.emit({ type: 'quest' });
        return say(["Hello, dear. I make potions, but I'm out of bat wings.", 'The bats in Gloomwood (east of here) drop them. Bring me 3 and I will pay you in potions.', 'Quest started: Wings for Willa']); }
      if (q.stage === 1) {
        if (this.count('wing') < 3) return say([`You have ${this.count('wing')} of 3 bat wings. The bats live in Gloomwood, east of the village.`]);
        q.stage = 3; this.removeItem('wing', 3); this.addItem('potion', 3); p.coins += 100;
        this.emit({ type: 'quest' }); this.emit({ type: 'sfx', name: 'quest' });
        return say(['Wonderful! These will brew nicely.', 'Quest complete: Wings for Willa', 'Reward: 3 potions, 100 coins']);
      }
      if (p.hp < this.maxHp()) { p.hp = this.maxHp(); this.emit({ type: 'sfx', name: 'heal' }); return say(['Let me patch you up. There, good as new!']); }
      return say(['Stay safe out there. Potions heal you in a pinch. Tap them in your bag.']);
    }
    if (id === 'marta') { this.emit({ type: 'shop' }); return say(["Welcome to Marta's! Have a look. I'll also buy what you find out there."], { shop: true }); }
    if (id === 'nana') {
      const q = Q.cat;
      if (q.stage === 0) { q.stage = 1; this.emit({ type: 'quest' });
        return say(["Rels, sweetie! That ginger cat of yours ran off chasing a butterfly.", 'I saw it run deep into Gloomwood, past where the path ends. Could you fetch it?', 'Quest started: Where Did the Cat Go?']); }
      if (q.stage === 1) return say(['Gloomwood is east. Follow the path, and keep going past where it stops.']);
      if (q.stage === 2) { q.stage = 3; this.flags.catFollowing = false; this.flags.catHome = true; p.coins += 80; this.addItem('apple', 5);
        this.emit({ type: 'quest' }); this.emit({ type: 'sfx', name: 'meow' });
        return say(["There it is! Oh, look, it's climbing up onto your head.", "I think it's decided to come everywhere with you now.", 'Quest complete: Where Did the Cat Go?', 'Reward: 80 coins, 5 apples, a cat hat']); }
      return say(['That cat looks very happy up there.']);
    }
    if (id === 'finn') {
      const lines = [
        ["Rels! Is it true you're going to fight ninjas?! So cool."],
        ['Did you know? Brutes have shields. You need a good sword to get through.'],
        ['I heard ninjas hide just outside Mossreach, up the road north. Way too scary for me.'],
        ['My uncle says the whole world is one big land. Walk far enough and you reach snow, or volcanoes!'],
        ['The fishing boat at the dock has a hole in it. Captain says it will be fixed soon.'],
      ];
      return say(lines[Math.floor(this.r() * lines.length)]);
    }
  }

  // ---------- save / load ----------
  serialize() {
    const p = this.player;
    return { v: 2, p: { x: p.x, y: p.y, hp: p.hp, xp: p.xp, style: p.style, inv: p.inv, coins: p.coins, swords: p.swords, sword: p.sword },
             q: this.quests, f: this.flags };
  }
  load(s) {
    try {
      if (!s || (s.v !== 1 && s.v !== 2)) return;
      const p = this.player;
      Object.assign(p, s.p, { xp: { ...p.xp, ...s.p.xp } });
      if (s.v === 1) { p.x += OX; p.y += OY; }   // old saves were made on the small Ember Key map
      if (p.inv.length !== INV_SIZE) p.inv = [...p.inv, ...Array(INV_SIZE).fill(null)].slice(0, INV_SIZE);
      if (this.world.isSolid(p.x, p.y)) { p.x = this.world.start.x; p.y = this.world.start.y; }
      for (const k in s.q) if (this.quests[k]) this.quests[k] = s.q[k];
      Object.assign(this.flags, s.f);
      for (const sl of p.inv) if (sl && sl.id === 'headband') sl.id = 'trophy';   // renamed item
    } catch (e) { /* bad save: start fresh */ }
  }
}

export const npcName = id => ({ bram: 'Coach Bram', willa: 'Willa', marta: 'Marta', nana: 'Nana Pell', finn: 'Finn' })[id] || id;
export { SKILLS, STYLES, INV_SIZE, SHOP };
