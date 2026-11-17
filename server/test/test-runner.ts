// A tiny test runner written from scratch so the project needs no testing library.
// Each test is a named function that throws an Error when something is wrong.

export interface TestCase {
  name: string;
  run: () => void;
}

/** Fail the current test unless the condition is true. */
export function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Fail the current test unless two plain values are equal (compared as JSON, which suits plain data). */
export function checkEqual(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\n    expected: ${e}\n    actual:   ${a}`);
}

/** Fail the current test unless the function throws. */
export function checkThrows(action: () => void, message: string): void {
  try { action(); } catch { return; }
  throw new Error(message);
}

/** Run every test, print a line per test, and return how many failed. */
export function runTests(groupName: string, tests: readonly TestCase[]): number {
  let failed = 0;
  console.log(`\n${groupName}`);
  for (const test of tests) {
    try {
      test.run();
      console.log(`  ok    ${test.name}`);
    } catch (error) {
      failed += 1;
      console.log(`  FAIL  ${test.name}\n    ${(error as Error).message}`);
    }
  }
  return failed;
}
