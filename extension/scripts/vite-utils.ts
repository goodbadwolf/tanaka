import { spawn } from 'node:child_process';
import { projectRoot } from './common.js';
import { ManagedProcess } from './process-utils.js';
import { Result, ok, err } from 'neverthrow';

export async function viteBuild(): Promise<Result<void, Error>> {
  return new Promise<Result<void, Error>>((resolve) => {
    const proc = spawn('vite', ['build'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    proc.on('error', (error) => {
      resolve(err(new Error(`Vite build failed: ${error.message}`)));
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve(ok(undefined));
      } else {
        resolve(err(new Error(`Vite build exited with code ${code}`)));
      }
    });
  });
}

export function viteWatchConfig(): ManagedProcess {
  return {
    name: 'vite watch',
    command: 'vite',
    args: ['build', '--watch'],
    errorMessage: 'Failed to start vite watch'
  };
}