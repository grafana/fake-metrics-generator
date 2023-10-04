import { Config, MapsJson } from './types';

import { faker } from '@faker-js/faker';
import { has as _has, some as _some } from 'lodash';

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

    let firstMetricPrefix = '';

    const splitMetric = existingMaps.metrics[0][0].split('__');

    if (splitMetric.length > 1) {
      firstMetricPrefix = splitMetric[0];
    }

    const metricPrefixes =
      (_has(config.metrics, 'prefix') && firstMetricPrefix === config.metrics.prefix) ||
      (!_has(config.metrics, 'prefix') && firstMetricPrefix === 'fake');

    let firstLabelPrefix = '';

    const splitLabel = existingMaps.labels[0][0].split('__');

    if (splitLabel.length > 1) {
      firstLabelPrefix = splitLabel[0];
    }

    const labelPrefixes =
      (_has(config.labels, 'prefix') && firstLabelPrefix === config.labels.prefix) ||
      (!_has(config.labels, 'prefix') && firstLabelPrefix === 'fake');

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
      numLabelValues &&
      // metric names have correct prefix
      metricPrefixes &&
      // label names have correct prefix
      labelPrefixes
    );
  }
  return false;
};

export const generateLabels = (config: Config): Map<string, string[]> => {
  const { labels: labelConfig } = config;

  let prefix = 'fake';

  if (_has(labelConfig, 'prefix')) {
    if (labelConfig.prefix) {
      prefix = labelConfig.prefix;
    } else {
      prefix = '';
    }
  }

  if (prefix) {
    // add a double underscore to indicate prefix
    prefix += '__';
  }

  const res = new Map<string, string[]>();

  while (res.size < labelConfig.maxPerMetric) {
    const label =
      prefix +
      faker.company
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

  let prefix = 'fake';

  if (_has(metricsConfig, 'prefix')) {
    if (metricsConfig.prefix) {
      prefix = metricsConfig.prefix;
    } else {
      prefix = '';
    }
  }

  if (prefix) {
    // add a double underscore to indicate prefix
    prefix += '__';
  }

  while (res.size < metricsConfig.quantity) {
    const metricName =
      prefix +
      faker.company
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
