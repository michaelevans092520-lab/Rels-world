// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// A player as the server sees it. Plain data only (no methods), so the whole player can be
// saved, copied, or sent over the network without conversion.

import { GAME_RULES } from '../data/game-rules.js';

export interface PlayerState {
  id: string;
  name: string;
  level: number;

  /** Free-world position in world units (no tile grid). Movement currently happens on the X/Y plane. */
  x: number;
  y: number;
  /** Height in the world. Stored now so 3D terrain can use it later; MoveCommand does not change it yet. */
  z: number;

  /** Direction the character faces, in radians. 0 points along +X; angles increase toward +Y. */
  facingAngle: number;

  /**
   * Movement speed in world units per second before any slowdowns.
   * REMINDER (wounded state, not built yet): as currentHealth / maxHealth drops, the player will
   * enter a "wounded state" that changes their walk stance, REDUCES MOVEMENT SPEED, and slows
   * their attack speed. Movement code should then use an "effective speed" derived from this value.
   */
  baseMoveSpeed: number;

  /**
   * Health is hidden: the server tracks it, but there is no health bar in the game UI.
   * Players fight to the death (currentHealth reaching 0).
   * REMINDER (wounded state, not built yet): lower health percentages will apply a "wounded state"
   * that changes walk stance, reduces movement speed, and slows attack speed.
   */
  currentHealth: number;
  maxHealth: number;

  /** Stunned: cannot move (and later, cannot act). */
  isStunned: boolean;
  /** Rooted: cannot move, but may still be able to do other things later. */
  isRooted: boolean;

  /** Anti-cheat bookkeeping: the tick number of this player's most recent movement... */
  lastMoveTick: number;
  /** ...and how far they have already moved during that tick, in world units. */
  distanceMovedThisTick: number;
}

/** What is needed to create a player. Everything else starts from the game rules. */
export interface NewPlayerDetails {
  id: string;
  name: string;
  level: number;
  maxHealth: number;
  x: number;
  y: number;
  z?: number;
  facingAngle?: number;
}

export function createPlayer(details: NewPlayerDetails): PlayerState {
  return {
    id: details.id, name: details.name, level: details.level,
    x: details.x, y: details.y, z: details.z ?? 0,
    facingAngle: details.facingAngle ?? 0,
    baseMoveSpeed: GAME_RULES.playerBaseMoveSpeed,
    currentHealth: details.maxHealth, maxHealth: details.maxHealth,
    isStunned: false, isRooted: false,
    lastMoveTick: -1, distanceMovedThisTick: 0,
  };
}

/** Alive means health above zero. */
export function isAlive(player: PlayerState): boolean {
  return player.currentHealth > 0;
}

/** A player can move when alive and neither stunned nor rooted. */
export function canMove(player: PlayerState): boolean {
  return isAlive(player) && !player.isStunned && !player.isRooted;
}

/**
 * The speed actually used for movement this tick.
 * For now this is simply the base speed. This is the single place where the future
 * wounded-state and slow effects will reduce it.
 */
export function effectiveMoveSpeed(player: PlayerState): number {
  return player.baseMoveSpeed;
}
