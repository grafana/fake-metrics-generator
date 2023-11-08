import {
  generateLabelValueMap,
  generateMetricsTimeSeriesMap,
  generateRotationLabelMap,
  pickLabelValues,
} from './generator/data-generation';
import { loadValidExistingData } from './generator/load-data';
import { config } from './config';
import { MapsJson } from './types';

import bodyParser from 'body-parser';
import cors from 'cors';
import { CronJob } from 'cron';
import express from 'express';
import fs from 'fs';
import prometheus, { Gauge } from 'prom-client';

const register = new prometheus.Registry();

if (config.collectDefaultMetrics) {
  const collectDefaultMetrics = prometheus.collectDefaultMetrics;
  collectDefaultMetrics({ register });
}

let metricMap: Map<string, Array<{ [k: string]: string }>>;
let labelMap: Map<string, string[]>;
let rotationLabelMap: Map<string, string[]>;

const existingData: MapsJson | undefined = loadValidExistingData();

if (existingData) {
  metricMap = new Map<string, Array<{ [k: string]: string }>>(existingData.metrics);
  labelMap = new Map<string, string[]>(existingData.labels);
  rotationLabelMap = new Map<string, string[]>(existingData.rotationLabels);
} else {
  // Map of possible label names and their values
  labelMap = generateLabelValueMap();
  metricMap = generateMetricsTimeSeriesMap(labelMap);
  rotationLabelMap = generateRotationLabelMap(labelMap);

  if (config.persistBetweenRuns) {
    fs.writeFileSync(
      `${__dirname}/config/data.json`,
      JSON.stringify(
        {
          metrics: Array.from(metricMap.entries()),
          labels: Array.from(labelMap.entries()),
          rotationLabels: Array.from(rotationLabelMap.entries()),
        },
        null,
        2
      ),
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
      labelNames: Array.from([...labelMap.keys(), ...rotationLabelMap.keys()]),
    })
  );
});

Array.from(gauges.values()).forEach((gauge) => {
  register.registerMetric(gauge);
});

let rotatedLabels: { [p: string]: string } = {};

if (rotationLabelMap.size > 0) {
  rotatedLabels = pickLabelValues(new Set(rotationLabelMap.keys() || []), rotationLabelMap);

  let cronSchedule = config.labels.rotationCronSchedule || '0 */6 * * *';

  new CronJob(
    cronSchedule,
    () => {
      rotatedLabels = pickLabelValues(new Set(rotationLabelMap.keys() || []), rotationLabelMap);
      register.resetMetrics();
    },
    null,
    true
  );
}

const generateRandomMetrics = () => {
  Array.from(gauges.entries()).forEach(([metricName, gauge]) => {
    metricMap.get(metricName)?.forEach((labels) => {
      gauge.set({ ...labels, ...rotatedLabels }, parseFloat((Math.random() * 100).toFixed(2)));
    });
  });
};

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/metrics', async (_, res) => {
  generateRandomMetrics();
  res.set('Content-Type', prometheus.register.contentType);
  res.send(await register.metrics());
});

app.get('/config', (_, res) => {
  res.header('Content-Type', 'application/json');
  res.send(JSON.stringify(config, null, 2));
});

app.get('/', (_, res) => {
  res.send(
    `
<h1>Fake metrics generator</h1>
<div>
<h2>Links</h2>
<ul>
<li><a href="/metrics">/metrics</a> to see the generated metrics.</li>
<li><a href="/config">/config</a> to see the current config</li>
</ul>
</div>
`
  );
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
