import { config } from '../config';

import { faker } from '@faker-js/faker';
import { has as _has, some as _some } from 'lodash';

const getMin = (testee: number | [number, number]) => {
  return typeof testee === 'number' ? testee : testee[0];
};

const getMax = (testee: number | [number, number]) => {
  return typeof testee === 'number' ? testee : testee[1];
};

const getPrefix = (cfg: { prefix?: string }) => {
  let prefix = 'fake__';

  if (_has(cfg, 'prefix')) {
    // if prefix is set to empty string then we want to honor that
    prefix = !cfg.prefix ? '' : `${cfg.prefix}__`;
  }
  return prefix;
};

export const generateRotationLabelMap = (existingLabels: Map<string, string[]>) => {
  const { labels: labelConfig } = config;
  if (labelConfig.qtyForValueRotation && labelConfig.qtyForValueRotation > 0) {
    return _generateLabelValueMap(
      labelConfig.qtyForValueRotation,
      labelConfig.valueVariations,
      getPrefix(labelConfig),
      new Set(existingLabels.keys())
    );
  }
  return new Map<string, string[]>();
};

export const generateLabelValueMap = (): Map<string, string[]> => {
  const { labels: labelConfig } = config;

  let maxLabels: number = typeof labelConfig.perMetric === 'number' ? labelConfig.perMetric : labelConfig.perMetric[1];

  return _generateLabelValueMap(maxLabels, labelConfig.valueVariations, getPrefix(labelConfig));
};

/**
 * Generates a map of labels to label values based on the label config
 */
const _generateLabelValueMap = (
  maxLabels: number,
  numVariations: number,
  prefix: string,
  excludeLabels: Set<string> = new Set<string>()
): Map<string, string[]> => {
  const labelMap = new Map<string, string[]>();

  while (labelMap.size < maxLabels) {
    const label =
      prefix +
      faker.company
        .buzzPhrase()
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();

    if (!labelMap.has(label) && !excludeLabels.has(label)) {
      const labelValues: Set<string> = new Set<string>();

      while (labelValues.size < numVariations) {
        labelValues.add(
          faker.company
            .catchPhraseNoun()
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase()
        );
      }

      labelMap.set(label, Array.from(labelValues));
    }
  }
  return labelMap;
};

/**
 * Generates a map of metric names to time series based on the metric and label configs
 * @param labelMap
 */
export const generateMetricsTimeSeriesMap = (
  labelMap: Map<string, string[]>
): Map<string, Array<{ [k: string]: string }>> => {
  const { labels: labelConfig, metrics: metricsConfig } = config;

  const metricsMap: Map<string, Array<{ [k: string]: string }>> = new Map<string, Array<{ [k: string]: string }>>();

  const minTimeSeries: number = getMin(metricsConfig.timeSeries);
  const maxTimeSeries: number = getMax(metricsConfig.timeSeries);

  const minLabelsPerMetric: number = getMin(labelConfig.perMetric);
  const maxLabelsPerMetric: number = getMax(labelConfig.perMetric);

  while (metricsMap.size < metricsConfig.quantity) {
    const metricName =
      getPrefix(metricsConfig) +
      faker.company
        .catchPhrase()
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();

    if (!metricsMap.has(metricName)) {
      const numTimeSeries = faker.number.int({
        min: minTimeSeries,
        max: maxTimeSeries,
      });

      const timeSeries: Map<Symbol, { [k: string]: string }> = new Map<Symbol, { [k: string]: string }>();

      while (timeSeries.size < numTimeSeries) {
        const numLabels = faker.number.int({ min: minLabelsPerMetric, max: maxLabelsPerMetric });

        // pick labels
        const timeSeriesLabels: Set<string> = new Set<string>();

        while (timeSeriesLabels.size < numLabels) {
          timeSeriesLabels.add(faker.helpers.arrayElement(Array.from(labelMap.keys())));
        }

        // assign values to labels
        const timeSeriesObject: { [k: string]: string } = pickLabelValues(timeSeriesLabels, labelMap);

        const symbol = Symbol.for(JSON.stringify(timeSeriesObject));
        timeSeries.set(symbol, timeSeriesObject);
      }

      metricsMap.set(metricName, Array.from(timeSeries.values()));
    }
  }
  return metricsMap;
};

export const pickLabelValues = (labels?: Set<string>, labelMap?: Map<string, string[]>): { [k: string]: string } => {
  if (!labels || labels.size === 0 || !labelMap || labelMap.size === 0) {
    console.warn('Tried picking values for labels but no labels or label map were provided');
    return {};
  }

  if (_some(Array.from(labels), (lbl) => !labelMap.has(lbl))) {
    console.warn('Tried picking values for labels that were not in the label map');
    return {};
  }

  const timeSeriesObject: { [k: string]: string } = {};

  Array.from(labels)
    .sort()
    .forEach((lbl) => {
      timeSeriesObject[lbl] = faker.helpers.arrayElement(labelMap.get(lbl)!);
    });

  return timeSeriesObject;
};
