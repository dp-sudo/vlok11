import { createLogger } from '@/core/Logger';

export function categorizeError(error: Error): AppErrorInfo {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    return {
      type: ErrorType.NETWORK,
      message: ERROR_MESSAGES[ErrorType.NETWORK],
      details: error.message,
      recoverable: true,
    };
  }
  if (message.includes('file type') || message.includes('unsupported')) {
    return {
      type: ErrorType.FILE_TYPE,
      message: ERROR_MESSAGES[ErrorType.FILE_TYPE],
      details: error.message,
      recoverable: true,
    };
  }
  if (message.includes('too large') || message.includes('size')) {
    return {
      type: ErrorType.FILE_TOO_LARGE,
      message: ERROR_MESSAGES[ErrorType.FILE_TOO_LARGE],
      details: error.message,
      recoverable: true,
    };
  }
  if (message.includes('webgl') || message.includes('context')) {
    return {
      type: ErrorType.WEBGL,
      message: ERROR_MESSAGES[ErrorType.WEBGL],
      details: error.message,
      recoverable: false,
    };
  }

  logger.error('Uncategorized error', { message: error.message });

  return {
    type: ErrorType.UNKNOWN,
    message: ERROR_MESSAGES[ErrorType.UNKNOWN],
    details: error.message,
    recoverable: true,
  };
}
export function handleError(error: Error, context?: string): AppErrorInfo {
  const errorInfo = categorizeError(error);

  logger.error(`Error in ${context ?? 'unknown'}`, {
    type: errorInfo.type,
    message: error.message,
  });

  return errorInfo;
}

export interface AppErrorInfo {
  details?: string;
  message: string;
  recoverable: boolean;
  type: ErrorType;
}

export enum ErrorType {
  AI_SERVICE = 'AI_SERVICE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE = 'FILE_TYPE',
  NETWORK = 'NETWORK',
  PROCESSING = 'PROCESSING',
  UNKNOWN = 'UNKNOWN',
  WEBGL = 'WEBGL',
}

const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络后重试',
  [ErrorType.FILE_TYPE]: '不支持的文件类型，请上传图片或视频文件',
  [ErrorType.FILE_TOO_LARGE]: '文件过大，请上传小于 100MB 的文件',
  [ErrorType.PROCESSING]: '处理过程中出现错误，请重试',
  [ErrorType.AI_SERVICE]: 'AI 服务暂时不可用，已切换到离线模式',
  [ErrorType.WEBGL]: '您的浏览器不支持 WebGL，请使用现代浏览器',
  [ErrorType.UNKNOWN]: '发生未知错误，请刷新页面重试',
};
const logger = createLogger({ module: 'Utils' });
