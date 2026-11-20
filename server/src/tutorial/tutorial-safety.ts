// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// Tutorial safety rules (owner's spec):
//  - Tutorial players can be attacked (normal open-world rules) but cannot die: health stops at 1.
//  - When health gets low, the guide restores it.
//  - The start area can't be left until the tutorial is finished.

import { StateUpdate } from '../core/commands.js';
import { GameState } from '../core/game-state.js';
import { TUTORIAL_RULES } from '../data/tutorial-rules.js';
import { PlayerState } from '../player/player-state.js';

/**
 * The lowest health this player may be left at.
 * FUTURE DAMAGE CODE MUST USE THIS when subtracting health, so tutorial players stop at 1 instead of dying.
 */
export function lowestAllowedHealth(player: PlayerState): number {
  return player.tutorial.completed ? 0 : TUTORIAL_RULES.healthFloor;
}

/** Tick system: keeps tutorial players alive and has the guide restore them when health is low. */
export function protectTutorialPlayers(state: GameState, _updatesThisTick: readonly StateUpdate[]): StateUpdate[] {
  const results: StateUpdate[] = [];
  for (const player of Object.values(state.players)) {
    if (player.tutorial.completed) continue;
    // Safety net in case some damage code forgot lowestAllowedHealth.
    player.currentHealth = Math.max(player.currentHealth, TUTORIAL_RULES.healthFloor);
    if (isHealthLow(player)) {
      player.currentHealth = player.maxHealth;
      // Health stays hidden, so the update says it happened without revealing any numbers.
      results.push({ type: 'tutorialGuideRestored', playerId: player.id });
    }
  }
  return results;
}

/** Low = at or below the guide's heal point, as a fraction of max health (e.g. 0.25 × 100 = 25). */
export function isHealthLow(player: PlayerState): boolean {
  return player.currentHealth <= player.maxHealth * TUTORIAL_RULES.guideHealAtHealthFraction;
}

/** True if (x, y) is inside the start-area circle: distance from its center ≤ its radius. */
export function isInsideStartArea(x: number, y: number): boolean {
  const area = TUTORIAL_RULES.startArea;
  return Math.hypot(x - area.centerX, y - area.centerY) <= area.radius;
}

/** Tutorial players may only move to positions inside the start area. Everyone else is unrestricted. */
export function tutorialAllowsPosition(player: PlayerState, x: number, y: number): boolean {
  return player.tutorial.completed || isInsideStartArea(x, y);
}
