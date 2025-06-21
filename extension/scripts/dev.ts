#!/usr/bin/env -S npx tsx
import { setupProcessHandlers, runCLI } from './common.js';
import { ProcessManager, webExtConfig } from './process-utils.js';
import { rspackWatchConfig } from './rspack-utils.js';

async function dev(): Promise<void> {
  const pm = new ProcessManager();

  // Start Rspack in watch mode
  const watchConfig = rspackWatchConfig('development');
  pm.spawn(watchConfig);

  // Start web-ext
  const extConfig = webExtConfig();
  pm.spawn(extConfig);

  // Link processes so if one dies, both die
  pm.linkExitHandlers(watchConfig.name, extConfig.name);
  setupProcessHandlers(() => pm.killAll());
}

runCLI(dev, import.meta.url);
