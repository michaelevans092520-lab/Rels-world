# Rel's World: server core

The authoritative game logic. It is written from scratch in TypeScript, follows clean-room rules, and is not tied to any engine.

## How it works
- **`GameState`**: the whole world as plain data. It has no graphics, sound or network code, so it can be saved or sent anywhere.
- **Commands**: every player action arrives as a plain object (`{ type, playerId, ... }`).
- **`CommandRouter`**: connects each command `type` to a handler. A handler checks the command, changes the state if it's valid, and returns a `CommandResult` (accepted or rejected, plus a list of `StateUpdate`s).
- **`updateTick(state, deltaSeconds, commands, router)`**: one step of the world. It applies the queued commands oldest first, then advances the clock. The caller decides how often it runs.

A visual engine or a network layer only ever sends commands and reads updates. It never changes the state directly.

## Build and test
Requires Node.js and the TypeScript compiler (`typescript`, Apache-2.0).
```
npm install
npm test
```
There are no runtime dependencies. Tests use a small runner in `test/test-runner.ts` instead of a testing library.

## Status
Only the plumbing exists so far: the state skeleton, commands, the router and the tick. Gameplay (players, movement, combat, inventory, trading) will be added from the owner's designs, one reviewed module at a time.
