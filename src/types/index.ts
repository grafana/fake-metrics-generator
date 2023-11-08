export type Config = {
  collectDefaultMetrics?: boolean; // Whether to include default metrics for prom-client
  labels: {
    // labels config
    prefix?: string; // The prefix to add to all labels; Defaults to "fake", set to '' to disable
    perMetric: number | [number /*min*/, number /*max*/]; // The number of labels to generate per metric can be a range
    qtyForValueRotation?: number; // A number of labels that will have their values rotated on a cron schedule
    rotationCronSchedule?: string; // A cron schedule for rotating the values of labels defaults to every 6 hours
    valueVariations: number; // How many different values a label can have
  };
  metrics: {
    // metrics config
    prefix?: string; // The prefix to add to all metrics; Defaults to "fake", set to '' to disable
    quantity: number; // How many metrics to generate
    timeSeries: number | [number /*min*/, number /*max*/]; // The number of time series to generate per metric can be a range
  };
  persistBetweenRuns?: boolean; // Whether to save the generated metrics and labels to a file to use on a future run
};

export type MapsJson = {
  metrics: Array<[string, Array<{ [k: string]: string }>]>;
  labels: Array<[string, string[]]>;
  rotationLabels: Array<[string, string[]]>;
};
