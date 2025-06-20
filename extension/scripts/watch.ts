#!/usr/bin/env -S npx tsx
import {
  logger,
  setupProcessHandlers,
  runInitialBuild,
  runCLI,
} from './common.js';
import { ProcessManager } from './process-utils.js';
import { viteWatchConfig } from './vite-utils.js';

async function watch(): Promise<void> {
  logger.info('Starting watch mode...');

  await runInitialBuild();

  const pm = new ProcessManager();
  pm.spawn(viteWatchConfig());
  setupProcessHandlers(() => pm.killAll());
}

runCLI(watch, import.meta.url);
