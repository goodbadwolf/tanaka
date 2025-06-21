// This will be replaced at build time based on the environment
import { config } from '@env';

export type Config = typeof config;
export function getConfig(): Config {
  return config;
}
