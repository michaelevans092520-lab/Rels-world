// ORIGINAL CODE: Rel's World is a commercial game. Read docs/IP-RULES.md before editing.
// A tick system is logic that runs once per tick after all commands, e.g. tutorial tracking.
// It sees every update the commands produced this tick and may answer with more updates.

import { StateUpdate } from './commands.js';
import { GameState } from './game-state.js';

export type TickSystem = (state: GameState, updatesThisTick: readonly StateUpdate[]) => StateUpdate[];
