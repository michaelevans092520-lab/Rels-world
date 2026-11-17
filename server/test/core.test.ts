// Tests for the core plumbing: the command router and the tick loop.
// They use a made-up "test" command, because no real gameplay commands exist yet.

import { acceptCommand, Command } from '../src/core/commands.js';
import { CommandRouter } from '../src/core/command-router.js';
import { createGameState, GameState } from '../src/core/game-state.js';
import { updateTick } from '../src/core/update-tick.js';
import { check, checkEqual, checkThrows, runTests, TestCase } from './test-runner.js';

/** A router with one fake command that just reports the tick it saw. */
function makeTestRouter(): CommandRouter {
  const router = new CommandRouter();
  router.register('test', (state: GameState, command: Command) =>
    acceptCommand([{ type: 'tested', playerId: command.playerId, seenAtTick: state.tickNumber }]));
  return router;
}

const tests: TestCase[] = [
  { name: 'a new world starts at tick 0 and 0 seconds', run: () => {
    checkEqual(createGameState(), { tickNumber: 0, elapsedSeconds: 0 }, 'fresh state is wrong');
  } },
  { name: 'each tick adds 1 to the tick number and deltaSeconds to the clock', run: () => {
    const state = createGameState(), router = new CommandRouter();
    updateTick(state, 0.5, [], router);
    updateTick(state, 0.25, [], router);
    checkEqual(state, { tickNumber: 2, elapsedSeconds: 0.75 }, 'clock did not advance correctly');
  } },
  { name: 'a negative or broken time step is refused', run: () => {
    const state = createGameState(), router = new CommandRouter();
    checkThrows(() => updateTick(state, -1, [], router), 'negative time was accepted');
    checkThrows(() => updateTick(state, Number.NaN, [], router), 'NaN time was accepted');
  } },
  { name: 'commands run in the order given and their updates are collected', run: () => {
    const state = createGameState(), router = makeTestRouter();
    const result = updateTick(state, 1, [{ type: 'test', playerId: 'a' }, { type: 'test', playerId: 'b' }], router);
    checkEqual(result.updates.map(u => u.playerId), ['a', 'b'], 'updates out of order');
    checkEqual(result.commandResults.map(r => r.accepted), [true, true], 'commands not accepted');
  } },
  { name: 'commands see the state from before the clock advances', run: () => {
    const state = createGameState(), router = makeTestRouter();
    const result = updateTick(state, 1, [{ type: 'test', playerId: 'a' }], router);
    checkEqual(result.updates[0]?.seenAtTick, 0, 'command ran after the clock moved');
    checkEqual(result.tickNumber, 1, 'tick result has the wrong tick number');
  } },
  { name: 'unknown command types are rejected, not crashed on', run: () => {
    const state = createGameState(), router = makeTestRouter();
    const result = updateTick(state, 1, [{ type: 'fly', playerId: 'a' }], router);
    check(!result.commandResults[0]?.accepted, 'unknown command was accepted');
    checkEqual(result.updates, [], 'rejected command produced updates');
  } },
  { name: 'a command type cannot be registered twice', run: () => {
    const router = makeTestRouter();
    checkThrows(() => router.register('test', () => acceptCommand([])), 'duplicate handler was allowed');
  } },
];

const failures = runTests('Core plumbing', tests);
console.log(failures === 0 ? '\nAll tests passed.' : `\n${failures} test(s) failed.`);
if (failures > 0) process.exitCode = 1;
