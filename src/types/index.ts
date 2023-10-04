export type Config = {
  collectDefaultMetrics?: boolean; // Whether to include default metrics for prom-client
  labels: {
    // labels config
    prefix?: string; // The prefix to add to all labels; Defaults to "fake", set to '' to disable
    maxPerMetric: number; // The max number of labels that can be applied to a metric
    minPerMetric: number; // The min number of labels that will be applied to a metric
    valueVariations: number; // How many different values a label can have
  };
  metrics: {
    // metrics config
    prefix?: string; // The prefix to add to all metrics; Defaults to "fake", set to '' to disable
    quantity: number; // How many metrics to generate
    maxTimeSeries: number; // The max number of time series per metric name
    minTimeSeries: number; // The min number of time series per metric name
  };
  persistBetweenRuns?: boolean; // Whether to save the generated metrics and labels to a file to use on a future run
};

export type MapsJson = {
  metrics: Array<[string, Array<{ [k: string]: string }>]>;
  labels: Array<[string, string[]]>;
};
