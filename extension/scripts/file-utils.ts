import { copyFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { logger, projectRoot } from './common.js';
import { Result, ok, err } from 'neverthrow';

export interface CopyOperation {
  source: string;
  destination: string;
  filter?: (filename: string) => boolean;
}

function isDirectory(path: string): boolean {
  return statSync(path).isDirectory();
}

export function copyFiles(
  operations: CopyOperation[],
  options: { log: boolean } = { log: true },
): Result<void, Error> {
  for (const op of operations) {
    const isDir = isDirectory(op.source);
    try {
      if (isDir) {
        copyDirectory(op);
      } else {
        copyFile(op);
      }
      if (options.log) {
        const source = op.source.replace(projectRoot, '').replace(/^\//, '');
        const destination = op.destination.replace(projectRoot, '').replace(/^\//, '');
        logger.info(`Copied ${isDir ? 'directory' : 'file'} ${source} to ${destination}`);
      }
    } catch (error) {
      return err(new Error(`Failed to copy ${op.source}: ${error}`));
    }
  }
  return ok(undefined);
}

function copyFile(op: CopyOperation): Result<void, Error> {
  try {
    copyFileSync(op.source, op.destination);
    return ok(undefined);
  } catch (error) {
    return err(new Error(`Failed to copy file ${op.source}: ${error}`));
  }
}
function copyDirectory(op: CopyOperation): Result<void, Error> {
  try {
    mkdirSync(op.destination, { recursive: true });

    const files = readdirSync(op.source);
    const filteredFiles = op.filter ? files.filter(op.filter) : files;

    if (filteredFiles.length === 0 && op.filter) {
      logger.warn(`No files matching filter in ${op.source}`);
    }

    filteredFiles.forEach((file) => {
      copyFileSync(join(op.source, file), join(op.destination, file));
    });
    return ok(undefined);
  } catch (error) {
    return err(new Error(`Failed to copy directory ${op.source}: ${error}`));
  }
}

export function ensureDirectoryExists(dir: string): Result<void, Error> {
  if (!existsSync(dir)) {
    return err(new Error(`Directory not found: ${dir}`));
  }
  return ok(undefined);
}
