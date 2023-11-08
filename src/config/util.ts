import { Config, MapsJson } from '../types';

import { has as _has, some as _some } from 'lodash';

const checkPrefix = (testee: string, hasConfigPrefix: boolean, prefix: string | undefined) => {
  let testeePrefix = '';

  const splitTestee = testee.split('__');

  if (splitTestee.length > 1) {
    testeePrefix = splitTestee[0];
  }

  return (hasConfigPrefix && testeePrefix === prefix) || (!hasConfigPrefix && testeePrefix === 'fake');
};

const checkQuantity = (quantity: number, numOrRange: number | [number, number]) => {
  if (typeof numOrRange === 'number') {
    return quantity === numOrRange;
  } else {
    return quantity >= numOrRange[0] && quantity <= numOrRange[1];
  }
};

export const existingDataMatchesConfig = (existingMaps: MapsJson | undefined, config: Config) => {
  if (existingMaps) {
    const labels = existingMaps.labels || [];
    const metrics = existingMaps.metrics || [];
    const rotationLabels = existingMaps.rotationLabels || [];

    const checks = {
      labelPrefix: checkPrefix(labels[0][0], _has(config.labels, 'prefix'), config.labels.prefix),
      labelQuantity: checkQuantity(labels.length, config.labels.perMetric),
      rotationLabelQty: checkQuantity(rotationLabels.length, config.labels.qtyForValueRotation || 0),
      labelValueVariations: checkQuantity(labels[0][1].length, config.labels.valueVariations),
      labelsPerTimeSeries: !_some(metrics, ([_, timeSeries]) => {
        return _some(timeSeries, (labels) => !checkQuantity(Object.keys(labels).length, config.labels.perMetric));
      }),
      metricPrefix: checkPrefix(metrics[0][0], _has(config.metrics, 'prefix'), config.metrics.prefix),
      metricQuantity: checkQuantity(metrics.length, config.metrics.quantity),
      timeSeriesPerMetric: !_some(
        metrics,
        ([_, timeSeries]) => !checkQuantity(timeSeries.length, config.metrics.timeSeries)
      ),
    };

    return (
      checks.metricQuantity && // number of metrics matches
      checks.labelQuantity && // number of labels matches
      checks.labelValueVariations && // number of values per label is within range
      checks.rotationLabelQty && // number of rotation labels is within range
      checks.timeSeriesPerMetric && // number of time series per metric is within range
      checks.labelsPerTimeSeries && // number of labels per time series is within range;
      checks.metricPrefix && // metric names have correct prefix
      checks.labelPrefix // label names have correct prefix
    );
  }
  return false;
};
