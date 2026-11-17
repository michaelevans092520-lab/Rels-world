// Boots the game: title screen, then the main loop (input → simulate → draw → HUD).
import { Game } from './core/game.js';
import { Renderer } from './render/render.js';
import { Input } from './ui/input.js';
import { UI } from './ui/ui.js';
import { unlockAudio } from './ui/audio.js';

const SAVE_KEY = 'relsWorldSave';
const $ = id => document.getElementById(id);
const canvas = $('game');

function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }

let game, renderer, input, ui, last = 0, running = false, saveTimer = 0;

function start(fresh) {
  unlockAudio();
  if (fresh) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  game = new Game(fresh ? null : loadSave());
  renderer = new Renderer(canvas, game);
  input = new Input(canvas, $('stick'), $('knob'), renderer, game);
  ui = new UI(game, input);
  window.__game = game;                 // handy for testing in the console
  $('title').hidden = true; $('hud').hidden = false;
  if (fresh || !game.flags.seenIntro) {
    // no cutscenes: just quick tips in the chat log while you play
    game.flags.seenIntro = true;
    game.msg('Welcome to Rel\'s World! Drag the left side of the screen (or WASD) to move.', '#ffd84a');
    game.msg('Coach Bram is in the training yard just north of here. Look for the yellow "!"', '#9fd8ff');
  }
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const inp = input.read();
  if (ui.blocking) { inp.mx = inp.my = 0; inp.attack = inp.interact = false; delete inp.tapEnemy; delete inp.tapNpc; }
  game.step(dt, inp);
  for (const e of game.events) { renderer.onEvent(e); ui.onEvent(e); }
  game.events.length = 0;
  renderer.draw(dt);
  renderer.drawMinimap($('minimap'));
  ui.update();
  saveTimer += dt; if (saveTimer > 5) { saveTimer = 0; save(); }
  requestAnimationFrame(frame);
}
function save() { if (game) try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.serialize())); } catch (e) {} }
addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);
addEventListener('resize', () => renderer && renderer.resize());
addEventListener('gamepadconnected', e => {
  if (game) game.msg(`Controller connected! A attack · X talk · Y bag · B close · LB/RB heal`, '#9fe09f');
  document.body.classList.add('pad');
});

// title screen
const has = !!loadSave();
$('btnContinue').hidden = !has;
$('btnNew').textContent = has ? 'New game' : 'Play';
$('btnContinue').addEventListener('click', () => start(false));
$('btnNew').addEventListener('click', () => {
  if (has && !confirmNew()) return;
  start(true);
});
function confirmNew() {
  const b = $('btnNew');
  if (b.dataset.sure) return true;
  b.dataset.sure = '1'; b.textContent = 'Tap again to erase your save';
  setTimeout(() => { delete b.dataset.sure; b.textContent = 'New game'; }, 3000);
  return false;
}
