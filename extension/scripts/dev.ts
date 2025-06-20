#!/usr/bin/env -S npx tsx
import { logger, setupProcessHandlers, exitWithError, isMainModule, sleep } from './common.js';
import { build } from './build.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig } from './vite-utils.js';

async function dev(): Promise<void> {
  logger.info('Starting development mode...');

  logger.info('Running initial build...');
  try {
    await build();
  } catch (error) {
    exitWithError('Initial build failed', error);
  }

  const pm = new ProcessManager();
  pm.spawn(viteWatchConfig());

  await sleep(1000);

  pm.spawn({
    name: 'web-ext',
    command: 'web-ext',
    args: ['run', '--source-dir', 'dist'],
    errorMessage: 'Failed to start web-ext'
  });

  pm.linkExitHandlers('vite watch', 'web-ext');
  setupProcessHandlers(() => pm.killAll());
}

if (isMainModule(import.meta.url)) {
  dev().catch(error => {
    exitWithError('Failed to start development mode', error);
  });
}