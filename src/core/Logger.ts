export enum LogLevel {
  DEBUG = 0,
  ERROR = 3,
  INFO = 1,
  NONE = 4,
  WARN = 2,
}

const MAX_LOG_HISTORY = 500;
const TIME_SLICE_END = 23;
const TIME_SLICE_START = 11;

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

export class Logger implements Logger {
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static history: LogEntry[] = [];
  private static maxHistory = MAX_LOG_HISTORY;

  private correlationId?: string;
  private localLevel?: LogLevel;
  private module: string;

  constructor(options: LoggerOptions) {
    this.module = options.module;
    this.localLevel = options.level;
    this.correlationId = options.correlationId;

    if (options.maxHistory !== undefined) {
      Logger.maxHistory = options.maxHistory;
    }
  }

  static getGlobalLevel(): LogLevel {
    return Logger.globalLevel;
  }

  static resetHistory(): void {
    Logger.history = [];
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  clearHistory(): void {
    Logger.history = [];
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private formatTime(timestamp: number): string {
    const d = new Date(timestamp);

    return d.toISOString().slice(TIME_SLICE_START, TIME_SLICE_END);
  }

  getHistory(limit?: number): LogEntry[] {
    if (limit) {
      return Logger.history.slice(-limit);
    }

    return [...Logger.history];
  }

  getLevel(): LogLevel {
    return this.localLevel ?? Logger.globalLevel;
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const effectiveLevel = this.localLevel ?? Logger.globalLevel;

    if (level < effectiveLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      module: this.module,
      message,
      timestamp: Date.now(),
      correlationId: this.correlationId,
      context,
    };

    Logger.history.push(entry);

    if (Logger.history.length > Logger.maxHistory) {
      Logger.history = Logger.history.slice(-Logger.maxHistory);
    }

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const prefix = `[${this.formatTime(entry.timestamp)}] [${this.module}]`;
    const errorSerializer = (_key: string, value: unknown) => {
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
          cause: 'cause' in value ? value.cause : undefined,
        };
      }

      return value;
    };

    const msg = entry.context
      ? `${prefix} ${entry.message} ${JSON.stringify(entry.context, errorSerializer)}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(msg);
        break;
      case LogLevel.INFO:
        console.info(msg);
        break;
      case LogLevel.WARN:
        console.warn(msg);
        break;
      case LogLevel.ERROR:
        console.error(msg);
        break;
    }
  }

  setLevel(level: LogLevel): void {
    this.localLevel = level;
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }
}

export interface LogEntry {
  context?: Record<string, unknown>;
  correlationId?: string;
  level: LogLevel;
  message: string;
  module: string;
  timestamp: number;
}
export interface Logger {
  clearHistory(): void;
  debug(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  getHistory(limit?: number): LogEntry[];
  getLevel(): LogLevel;
  info(message: string, context?: Record<string, unknown>): void;
  setLevel(level: LogLevel): void;
  warn(message: string, context?: Record<string, unknown>): void;
}
export interface LoggerOptions {
  correlationId?: string;
  level?: LogLevel;
  maxHistory?: number;
  module: string;
}

export const getGlobalLogLevel = Logger.getGlobalLevel;
export const resetLogHistory = Logger.resetHistory;
export const setGlobalLogLevel = Logger.setGlobalLevel;
