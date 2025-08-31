import { config } from "../config";

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.parseLogLevel(config.logging.level);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, correlationId, metadata } = entry;
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (correlationId) {
      logMessage += ` [${correlationId}]`;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` ${JSON.stringify(metadata)}`;
    }

    return logMessage;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId,
      metadata,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  error(
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.ERROR, message, metadata, correlationId);
  }

  warn(
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.WARN, message, metadata, correlationId);
  }

  info(
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.INFO, message, metadata, correlationId);
  }

  debug(
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log(LogLevel.DEBUG, message, metadata, correlationId);
  }
}

export const logger = new Logger();
