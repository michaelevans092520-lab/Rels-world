// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// On-screen hints: one when each step starts, then stuck reminders.
// Owner's rule: first reminder after 30 s without progress, then every 30 s.

import { StateUpdate } from '../core/commands.js';
import { GameState } from '../core/game-state.js';
import { TUTORIAL_RULES } from '../data/tutorial-rules.js';
import { PlayerState } from '../player/player-state.js';
import { TutorialProgress } from './tutorial-state.js';
import { currentTutorialStep } from './tutorial-progress.js';

/** Tick system: sends each tutorial player a hint when a step starts, and reminders when stuck. */
export function sendTutorialHints(state: GameState, _updatesThisTick: readonly StateUpdate[]): StateUpdate[] {
  const results: StateUpdate[] = [];
  for (const player of Object.values(state.players)) {
    const hint = nextHintFor(player, state.elapsedSeconds);
    if (hint) results.push(hint);
  }
  return results;
}

function nextHintFor(player: PlayerState, nowSeconds: number): StateUpdate | null {
  const tutorial = player.tutorial, step = currentTutorialStep(player);
  if (tutorial.completed || !step) return null;

  // A step the player hasn't been told about yet: announce it and start its stuck timer now.
  if (tutorial.announcedStepIndex !== tutorial.stepIndex) {
    tutorial.announcedStepIndex = tutorial.stepIndex;
    tutorial.lastProgressAtSeconds = nowSeconds;
    tutorial.lastReminderAtSeconds = -1;
    return { type: 'tutorialHint', playerId: player.id, stepId: step.id, hint: step.hint, reason: 'stepStarted' };
  }
  if (!isReminderDue(tutorial, nowSeconds)) return null;
  tutorial.lastReminderAtSeconds = nowSeconds;
  return { type: 'tutorialHint', playerId: player.id, stepId: step.id, hint: step.hint, reason: 'reminder' };
}

/**
 * First reminder: when `firstReminderSeconds` have passed since the last progress.
 * After that: every `repeatReminderSeconds` since the previous reminder (until progress resets it).
 */
export function isReminderDue(tutorial: TutorialProgress, nowSeconds: number): boolean {
  if (tutorial.lastReminderAtSeconds < 0) {
    return nowSeconds - tutorial.lastProgressAtSeconds >= TUTORIAL_RULES.firstReminderSeconds;
  }
  return nowSeconds - tutorial.lastReminderAtSeconds >= TUTORIAL_RULES.repeatReminderSeconds;
}
