#!/usr/bin/env -S npx tsx
import { ok, Result } from 'neverthrow';
import { exitWithError, isMainModule } from './common.js';
import { runStages, Stage, buildCode, copyIcons, copyManifest } from './stages.js';

export async function build(): Promise<Result<void, Error>> {
  const buildStages: Stage[] = [buildCode, copyIcons, copyManifest];
  const result = await runStages(buildStages, 'build');
  return result;
}

if (isMainModule(import.meta.url)) {
  build().then((result) => {
    if (result.isErr()) {
      exitWithError('Build failed', result.error);
    }
  });
}
