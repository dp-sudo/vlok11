import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, createLogger, Logger } from './Logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.resetHistory();
    Logger.clearModuleLevels();
    Logger.setGlobalLevel(LogLevel.INFO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger instance', () => {
      const logger = createLogger({ module: 'test' });
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create logger with custom module name', () => {
      const logger = createLogger({ module: 'CustomModule' });
      expect(logger.getLevel()).toBeDefined();
    });
  });

  describe('instance methods', () => {
    it('should log info messages', () => {
      const logger = createLogger({ module: 'TestModule' });
      logger.info('Test message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      const logger = createLogger({ module: 'TestModule' });
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = createLogger({ module: 'TestModule' });
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log debug when global level is INFO', () => {
      const logger = createLogger({ module: 'TestModule' });
      logger.debug('Debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log debug when global level is DEBUG', () => {
      Logger.setGlobalLevel(LogLevel.DEBUG);
      const logger = createLogger({ module: 'TestModule' });
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('should include context in log output', () => {
      const logger = createLogger({ module: 'TestModule' });
      const context = { key: 'value', num: 42 };
      logger.info('Message with context', context);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Message with context')
      );
    });
  });

  describe('log levels', () => {
    it('should respect global log level', () => {
      Logger.setGlobalLevel(LogLevel.WARN);
      const logger = createLogger({ module: 'Test' });
      logger.info('Should not appear');
      logger.warn('Should appear');
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should respect module-specific log level', () => {
      Logger.setModuleLevel('SpecificModule', LogLevel.ERROR);
      const logger1 = createLogger({ module: 'SpecificModule' });
      const logger2 = createLogger({ module: 'OtherModule' });

      logger1.info('Module specific - should not appear');
      logger2.info('Other module - should appear');

      expect(console.info).not.toHaveBeenCalledWith(expect.stringContaining('Module specific'));
    });

    it('should use local level over global level', () => {
      Logger.setGlobalLevel(LogLevel.ERROR);
      const logger = createLogger({ module: 'Test', level: LogLevel.DEBUG });
      logger.debug('Should appear despite global ERROR level');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('should record log entries in history', () => {
      const logger = createLogger({ module: 'Test' });
      logger.info('Message 1');
      logger.warn('Message 2');

      const history = logger.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit history size', () => {
      const logger = createLogger({ module: 'Test', maxHistory: 5 });
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const history = logger.getHistory();
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should clear history', () => {
      const logger = createLogger({ module: 'Test' });
      logger.info('Message');
      logger.clearHistory();

      const history = logger.getHistory();
      expect(history.length).toBe(0);
    });

    it('should get limited history', () => {
      const logger = createLogger({ module: 'Test' });
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');

      const history = logger.getHistory(2);
      expect(history.length).toBe(2);
    });
  });

  describe('static methods', () => {
    it('should get and set global level', () => {
      expect(Logger.getGlobalLevel()).toBe(LogLevel.INFO);
      Logger.setGlobalLevel(LogLevel.ERROR);
      expect(Logger.getGlobalLevel()).toBe(LogLevel.ERROR);
    });

    it('should get and set module level', () => {
      Logger.setModuleLevel('TestModule', LogLevel.DEBUG);
      expect(Logger.getModuleLevel('TestModule')).toBe(LogLevel.DEBUG);
      expect(Logger.getModuleLevel('NonExistent')).toBeUndefined();
    });

    it('should clear module levels', () => {
      Logger.setModuleLevel('TestModule', LogLevel.DEBUG);
      Logger.clearModuleLevels();
      expect(Logger.getModuleLevel('TestModule')).toBeUndefined();
    });

    it('should reset global history', () => {
      const logger = createLogger({ module: 'Test' });
      logger.info('Message');
      Logger.resetHistory();
      expect(Logger.getHistory().length).toBe(0);
    });
  });

  describe('output formatting', () => {
    it('should output in correct format with timestamp, module and level', () => {
      const logger = createLogger({ module: 'FormatTest' });
      logger.info('Formatted message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[FormatTest]')
      );
    });

    it('should serialize Error objects properly', () => {
      const logger = createLogger({ module: 'ErrorTest' });
      const error = new Error('Test error');
      logger.error('An error occurred', { error });

      const mockCalls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
      const output = (mockCalls[0]?.[0] ?? '') as string;
      expect(output).toContain('An error occurred');
      expect(output).toContain('"message":"Test error"');
    });
  });
});
