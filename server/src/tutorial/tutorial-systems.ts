// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// The tutorial's tick systems, in the order they must run each tick:
//   1. count progress from this tick's actions (may finish steps or the whole tutorial),
//   2. keep tutorial players alive / guide restores health,
//   3. send step hints and stuck reminders (so a newly reached step is announced the same tick).

import { TickSystem } from '../core/tick-system.js';
import { sendTutorialHints } from './tutorial-hints.js';
import { trackTutorialProgress } from './tutorial-progress.js';
import { protectTutorialPlayers } from './tutorial-safety.js';

export const TUTORIAL_SYSTEMS: readonly TickSystem[] = [trackTutorialProgress, protectTutorialPlayers, sendTutorialHints];
