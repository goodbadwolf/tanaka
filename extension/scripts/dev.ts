#!/usr/bin/env -S npx tsx
import { Result } from 'neverthrow';
import { setupProcessHandlers, exitWithError, isMainModule, sleep } from './common.js';
import { ProcessManager } from './process-utils.js';
import { copyStaticAssets, runStages, Stage } from './stages.js';
import { viteWatchConfig, webExtConfig } from './vite-utils.js';

async function preDev(): Promise<Result<void, Error>> {
  const devStages: Stage[] = [copyStaticAssets];
  const result = await runStages(devStages, 'pre-dev');
  return result;
}

async function dev(): Promise<void> {
  const result = await preDev();
  if (result.isErr()) {
    exitWithError('Pre-dev failed', result.error);
  }

  const pm = new ProcessManager();
  const watchConfig = viteWatchConfig();
  pm.spawn(watchConfig);

  await sleep(1000);

  const extConfig = webExtConfig();
  pm.spawn(extConfig);

  pm.linkExitHandlers(watchConfig.name, extConfig.name);
  setupProcessHandlers(() => pm.killAll());
}

if (isMainModule(import.meta.url)) {
  dev().catch((error) => {
    exitWithError('Failed to start development mode', error);
  });
}
