// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// The tick: the server's heartbeat. Each call advances the world by one step.
//
// Order inside a tick (kept simple and fixed so results are predictable):
//   1. Apply every command that arrived since the last tick, oldest first.
//   2. Run each tick system (e.g. tutorial tracking), in the order given. Each one sees all
//      updates so far, including those from earlier systems.
//   3. Advance the clock.
//
// How often this runs (the tick length) is decided by the caller, not here,
// so the same logic works for a real server, a test, or an offline single-player game.

import { Command, CommandResult, StateUpdate } from './commands.js';
import { CommandRouter } from './command-router.js';
import { GameState } from './game-state.js';
import { TickSystem } from './tick-system.js';

/** What one tick produced, for sending to clients and for logging. */
export interface TickResult {
  /** The tick number that just finished. */
  tickNumber: number;
  /** The answer to each command, in the same order the commands were given. */
  commandResults: CommandResult[];
  /** Every state change from this tick, in the order they happened. */
  updates: StateUpdate[];
}

export function updateTick(
  state: GameState,
  deltaSeconds: number,
  queuedCommands: readonly Command[],
  router: CommandRouter,
  systems: readonly TickSystem[] = [],
): TickResult {
  // A negative or broken time step would run the clock backwards, so refuse it outright.
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new Error(`deltaSeconds must be a number >= 0, got ${deltaSeconds}.`);
  }

  const commandResults: CommandResult[] = [];
  const updates: StateUpdate[] = [];

  // 1. Commands, oldest first. Each handler sees the changes made by the ones before it.
  for (const command of queuedCommands) {
    const result = router.handle(state, command);
    commandResults.push(result);
    updates.push(...result.updates);
  }

  // 2. Tick systems.
  for (const system of systems) {
    updates.push(...system(state, updates));
  }

  // 3. Clock.
  state.tickNumber += 1;
  state.elapsedSeconds += deltaSeconds;

  return { tickNumber: state.tickNumber, commandResults, updates };
}
