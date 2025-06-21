#!/usr/bin/env -S npx tsx
import { Result } from 'neverthrow';
import { exitWithError, runCLI } from './common.js';
import { runStages, Stage, createBuildCodeStage, createCopyStaticAssetsStage } from './stages.js';

export async function build(mode: string): Promise<Result<void, Error>> {
  const buildStages: Stage[] = [createBuildCodeStage(mode), createCopyStaticAssetsStage()];
  return await runStages(buildStages, 'build');
}

async function main(): Promise<void> {
  const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
  if (!modeArg || modeArg.split('=').length !== 2) {
    exitWithError(
      'A valid build mode must be specified',
      new Error('Use --mode=development|staging|production'),
    );
  }

  const mode = modeArg.split('=')[1];

  const result = await build(mode);
  if (result.isErr()) {
    exitWithError('Build failed', result.error);
  }
}

runCLI(main, import.meta.url);
