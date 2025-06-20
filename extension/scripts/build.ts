#!/usr/bin/env -S npx tsx
import { runStages, exitWithError, isMainModule } from './common.js';
import { buildStages } from './build-stages.js';

export async function build(): Promise<void> {
  const result = await runStages(buildStages, 'build process');
  
  if (result.isErr()) {
    exitWithError('Build failed', result.error);
  }
}

if (isMainModule(import.meta.url)) {
  build().catch(error => {
    exitWithError('Unexpected error', error);
  });
}