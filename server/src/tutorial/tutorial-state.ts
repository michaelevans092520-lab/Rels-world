// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// A player's tutorial progress, stored on the player as plain data.

export interface TutorialProgress {
  /** True once every step is done (or the tutorial was skipped). */
  completed: boolean;
  /** Index into TUTORIAL_RULES.steps of the step the player is on. */
  stepIndex: number;
  /** Progress on the current step: a count of events, or units walked for the move step. */
  stepProgress: number;
  /** Game time (GameState.elapsedSeconds) of the player's last progress. Drives stuck reminders. */
  lastProgressAtSeconds: number;
  /** Game time the last stuck reminder was sent, or -1 if none yet for this stretch. */
  lastReminderAtSeconds: number;
  /** Which step the player was last told about (hint shown), or -1 before the first hint. */
  announcedStepIndex: number;
}

/**
 * Starting progress for a new character.
 * `required` is false for characters allowed to skip (the owner's rule: later characters on an account can skip).
 * There's no account system yet, so whoever creates the character decides this for now.
 */
export function createTutorialProgress(required: boolean, nowSeconds = 0): TutorialProgress {
  return { completed: !required, stepIndex: 0, stepProgress: 0, lastProgressAtSeconds: nowSeconds, lastReminderAtSeconds: -1, announcedStepIndex: -1 };
}
