import { join } from 'node:path';
import { DIST_DIR, ICONS_DIR, MANIFEST_FILE, logger } from './common.js';
import { copyFiles } from './file-utils.js';
import { viteBuild } from './vite-utils.js';
import { Result, ok, err } from 'neverthrow';
import chalk from 'chalk';

export interface Stage {
  name: string;
  fn: () => Promise<Result<void, Error>>;
}

export function compositeStage(name: string, stages: Stage[]): Stage {
  return {
    name,
    fn: async () => {
      for (const stage of stages) {
        const result = await stage.fn();
        if (result.isErr()) return result;
      }
      return ok(undefined);
    },
  };
}

export function createBuildCodeStage(mode: string): Stage {
  return {
    name: `Build Code (${mode})`,
    fn: () => viteBuild(mode),
  };
}

export function createCopyManifestStage(): Stage {
  return {
    name: 'Copy manifest',
    fn: async (): Promise<Result<void, Error>> =>
      copyFiles([{ source: MANIFEST_FILE, destination: join(DIST_DIR, 'manifest.json') }]),
  };
}

export function createCopyIconsStage(): Stage {
  return {
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
}

export function createCopyStaticAssetsStage(): Stage {
  return compositeStage('Copy static assets', [createCopyManifestStage(), createCopyIconsStage()]);
}

export async function runStages(
  stages: Stage[],
  description: string,
): Promise<Result<void, Error>> {
  logger.info(`Starting ${description} (${stages.length} stages)`);

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    logger.info(
      `Running stage ${chalk.greenBright(`${i + 1}/${stages.length}`)}: ${chalk.whiteBright.bold(stage.name)}`,
    );
    const result = await stage.fn();

    if (result.isErr()) {
      logger.error({ err: result.error }, `Stage '${stage.name}' failed`);
      return err(result.error);
    }
  }

  logger.info(`Finished ${description}!`);
  return ok(undefined);
}
