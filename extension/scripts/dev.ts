#!/usr/bin/env -S npx tsx
import {
  logger,
  setupProcessHandlers,
  exitWithError,
  isMainModule,
  sleep,
  runInitialBuild,
} from './common.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig, webExtConfig } from './vite-utils.js';

async function dev(): Promise<void> {
  logger.info('Starting development mode...');

  await runInitialBuild();

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
