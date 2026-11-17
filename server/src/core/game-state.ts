// The complete state of the game world on the server.
// Plain data only: no functions, no references to screens, sounds or networking,
// so it can be copied, saved to disk, or sent over the network as-is.

import { PlayerState } from '../player/player-state.js';

export interface GameState {
  /** How many ticks have run since the world started. Increases by exactly 1 per tick. */
  tickNumber: number;
  /** Total simulated time in seconds since the world started. */
  elapsedSeconds: number;
  /** Every player in the world, looked up by player ID. */
  players: Record<string, PlayerState>;
}

/** A brand-new, empty world. */
export function createGameState(): GameState {
  return { tickNumber: 0, elapsedSeconds: 0, players: {} };
}
