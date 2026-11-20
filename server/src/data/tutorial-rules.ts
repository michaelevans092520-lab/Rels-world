// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// Tutorial design data (owner's spec: docs/specs/tutorial.md). Change the tutorial here, not in the logic.

/** One tutorial step: finished once `count` updates of `eventType` have happened (or `count` units moved). */
export interface TutorialStepRule {
  id: string;
  /** The StateUpdate type that counts toward this step (sent by the system that does the action). */
  eventType: string;
  /** How many are needed. For the move step this is distance in world units. */
  count: number;
  /** Short on-screen hint shown when the step starts and in stuck reminders. DRAFT TEXT: owner to edit. */
  hint: string;
}

export const TUTORIAL_RULES = {
  /** Owner's order: move → items → fight → quest. Counts marked "default" are placeholders for the owner to confirm. */
  steps: [
    { id: 'move', eventType: 'playerMoved', count: 10, hint: 'Use the joystick, WASD or controller to walk around.' },          // 10 units: default
    { id: 'pickUpItem', eventType: 'itemPickedUp', count: 1, hint: 'Pick up the item the guide left for you.' },
    { id: 'equipItem', eventType: 'itemEquipped', count: 1, hint: 'Open your bag and equip the item.' },
    { id: 'fight', eventType: 'trainingTargetHit', count: 3, hint: 'Attack the training target.' },                              // 3 hits: default
    { id: 'acceptQuest', eventType: 'questAccepted', count: 1, hint: 'Talk to the guide to get your first quest.' },
  ] as TutorialStepRule[],

  /** Stuck reminders: first one after 30 s without progress on a step, then every 30 s (owner). */
  firstReminderSeconds: 30,
  repeatReminderSeconds: 30,

  /** Tutorial players can be attacked but can't die: health never drops below this (owner). */
  healthFloor: 1,
  /**
   * The guide restores the player when health falls to this fraction of max or lower (owner chose "guide heals when low").
   * 0.25 is a DEFAULT: the owner hasn't set the exact "low" point yet.
   * REMINDER (owner): extra guide chat will be added later. Ask the owner when NPC dialogue gets designed.
   */
  guideHealAtHealthFraction: 0.25,

  /** The start area players can't leave until the tutorial is done: a circle about 100 units across (owner). */
  startArea: {
    /** PLACEHOLDER position: set once Country 1's map is designed. */
    centerX: 0,
    centerY: 0,
    radius: 50,
  },

  /** Items given when the tutorial is finished (owner wants a starter reward). Empty until items are designed. */
  starterRewardItemIds: [] as string[],
};
