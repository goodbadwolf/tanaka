#!/usr/bin/env -S npx tsx
import { exitWithError, runCLI } from './common.js';
import { rspackBuild } from './rspack-utils.js';

async function main(): Promise<void> {
  const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
  if (!modeArg || modeArg.split('=').length !== 2) {
    exitWithError(
      'A valid build mode must be specified',
      new Error('Use --mode=development|staging|production'),
    );
  }

  const mode = modeArg.split('=')[1];

  const result = await rspackBuild(mode);
  if (result.isErr()) {
    exitWithError('Build failed', result.error);
  }
}

runCLI(main, import.meta.url);
