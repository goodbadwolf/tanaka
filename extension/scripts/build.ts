#!/usr/bin/env -S npx tsx
import { Result } from 'neverthrow';
import { exitWithError, runCLI } from './common.js';
import { runStages, Stage, buildCode, copyIcons, copyManifest } from './stages.js';

export async function build(): Promise<Result<void, Error>> {
  const buildStages: Stage[] = [buildCode, copyIcons, copyManifest];
  return await runStages(buildStages, 'build');
}

async function main(): Promise<void> {
  const result = await build();
  if (result.isErr()) {
    exitWithError('Build failed', result.error);
  }
}

runCLI(main, import.meta.url);
