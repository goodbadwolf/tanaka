#!/usr/bin/env -S npx tsx
import { logger, setupProcessHandlers, runCLI } from './common.js';
import { ProcessManager } from './process-utils.js';
import { rspackWatchConfig } from './rspack-utils.js';

async function watch(): Promise<void> {
  logger.info('Starting watch mode...');

  const pm = new ProcessManager();
  const mode =
    process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1] || 'development';
  pm.spawn(rspackWatchConfig(mode));
  setupProcessHandlers(() => pm.killAll());
}

runCLI(watch, import.meta.url);
