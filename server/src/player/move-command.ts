// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// MoveCommand: the one movement command for every input device.
// Keyboard (WASD), game controllers and touch joysticks all send the same thing:
// a 2D direction vector (each part from -1.0 to 1.0, total length at most 1.0) plus a facing angle.
// The server alone decides where the player ends up.

import { acceptCommand, Command, CommandResult, rejectCommand } from '../core/commands.js';
import { CommandHandler } from '../core/command-router.js';
import { GameState } from '../core/game-state.js';
import { GAME_RULES, secondsPerTick } from '../data/game-rules.js';
import { MovementBlocker } from '../world/movement-blocker.js';
import { tutorialAllowsPosition } from '../tutorial/tutorial-safety.js';
import { canMove, effectiveMoveSpeed, PlayerState } from './player-state.js';

export const MOVE_COMMAND_TYPE = 'move';

export interface MoveCommand extends Command {
  type: typeof MOVE_COMMAND_TYPE;
  /** Sideways part of the direction, -1.0 (left / -X) to 1.0 (right / +X). */
  directionX: number;
  /** Forward part of the direction, -1.0 (-Y) to 1.0 (+Y). */
  directionY: number;
  /** Where the player is looking, in radians (see PlayerState.facingAngle). */
  facingAngle: number;
}

/**
 * Builds the handler to register with the CommandRouter:
 *   router.register(MOVE_COMMAND_TYPE, createMoveCommandHandler(blocker));
 * The blocker is passed in so the movement code never depends on a particular map format.
 */
export function createMoveCommandHandler(blocker: MovementBlocker): CommandHandler {
  return (state, command) => processMoveCommand(state, command as MoveCommand, blocker);
}

/** Runs the server checks in order, then moves the player for one tick. */
export function processMoveCommand(state: GameState, command: MoveCommand, blocker: MovementBlocker): CommandResult {
  const player = state.players[command.playerId];
  if (!player) return rejectCommand('Unknown player.');

  // Check 1: alive and not stunned or rooted.
  if (!canMove(player)) return rejectCommand('Player cannot move right now (dead, stunned or rooted).');

  // Check 2: the input itself is valid (no huge numbers, no NaN).
  const inputProblem = findMoveInputProblem(command);
  if (inputProblem) return rejectCommand(inputProblem);

  // Work out the destination for one tick of movement.
  const step = movementStepForOneTick(player, command.directionX, command.directionY);
  const targetX = player.x + step.x;
  const targetY = player.y + step.y;

  // Check 3a: this move plus anything already moved this tick stays within the per-tick limit.
  if (exceedsDistanceLimit(player, state.tickNumber, step.length)) {
    return rejectCommand('Too far for one tick.');
  }
  // Check 3b: the path does not leave the map or pass through anything solid.
  if (step.length > 0 && blocker.isPathBlocked(player.x, player.y, targetX, targetY)) {
    return rejectCommand('Path is blocked.');
  }
  // Check 3c: tutorial players can't leave the start area until they finish.
  if (!tutorialAllowsPosition(player, targetX, targetY)) return rejectCommand('Finish the tutorial to leave the start area.');

  applyMove(player, state.tickNumber, targetX, targetY, command.facingAngle, step.length);
  return acceptCommand([{ type: 'playerMoved', playerId: player.id, x: player.x, y: player.y, z: player.z, facingAngle: player.facingAngle, distance: step.length }]);
}

/** Returns a description of what is wrong with the input, or null if it is fine. */
export function findMoveInputProblem(command: MoveCommand): string | null {
  const { directionX, directionY, facingAngle } = command;
  if (![directionX, directionY, facingAngle].every(Number.isFinite)) {
    return 'Direction and facing angle must be real numbers.';
  }
  // Length of the vector by Pythagoras. Anything longer than 1.0 would mean moving faster than allowed.
  const length = Math.hypot(directionX, directionY);
  if (length > 1 + GAME_RULES.movementVectorTolerance) {
    return 'Direction vector is longer than 1.0.';
  }
  return null;
}

/**
 * How far the player moves this tick, as an X/Y offset.
 * distance = speed (units per second) × tick length (seconds) × how far the stick is pushed (0 to 1).
 * At full speed: 5.0 × 0.05 = 0.25 world units per tick.
 */
export function movementStepForOneTick(player: PlayerState, directionX: number, directionY: number) {
  const unitsPerTick = effectiveMoveSpeed(player) * secondsPerTick();
  const x = directionX * unitsPerTick;
  const y = directionY * unitsPerTick;
  return { x, y, length: Math.hypot(x, y) };
}

/** The most a player may move in a single tick: full speed for one full tick. */
export function maxDistancePerTick(player: PlayerState): number {
  return effectiveMoveSpeed(player) * secondsPerTick();
}

/**
 * True if moving `distance` now would push this tick's total past the per-tick maximum.
 * This stops a cheater from sending many MoveCommands in the same tick to move several times.
 */
export function exceedsDistanceLimit(player: PlayerState, tickNumber: number, distance: number): boolean {
  const alreadyMoved = player.lastMoveTick === tickNumber ? player.distanceMovedThisTick : 0;
  const allowed = maxDistancePerTick(player) * (1 + GAME_RULES.movementVectorTolerance);
  return alreadyMoved + distance > allowed;
}

/** Writes the accepted move into the player's state. */
function applyMove(player: PlayerState, tickNumber: number, x: number, y: number, facingAngle: number, distance: number): void {
  const alreadyMoved = player.lastMoveTick === tickNumber ? player.distanceMovedThisTick : 0;
  player.x = x;
  player.y = y;
  player.facingAngle = facingAngle;
  player.lastMoveTick = tickNumber;
  player.distanceMovedThisTick = alreadyMoved + distance;
}
