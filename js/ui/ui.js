// HUD and menus (DOM). Reads game state and calls game methods; holds no game rules itself.
import { ITEMS, SWORDS, RARITY, QUESTS } from '../core/data.js';
import { SKILLS, SHOP } from '../core/game.js';
import { XP_TABLE } from '../core/util.js';
import { itemIcon } from '../render/sprites.js';
import { play } from './audio.js';

const $ = id => document.getElementById(id);
const SKILL_NAME = { attack: 'Attack', strength: 'Strength', defence: 'Defence', hitpoints: 'Hitpoints' };

export class UI {
  constructor(game, input) {
    this.g = game; this.input = input;
    this.dlg = null; this.panel = null; this.log = [];
    this.iconCache = {};
    $('btnAttack').addEventListener('pointerdown', e => { e.preventDefault(); input.press('attack'); });
    $('btnAct').addEventListener('pointerdown', e => { e.preventDefault(); input.press('interact'); });
    $('btnBag').addEventListener('click', () => this.toggle('bag'));
    $('btnQuests').addEventListener('click', () => this.toggle('quests'));
    $('btnSkills').addEventListener('click', () => this.toggle('skills'));
    $('btnPotion').addEventListener('pointerdown', e => { e.preventDefault(); this.quickHeal(); });
    $('dialog').addEventListener('click', () => this.nextLine());
    $('sheet').addEventListener('click', e => this.onSheetClick(e));
    $('sheetClose').addEventListener('click', () => this.close());
    input.onKey = k => {
      if (this.dlg && (k === ' ' || k === 'enter' || k === 'e')) { this.nextLine(); return; }
      if (k === 'b' || k === 'i') this.toggle('bag');
      else if (k === 'q') this.toggle('quests');
      else if (k === 'k') this.toggle('skills');
      else if (k === 'h') this.quickHeal();
      else if (k === 'escape') { if (this.dlg) this.closeDialog(); else this.close(); }
    };
  }
  get blocking() { return !!this.dlg || !!this.panel; }

  // ---------- events from the game ----------
  onEvent(e) {
    const g = this.g;
    if (e.type === 'msg') this.addLog(e.text, e.color);
    else if (e.type === 'sfx') play(e.name);
    else if (e.type === 'xp') this.xpDrop(e.skill, e.amt);
    else if (e.type === 'level') { play('level'); this.toast(`${SKILL_NAME[e.skill]} level ${e.lvl}!`); }
    else if (e.type === 'dialog') this.openDialog(e);
    else if (e.type === 'shop') this.pendingShop = true;
    else if (e.type === 'quest') { if (this.panel === 'quests') this.render(); }
    else if (e.type === 'died') this.toast('Knocked out!');
  }
  addLog(text, color = '#fff4ea') {
    const el = document.createElement('div'); el.className = 'line'; el.textContent = text; el.style.color = color;
    const box = $('log'); box.appendChild(el);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => el.classList.add('fade'), 6000);
    setTimeout(() => el.remove(), 7000);
  }
  xpDrop(skill, amt) {
    const el = document.createElement('div'); el.className = 'xpdrop'; el.textContent = `+${amt} ${SKILL_NAME[skill]}`;
    $('xpdrops').appendChild(el); setTimeout(() => el.remove(), 1600);
  }
  toast(text) {
    const el = $('toast'); el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  // ---------- dialog ----------
  openDialog(e) {
    this.close();
    this.dlg = { ...e, i: 0 };
    $('dialog').hidden = false; this.showLine(); play('talk');
  }
  showLine() {
    const d = this.dlg, line = d.lines[d.i];
    $('dlgName').textContent = d.name;
    const txt = $('dlgText'); txt.textContent = line;
    txt.className = /^Quest (started|complete)|^Reward/.test(line) ? 'quest' : '';
    $('dlgMore').textContent = d.i < d.lines.length - 1 ? 'Tap to continue ▸' : (d.shop ? 'Tap to open the shop ▸' : 'Tap to close');
  }
  nextLine() {
    const d = this.dlg; if (!d) return;
    if (d.i < d.lines.length - 1) { d.i++; this.showLine(); play('talk'); }
    else { const shop = d.shop; this.closeDialog(); if (shop) this.open('shop'); }
  }
  closeDialog() { this.dlg = null; $('dialog').hidden = true; }

  // ---------- panels ----------
  toggle(name) { if (this.panel === name) this.close(); else this.open(name); }
  open(name) { if (this.dlg) this.closeDialog(); this.panel = name; $('sheetWrap').hidden = false; this.render(); }
  close() { this.panel = null; $('sheetWrap').hidden = true; }
  quickHeal() {
    const g = this.g, i = g.player.inv.findIndex(s => s && (s.id === 'potion' || s.id === 'apple'));
    if (i < 0) { this.addLog('No potions or apples in your bag.', '#ff8a7a'); return; }
    g.useSlot(i); if (this.panel === 'bag') this.render();
  }

  icon(id, px = 40) {
    const key = id + px; if (this.iconCache[key]) return this.iconCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = px * 2;
    const c = cv.getContext('2d'); c.translate(px, px * 1.05); c.scale(px * 2.3, px * 2.3); itemIcon(c, id, 0.42);
    return (this.iconCache[key] = cv.toDataURL());
  }
  swordGlyph(sw) { return `<span class="glyph" style="--c:${sw.color}"></span>`; }

  render() {
    const g = this.g, p = g.player, body = $('sheetBody');
    $('sheetTitle').textContent = { bag: 'Bag', quests: 'Quests', skills: 'Skills', shop: "Marta's Store" }[this.panel];
    if (this.panel === 'bag' || this.panel === 'shop') {
      const selling = this.panel === 'shop';
      const slots = p.inv.map((s, i) => s
        ? `<button class="slot" data-a="${selling ? 'sell' : 'use'}" data-i="${i}" title="${ITEMS[s.id].name}"><img src="${this.icon(ITEMS[s.id].icon)}" alt="">${s.n > 1 ? `<b>${s.n}</b>` : ''}</button>`
        : `<div class="slot empty"></div>`).join('');
      const swords = p.swords.map(id => { const sw = SWORDS[id];
        return `<button class="sw ${p.sword === id ? 'on' : ''}" data-a="equip" data-id="${id}" style="--r:${RARITY[sw.rarity]}">${this.swordGlyph(sw)}<span>${sw.name}</span><small>${p.sword === id ? 'Equipped' : 'Tap to equip'}</small></button>`; }).join('');
      let shop = '';
      if (selling) {
        shop = `<p class="eyebrow">Buy</p><div class="shoplist">${SHOP.map((e, k) => {
          if (e.sword) { const sw = SWORDS[e.sword], own = p.swords.includes(e.sword);
            return `<button class="row" data-a="buy" data-k="${k}" ${!own && p.coins < sw.price ? 'disabled' : ''}>${this.swordGlyph(sw)}<span class="nm" style="color:${RARITY[sw.rarity]}">${sw.name}</span><small>Max hit +${sw.dmg} · ${sw.spd === 1 ? 'fast' : 'normal'} speed</small><em>${own ? (p.sword === e.sword ? 'Equipped' : 'Equip') : '🪙 ' + sw.price}</em></button>`; }
          const it = ITEMS[e.id];
          return `<button class="row" data-a="buy" data-k="${k}" ${p.coins < e.price ? 'disabled' : ''}><img src="${this.icon(it.icon)}" alt=""><span class="nm">${it.name}</span><small>${it.info}</small><em>🪙 ${e.price}</em></button>`;
        }).join('')}</div><p class="eyebrow">Sell: tap an item in your bag</p>`;
      }
      body.innerHTML = `${shop}<div class="coinsrow">🪙 <b>${p.coins}</b> coins</div><div class="inv">${slots}</div>
        ${selling ? '' : `<p class="eyebrow">Swords</p><div class="swords">${swords}</div><p class="hint">Tap a potion or apple to heal. Tap anything else to read about it.</p>`}`;
    } else if (this.panel === 'quests') {
      body.innerHTML = Object.entries(QUESTS).map(([k, q]) => {
        const st = g.quests[k], done = st.stage === 3, locked = q.requires && g.quests[q.requires].stage !== 3 && st.stage === 0;
        const step = done ? 'Complete!' : locked ? q.steps[0] : q.steps[Math.min(st.stage, 2)];
        const prog = k === 'training' && st.stage === 1 ? ` (${st.count}/5)` : k === 'wings' && st.stage === 1 ? ` (${Math.min(3, g.count('wing'))}/3)` : '';
        return `<div class="quest ${done ? 'done' : st.stage ? 'active' : ''}"><span class="qn">${done ? '✓ ' : ''}${q.name}</span><span class="qs">${step}${prog}</span></div>`;
      }).join('');
    } else if (this.panel === 'skills') {
      const rows = SKILLS.map(s => {
        const xp = p.xp[s], l = g.lvl(s), a = XP_TABLE[l], b = XP_TABLE[Math.min(99, l + 1)], k = l >= 99 ? 1 : (xp - a) / (b - a);
        return `<div class="skill"><span class="sn">${SKILL_NAME[s]}</span><span class="sl">${l}</span><i><b style="width:${k * 100}%"></b></i><small>${xp} XP · ${l >= 99 ? 'max' : (b - xp) + ' to go'}</small></div>`;
      }).join('');
      const st = (k, label, trains) => `<button class="style ${p.style === k ? 'on' : ''}" data-a="style" data-k="${k}"><b>${label}</b><small>Trains ${trains}</small></button>`;
      body.innerHTML = `<div class="cl">Combat level <b>${g.combatLevel()}</b> · HP ${p.hp}/${g.maxHp()}</div>${rows}
        <p class="eyebrow">Combat style</p><div class="styles">${st('accurate', 'Accurate', 'Attack')}${st('aggressive', 'Aggressive', 'Strength')}${st('defensive', 'Defensive', 'Defence')}</div>
        <p class="hint">Attack helps you land hits. Strength raises your max hit. Defence helps you dodge. Hitpoints trains as you fight.</p>`;
    }
  }
  onSheetClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const g = this.g, a = b.dataset.a;
    if (a === 'use') g.useSlot(+b.dataset.i);
    else if (a === 'sell') g.sellSlot(+b.dataset.i);
    else if (a === 'equip') g.equip(b.dataset.id);
    else if (a === 'buy') g.buy(SHOP[+b.dataset.k]);
    else if (a === 'style') g.setStyle(b.dataset.k);
    this.render();
  }

  // ---------- per-frame HUD ----------
  update() {
    const g = this.g, p = g.player, max = g.maxHp();
    $('hpText').textContent = `${Math.max(0, p.hp)}/${max}`;
    $('hpFill').style.width = Math.max(0, p.hp / max * 100) + '%';
    $('hpFill').style.background = p.hp / max < 0.3 ? '#e0453a' : '#3fd47a';
    $('cbText').textContent = g.combatLevel();
    $('coinText').textContent = p.coins;
    const h = g.interactHint();
    const act = $('btnAct'); act.hidden = !h; if (h) act.textContent = h.label;
    const heals = g.count('potion') + g.count('apple');
    $('btnPotion').hidden = heals === 0; $('potionN').textContent = heals;
    $('btnAttack').classList.toggle('engaged', !!p.target);
    if (this.pendingShop && !this.dlg) this.pendingShop = false;
  }
}
