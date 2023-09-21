import { Config } from './types';
import { existingDataMatchesConfig, generateLabels, generateMetrics } from './utils';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import prometheus, { Gauge } from 'prom-client';

const register = new prometheus.Registry();

let config: Config;

try {
  config = require('./config/config.json');
} catch (e) {
  console.log('Config.json not found, using default config');
  config = require('./config/default/config.json');
}

if (config.collectDefaultMetrics) {
  const collectDefaultMetrics = prometheus.collectDefaultMetrics;
  collectDefaultMetrics({ register });
}

let existingData;
try {
  existingData = JSON.parse(fs.readFileSync(`${__dirname}/config/data.json`, { encoding: 'utf-8' }));
} catch (e) {
  console.log('No existing metric map found, generating new one');
}

let metricMap: Map<string, Array<{ [k: string]: string }>>;
let labelMap: Map<string, string[]>;

if (existingDataMatchesConfig(existingData, config)) {
  metricMap = new Map<string, Array<{ [k: string]: string }>>(existingData.metrics);
  labelMap = new Map<string, string[]>(existingData.labels);
} else {
  if (existingData) {
    console.log('Existing data does not match config, generating new data');
  }

  // Map of possible label names and their values
  labelMap = generateLabels(config);
  metricMap = generateMetrics(config, labelMap);

  if (config.persistBetweenRuns) {
    fs.writeFileSync(
      `${__dirname}/config/data.json`,
      JSON.stringify({ metrics: Array.from(metricMap.entries()), labels: Array.from(labelMap.entries()) }, null, 2),
      { encoding: 'utf-8' }
    );
  }
}

const gauges: Map<string, Gauge> = new Map<string, Gauge>();

Array.from(metricMap.keys()).forEach((metricName) => {
  gauges.set(
    metricName,
    new prometheus.Gauge({
      name: metricName,
      help: 'a generated gauge metric',
      labelNames: Array.from(labelMap.keys()),
    })
  );
});

Array.from(gauges.values()).forEach((gauge) => {
  register.registerMetric(gauge);
});

const generateRandomMetrics = () => {
  Array.from(gauges.entries()).forEach(([metricName, gauge]) => {
    metricMap.get(metricName)?.forEach((lbls) => {
      gauge.set(lbls, parseFloat((Math.random() * 100).toFixed(2)));
    });
  });
};

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/metrics', async (req, res) => {
  generateRandomMetrics();
  res.set('Content-Type', prometheus.register.contentType);
  res.send(await register.metrics());
});

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
