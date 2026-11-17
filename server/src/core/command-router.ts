// The command router connects each command type to the function that handles it.
// New gameplay is added by writing one handler and registering it, without
// touching the router or the tick loop.

import { Command, CommandResult, rejectCommand } from './commands.js';
import { GameState } from './game-state.js';

/** A function that checks a command against the current state, changes the state if valid, and reports what changed. */
export type CommandHandler = (state: GameState, command: Command) => CommandResult;

export class CommandRouter {
  private readonly handlersByType = new Map<string, CommandHandler>();

  /** Connect a command type to its handler. Each type may only be registered once, to avoid two handlers fighting. */
  register(commandType: string, handler: CommandHandler): void {
    if (this.handlersByType.has(commandType)) {
      throw new Error(`A handler for "${commandType}" is already registered.`);
    }
    this.handlersByType.set(commandType, handler);
  }

  /** Run one command. Unknown command types are rejected instead of crashing the server. */
  handle(state: GameState, command: Command): CommandResult {
    const handler = this.handlersByType.get(command.type);
    if (!handler) {
      return rejectCommand(`Unknown command type "${command.type}".`);
    }
    return handler(state, command);
  }

  /** True if some handler is registered for this command type. */
  knows(commandType: string): boolean {
    return this.handlersByType.has(commandType);
  }
}
