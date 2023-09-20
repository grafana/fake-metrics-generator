import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import prometheus, {Gauge} from 'prom-client';
import {faker} from '@faker-js/faker'
import config from './config/config.json'

const register = new prometheus.Registry();

if(config.collectDefaultMetrics) {
  const collectDefaultMetrics = prometheus.collectDefaultMetrics;
  collectDefaultMetrics({register})
}

let existingMaps
try {
     existingMaps = JSON.parse(fs.readFileSync(`${__dirname}/config/existing-maps.json`, {encoding: 'utf-8'}))
} catch (e) {
    console.log('No existing metric map found, generating new one')
}

let metricMap: Map<string, Array<{ [k: string]: string }>>
let labelMap: Map<string, string[]>

if(existingMaps) {
    metricMap = new Map<string, Array<{ [k: string]: string }>>(existingMaps.metrics)
    labelMap = new Map<string, string[]>(existingMaps.labels)
}else{
    const {labels: labelConfig, metrics: metricsConfig} = config

// Map of possible label names and their values
    labelMap = new Map<string, string[]>();
    metricMap = new Map<string, Array<{ [k: string]: string }>>()

    for (let i = 0; i < labelConfig.maxPerMetric; i++) {
        const values: Array<string> = []

        for (let i = 0; i < labelConfig.valueVariations; i++) {
            values.push(faker.company.catchPhraseNoun().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase())
        }

        labelMap.set(faker.company.buzzPhrase().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(), values)
    }

    for (let i = 0; i < metricsConfig.quantity; i++) {
        const metricName = faker.company.catchPhrase().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
        const labelPairs = [];
        for (let k = 0; k < faker.number.int({
            min: metricsConfig.minTimeSeries,
            max: metricsConfig.maxTimeSeries
        }); k++) {
            const labelsForMetric: { [k: string]: string } = {}
            for (let j = 0; j < faker.number.int({min: labelConfig.minPerMetric, max: labelConfig.maxPerMetric}); j++) {
                // pick a random label from labels.keys() and assign it a random value from labels.get(label)
                const labelName = faker.helpers.arrayElement(Array.from(labelMap.keys()))
                labelsForMetric[labelName] = faker.helpers.arrayElement(labelMap.get(labelName)!)
            }
            labelPairs.push(labelsForMetric)
        }
        metricMap.set(metricName, labelPairs)
    }

    fs.writeFileSync(`${__dirname}/config/existing-maps.json`, JSON.stringify({metrics: Array.from(metricMap.entries()), labels: Array.from(labelMap.entries())}, null, 2), {encoding: 'utf-8'})
}

const gauges: Map<string, Gauge> = new Map<string, Gauge>();

Array.from(metricMap.keys()).forEach(metricName => {
    gauges.set(metricName, new prometheus.Gauge({
        name: metricName,
        help: 'a generated gauge metric',
        labelNames: Array.from(labelMap.keys())
    }))
})

Array.from(gauges.values()).forEach(gauge => {
    register.registerMetric(gauge);
})

const generateRandomMetrics = () => {
    Array.from(gauges.entries()).forEach(([metricName, gauge]) => {
        metricMap.get(metricName)?.forEach(lbls => {
            gauge.set(lbls, parseFloat((Math.random() * 100).toFixed(2)))
        })
    })
}

const metricsGenerationInterval = 5000;
setInterval(generateRandomMetrics, metricsGenerationInterval)

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.send(await register.metrics());
});

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
