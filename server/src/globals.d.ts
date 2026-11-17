// The few runtime globals this project uses, declared by hand so no type packages
// (such as @types/node) are needed. Add to this list only when something new is used.

declare const console: {
  log(...values: unknown[]): void;
};

declare const process: {
  exitCode: number | undefined;
};
