#!/usr/bin/env -S npx tsx
import { logger, setupProcessHandlers, runCLI } from './common.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig } from './vite-utils.js';

async function watch(): Promise<void> {
  logger.info('Starting watch mode...');

  const pm = new ProcessManager();
  pm.spawn(viteWatchConfig());
  setupProcessHandlers(() => pm.killAll());
}

runCLI(watch, import.meta.url);
