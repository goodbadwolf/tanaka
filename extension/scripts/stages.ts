import { join } from 'node:path';
import { DIST_DIR, ICONS_DIR, MANIFEST_FILE, Stage } from './common.js';
import { copyFiles, ensureDirectoryExists } from './file-utils.js';
import { viteBuild } from './vite-utils.js';
import { Result } from 'neverthrow';

export const buildCode: Stage = {
  name: 'Build Code',
  fn: viteBuild,
};

export const verifyBuildOutput: Stage = {
  name: 'Verify build output',
  fn: async (): Promise<Result<void, Error>> => ensureDirectoryExists(DIST_DIR),
};

export const copyManifest: Stage = {
  name: 'Copy manifest',
  fn: async (): Promise<Result<void, Error>> =>
    copyFiles([{ source: MANIFEST_FILE, destination: join(DIST_DIR, 'manifest.json') }]),
};

export const copyIcons: Stage = {
  name: 'Copy icons',
  fn: async (): Promise<Result<void, Error>> =>
    copyFiles([
      {
        source: ICONS_DIR,
        destination: join(DIST_DIR, 'icons'),
        filter: (filename) => filename.endsWith('.png'),
      },
    ]),
};
