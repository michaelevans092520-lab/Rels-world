# Rel's World: server core

> **Original code only. This game will be sold.** Read `../docs/IP-RULES.md` before changing anything here.

The authoritative game logic. It is written from scratch in TypeScript, follows clean-room rules, and is not tied to any engine.

## How it works
- **`GameState`**: the whole world as plain data. It has no graphics, sound or network code, so it can be saved or sent anywhere.
- **Commands**: every player action arrives as a plain object (`{ type, playerId, ... }`).
- **`CommandRouter`**: connects each command `type` to a handler. A handler checks the command, changes the state if it's valid, and returns a `CommandResult` (accepted or rejected, plus a list of `StateUpdate`s).
- **`updateTick(state, deltaSeconds, commands, router, systems)`**: one step of the world. It applies the queued commands oldest first, runs the tick systems (like the tutorial), then advances the clock. The caller decides how often it runs.

A visual engine or a network layer only ever sends commands and reads updates. It never changes the state directly.

## Build and test
Requires Node.js and the TypeScript compiler (`typescript`, Apache-2.0).
```
npm install
npm test        # compiles and runs test/run-all
```
There are no runtime dependencies. Tests use a small runner in `test/test-runner.ts` instead of a testing library.

## Files
| File | What it does |
|---|---|
| `src/core/game-state.ts` | `GameState`: tick, clock, players |
| `src/core/commands.ts` | `Command`, `StateUpdate`, `CommandResult` |
| `src/core/command-router.ts` | Maps command types to handlers |
| `src/core/update-tick.ts` | `updateTick()`: one server step |
| `src/data/game-rules.ts` | Tuning data: 20 ticks/s, base speed 5.0 |
| `src/player/player-state.ts` | `PlayerState`, `createPlayer`, `canMove`, `effectiveMoveSpeed` |
| `src/player/move-command.ts` | `MoveCommand` checks and movement |
| `src/world/movement-blocker.ts` | What blocks movement (interface + simple box placeholder) |
| `src/core/tick-system.ts` | Logic that runs every tick after commands |
| `src/data/tutorial-rules.ts` | Tutorial steps, timers, health floor, start area (data) |
| `src/tutorial/` | Tutorial progress, hints/reminders, safety rules, system order |

## Status
Built from the owner's specs: core plumbing (spec 0), Player + MoveCommand (spec 1), tutorial (spec 2). Combat, inventory, trading etc. wait for their designs.
