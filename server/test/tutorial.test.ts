// Tests for the tutorial (owner's spec: docs/specs/tutorial.md).
// Items, combat and quests aren't built yet, so a fake "emit" command stands in for them by producing
// the update those systems will send (e.g. "itemPickedUp").

import { acceptCommand, Command, StateUpdate } from '../src/core/commands.js';
import { CommandRouter } from '../src/core/command-router.js';
import { createGameState, GameState } from '../src/core/game-state.js';
import { TickResult, updateTick } from '../src/core/update-tick.js';
import { secondsPerTick } from '../src/data/game-rules.js';
import { TUTORIAL_RULES } from '../src/data/tutorial-rules.js';
import { createMoveCommandHandler, MOVE_COMMAND_TYPE, MoveCommand } from '../src/player/move-command.js';
import { createPlayer } from '../src/player/player-state.js';
import { TUTORIAL_SYSTEMS } from '../src/tutorial/tutorial-systems.js';
import { BoxMovementBlocker } from '../src/world/movement-blocker.js';
import { check, checkEqual, TestCase } from './test-runner.js';

interface EmitCommand extends Command { eventType: string }

/** World with a new player "p1" at the start-area center, plus a fake "emit" command for future systems. */
function setup(): { state: GameState; router: CommandRouter } {
  const state = createGameState();
  state.players.p1 = createPlayer({ id: 'p1', name: 'Rels', level: 1, maxHealth: 100, x: 0, y: 0 });
  const router = new CommandRouter();
  router.register(MOVE_COMMAND_TYPE, createMoveCommandHandler(new BoxMovementBlocker({ minX: -500, maxX: 500, minY: -500, maxY: 500 }, [])));
  router.register('emit', (_s, c) => acceptCommand([{ type: (c as EmitCommand).eventType, playerId: c.playerId }]));
  return { state, router };
}
const tick = (s: GameState, r: CommandRouter, commands: Command[] = [], dt = secondsPerTick()): TickResult =>
  updateTick(s, dt, commands, r, TUTORIAL_SYSTEMS);
const walk = (dx: number, dy: number, playerId = 'p1'): MoveCommand => ({ type: MOVE_COMMAND_TYPE, playerId, directionX: dx, directionY: dy, facingAngle: 0 });
const emit = (eventType: string, playerId = 'p1'): EmitCommand => ({ type: 'emit', playerId, eventType });
const ofType = (updates: StateUpdate[], type: string) => updates.filter(u => u.type === type);

/** Walk back and forth inside the start area until the move step (10 units) is done. Returns every update produced. */
function finishMoveStep(state: GameState, router: CommandRouter): StateUpdate[] {
  const updates: StateUpdate[] = [];
  for (let i = 0; i < 60 && state.players.p1!.tutorial.stepIndex === 0; i++) updates.push(...tick(state, router, [walk(i % 40 < 20 ? 1 : -1, 0)]).updates);
  return updates;
}
/** Complete every step after "move" with fake events, in the owner's order. */
function finishRemainingSteps(state: GameState, router: CommandRouter): TickResult[] {
  const results: TickResult[] = [];
  for (const step of TUTORIAL_RULES.steps.slice(1)) {
    for (let i = 0; i < step.count; i++) results.push(tick(state, router, [emit(step.eventType)]));
  }
  return results;
}

export const tutorialTests: TestCase[] = [
  { name: 'steps follow the owner\'s order: move → items → fight → quest', run: () => {
    checkEqual(TUTORIAL_RULES.steps.map(s => s.id), ['move', 'pickUpItem', 'equipItem', 'fight', 'acceptQuest'], 'wrong order');
  } },
  { name: 'new characters start the tutorial; characters allowed to skip start finished', run: () => {
    check(!createPlayer({ id: 'a', name: 'A', level: 1, maxHealth: 10, x: 0, y: 0 }).tutorial.completed, 'new player skipped');
    check(createPlayer({ id: 'b', name: 'B', level: 1, maxHealth: 10, x: 0, y: 0, tutorialRequired: false }).tutorial.completed, 'skip ignored');
  } },
  { name: 'the first step is announced with a hint on the first tick', run: () => {
    const { state, router } = setup();
    const hints = ofType(tick(state, router).updates, 'tutorialHint');
    checkEqual(hints.map(h => [h.stepId, h.reason]), [['move', 'stepStarted']], 'no first hint');
  } },
  { name: 'walking counts distance; 10 units finishes the move step and announces the next', run: () => {
    const { state, router } = setup();
    const updates = finishMoveStep(state, router);
    checkEqual(state.players.p1!.tutorial.stepIndex, 1, 'move step not finished');
    // The next step is announced in the same tick the move step finishes.
    const hints = ofType(updates, 'tutorialHint').map(h => h.stepId);
    checkEqual(hints, ['move', 'pickUpItem'], 'next step not announced');
  } },
  { name: 'actions for a later step don\'t count early', run: () => {
    const { state, router } = setup();
    tick(state, router, [emit('itemEquipped'), emit('trainingTargetHit'), emit('questAccepted')]);
    checkEqual([state.players.p1!.tutorial.stepIndex, state.players.p1!.tutorial.stepProgress], [0, 0], 'out-of-order action counted');
  } },
  { name: 'another player\'s actions don\'t count for you', run: () => {
    const { state, router } = setup();
    state.players.p2 = createPlayer({ id: 'p2', name: 'Other', level: 1, maxHealth: 100, x: 1, y: 1, tutorialRequired: false });
    finishMoveStep(state, router);
    tick(state, router, [emit('itemPickedUp', 'p2')]);
    checkEqual(state.players.p1!.tutorial.stepIndex, 1, 'p2 action counted for p1');
  } },
  { name: 'finishing every step completes the tutorial, unlocks the area and reports the reward', run: () => {
    const { state, router } = setup();
    finishMoveStep(state, router);
    const all = finishRemainingSteps(state, router).flatMap(r => r.updates);
    check(state.players.p1!.tutorial.completed, 'tutorial not completed');
    checkEqual(ofType(all, 'tutorialCompleted').length, 1, 'no completion update');
    checkEqual(ofType(all, 'startAreaUnlocked').length, 1, 'area not unlocked');
  } },
  { name: 'stuck reminders: first after 30 s without progress, then every 30 s', run: () => {
    const { state, router } = setup();
    tick(state, router, [], 1);                                     // t=0: step announced
    const reminderTimes: number[] = [];
    for (let t = 1; t <= 70; t++) {
      const hints = ofType(tick(state, router, [], 1).updates, 'tutorialHint');
      if (hints.some(h => h.reason === 'reminder')) reminderTimes.push(t);
    }
    checkEqual(reminderTimes, [30, 60], 'reminders at the wrong times');
  } },
  { name: 'progress resets the stuck timer', run: () => {
    const { state, router } = setup();
    tick(state, router, [], 1);
    for (let t = 1; t <= 25; t++) tick(state, router, [], 1);
    tick(state, router, [walk(1, 0)], 1);                          // t=26: progress
    let firstReminder = -1;
    for (let t = 27; t <= 60 && firstReminder < 0; t++) {
      if (ofType(tick(state, router, [], 1).updates, 'tutorialHint').some(h => h.reason === 'reminder')) firstReminder = t;
    }
    checkEqual(firstReminder, 56, 'timer did not restart at the progress');
  } },
  { name: 'tutorial players can\'t die: health never stays below 1', run: () => {
    const { state, router } = setup();
    state.players.p1!.currentHealth = -20;                         // as if some damage code ignored the floor
    tick(state, router);
    check(state.players.p1!.currentHealth >= TUTORIAL_RULES.healthFloor, 'tutorial player was left at 0 or below');
  } },
  { name: 'the guide restores low health and the update reveals no numbers', run: () => {
    const { state, router } = setup();
    state.players.p1!.currentHealth = 25;                          // 25% of 100 = "low"
    const restored = ofType(tick(state, router).updates, 'tutorialGuideRestored');
    checkEqual(state.players.p1!.currentHealth, 100, 'health not restored');
    checkEqual(restored, [{ type: 'tutorialGuideRestored', playerId: 'p1' }], 'update missing or leaks health');
  } },
  { name: 'health above the low point is left alone', run: () => {
    const { state, router } = setup();
    state.players.p1!.currentHealth = 60;
    tick(state, router);
    checkEqual(state.players.p1!.currentHealth, 60, 'health changed when not low');
  } },
  { name: 'players who finished the tutorial get no protection', run: () => {
    const { state, router } = setup();
    state.players.p1!.tutorial.completed = true;
    state.players.p1!.currentHealth = 0;
    tick(state, router);
    checkEqual(state.players.p1!.currentHealth, 0, 'finished player was protected');
  } },
  { name: 'tutorial players can\'t walk out of the start area; finished players can', run: () => {
    const { state, router } = setup();
    const p = state.players.p1!;
    p.x = TUTORIAL_RULES.startArea.radius - 0.1;                   // right at the edge
    const blocked = tick(state, router, [walk(1, 0)]);
    check(!blocked.commandResults[0]!.accepted && p.x === TUTORIAL_RULES.startArea.radius - 0.1, 'left the start area');
    p.tutorial.completed = true;
    const allowed = tick(state, router, [walk(1, 0)]);
    check(allowed.commandResults[0]!.accepted && p.x > TUTORIAL_RULES.startArea.radius, 'finished player still locked in');
  } },
];
