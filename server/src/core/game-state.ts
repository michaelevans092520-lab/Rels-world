// The complete state of the game world on the server.
// Plain data only: no functions, no references to screens, sounds or networking,
// so it can be copied, saved to disk, or sent over the network as-is.
//
// This holds only the fields every game needs (a tick counter and a clock).
// Gameplay fields (players, monsters, items, ...) get added here once they are designed.

export interface GameState {
  /** How many ticks have run since the world started. Increases by exactly 1 per tick. */
  tickNumber: number;
  /** Total simulated time in seconds since the world started. */
  elapsedSeconds: number;
}

/** A brand-new, empty world. */
export function createGameState(): GameState {
  return { tickNumber: 0, elapsedSeconds: 0 };
}
