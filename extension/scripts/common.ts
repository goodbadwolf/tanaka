import pino from 'pino';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: false,
    },
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
export const projectRoot = join(__dirname, '..');
export const DIST_DIR = join(projectRoot, 'dist');
export const ICONS_DIR = join(projectRoot, 'icons');
export const MANIFEST_FILE = join(projectRoot, 'manifest.json');

export function setupProcessHandlers(cleanup: () => void): void {
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, cleaning up...');
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, cleaning up...');
    cleanup();
    process.exit(0);
  });
}

export function exitWithError(message: string, error?: any): never {
  if (error) {
    logger.error({ err: error }, message);
  } else {
    logger.error(message);
  }
  process.exit(1);
}

export function isMainModule(importMetaUrl: string): boolean {
  return importMetaUrl === `file://${process.argv[1]}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
