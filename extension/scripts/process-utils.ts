import { spawn, ChildProcess, SpawnOptions } from 'node:child_process';
import { logger, exitWithError } from './common.js';

export interface ManagedProcess {
  name: string;
  command: string;
  args: string[];
  errorMessage: string;
}

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map();

  spawn(config: ManagedProcess, options: SpawnOptions = { stdio: 'inherit', shell: true }): ChildProcess {
    logger.info(`Starting ${config.name}...`);
    
    const proc = spawn(config.command, config.args, options);
    this.processes.set(config.name, proc);

    proc.on('error', (error) => {
      this.killAll();
      exitWithError(config.errorMessage, error);
    });

    return proc;
  }

  killAll(): void {
    for (const [name, proc] of this.processes) {
      logger.info(`Stopping ${name}...`);
      proc.kill();
    }
    this.processes.clear();
  }

  linkExitHandlers(primary: string, secondary: string): void {
    const primaryProc = this.processes.get(primary);
    const secondaryProc = this.processes.get(secondary);

    if (!primaryProc || !secondaryProc) return;

    primaryProc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        logger.error(`${primary} process exited with code ${code}`);
        secondaryProc.kill();
        process.exit(code);
      }
    });

    secondaryProc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        logger.error(`${secondary} process exited with code ${code}`);
        primaryProc.kill();
        process.exit(code);
      }
    });
  }
}