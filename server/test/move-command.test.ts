// Tests for the Player state and MoveCommand rules from the first design spec.

import { CommandRouter } from '../src/core/command-router.js';
import { createGameState, GameState } from '../src/core/game-state.js';
import { updateTick } from '../src/core/update-tick.js';
import { GAME_RULES, secondsPerTick } from '../src/data/game-rules.js';
import { createMoveCommandHandler, MOVE_COMMAND_TYPE, MoveCommand } from '../src/player/move-command.js';
import { createPlayer } from '../src/player/player-state.js';
import { BoxMovementBlocker } from '../src/world/movement-blocker.js';
import { check, checkEqual, TestCase } from './test-runner.js';

// Test map: a 100 × 100 area with one wall standing at x = 52..53 across y = 40..60.
const blocker = new BoxMovementBlocker({ minX: 0, maxX: 100, minY: 0, maxY: 100 }, [{ minX: 52, maxX: 53, minY: 40, maxY: 60 }]);

/** A world with one healthy player "p1" at (50, 50) and a router that knows MoveCommand. */
function setup(): { state: GameState; router: CommandRouter } {
  const state = createGameState();
  // Tutorial already done, so the start-area limit doesn't interfere with these movement tests.
  state.players.p1 = createPlayer({ id: 'p1', name: 'Rels', level: 1, maxHealth: 100, x: 50, y: 50, tutorialRequired: false });
  const router = new CommandRouter();
  router.register(MOVE_COMMAND_TYPE, createMoveCommandHandler(blocker));
  return { state, router };
}
function move(directionX: number, directionY: number, facingAngle = 0, playerId = 'p1'): MoveCommand {
  return { type: MOVE_COMMAND_TYPE, playerId, directionX, directionY, facingAngle };
}
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const FULL_STEP = GAME_RULES.playerBaseMoveSpeed * secondsPerTick();   // 5.0 × 0.05 = 0.25

export const movementTests: TestCase[] = [
  { name: 'tick length is 50 ms and base speed is 5.0 units per second', run: () => {
    check(close(secondsPerTick(), 0.05), 'tick length is not 0.05 s');
    checkEqual(createPlayer({ id: 'a', name: 'A', level: 1, maxHealth: 10, x: 0, y: 0 }).baseMoveSpeed, 5, 'base speed is not 5.0');
  } },
  { name: 'full stick moves 0.25 units in one tick and updates facing', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(-1, 0, 3.1)], router);
    const p = state.players.p1!;
    check(close(p.x, 50 - FULL_STEP) && close(p.y, 50), `ended at ${p.x}, ${p.y}`);
    checkEqual(p.facingAngle, 3.1, 'facing angle not applied');
    checkEqual(result.updates[0]?.type, 'playerMoved', 'no playerMoved update');
  } },
  { name: 'half-pushed stick moves half as far (analog input)', run: () => {
    const { state, router } = setup();
    updateTick(state, secondsPerTick(), [move(0, 0.5)], router);
    check(close(state.players.p1!.y, 50 + FULL_STEP / 2), 'analog distance is wrong');
  } },
  { name: 'diagonal of length 1 is accepted, including tiny rounding error', run: () => {
    const { state, router } = setup();
    const d = Math.SQRT1_2 + 1e-12;
    const result = updateTick(state, secondsPerTick(), [move(-d, -d)], router);
    check(result.commandResults[0]!.accepted, 'normalized diagonal was rejected');
  } },
  { name: 'speed hack: a vector longer than 1.0 is rejected and nothing moves', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(1, 1)], router);
    check(!result.commandResults[0]!.accepted, 'oversized vector accepted');
    check(state.players.p1!.x === 50 && state.players.p1!.y === 50, 'player moved anyway');
  } },
  { name: 'NaN or infinite input is rejected', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(Number.NaN, 0), move(0, 0, Infinity)], router);
    checkEqual(result.commandResults.map(r => r.accepted), [false, false], 'bad numbers accepted');
  } },
  { name: 'speed hack: a second MoveCommand in the same tick cannot add extra distance', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(-1, 0), move(-1, 0)], router);
    checkEqual(result.commandResults.map(r => r.accepted), [true, false], 'second move in the same tick was accepted');
    check(close(state.players.p1!.x, 50 - FULL_STEP), 'moved more than one step');
  } },
  { name: 'the per-tick allowance resets on the next tick', run: () => {
    const { state, router } = setup();
    updateTick(state, secondsPerTick(), [move(-1, 0)], router);
    updateTick(state, secondsPerTick(), [move(-1, 0)], router);
    check(close(state.players.p1!.x, 50 - 2 * FULL_STEP), 'second tick did not move');
  } },
  { name: 'dead, stunned or rooted players cannot move', run: () => {
    for (const change of ['dead', 'stunned', 'rooted']) {
      const { state, router } = setup();
      const p = state.players.p1!;
      if (change === 'dead') p.currentHealth = 0;
      if (change === 'stunned') p.isStunned = true;
      if (change === 'rooted') p.isRooted = true;
      const result = updateTick(state, secondsPerTick(), [move(-1, 0)], router);
      check(!result.commandResults[0]!.accepted && p.x === 50, `${change} player moved`);
    }
  } },
  { name: 'walls block the path; the player stays put', run: () => {
    const { state, router } = setup();
    state.players.p1!.x = 51.9;                        // 0.1 units left of the wall
    const result = updateTick(state, secondsPerTick(), [move(1, 0)], router);
    check(!result.commandResults[0]!.accepted && state.players.p1!.x === 51.9, 'walked into the wall');
  } },
  { name: 'map edges block movement', run: () => {
    const { state, router } = setup();
    state.players.p1!.x = 0.1;
    const result = updateTick(state, secondsPerTick(), [move(-1, 0)], router);
    check(!result.commandResults[0]!.accepted, 'walked off the map');
  } },
  { name: 'standing still is allowed and only turns the player', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(0, 0, 1.5)], router);
    check(result.commandResults[0]!.accepted && state.players.p1!.x === 50, 'zero vector misbehaved');
    checkEqual(state.players.p1!.facingAngle, 1.5, 'facing not updated while standing');
  } },
  { name: 'unknown players are rejected', run: () => {
    const { state, router } = setup();
    const result = updateTick(state, secondsPerTick(), [move(1, 0, 0, 'ghost')], router);
    check(!result.commandResults[0]!.accepted, 'unknown player accepted');
  } },
];
