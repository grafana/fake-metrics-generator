import { Config } from '../types';

import fs from 'fs';

let loadedConfig: Config;

try {
  loadedConfig = JSON.parse(fs.readFileSync(`${__dirname}/config/config.json`, { encoding: 'utf-8' }));
} catch (e) {
  console.log('Config.json not found, using default config');
  loadedConfig = JSON.parse(fs.readFileSync(`${__dirname}/config/default/config.json`, { encoding: 'utf-8' }));
}

export const config = loadedConfig;
