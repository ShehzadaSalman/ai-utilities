export interface AppConfig {
  port: number;
  nodeEnv: string;
  calcom: {
    apiKey: string;
    baseUrl: string;
    version: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

export interface CalComConfig {
  apiKey: string;
  baseUrl: string;
  version: string;
}
