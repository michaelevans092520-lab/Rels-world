// Runs every test group and sets a failing exit code if anything broke.

import { coreTests } from './core.test.js';
import { movementTests } from './move-command.test.js';
import { runTests } from './test-runner.js';

const failures =
  runTests('Core plumbing', coreTests) +
  runTests('Player and MoveCommand', movementTests);

console.log(failures === 0 ? '\nAll tests passed.' : `\n${failures} test(s) failed.`);
if (failures > 0) process.exitCode = 1;
