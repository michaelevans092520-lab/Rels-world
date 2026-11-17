// Touch joystick, action buttons, taps on the world, and keyboard.
// Produces one plain input object per frame: { mx, my, attack, interact, tapEnemy, tapNpc }.

export class Input {
  constructor(canvas, stickEl, knobEl, renderer, game) {
    this.cv = canvas; this.stick = stickEl; this.knob = knobEl; this.r = renderer; this.g = game;
    this.vx = 0; this.vy = 0; this.keys = new Set();
    this.pending = {}; this.stickId = null; this.sx = 0; this.sy = 0;
    this.taps = new Map();
    const R = 56;

    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      // left 45% of the screen: a floating joystick appears where the thumb lands
      if (this.stickId === null && e.clientX < canvas.clientWidth * 0.45) {
        this.stickId = e.pointerId; this.sx = e.clientX; this.sy = e.clientY;
        stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; stickEl.classList.add('on');
        knobEl.style.transform = 'translate(-50%,-50%)';
        canvas.setPointerCapture(e.pointerId);
      } else this.taps.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== this.stickId) return;
      let dx = e.clientX - this.sx, dy = e.clientY - this.sy;
      const l = Math.hypot(dx, dy);
      if (l > R) { dx *= R / l; dy *= R / l; }
      this.vx = dx / R; this.vy = dy / R;
      knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const end = e => {
      if (e.pointerId === this.stickId) {
        this.stickId = null; this.vx = this.vy = 0; stickEl.classList.remove('on');
      } else {
        const tp = this.taps.get(e.pointerId); this.taps.delete(e.pointerId);
        if (tp && Math.hypot(e.clientX - tp.x, e.clientY - tp.y) < 14 && performance.now() - tp.t < 400) this.tapWorld(e.clientX, e.clientY);
      }
    };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea')) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { this.keys.add(k); e.preventDefault(); }
      else if (k === ' ' || k === 'j') { this.pending.attack = true; e.preventDefault(); }
      else if (k === 'e' || k === 'enter') this.pending.interact = true;
      if (this.onKey) this.onKey(k, e);
    });
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => { this.keys.clear(); this.vx = this.vy = 0; });
  }

  tapWorld(px, py) {
    const [wx, wy] = this.r.screenToWorld(px, py), g = this.g;
    // enemies are tall, so test against their body, not just their feet
    let best = null, bd = 0.9;
    for (const e of g.enemies) {
      if (e.dead) continue;
      const h = e.type === 'colossus' ? 2 : e.type === 'bat' ? 1.1 : 0.6;
      const d = Math.hypot(wx - e.x, (wy - (e.y - h)) * 0.7);
      if (d < bd + (e.type === 'colossus' ? 1 : 0)) { bd = d; best = e; }
    }
    if (best) { this.pending.tapEnemy = best.id; return; }
    for (const n of g.npcs) if (Math.hypot(wx - n.x, wy - (n.y - 0.7)) < 0.9) { this.pending.tapNpc = n.id; return; }
  }
  press(name) { this.pending[name] = true; }

  read() {
    let mx = this.vx, my = this.vy;
    const k = this.keys;
    if (k.size) {
      mx = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
      my = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
      const l = Math.hypot(mx, my); if (l) { mx /= l; my /= l; }
    }
    const out = { mx, my, ...this.pending };
    this.pending = {};
    return out;
  }
}
