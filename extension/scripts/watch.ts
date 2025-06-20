#!/usr/bin/env -S npx tsx
import { logger, setupProcessHandlers, exitWithError, isMainModule } from './common.js';
import { build } from './build.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig } from './vite-utils.js';

export async function watch(): Promise<void> {
  logger.info('Starting watch mode...');

  logger.info('Running initial build...');
  try {
    await build();
  } catch (error) {
    exitWithError('Initial build failed', error);
  }

  const pm = new ProcessManager();
  pm.spawn(viteWatchConfig());
  setupProcessHandlers(() => pm.killAll());
}

if (isMainModule(import.meta.url)) {
  watch().catch(error => {
    exitWithError('Failed to start watch mode', error);
  });
}