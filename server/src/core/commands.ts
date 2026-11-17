// Commands: everything a player wants to do arrives as a command object.
// The server decides whether to accept it and answers with a list of state updates.
// Because commands and updates are plain data, they can travel over any network
// connection (WebSocket, UDP, ...) without changing the game logic.

/** Fields every command carries. Specific commands (MoveCommand, AttackCommand, ...) extend this. */
export interface Command {
  /** Which kind of command this is, e.g. "move". Used to find the code that handles it. */
  type: string;
  /** The player who sent it. */
  playerId: string;
}

/** One change the server made to the world, described as data for clients to apply or display. */
export interface StateUpdate {
  /** Which kind of change this is, e.g. "playerMoved". */
  type: string;
  /** Any extra details about the change. Each update type documents its own fields. */
  [detail: string]: unknown;
}

/** The server's answer to a single command. */
export interface CommandResult {
  /** True if the command was valid and was applied. */
  accepted: boolean;
  /** When a command is rejected, a short explanation (useful for debugging and for client messages). */
  reason?: string;
  /** Everything that changed because of this command. Empty when rejected. */
  updates: StateUpdate[];
}

/** Shortcut for building a rejection. */
export function rejectCommand(reason: string): CommandResult {
  return { accepted: false, reason, updates: [] };
}

/** Shortcut for building a success. */
export function acceptCommand(updates: StateUpdate[]): CommandResult {
  return { accepted: true, updates };
}
