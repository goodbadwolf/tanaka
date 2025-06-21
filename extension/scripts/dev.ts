#!/usr/bin/env -S npx tsx
import { setupProcessHandlers, exitWithError, sleep, runCLI } from './common.js';
import { ProcessManager } from './process-utils.js';
import { runStages, Stage, createCopyStaticAssetsStage } from './stages.js';
import { viteWatchConfig, webExtConfig } from './vite-utils.js';

async function dev(): Promise<void> {
  const pm = new ProcessManager();
  const watchConfig = viteWatchConfig();
  pm.spawn(watchConfig);

  await sleep(2000);

  const devStages: Stage[] = [createCopyStaticAssetsStage()];
  const result = await runStages(devStages, 'pre-dev');
  if (result.isErr()) {
    exitWithError('Pre-dev failed', result.error);
  }
  const extConfig = webExtConfig();
  pm.spawn(extConfig);

  pm.linkExitHandlers(watchConfig.name, extConfig.name);
  setupProcessHandlers(() => pm.killAll());
}

runCLI(dev, import.meta.url);
