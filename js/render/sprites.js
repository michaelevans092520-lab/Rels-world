// Hand-drawn (code-drawn) sprites. Every function draws in tile units with the origin at the
// character's feet: call inside ctx.save(); ctx.translate(feetX, feetY); ctx.scale(px, px).

export const REL = { skin: '#e0a982', hair: '#6b3e1f', hairHi: '#8a5530', pants: '#f4f1ea', crocs: '#121014', tie: '#ff7aa8',
                     shirt: '#151317', cat: '#e8893a', catStripe: '#9a4f1a' };
const INK = '#14090f';

const ell = (c, x, y, rx, ry, fill) => { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const rr = (c, x, y, w, h, r, fill) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
export function shadow(c, rx = 0.32, ry = 0.11, a = 0.3) { ell(c, 0, 0, rx, ry, `rgba(0,0,0,${a})`); }

// the cat-face print on Rels' tee
function catFace(c, x, y, r) {
  c.fillStyle = '#e8893a'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * r * 0.3, y - r * 0.8); c.lineTo(x + sd * r * 0.9, y - r * 1.35); c.lineTo(x + sd * r * 0.95, y - r * 0.3); c.closePath(); c.fill(); }
  c.fillStyle = INK; for (const sd of [-1, 1]) ell(c, x + sd * r * 0.38, y - r * 0.1, r * 0.13, r * 0.2, INK);
  c.fillStyle = '#ff7aa8'; c.beginPath(); c.moveTo(x - r * 0.14, y + r * 0.2); c.lineTo(x + r * 0.14, y + r * 0.2); c.lineTo(x, y + r * 0.36); c.fill();
}

// dir: 0 down (toward camera), 1 up, 2 left, 3 right
export const dirOf = (fx, fy) => Math.abs(fx) > Math.abs(fy) * 1.1 ? (fx < 0 ? 2 : 3) : (fy < 0 ? 1 : 0);

export function drawSword(c, x, y, ang, color, glow) {
  c.save(); c.translate(x, y); c.rotate(ang); c.lineCap = 'round';
  c.strokeStyle = '#5a3a22'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(0, 0.06); c.lineTo(0, -0.06); c.stroke();
  c.strokeStyle = '#c9a04a'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(-0.1, -0.07); c.lineTo(0.1, -0.07); c.stroke();
  if (glow) { c.shadowColor = color; c.shadowBlur = 8; }
  c.fillStyle = color; c.beginPath(); c.moveTo(-0.035, -0.08); c.lineTo(-0.028, -0.62); c.lineTo(0, -0.72); c.lineTo(0.028, -0.62); c.lineTo(0.035, -0.08); c.closePath(); c.fill();
  c.restore();
}

// A person: Rels, villagers. o = { dir, walk (phase, radians), moving, shirt, hair, skin, pants, shoes, ponytail, tie, catPrint, beard, apron, kid, swing (0..1 or -1), sword, catHat, t }
export function person(c, o) {
  const s = o.kid ? 0.95 : 1.18, dir = o.dir, mv = o.moving ? 1 : 0, ph = o.walk || 0;
  c.save(); c.scale(s, s);
  shadow(c, 0.3, 0.1);
  const bob = mv ? Math.abs(Math.sin(ph)) * 0.04 : 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const side = dir >= 2, flip = dir === 2 ? -1 : 1;
  // legs
  const legSwing = Math.sin(ph) * 0.12 * mv;
  const leg = (lx, off) => {
    c.strokeStyle = o.pants; c.lineWidth = 0.13;
    const fx = side ? lx + off * flip : lx, fy = side ? -0.02 : -0.02 - Math.max(0, off) * 0.4;
    c.beginPath(); c.moveTo(lx * 0.8, -0.5); c.lineTo(fx, fy - 0.08); c.stroke();
    if (o.flowers) { c.fillStyle = '#ff8fb1'; c.beginPath(); c.arc((lx * 0.8 + fx) / 2, -0.28, 0.022, 0, 7); c.fill(); c.fillStyle = '#8fd3ff'; c.beginPath(); c.arc(fx, -0.14, 0.02, 0, 7); c.fill(); }
    ell(c, fx + (side ? 0.04 * flip : 0), fy - 0.03, side ? 0.1 : 0.075, 0.05, o.shoes);
  };
  c.save(); c.translate(0, -bob);
  // sword arm, with a swing arc
  const swordArm = () => {
    const hx = dir === 2 ? -0.22 : 0.22, sy = -0.86;
    let ang, ax2 = hx + (side ? 0.12 * flip : 0.02), ay2 = -0.55;
    if (o.swing >= 0 && o.swing < 1) {
      const e = 1 - (1 - o.swing) ** 3, base = [Math.PI * 0.85, -Math.PI * 0.15, -Math.PI * 0.6, Math.PI * 0.6][dir];
      ang = base - (dir === 2 ? -1 : 1) * (-1.4 + e * 2.6);
      ax2 = hx + Math.sin(ang) * 0.32; ay2 = sy - Math.cos(ang) * 0.32;
      c.save(); c.globalAlpha = 0.5 * (1 - o.swing); c.strokeStyle = '#fff'; c.lineWidth = 0.08;
      c.beginPath(); c.arc(hx, sy, 0.95, base - (dir === 2 ? -1 : 1) * 1.4 - Math.PI / 2, ang - Math.PI / 2, dir === 2); c.stroke(); c.restore();
    } else ang = dir === 2 ? -0.5 : dir === 3 ? 0.5 : 0.35;
    c.strokeStyle = o.skin; c.lineWidth = 0.075; c.beginPath(); c.moveTo(hx * 0.9, sy); c.lineTo(ax2, ay2); c.stroke();
    drawSword(c, ax2, ay2, ang, o.sword.color, o.sword.rarity !== 'common');
  };
  if (o.sword && dir === 1) swordArm();
  leg(-0.08, legSwing); leg(0.08, -legSwing);
  // ponytail behind when facing camera
  const hy = -1.12, tail = Math.sin((o.t || 0) * 6 + ph) * 0.05 * (mv + 0.3);
  const drawTail = () => {
    if (!o.ponytail) return;
    c.strokeStyle = o.hair; c.lineWidth = 0.11;
    const tx = side ? -0.2 * flip : tail;
    c.beginPath(); c.moveTo(0, hy - 0.1); c.quadraticCurveTo(tx, hy + 0.05, tx * 1.4 + (side ? -0.08 * flip : 0), hy + 0.3); c.stroke();
  };
  if (dir === 0 || side) drawTail();
  // body
  const bw = 0.2;
  rr(c, -bw, -0.95, bw * 2, 0.5, 0.08, o.shirt);
  if (o.apron) rr(c, -bw * 0.75, -0.8, bw * 1.5, 0.38, 0.04, '#f4ede0');
  if (o.catPrint && dir === 0) catFace(c, 0, -0.72, 0.075);
  if (o.catPrint && dir === 1) catFace(c, 0, -0.74, 0.07);
  // arms (the sword arm is drawn later)
  const armSwing = Math.sin(ph) * 0.1 * mv;
  c.strokeStyle = o.skin; c.lineWidth = 0.075;
  const arm = (ax, sw) => { c.beginPath(); c.moveTo(ax, -0.88); c.lineTo(ax + (side ? sw * flip : ax * 0.25), -0.55 + (side ? 0 : sw * 0.5)); c.stroke();
    c.strokeStyle = o.shirt; c.lineWidth = 0.1; c.beginPath(); c.moveTo(ax, -0.9); c.lineTo(ax * 1.05, -0.76); c.stroke(); c.strokeStyle = o.skin; c.lineWidth = 0.075; };
  if (!side) arm(-bw - 0.02, armSwing);
  // head
  ell(c, 0, hy + 0.05, 0.035, 0.05, o.skin);
  c.fillStyle = o.skin; c.beginPath(); c.arc(0, hy - 0.1, 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = o.hair;
  if (dir === 1) { c.beginPath(); c.arc(0, hy - 0.1, 0.205, 0, Math.PI * 2); c.fill(); }
  else if (side) { c.beginPath(); c.arc(-0.03 * flip, hy - 0.14, 0.2, Math.PI * (flip > 0 ? 0.55 : -0.55) + (flip > 0 ? 0 : Math.PI), Math.PI * (flip > 0 ? 1.95 : 0.95) + (flip > 0 ? 0 : 0)); c.fill(); }
  else { c.beginPath(); c.arc(0, hy - 0.15, 0.205, Math.PI * 1.02, Math.PI * 1.98); c.fill(); c.fillRect(-0.205, hy - 0.16, 0.06, 0.12); c.fillRect(0.145, hy - 0.16, 0.06, 0.12); }
  if (dir === 0 || side) {   // face
    const ex = side ? 0.09 * flip : 0;
    c.fillStyle = INK;
    if (side) ell(c, ex, hy - 0.08, 0.025, 0.035, INK);
    else { ell(c, -0.075, hy - 0.08, 0.024, 0.034, INK); ell(c, 0.075, hy - 0.08, 0.024, 0.034, INK); }
    c.fillStyle = 'rgba(255,120,120,0.35)'; if (!side) { ell(c, -0.12, hy, 0.035, 0.022, c.fillStyle); ell(c, 0.12, hy, 0.035, 0.022, 'rgba(255,120,120,0.35)'); }
    if (o.beard) { c.fillStyle = o.hair; c.beginPath(); c.arc(ex, hy + 0.0, 0.14, 0, Math.PI); c.fill(); }
  }
  if (dir === 1) drawTail();
  if (o.tie) ell(c, side ? -0.05 * flip : 0, hy - 0.29, 0.05, 0.032, o.tie);
  if (o.catHat) catHat(c, hy, dir, o.t || 0, flip);
  if (o.sword && dir !== 1) swordArm();
  else if (!o.sword && !side) arm(bw + 0.02, -armSwing);

  c.restore(); c.restore();
}

function catHat(c, hy, dir, t, flip) {
  const y = hy - 0.32, tail = Math.sin(t * 3) * 0.05;
  c.strokeStyle = REL.cat; c.lineWidth = 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0.16, y + 0.02); c.quadraticCurveTo(0.3 + tail, y + 0.12, 0.24 + tail, y + 0.3); c.stroke();
  ell(c, 0, y, 0.22, 0.11, REL.cat);
  c.strokeStyle = REL.catStripe; c.lineWidth = 0.025;
  for (const dx of [-0.1, 0, 0.1]) { c.beginPath(); c.moveTo(dx - 0.02, y - 0.09); c.lineTo(dx + 0.01, y + 0.0); c.stroke(); }
  if (dir !== 1) {
    const hx = dir === 2 ? -0.15 : dir === 3 ? 0.15 : 0;
    c.fillStyle = REL.cat; c.beginPath(); c.arc(hx, y - 0.04, 0.1, 0, Math.PI * 2); c.fill();
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(hx + sd * 0.03, y - 0.11); c.lineTo(hx + sd * 0.09, y - 0.2); c.lineTo(hx + sd * 0.1, y - 0.07); c.fill(); }
    ell(c, hx - 0.035, y - 0.04, 0.015, 0.022, INK); ell(c, hx + 0.035, y - 0.04, 0.015, 0.022, INK);
  }
}

// the cat walking on the ground
export function cat(c, t, moving, dir) {
  shadow(c, 0.22, 0.07);
  const flip = dir === 2 ? -1 : 1, b = moving ? Math.abs(Math.sin(t * 12)) * 0.03 : 0;
  c.save(); c.scale(flip, 1);
  c.strokeStyle = REL.cat; c.lineWidth = 0.05; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-0.2, -0.2); c.quadraticCurveTo(-0.35, -0.35 + Math.sin(t * 4) * 0.05, -0.3, -0.48); c.stroke();
  for (const lx of [-0.13, -0.05, 0.08, 0.15]) { c.beginPath(); c.moveTo(lx, -0.15); c.lineTo(lx + (moving ? Math.sin(t * 12 + lx * 20) * 0.04 : 0), 0); c.stroke(); }
  ell(c, 0, -0.2 - b, 0.22, 0.1, REL.cat);
  c.fillStyle = REL.cat; c.beginPath(); c.arc(0.2, -0.3 - b, 0.1, 0, Math.PI * 2); c.fill();
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0.2 + sd * 0.03, -0.37 - b); c.lineTo(0.2 + sd * 0.08, -0.47 - b); c.lineTo(0.2 + sd * 0.1, -0.34 - b); c.fill(); }
  ell(c, 0.24, -0.31 - b, 0.015, 0.022, INK);
  c.strokeStyle = REL.catStripe; c.lineWidth = 0.022;
  for (const dx of [-0.1, 0, 0.1]) { c.beginPath(); c.moveTo(dx, -0.29 - b); c.lineTo(dx + 0.02, -0.21 - b); c.stroke(); }
  c.restore();
}

// ---------- enemies ----------
export function enemy(c, e, t, hurt, accent) {
  const k = e.type;
  const bob = Math.sin(t * 6 + e.id) * 0.03;
  if (k === 'dummy') {
    shadow(c, 0.28, 0.09);
    c.fillStyle = '#6b4a2b'; c.fillRect(-0.04, -1.05, 0.08, 1.05); c.fillRect(-0.36, -0.82, 0.72, 0.06);
    ell(c, 0, -0.62, 0.24, 0.26, '#d9b56a');
    c.strokeStyle = '#8a6a2e'; c.lineWidth = 0.03; c.beginPath(); c.ellipse(0, -0.62, 0.24, 0.26, 0, 0, 7); c.stroke();
    c.strokeStyle = '#c8323c'; c.lineWidth = 0.04; c.beginPath(); c.arc(0, -0.6, 0.11, 0, 7); c.stroke();
    ell(c, 0, -0.6, 0.04, 0.04, '#c8323c'); ell(c, 0, -1.07, 0.12, 0.12, '#d9b56a');
  } else if (k === 'slime') {
    const sq = e.moving ? Math.sin(t * 10 + e.id) * 0.05 : Math.sin(t * 3 + e.id) * 0.02;
    shadow(c, 0.3, 0.09);
    const g = c.createRadialGradient(-0.08, -0.32, 0.02, 0, -0.22, 0.35);
    g.addColorStop(0, '#ffd27a'); g.addColorStop(0.5, '#ff7a3a'); g.addColorStop(1, '#b8341c');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, -0.2 + sq * 0.5, 0.3 + sq, 0.22 - sq, 0, Math.PI, 0); c.lineTo(0.3 + sq, -0.02); c.quadraticCurveTo(0, 0.03, -0.3 - sq, -0.02); c.fill();
    ell(c, -0.09, -0.24, 0.045, 0.06, '#fff'); ell(c, 0.09, -0.24, 0.045, 0.06, '#fff');
    ell(c, -0.085, -0.23, 0.022, 0.035, INK); ell(c, 0.095, -0.23, 0.022, 0.035, INK);
  } else if (k === 'bat') {
    shadow(c, 0.2, 0.06, 0.2);
    const y = -1.15 + bob * 3, flap = Math.sin(t * 16 + e.id);
    c.fillStyle = '#2a1830'; c.strokeStyle = accent; c.lineWidth = 0.025;
    for (const sd of [-1, 1]) {
      c.beginPath(); c.moveTo(sd * 0.1, y - 0.03); c.lineTo(sd * 0.55, y - 0.2 - flap * 0.22); c.lineTo(sd * 0.47, y + 0.04 - flap * 0.1);
      c.lineTo(sd * 0.34, y); c.lineTo(sd * 0.25, y + 0.08); c.lineTo(sd * 0.13, y + 0.05); c.closePath(); c.fill(); c.stroke();
    }
    ell(c, 0, y, 0.15, 0.14, '#2a1830');
    c.beginPath(); for (const sd of [-1, 1]) { c.moveTo(sd * 0.05, y - 0.11); c.lineTo(sd * 0.12, y - 0.23); c.lineTo(sd * 0.12, y - 0.08); } c.fill();
    ell(c, -0.05, y - 0.02, 0.03, 0.025, '#ffcf3a'); ell(c, 0.05, y - 0.02, 0.03, 0.025, '#ffcf3a');
  } else if (k === 'brute') {
    shadow(c, 0.42, 0.13);
    const b2 = e.moving ? Math.abs(Math.sin(t * 7)) * 0.04 : 0;
    c.fillStyle = INK; c.fillRect(-0.24, -0.6, 0.17, 0.6); c.fillRect(0.07, -0.6, 0.17, 0.6);
    c.fillStyle = '#3b2c34'; c.beginPath(); c.moveTo(-0.42, -1.3 - b2); c.lineTo(0.42, -1.3 - b2); c.lineTo(0.3, -0.56); c.lineTo(-0.3, -0.56); c.closePath(); c.fill();
    ell(c, 0, -1.45 - b2, 0.17, 0.17, '#3b2c34');
    c.fillStyle = INK; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.1, -1.56 - b2); c.lineTo(sd * 0.24, -1.76 - b2); c.lineTo(sd * 0.18, -1.5 - b2); c.fill(); }
    ell(c, -0.06, -1.46 - b2, 0.035, 0.025, '#ff4b3b'); ell(c, 0.06, -1.46 - b2, 0.035, 0.025, '#ff4b3b');
    const sx = e.fx < -0.3 ? -0.22 : e.fx > 0.3 ? 0.22 : 0;
    if (e.fy >= -0.3) {
      c.fillStyle = '#5a4a52'; c.strokeStyle = accent; c.lineWidth = 0.05;
      c.beginPath(); c.moveTo(sx - 0.34, -1.12); c.lineTo(sx + 0.34, -1.12); c.lineTo(sx + 0.34, -0.62); c.quadraticCurveTo(sx + 0.3, -0.36, sx, -0.28); c.quadraticCurveTo(sx - 0.3, -0.36, sx - 0.34, -0.62); c.closePath(); c.fill(); c.stroke();
      ell(c, sx, -0.75, 0.08, 0.08, accent);
    }
  } else if (k === 'ninja') {
    shadow(c, 0.26, 0.08);
    const dir = dirOf(e.fx, e.fy), mv = e.moving ? 1 : 0, ph = t * 14;
    c.strokeStyle = '#1b1620'; c.lineWidth = 0.12; c.lineCap = 'round';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.08, -0.5); c.lineTo(sd * 0.1 + Math.sin(ph) * sd * 0.06 * mv, -0.04); c.stroke(); }
    rr(c, -0.19, -0.95, 0.38, 0.48, 0.08, '#1b1620');
    ell(c, 0, -1.12, 0.18, 0.18, '#1b1620');
    c.fillStyle = '#c8323c'; c.fillRect(-0.18, -1.2, 0.36, 0.05);
    c.strokeStyle = '#c8323c'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(0.15, -1.18); c.quadraticCurveTo(0.3, -1.15 + Math.sin(t * 10) * 0.04, 0.38, -1.05); c.stroke();
    if (dir !== 1) { c.fillStyle = '#e0a982'; c.fillRect(dir === 2 ? -0.16 : dir === 3 ? 0 : -0.12, -1.14, dir >= 2 ? 0.16 : 0.24, 0.05); c.fillStyle = INK; c.fillRect(dir === 2 ? -0.12 : dir === 3 ? 0.06 : -0.08, -1.13, 0.04, 0.03); if (dir === 0) c.fillRect(0.04, -1.13, 0.04, 0.03); }
    drawSword(c, 0.24, -0.6, e.swingT && t - e.swingT < 0.3 ? 1.6 : 0.5, '#e6ecf2', false);
  } else if (k === 'colossus') {
    c.scale(2.2, 2.2);
    shadow(c, 0.42, 0.13);
    const sw = e.moving ? Math.sin(t * 4) * 0.06 : 0;
    c.strokeStyle = '#a07a3a'; c.lineWidth = 0.14; c.lineCap = 'round';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.12, -0.6); c.lineTo(sd * 0.15 + sw * sd, 0); c.stroke(); }
    ell(c, 0, -0.95, 0.34, 0.42, '#d9b56a');
    c.strokeStyle = '#8a6a2e'; c.lineWidth = 0.025;
    for (let k2 = 0; k2 < 6; k2++) { c.beginPath(); c.moveTo(-0.28 + k2 * 0.11, -1.25); c.lineTo(-0.3 + k2 * 0.12, -0.6); c.stroke(); }
    c.strokeStyle = '#c99a4a'; c.lineWidth = 0.1;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.3, -1.15); c.lineTo(sd * 0.55, -0.85 + (e.swingT && t - e.swingT < 0.3 ? -0.3 : 0)); c.lineTo(sd * 0.5, -0.6); c.stroke(); }
    ell(c, 0, -1.48, 0.2, 0.2, '#d9b56a');
    c.strokeStyle = '#6b4a2b'; c.lineWidth = 0.04;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.1, -1.62); c.lineTo(sd * 0.25, -1.85); c.lineTo(sd * 0.35, -1.8); c.moveTo(sd * 0.2, -1.77); c.lineTo(sd * 0.18, -1.95); c.stroke(); }
    ell(c, -0.07, -1.5, 0.04, 0.035, '#ff4b3b'); ell(c, 0.07, -1.5, 0.04, 0.035, '#ff4b3b');
  }
}
export const enemyHeight = k => ({ dummy: 1.25, slime: 0.5, bat: 1.45, brute: 1.85, ninja: 1.35, colossus: 4.4 })[k] || 1.3;

// ---------- world props ----------
export function tree(c, o, t) {
  const st = o.style || 'oak', sway = Math.sin(t * 0.8 + o.x) * 0.02, big = 0.85 + o.v * 0.3;
  shadow(c, 0.5, 0.16, 0.28);
  if (st === 'pine') {
    c.fillStyle = '#4a3222'; c.fillRect(-0.08, -0.5, 0.16, 0.5);
    for (let k = 0; k < 3; k++) {
      const y = -0.45 - k * 0.42 * big, w = (0.62 - k * 0.15) * big;
      c.fillStyle = k % 2 ? '#2f5a46' : '#264c3c'; c.beginPath(); c.moveTo(-w + sway, y); c.lineTo(sway * 2, y - 0.62 * big); c.lineTo(w + sway, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(-w * 0.5 + sway, y - 0.3 * big); c.lineTo(sway * 2, y - 0.62 * big); c.lineTo(w * 0.5 + sway, y - 0.3 * big); c.closePath(); c.fill();
    }
    return;
  }
  if (st === 'dead' || st === 'charred') {
    const col = st === 'dead' ? '#4a4034' : '#231b1d';
    c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 0.14;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0.02, -1.2 * big); c.stroke();
    c.lineWidth = 0.07;
    for (const [a, b, d] of [[-0.1, -0.7, -0.4], [0.05, -0.9, 0.42], [0, -1.15, -0.3], [0.02, -1.0, 0.25]]) {
      c.beginPath(); c.moveTo(a, b * big); c.lineTo(a + d, (b - 0.35) * big); c.stroke();
    }
    if (st === 'charred' && o.v > 0.5) { c.fillStyle = 'rgba(255,120,40,0.8)'; c.beginPath(); c.arc(0.02, -0.6, 0.05, 0, 7); c.fill(); }
    if (st === 'dead') { c.fillStyle = 'rgba(160,190,120,0.5)'; ell(c, -0.3, -0.95 * big, 0.12, 0.05, c.fillStyle); }
    return;
  }
  if (st === 'palm') {
    c.strokeStyle = '#8a6a42'; c.lineWidth = 0.12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(0.2, -0.7, 0.1 + sway, -1.5 * big); c.stroke();
    const tx = 0.1 + sway, ty = -1.5 * big;
    c.fillStyle = '#3a8a3a';
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + 0.3;
      c.beginPath(); c.ellipse(tx + Math.cos(a) * 0.32, ty + Math.sin(a) * 0.14 + 0.05, 0.36, 0.08, a, 0, 7); c.fill();
    }
    ell(c, tx - 0.05, ty + 0.08, 0.06, 0.06, '#6b4a2b'); ell(c, tx + 0.06, ty + 0.1, 0.06, 0.06, '#6b4a2b');
    return;
  }
  if (st === 'crystal') {
    const cols = ['#9fe0f5', '#c8f2ff', '#7cc8e8'];
    for (const [dx, h, w, k] of [[-0.18, 0.8, 0.14, 0], [0.15, 1.15, 0.17, 1], [0, 1.45, 0.2, 2], [0.32, 0.6, 0.11, 0]]) {
      c.fillStyle = cols[k]; c.beginPath(); c.moveTo(dx - w, 0); c.lineTo(dx - w * 0.8, -h * big * 0.8); c.lineTo(dx, -h * big); c.lineTo(dx + w * 0.8, -h * big * 0.8); c.lineTo(dx + w, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(dx - w * 0.3, -h * big * 0.75, w * 0.25, h * big * 0.5);
    }
    return;
  }
  // round-canopy trees: oak, dark (Gloomwood), star (Starfall)
  const pal = st === 'dark' ? ['#16301f', '#1f4229', '#2d5a37'] : st === 'star' ? ['#3d2f7a', '#5a48a8', '#8a78d8'] : ['#2f6b2f', '#3f8a3a', '#5aa84a'];
  c.fillStyle = st === 'dark' ? '#3a2618' : st === 'star' ? '#d8d0f0' : '#5a3a22'; c.fillRect(-0.1, -0.7, 0.2, 0.7);
  ell(c, sway, -1.15 * big, 0.62 * big, 0.55 * big, pal[0]);
  ell(c, -0.18 + sway, -1.3 * big, 0.38 * big, 0.36 * big, pal[1]);
  ell(c, 0.2 + sway, -1.22 * big, 0.36 * big, 0.32 * big, pal[1]);
  ell(c, -0.05 + sway, -1.5 * big, 0.3 * big, 0.25 * big, pal[2]);
  if (st === 'oak' && o.v > 0.7) { ell(c, 0.2, -1.1, 0.06, 0.06, '#d8443a'); ell(c, -0.25, -1.25, 0.06, 0.06, '#d8443a'); }
  if (st === 'star') for (let k = 0; k < 4; k++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + k * 2 + o.x); ell(c, -0.3 + k * 0.2 + sway, -1.1 - (k % 2) * 0.3, 0.04 * tw + 0.01, 0.04 * tw + 0.01, '#fff3a8'); }
}
export function rock(c, o) {
  const s = o.big ? 1.2 : 0.8;
  shadow(c, 0.4 * s, 0.13 * s, 0.25);
  c.fillStyle = '#6f6870'; c.beginPath(); c.moveTo(-0.42 * s, 0); c.lineTo(-0.36 * s, -0.42 * s); c.lineTo(-0.05 * s, -0.62 * s); c.lineTo(0.32 * s, -0.48 * s); c.lineTo(0.42 * s, 0); c.closePath(); c.fill();
  c.fillStyle = '#8d8690'; c.beginPath(); c.moveTo(-0.36 * s, -0.42 * s); c.lineTo(-0.05 * s, -0.62 * s); c.lineTo(0.05 * s, -0.3 * s); c.lineTo(-0.3 * s, -0.2 * s); c.closePath(); c.fill();
}
export function fence(c) {
  c.fillStyle = '#7a5530'; c.fillRect(-0.06, -0.62, 0.12, 0.62);
  c.fillStyle = '#946a3c'; c.fillRect(-0.5, -0.5, 1.0, 0.08); c.fillRect(-0.5, -0.28, 1.0, 0.08);
}
export function sign(c, text) {
  c.fillStyle = '#6b4a2b'; c.fillRect(-0.04, -0.75, 0.08, 0.75);
  rr(c, -0.38, -0.95, 0.76, 0.32, 0.04, '#b88a52');
  c.strokeStyle = '#6b4a2b'; c.lineWidth = 0.03; c.strokeRect(-0.36, -0.93, 0.72, 0.28);
  c.fillStyle = '#4a2f1a'; c.fillRect(-0.24, -0.84, 0.48, 0.03); c.fillRect(-0.2, -0.76, 0.4, 0.03);
}
export function well(c) {
  shadow(c, 0.9, 0.3, 0.25);
  ell(c, 0, -0.35, 0.8, 0.42, '#6f6870'); ell(c, 0, -0.42, 0.62, 0.3, '#24323d');
  c.fillStyle = '#7a5530'; c.fillRect(-0.7, -1.5, 0.1, 1.2); c.fillRect(0.6, -1.5, 0.1, 1.2);
  c.fillStyle = '#9a3a2a'; c.beginPath(); c.moveTo(-0.95, -1.4); c.lineTo(0, -1.9); c.lineTo(0.95, -1.4); c.closePath(); c.fill();
}
export function boat(c, t) {
  const b = Math.sin(t * 1.5) * 0.04;
  c.save(); c.translate(0, b);
  c.fillStyle = '#6b4a2b'; c.beginPath(); c.moveTo(-1.5, -0.6); c.lineTo(1.5, -0.6); c.lineTo(1.1, 0.1); c.lineTo(-1.1, 0.1); c.closePath(); c.fill();
  c.fillStyle = '#8a5f38'; c.fillRect(-1.4, -0.7, 2.8, 0.12);
  c.fillStyle = '#5a3a22'; c.fillRect(-0.05, -2.6, 0.1, 2.0);
  c.fillStyle = '#f4ede0'; c.beginPath(); c.moveTo(0.08, -2.5); c.lineTo(1.1, -0.85); c.lineTo(0.08, -0.85); c.closePath(); c.fill();
  c.restore();
}
// house drawn with its feet at the bottom-left corner; w,h in tiles
export function house(c, o) {
  const w = o.w, h = o.h, wall = 1.6;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0.15, -0.05, w, 0.3);
  // front wall
  c.fillStyle = '#e8dcc4'; c.fillRect(0, -wall, w, wall);
  c.fillStyle = '#c8b898'; c.fillRect(0, -0.14, w, 0.14);
  // door + windows
  rr(c, o.door + 0.15, -1.15, 0.7, 1.15, 0.12, '#6b4a2b');
  ell(c, o.door + 0.7, -0.55, 0.05, 0.05, '#e0b050');
  for (let k = 0; k < w; k++) if (k !== o.door && (k % 2 === 1 || w <= 4)) {
    c.fillStyle = '#6b4a2b'; c.fillRect(k + 0.17, -1.22, 0.66, 0.56); c.fillStyle = '#ffd98a'; c.fillRect(k + 0.22, -1.17, 0.56, 0.46);
    c.fillStyle = '#6b4a2b'; c.fillRect(k + 0.47, -1.17, 0.06, 0.46);
  }
  // roof covers the house's tile depth (seen from above at an angle)
  const top = -wall - (h - 0.4);
  c.fillStyle = o.roof; c.beginPath(); c.moveTo(-0.25, -wall + 0.05); c.lineTo(w + 0.25, -wall + 0.05); c.lineTo(w - 0.1, top); c.lineTo(0.1, top); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)';
  for (let k = 1; k < 5; k++) c.fillRect(-0.2, lerpN(-wall + 0.05, top, k / 5) - 0.04, w + 0.4, 0.06);
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0.1, top, w - 0.2, 0.18);
}
const lerpN = (a, b, k) => a + (b - a) * k;

// ground item: a little icon on the floor
export function itemIcon(c, id, size = 0.3) {
  const s = size;
  if (id === 'coins' || id === 'coin') {
    for (const [dx, dy] of [[-0.08, 0], [0.08, 0.02], [0, -0.06]]) { ell(c, dx * s / 0.3, dy * s / 0.3, s * 0.42, s * 0.3, '#d48a0c'); ell(c, dx * s / 0.3, dy * s / 0.3 - s * 0.06, s * 0.42, s * 0.3, '#ffcf3a'); }
  } else if (id === 'straw') { c.strokeStyle = '#d9b56a'; c.lineWidth = s * 0.15; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * s * 0.15, s * 0.3); c.lineTo(k * s * 0.25, -s * 0.5); c.stroke(); } c.fillStyle = '#c8323c'; c.fillRect(-s * 0.4, -s * 0.05, s * 0.8, s * 0.15); }
  else if (id === 'goo') { ell(c, 0, 0, s * 0.5, s * 0.38, '#ff7a3a'); ell(c, -s * 0.15, -s * 0.12, s * 0.12, s * 0.08, '#ffd27a'); }
  else if (id === 'wing') { c.fillStyle = '#4a2a50'; c.beginPath(); c.moveTo(-s * 0.6, s * 0.2); c.lineTo(-s * 0.2, -s * 0.5); c.lineTo(s * 0.6, -s * 0.3); c.lineTo(s * 0.3, s * 0.1); c.lineTo(0, s * 0.0); c.closePath(); c.fill(); }
  else if (id === 'shard') { c.fillStyle = '#8a9aaa'; c.beginPath(); c.moveTo(-s * 0.4, s * 0.3); c.lineTo(-s * 0.1, -s * 0.5); c.lineTo(s * 0.45, -s * 0.1); c.lineTo(s * 0.2, s * 0.35); c.closePath(); c.fill(); c.fillStyle = '#cfe0ef'; c.fillRect(-s * 0.1, -s * 0.2, s * 0.15, s * 0.3); }
  else if (id === 'potion') { ell(c, 0, s * 0.1, s * 0.4, s * 0.4, '#e04a6a'); c.fillStyle = '#e8e0d8'; c.fillRect(-s * 0.12, -s * 0.55, s * 0.24, s * 0.3); c.fillStyle = '#8a5a33'; c.fillRect(-s * 0.14, -s * 0.65, s * 0.28, s * 0.12); ell(c, -s * 0.12, -s * 0.02, s * 0.1, s * 0.08, 'rgba(255,255,255,0.6)'); }
  else if (id === 'apple') { ell(c, 0, 0, s * 0.42, s * 0.4, '#d8443a'); c.strokeStyle = '#5a3a22'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(s * 0.05, -s * 0.55); c.stroke(); ell(c, s * 0.18, -s * 0.48, s * 0.14, s * 0.07, '#4a9a3a'); }
  else if (id === 'band') { c.fillStyle = '#1b1620'; c.fillRect(-s * 0.5, -s * 0.12, s, s * 0.24); c.fillStyle = '#c8323c'; c.fillRect(-s * 0.1, -s * 0.12, s * 0.2, s * 0.24); c.strokeStyle = '#1b1620'; c.lineWidth = s * 0.1; c.beginPath(); c.moveTo(s * 0.5, 0); c.lineTo(s * 0.7, s * 0.4); c.stroke(); }
}
