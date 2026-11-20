// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// Tutorial step tracking. It watches the updates other systems produce (e.g. "playerMoved",
// "itemPickedUp") and counts the ones that match the player's current step.
// The tutorial never needs to know how moving, items or fighting work. It only listens.

import { StateUpdate } from '../core/commands.js';
import { GameState } from '../core/game-state.js';
import { TUTORIAL_RULES, TutorialStepRule } from '../data/tutorial-rules.js';
import { PlayerState } from '../player/player-state.js';

/** The step a player is on, or undefined once all steps are done. */
export function currentTutorialStep(player: PlayerState): TutorialStepRule | undefined {
  return TUTORIAL_RULES.steps[player.tutorial.stepIndex];
}

/** Tick system: counts this tick's updates toward each tutorial player's current step. */
export function trackTutorialProgress(state: GameState, updatesThisTick: readonly StateUpdate[]): StateUpdate[] {
  const results: StateUpdate[] = [];
  for (const update of updatesThisTick) {
    const player = typeof update.playerId === 'string' ? state.players[update.playerId] : undefined;
    if (!player || player.tutorial.completed) continue;
    results.push(...applyUpdateToTutorial(player, update, state.elapsedSeconds));
  }
  return results;
}

/**
 * How much one update counts toward a step.
 * The move step counts distance walked; every other step counts 1 per matching update.
 */
export function progressFromUpdate(step: TutorialStepRule, update: StateUpdate): number {
  if (update.type !== step.eventType) return 0;
  if (update.type === 'playerMoved') return typeof update.distance === 'number' ? update.distance : 0;
  return 1;
}

function applyUpdateToTutorial(player: PlayerState, update: StateUpdate, nowSeconds: number): StateUpdate[] {
  const step = currentTutorialStep(player);
  if (!step) return [];
  const amount = progressFromUpdate(step, update);
  if (amount <= 0) return [];

  const tutorial = player.tutorial;
  tutorial.stepProgress += amount;
  tutorial.lastProgressAtSeconds = nowSeconds;   // progress resets the stuck-reminder timer
  tutorial.lastReminderAtSeconds = -1;
  if (tutorial.stepProgress < step.count) return [];
  return finishCurrentStep(player, nowSeconds);
}

/** Moves the player to the next step, or completes the tutorial after the last one. */
function finishCurrentStep(player: PlayerState, nowSeconds: number): StateUpdate[] {
  const tutorial = player.tutorial;
  const finished = TUTORIAL_RULES.steps[tutorial.stepIndex]!;
  tutorial.stepIndex += 1;
  tutorial.stepProgress = 0;
  tutorial.lastProgressAtSeconds = nowSeconds;
  const updates: StateUpdate[] = [{ type: 'tutorialStepCompleted', playerId: player.id, stepId: finished.id }];
  if (!currentTutorialStep(player)) updates.push(...completeTutorial(player));
  return updates;
}

/** Marks the tutorial done, unlocks the start area and hands out the starter reward. */
function completeTutorial(player: PlayerState): StateUpdate[] {
  player.tutorial.completed = true;
  // Items don't exist yet: the reward is reported here and will be added to the bag once inventory is built.
  return [
    { type: 'tutorialCompleted', playerId: player.id, rewardItemIds: [...TUTORIAL_RULES.starterRewardItemIds] },
    { type: 'startAreaUnlocked', playerId: player.id },
  ];
}
