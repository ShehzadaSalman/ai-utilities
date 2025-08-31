import dotenv from "dotenv";
import { AppConfig } from "../types/config";

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  calcom: {
    apiKey: process.env.CALCOM_API_KEY || "",
    baseUrl: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
    version: process.env.CALCOM_VERSION || "v2",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "combined",
  },
};

export const validateConfig = (): void => {
  const requiredEnvVars = ["CALCOM_API_KEY"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  if (!config.calcom.apiKey) {
    throw new Error("Cal.com API key is required");
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }
};

export default config;
