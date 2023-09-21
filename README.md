# Fake metrics generator

This project generates fake metrics that can be scraped and pushed to a prometheus instance.

![screenshot](./docs/img/fake-metrics.png)

## Running locally

1. Install dependencies `yarn`
2. Copy src/config/config.json.example to src/config/config.json and edit it to your liking. See [configuration](#configuration) for more details.
`cp src/config/config.json.example src/config/config.json`
3. Run the server
```bash
# 1. via docker compose
yarn build & docker compose up -d
# 2. via yarn in watch mode
yarn dev
# 3. via yarn
yarn start
```

## Running in environment

TODO: Fill in details

## Configuration

The configuration file is located at `src/config/config.json`. The following is the default configuration:

```typescript
type Config = {
    collectDefaultMetrics: boolean; // Whether to include default metrics for prom-client
    labels: { // labels config
        maxPerMetric: number; // The max number of labels that can be applied to a metric
        minPerMetric: number; // The min number of labels that will be applied to a metric
        valueVariations: number; // How many different values a label can have
    },
    metrics: { // metrics config
        quantity: number; // How many metrics to generate
        maxTimeSeries: number; // The max number of time series per metric name
        minTimeSeries: number; // The min number of time series per metric name
    },
    persistBetweenRuns: boolean; // Whether to save the generated metrics and labels to a file to use on a future run
}
```
