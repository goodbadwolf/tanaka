// This will be replaced at build time based on the environment
import { config } from '@env';
import type { Config } from './types';

export type { Config };
export function getConfig(): Config {
  return config as Config;
}
