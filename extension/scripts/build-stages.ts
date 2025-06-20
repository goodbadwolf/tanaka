import { join } from 'node:path';
import { DIST_DIR, ICONS_DIR, MANIFEST_FILE, Stage } from './common.js';
import { copyFiles, ensureDirectoryExists } from './file-utils.js';
import { viteBuild } from './vite-utils.js';
import { Result } from 'neverthrow';

export const buildStages: Stage[] = [
  {
    name: 'Build TypeScript/JavaScript',
    fn: viteBuild
  },
  {
    name: 'Verify build output',
    fn: (): Result<void, Error> => ensureDirectoryExists(DIST_DIR)
  },
  {
    name: 'Copy static assets',
    fn: (): Result<void, Error> => copyFiles([
      {
        source: MANIFEST_FILE,
        destination: join(DIST_DIR, 'manifest.json')
      },
      {
        source: ICONS_DIR,
        destination: join(DIST_DIR, 'icons'),
        isDirectory: true,
        filter: (f) => f.endsWith('.png')
      }
    ])
  }
];