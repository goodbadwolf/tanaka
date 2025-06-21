import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { logger, projectRoot } from './common.js';
import { ManagedProcess } from './process-utils.js';
import { err, ok, Result } from 'neverthrow';

export async function rspackBuild(mode: string): Promise<Result<void, Error>> {
  return new Promise((resolve) => {
    logger.info(`Running rspack build in ${mode} mode...`);

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      BUILD_ENV: mode,
      FORCE_COLOR: '1',
    };

    const childProcess = spawn('rspack', ['build'], {
      cwd: projectRoot,
      shell: true,
      stdio: 'pipe',
      env,
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

export function rspackWatchConfig(mode?: string): ManagedProcess {
  const env: Record<string, string> = {
    NODE_ENV: 'development',
  };

  if (mode) {
    env.BUILD_ENV = mode;
  }

  return {
    name: 'rspack watch',
    command: 'rspack',
    args: ['build', '--watch'],
    env,
    errorMessage: 'Failed to start rspack watch',
  };
}

export function rspackServeConfig(mode?: string): ManagedProcess {
  const env: Record<string, string> = {
    NODE_ENV: 'development',
  };

  if (mode) {
    env.BUILD_ENV = mode;
  }

  return {
    name: 'rspack serve',
    command: 'rspack',
    args: ['serve'],
    env,
    errorMessage: 'Failed to start rspack dev server',
  };
}
