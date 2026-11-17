// Game-wide tuning numbers, kept as plain data so they can be changed without touching logic.

export const GAME_RULES = {
  /** Server simulation rate. 20 ticks per second = one tick every 50 ms (real-time action movement). */
  ticksPerSecond: 20,

  /** A player's starting movement speed, in world units per second. */
  playerBaseMoveSpeed: 5.0,

  /**
   * Allowed rounding error when checking that a movement vector's length is at most 1.0.
   * Clients compute normalized vectors with floating-point math, so a "length 1" vector can
   * come out as 1.0000000001. This tolerance accepts that tiny error without allowing a real speed boost.
   */
  movementVectorTolerance: 0.000001,
} as const;

/** Length of one tick in seconds (1 / 20 = 0.05 s). */
export function secondsPerTick(): number {
  return 1 / GAME_RULES.ticksPerSecond;
}
