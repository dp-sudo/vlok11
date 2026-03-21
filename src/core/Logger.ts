export enum LogLevel {
  DEBUG = 0,
  ERROR = 3,
  INFO = 1,
  NONE = 4,
  WARN = 2,
}

export interface LogFilter {
  module?: string;
  minLevel?: LogLevel;
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

const MAX_LOG_HISTORY = 500;
const TIME_SLICE_END = 23;
const TIME_SLICE_START = 11;

// Sensitive fields that should be redacted from logs
const SENSITIVE_FIELDS = ['apiKey', 'token', 'password', 'secret', 'credential'];

// Lock for thread-safe history management
let historyLock = false;

// Pre-allocated error serializer to avoid creating new function on each log call
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

// 默认格式化器
const defaultFormatter: LogFormatter = {
  format(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString().slice(TIME_SLICE_START, TIME_SLICE_END);
    const levelStr = LogLevel[entry.level];
    const prefix = `[${time}] [${entry.module}] [${levelStr}]`;

    return entry.context
      ? `${prefix} ${entry.message} ${JSON.stringify(entry.context)}`
      : `${prefix} ${entry.message}`;
  },
};

const CURRENT_FORMATTER: { current: LogFormatter } = { current: defaultFormatter };

export function createLogger(options: LoggerOptions): LoggerContract {
  return new Logger(options);
}

class Logger implements LoggerContract {
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static history: LogEntry[] = [];
  private static maxHistory = MAX_LOG_HISTORY;
  private static moduleFilters = new Map<string, LogLevel>();

  private correlationId: string | undefined;
  private localLevel: LogLevel | undefined;
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

  static setModuleLevel(module: string, level: LogLevel): void {
    Logger.moduleFilters.set(module, level);
  }

  static getModuleLevel(module: string): LogLevel | undefined {
    return Logger.moduleFilters.get(module);
  }

  static clearModuleLevels(): void {
    Logger.moduleFilters.clear();
  }

  static setFormatter(formatter: LogFormatter): void {
    CURRENT_FORMATTER.current = formatter;
  }

  static resetFormatter(): void {
    CURRENT_FORMATTER.current = defaultFormatter;
  }

  static getHistory(): LogEntry[] {
    return [...Logger.history];
  }

  private getEffectiveLevel(): LogLevel {
    return this.localLevel ?? Logger.moduleFilters.get(this.module) ?? Logger.globalLevel;
  }

  /**
   * Sanitize context to redact sensitive information
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
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
    return this.getEffectiveLevel();
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const effectiveLevel = this.getEffectiveLevel();

    if (level < effectiveLevel) {
      return;
    }

    // Sanitize context to redact sensitive information
    const sanitizedContext = context ? this.sanitizeContext(context) : undefined;

    const entry: LogEntry = {
      level,
      module: this.module,
      message,
      timestamp: Date.now(),
      ...(this.correlationId !== undefined ? { correlationId: this.correlationId } : {}),
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
    };

    // Simple mutex lock for thread-safe history management
    // Using a flag-based critical section - JS is single-threaded so this is safe
    // The lock prevents re-entrant calls from corrupting history during async operations
    if (historyLock) {
      // If already locked, just push without trimming (trims happen on next unlocked call)
      Logger.history.push(entry);
    } else {
      historyLock = true;
      try {
        Logger.history.push(entry);

        if (Logger.history.length > Logger.maxHistory) {
          Logger.history = Logger.history.slice(-Logger.maxHistory);
        }
      } finally {
        historyLock = false;
      }
    }

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const prefix = `[${this.formatTime(entry.timestamp)}] [${this.module}]`;

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
export interface LoggerContract {
  clearHistory(): void;
  debug(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  getHistory(limit?: number): LogEntry[];
  getLevel(): LogLevel;
  info(message: string, context?: Record<string, unknown>): void;
  setLevel(level: LogLevel): void;
  warn(message: string, context?: Record<string, unknown>): void;
}

export interface LoggerStaticContract {
  getGlobalLevel(): LogLevel;
  setGlobalLevel(level: LogLevel): void;
  setModuleLevel(module: string, level: LogLevel): void;
  getModuleLevel(module: string): LogLevel | undefined;
  clearModuleLevels(): void;
  setFormatter(formatter: LogFormatter): void;
  resetFormatter(): void;
  getHistory(): LogEntry[];
  resetHistory(): void;
}

export { Logger };

export interface LoggerOptions {
  correlationId?: string;
  level?: LogLevel;
  maxHistory?: number;
  module: string;
}
