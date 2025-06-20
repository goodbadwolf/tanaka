import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './common.js';
import { Result, ok, err } from 'neverthrow';

export interface CopyOperation {
  source: string;
  destination: string;
  isDirectory?: boolean;
  filter?: (filename: string) => boolean;
}

export function copyFiles(operations: CopyOperation[]): Result<void, Error> {
  for (const op of operations) {
    try {
      if (op.isDirectory) {
        copyDirectory(op);
      } else {
        copyFile(op);
      }
    } catch (error) {
      return err(new Error(`Failed to copy ${op.source}: ${error}`));
    }
  }
  return ok(undefined);
}

function copyFile(op: CopyOperation): void {
  copyFileSync(op.source, op.destination);
}

function copyDirectory(op: CopyOperation): void {
  mkdirSync(op.destination, { recursive: true });
  
  const files = readdirSync(op.source);
  const filteredFiles = op.filter ? files.filter(op.filter) : files;
  
  if (filteredFiles.length === 0 && op.filter) {
    logger.warn(`No files matching filter in ${op.source}`);
    return;
  }
  
  filteredFiles.forEach(file => {
    copyFileSync(
      join(op.source, file),
      join(op.destination, file)
    );
  });
}

export function ensureDirectoryExists(dir: string): Result<void, Error> {
  if (!existsSync(dir)) {
    return err(new Error(`Directory not found: ${dir}`));
  }
  return ok(undefined);
}