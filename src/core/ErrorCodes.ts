export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? '未知错误';
}

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  INIT_TIMEOUT: 'E001',
  INIT_FAILED: 'E002',
  INIT_DEPENDENCY_MISSING: 'E003',

  CAMERA_SYNC_FAILED: 'E100',
  CAMERA_PRESET_NOT_FOUND: 'E101',
  CAMERA_CONTROLS_NOT_READY: 'E102',

  SERVICE_NOT_READY: 'E200',
  SERVICE_DISPOSED: 'E201',
  SERVICE_ALREADY_INITIALIZED: 'E202',

  ASSET_LOAD_FAILED: 'E300',
  ASSET_INVALID: 'E301',
  ASSET_TOO_LARGE: 'E302',
  ASSET_UNSUPPORTED_TYPE: 'E303',

  AI_MODEL_LOAD_FAILED: 'E400',
  AI_INFERENCE_FAILED: 'E401',
  AI_INPUT_INVALID: 'E402',
} as const;
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.INIT_TIMEOUT]: '服务初始化超时',
  [ErrorCodes.INIT_FAILED]: '服务初始化失败',
  [ErrorCodes.INIT_DEPENDENCY_MISSING]: '缺少必要的依赖服务',

  [ErrorCodes.CAMERA_SYNC_FAILED]: '相机同步失败',
  [ErrorCodes.CAMERA_PRESET_NOT_FOUND]: '相机预设不存在',
  [ErrorCodes.CAMERA_CONTROLS_NOT_READY]: '相机控制未就绪',

  [ErrorCodes.SERVICE_NOT_READY]: '服务未就绪',
  [ErrorCodes.SERVICE_DISPOSED]: '服务已销毁',
  [ErrorCodes.SERVICE_ALREADY_INITIALIZED]: '服务已初始化',

  [ErrorCodes.ASSET_LOAD_FAILED]: '资源加载失败',
  [ErrorCodes.ASSET_INVALID]: '资源格式无效',
  [ErrorCodes.ASSET_TOO_LARGE]: '资源文件过大',
  [ErrorCodes.ASSET_UNSUPPORTED_TYPE]: '不支持的资源类型',

  [ErrorCodes.AI_MODEL_LOAD_FAILED]: 'AI模型加载失败',
  [ErrorCodes.AI_INFERENCE_FAILED]: 'AI推理失败',
  [ErrorCodes.AI_INPUT_INVALID]: 'AI输入数据无效',
};
