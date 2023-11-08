import { config } from '../config';
import { existingDataMatchesConfig } from '../config/util';
import { MapsJson } from '../types';

import fs from 'fs';

export const loadValidExistingData = (): MapsJson | undefined => {
  let existingData;
  try {
    existingData = JSON.parse(fs.readFileSync(`${__dirname}/config/data.json`, { encoding: 'utf-8' }));
  } catch (e) {
    console.warn('Unable to load existing data', e);
  }

  if (existingDataMatchesConfig(existingData, config)) {
    return existingData;
  }
  console.warn('Existing data does not match config');
  return;
};
