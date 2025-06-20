import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { logger, projectRoot } from './common.js';
import { ManagedProcess } from './process-utils.js';
import { err, ok, Result } from 'neverthrow';

export async function viteBuild(): Promise<Result<void, Error>> {
  return new Promise((resolve) => {
    logger.info('Running vite build...');
    const childProcess = spawn('vite', ['build'], {
      cwd: projectRoot,
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    const rlOut = createInterface({ input: childProcess.stdout });
    const rlErr = createInterface({ input: childProcess.stderr });

    rlOut.on('line', (line) => {
      logger.info(line);
    });

    rlErr.on('line', (line) => {
      logger.error(line);
    });

    childProcess.on('close', (code) => {
      rlOut.close();
      rlErr.close();
      if (code === 0) {
        resolve(ok(undefined));
      } else {
        resolve(err(new Error(`Build failed with exit code ${code}`)));
      }
    });

    childProcess.on('error', (error) => {
      rlOut.close();
      rlErr.close();
      resolve(err(new Error(`Build failed: ${error.message}`)));
    });
  });
}

export function viteWatchConfig(): ManagedProcess {
  return {
    name: 'vite watch',
    command: 'vite',
    args: ['build', '--watch'],
    errorMessage: 'Failed to start vite watch',
  };
}

export function webExtConfig(): ManagedProcess {
  return {
    name: 'web-ext',
    command: 'web-ext',
    args: ['run', '--source-dir', 'dist'],
    errorMessage: 'Failed to start web-ext',
  };
}
