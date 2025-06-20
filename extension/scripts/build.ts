#!/usr/bin/env -S npx tsx
import { ok, Result } from 'neverthrow';
import { runStages, exitWithError, isMainModule, Stage } from './common.js';
import { buildCode, copyIcons, copyManifest, verifyBuildOutput } from './stages.js';

export const buildStages: Stage[] = [buildCode, verifyBuildOutput, copyManifest, copyIcons];

export async function build(): Promise<Result<void, Error>> {
  const result = await runStages(buildStages, 'build process');

  if (result.isErr()) {
    exitWithError('Build failed', result.error);
  }

  return ok(undefined);
}

if (isMainModule(import.meta.url)) {
  build().then((result) => {
    result.match(
      () => {},
      (error) => {
        exitWithError('Unexpected error', error);
      },
    );
  });
}
