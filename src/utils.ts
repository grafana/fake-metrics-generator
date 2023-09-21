import { Config, MapsJson } from './types';

import { faker } from '@faker-js/faker';
import { some as _some } from 'lodash';

export const existingDataMatchesConfig = (existingMaps: MapsJson | undefined, config: Config) => {
  if (existingMaps) {
    const numMetrics = existingMaps.metrics.length === config.metrics.quantity;
    const numTimeSeriesPerMetric = !_some(
      existingMaps.metrics,
      (m) => m[1].length < config.metrics.minTimeSeries || m[1].length > config.metrics.maxTimeSeries
    );
    const numLabelsPerTimeSeries = !_some(existingMaps.metrics, (m) => {
      return _some(
        m[1],
        (l) => Object.keys(l).length < config.labels.minPerMetric || Object.keys(l).length > config.labels.maxPerMetric
      );
    });
    const numLabels = existingMaps.labels.length === config.labels.maxPerMetric;
    const numLabelValues = existingMaps.labels[0][1].length === config.labels.valueVariations;

    return (
      // number of metrics matches
      numMetrics &&
      // number of time series per metric is within range
      numTimeSeriesPerMetric &&
      // number of labels per time series is within range
      numLabelsPerTimeSeries &&
      // number of labels match
      numLabels &&
      // number of values per labels match
      numLabelValues
    );
  }
  return false;
};

export const generateLabels = (config: Config): Map<string, string[]> => {
  const { labels: labelConfig } = config;

  const res = new Map<string, string[]>();

  while (res.size < labelConfig.maxPerMetric) {
    const label = faker.company
      .buzzPhrase()
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
    if (!res.has(label)) {
      const values: Set<string> = new Set<string>();

      while (values.size < labelConfig.valueVariations) {
        values.add(
          faker.company
            .catchPhraseNoun()
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase()
        );
      }
      res.set(label, Array.from(values));
    }
  }
  return res;
};

export const generateMetrics = (
  config: Config,
  labels: Map<string, string[]>
): Map<string, Array<{ [k: string]: string }>> => {
  const { labels: labelConfig, metrics: metricsConfig } = config;
  const res: Map<string, Array<{ [k: string]: string }>> = new Map<string, Array<{ [k: string]: string }>>();

  while (res.size < metricsConfig.quantity) {
    const metricName = faker.company
      .catchPhrase()
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
    if (!res.has(metricName)) {
      const numTimeSeries = faker.number.int({
        min: metricsConfig.minTimeSeries,
        max: metricsConfig.maxTimeSeries,
      });
      const timeSeries: Map<Symbol, { [k: string]: string }> = new Map<Symbol, { [k: string]: string }>();

      while (timeSeries.size < numTimeSeries) {
        const numLabels = faker.number.int({ min: labelConfig.minPerMetric, max: labelConfig.maxPerMetric });

        // pick labels
        const timeSeriesLabels: Set<string> = new Set<string>();

        while (timeSeriesLabels.size < numLabels) {
          timeSeriesLabels.add(faker.helpers.arrayElement(Array.from(labels.keys())));
        }
        // assign values to labels

        const timeSeriesObject: { [k: string]: string } = {};

        Array.from(timeSeriesLabels)
          .sort()
          .forEach((lbl) => {
            timeSeriesObject[lbl] = faker.helpers.arrayElement(labels.get(lbl)!);
          });

        const symbol = Symbol.for(JSON.stringify(timeSeriesObject));
        timeSeries.set(symbol, timeSeriesObject);
      }
      res.set(metricName, Array.from(timeSeries.values()));
    }
  }
  return res;
};
