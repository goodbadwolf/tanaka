#!/usr/bin/env -S npx tsx
import {
  logger,
  setupProcessHandlers,
  exitWithError,
  isMainModule,
  runInitialBuild,
} from './common.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig } from './vite-utils.js';

export async function watch(): Promise<void> {
  logger.info('Starting watch mode...');

  await runInitialBuild({
    shouldBuildCode: false,
    shouldCopyStaticAssets: true,
  });

  const pm = new ProcessManager();
  pm.spawn(viteWatchConfig());
  setupProcessHandlers(() => pm.killAll());
}

if (isMainModule(import.meta.url)) {
  watch().catch((error) => {
    exitWithError('Failed to start watch mode', error);
  });
}
