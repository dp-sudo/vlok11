import type { RecoveryOption } from '@/shared/types';

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] ?? '未知错误';
}

export function getRecoveryOptions(code: ErrorCode): RecoveryOption[] | undefined {
  return RecoveryOptions[code];
}

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCodes = {
  // 初始化错误 (E001-E009)
  INIT_TIMEOUT: 'E001',
  INIT_FAILED: 'E002',
  INIT_DEPENDENCY_MISSING: 'E003',
  INIT_CANCELLED: 'E004',
  INIT_WEBGL_NOT_SUPPORTED: 'E005',

  // 相机错误 (E100-E109)
  CAMERA_SYNC_FAILED: 'E100',
  CAMERA_PRESET_NOT_FOUND: 'E101',
  CAMERA_CONTROLS_NOT_READY: 'E102',
  CAMERA_PERMISSION_DENIED: 'E103',
  CAMERA_NOT_AVAILABLE: 'E104',

  // 服务错误 (E200-E209)
  SERVICE_NOT_READY: 'E200',
  SERVICE_DISPOSED: 'E201',
  SERVICE_ALREADY_INITIALIZED: 'E202',
  SERVICE_START_FAILED: 'E203',
  SERVICE_STOP_FAILED: 'E204',

  // 资源错误 (E300-E309)
  ASSET_LOAD_FAILED: 'E300',
  ASSET_INVALID: 'E301',
  ASSET_TOO_LARGE: 'E302',
  ASSET_UNSUPPORTED_TYPE: 'E303',
  ASSET_DECODE_FAILED: 'E304',
  ASSET_NOT_FOUND: 'E305',

  // AI错误 (E400-E409)
  AI_MODEL_LOAD_FAILED: 'E400',
  AI_INFERENCE_FAILED: 'E401',
  AI_INPUT_INVALID: 'E402',
  AI_OUTPUT_INVALID: 'E403',
  AI_QUOTA_EXCEEDED: 'E404',
  AI_API_KEY_INVALID: 'E405',

  // 网络错误 (E500-E509)
  NETWORK_OFFLINE: 'E500',
  NETWORK_TIMEOUT: 'E501',
  NETWORK_REQUEST_FAILED: 'E502',
  NETWORK_CONNECTION_REFUSED: 'E503',
  NETWORK_CORS_ERROR: 'E504',

  // 权限错误 (E600-E609)
  PERMISSION_DENIED: 'E600',
  PERMISSION_REQUIRED: 'E601',
  PERMISSION_REVOKED: 'E602',
  PERMISSION_STORAGE_DENIED: 'E603',

  // 验证错误 (E700-E709)
  VALIDATION_FAILED: 'E700',
  VALIDATION_INVALID_FORMAT: 'E701',
  VALIDATION_OUT_OF_RANGE: 'E702',
  VALIDATION_REQUIRED_FIELD: 'E703',
  VALIDATION_PATTERN_MISMATCH: 'E704',

  // 存储错误 (E800-E809)
  STORAGE_FULL: 'E800',
  STORAGE_QUOTA_EXCEEDED: 'E801',
  STORAGE_READ_FAILED: 'E802',
  STORAGE_WRITE_FAILED: 'E803',
  STORAGE_CLEAR_FAILED: 'E804',

  // 录制错误 (E900-E909)
  RECORDING_FAILED: 'E900',
  RECORDING_NOT_SUPPORTED: 'E901',
  RECORDING_PERMISSION_DENIED: 'E902',
  RECORDING_ENCODING_FAILED: 'E903',
  RECORDING_MAX_DURATION: 'E904',
  RECORDING_NO_DATA: 'E905',
} as const;
export const ErrorMessages: Record<ErrorCode, string> = {
  // 初始化错误
  [ErrorCodes.INIT_TIMEOUT]: '服务初始化超时',
  [ErrorCodes.INIT_FAILED]: '服务初始化失败',
  [ErrorCodes.INIT_DEPENDENCY_MISSING]: '缺少必要的依赖服务',
  [ErrorCodes.INIT_CANCELLED]: '初始化已取消',
  [ErrorCodes.INIT_WEBGL_NOT_SUPPORTED]: '浏览器不支持WebGL',

  // 相机错误
  [ErrorCodes.CAMERA_SYNC_FAILED]: '相机同步失败',
  [ErrorCodes.CAMERA_PRESET_NOT_FOUND]: '相机预设不存在',
  [ErrorCodes.CAMERA_CONTROLS_NOT_READY]: '相机控制未就绪',
  [ErrorCodes.CAMERA_PERMISSION_DENIED]: '相机权限被拒绝',
  [ErrorCodes.CAMERA_NOT_AVAILABLE]: '相机不可用',

  // 服务错误
  [ErrorCodes.SERVICE_NOT_READY]: '服务未就绪',
  [ErrorCodes.SERVICE_DISPOSED]: '服务已销毁',
  [ErrorCodes.SERVICE_ALREADY_INITIALIZED]: '服务已初始化',
  [ErrorCodes.SERVICE_START_FAILED]: '服务启动失败',
  [ErrorCodes.SERVICE_STOP_FAILED]: '服务停止失败',

  // 资源错误
  [ErrorCodes.ASSET_LOAD_FAILED]: '资源加载失败',
  [ErrorCodes.ASSET_INVALID]: '资源格式无效',
  [ErrorCodes.ASSET_TOO_LARGE]: '资源文件过大',
  [ErrorCodes.ASSET_UNSUPPORTED_TYPE]: '不支持的资源类型',
  [ErrorCodes.ASSET_DECODE_FAILED]: '资源解码失败',
  [ErrorCodes.ASSET_NOT_FOUND]: '资源文件不存在',

  // AI错误
  [ErrorCodes.AI_MODEL_LOAD_FAILED]: 'AI模型加载失败',
  [ErrorCodes.AI_INFERENCE_FAILED]: 'AI推理失败',
  [ErrorCodes.AI_INPUT_INVALID]: 'AI输入数据无效',
  [ErrorCodes.AI_OUTPUT_INVALID]: 'AI输出数据无效',
  [ErrorCodes.AI_QUOTA_EXCEEDED]: 'AI配额已用尽',
  [ErrorCodes.AI_API_KEY_INVALID]: 'AI API密钥无效',

  // 网络错误
  [ErrorCodes.NETWORK_OFFLINE]: '网络已断开',
  [ErrorCodes.NETWORK_TIMEOUT]: '网络请求超时',
  [ErrorCodes.NETWORK_REQUEST_FAILED]: '网络请求失败',
  [ErrorCodes.NETWORK_CONNECTION_REFUSED]: '网络连接被拒绝',
  [ErrorCodes.NETWORK_CORS_ERROR]: '跨域请求错误',

  // 权限错误
  [ErrorCodes.PERMISSION_DENIED]: '权限被拒绝',
  [ErrorCodes.PERMISSION_REQUIRED]: '需要相应权限',
  [ErrorCodes.PERMISSION_REVOKED]: '权限已被撤销',
  [ErrorCodes.PERMISSION_STORAGE_DENIED]: '存储权限被拒绝',

  // 验证错误
  [ErrorCodes.VALIDATION_FAILED]: '数据验证失败',
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: '数据格式无效',
  [ErrorCodes.VALIDATION_OUT_OF_RANGE]: '数值超出范围',
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: '必填字段为空',
  [ErrorCodes.VALIDATION_PATTERN_MISMATCH]: '数据格式不匹配',

  // 存储错误
  [ErrorCodes.STORAGE_FULL]: '存储空间已满',
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: '存储配额已超出',
  [ErrorCodes.STORAGE_READ_FAILED]: '存储读取失败',
  [ErrorCodes.STORAGE_WRITE_FAILED]: '存储写入失败',
  [ErrorCodes.STORAGE_CLEAR_FAILED]: '存储清除失败',

  // 录制错误
  [ErrorCodes.RECORDING_FAILED]: '录制失败',
  [ErrorCodes.RECORDING_NOT_SUPPORTED]: '不支持录制功能',
  [ErrorCodes.RECORDING_PERMISSION_DENIED]: '录制权限被拒绝',
  [ErrorCodes.RECORDING_ENCODING_FAILED]: '录制编码失败',
  [ErrorCodes.RECORDING_MAX_DURATION]: '已达到最大录制时长',
  [ErrorCodes.RECORDING_NO_DATA]: '录制数据为空',
};

// Recovery action helpers - defined as stable references
const reloadPage = (): void => {
  window.location.reload();
};
const noOp = (): void => {
  /* No automatic recovery available */
};

// Specific recovery actions for different error types
const requestCameraPermission = async (): Promise<void> => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    // Permission denied or not available
  }
};

const openBrowserSupport = (): void => {
  window.open('https://caniuse.com/webgl', '_blank');
};

const clearStorage = async (): Promise<void> => {
  try {
    await navigator.storage?.persist?.();
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage not available
  }
};

const checkNetworkConnection = async (): Promise<void> => {
  if (!navigator.onLine) {
    window.addEventListener('online', () => window.location.reload(), { once: true });
  }
};

const stopRecording = (): void => {
  // MediaRecorder cleanup handled by caller
};

const retryAction = (): void => {
  // Retry logic handled by caller
};

const openSettings = (): void => {
  // Open settings handled by caller
};

// Recovery options - externalized from ErrorHandler
export const RecoveryOptions: Record<ErrorCode, RecoveryOption[]> = {
  // 初始化错误
  [ErrorCodes.INIT_TIMEOUT]: [{ label: '重试', action: reloadPage }],
  [ErrorCodes.INIT_FAILED]: [{ label: '重试', action: reloadPage }],
  [ErrorCodes.INIT_DEPENDENCY_MISSING]: [{ label: '刷新页面', action: reloadPage }],
  [ErrorCodes.INIT_CANCELLED]: [{ label: '重试', action: reloadPage }],
  [ErrorCodes.INIT_WEBGL_NOT_SUPPORTED]: [
    { label: '查看支持的浏览器', action: openBrowserSupport },
  ],

  // 相机错误
  [ErrorCodes.CAMERA_SYNC_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.CAMERA_PRESET_NOT_FOUND]: [{ label: '使用默认', action: retryAction }],
  [ErrorCodes.CAMERA_CONTROLS_NOT_READY]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.CAMERA_PERMISSION_DENIED]: [{ label: '授予权限', action: requestCameraPermission }],
  [ErrorCodes.CAMERA_NOT_AVAILABLE]: [{ label: '检查设备', action: requestCameraPermission }],

  // 服务错误
  [ErrorCodes.SERVICE_NOT_READY]: [{ label: '重新初始化', action: reloadPage }],
  [ErrorCodes.SERVICE_DISPOSED]: [{ label: '刷新', action: reloadPage }],
  [ErrorCodes.SERVICE_ALREADY_INITIALIZED]: [{ label: '继续', action: noOp }],
  [ErrorCodes.SERVICE_START_FAILED]: [{ label: '重试', action: reloadPage }],
  [ErrorCodes.SERVICE_STOP_FAILED]: [{ label: '重试', action: retryAction }],

  // 资源错误
  [ErrorCodes.ASSET_LOAD_FAILED]: [{ label: '重试加载', action: retryAction }],
  [ErrorCodes.ASSET_INVALID]: [{ label: '选择有效文件', action: openSettings }],
  [ErrorCodes.ASSET_TOO_LARGE]: [{ label: '选择更小文件', action: openSettings }],
  [ErrorCodes.ASSET_UNSUPPORTED_TYPE]: [{ label: '查看支持格式', action: openSettings }],
  [ErrorCodes.ASSET_DECODE_FAILED]: [{ label: '尝试其他文件', action: retryAction }],
  [ErrorCodes.ASSET_NOT_FOUND]: [{ label: '选择其他文件', action: openSettings }],

  // AI错误
  [ErrorCodes.AI_MODEL_LOAD_FAILED]: [{ label: '重试加载模型', action: retryAction }],
  [ErrorCodes.AI_INFERENCE_FAILED]: [
    { label: '重试AI', action: retryAction },
    { label: '跳过AI处理', action: noOp },
  ],
  [ErrorCodes.AI_INPUT_INVALID]: [{ label: '尝试其他输入', action: retryAction }],
  [ErrorCodes.AI_OUTPUT_INVALID]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.AI_QUOTA_EXCEEDED]: [{ label: '检查配额', action: openSettings }],
  [ErrorCodes.AI_API_KEY_INVALID]: [{ label: '检查API密钥', action: openSettings }],

  // 网络错误
  [ErrorCodes.NETWORK_OFFLINE]: [{ label: '检查网络', action: checkNetworkConnection }],
  [ErrorCodes.NETWORK_TIMEOUT]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.NETWORK_REQUEST_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.NETWORK_CONNECTION_REFUSED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.NETWORK_CORS_ERROR]: [{ label: '联系开发者', action: openSettings }],

  // 权限错误
  [ErrorCodes.PERMISSION_DENIED]: [{ label: '重新请求', action: retryAction }],
  [ErrorCodes.PERMISSION_REQUIRED]: [{ label: '授予权限', action: retryAction }],
  [ErrorCodes.PERMISSION_REVOKED]: [{ label: '重新请求', action: retryAction }],
  [ErrorCodes.PERMISSION_STORAGE_DENIED]: [{ label: '授予存储权限', action: clearStorage }],

  // 验证错误
  [ErrorCodes.VALIDATION_FAILED]: [{ label: '检查输入', action: openSettings }],
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: [{ label: '修正格式', action: openSettings }],
  [ErrorCodes.VALIDATION_OUT_OF_RANGE]: [{ label: '调整数值', action: openSettings }],
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: [{ label: '填写必填项', action: openSettings }],
  [ErrorCodes.VALIDATION_PATTERN_MISMATCH]: [{ label: '修正格式', action: openSettings }],

  // 存储错误
  [ErrorCodes.STORAGE_FULL]: [{ label: '清理空间', action: clearStorage }],
  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: [{ label: '清理存储', action: clearStorage }],
  [ErrorCodes.STORAGE_READ_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.STORAGE_WRITE_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.STORAGE_CLEAR_FAILED]: [{ label: '重试', action: retryAction }],

  // 录制错误
  [ErrorCodes.RECORDING_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.RECORDING_NOT_SUPPORTED]: [{ label: '使用支持的浏览器', action: openBrowserSupport }],
  [ErrorCodes.RECORDING_PERMISSION_DENIED]: [{ label: '授予权限', action: retryAction }],
  [ErrorCodes.RECORDING_ENCODING_FAILED]: [{ label: '重试', action: retryAction }],
  [ErrorCodes.RECORDING_MAX_DURATION]: [{ label: '停止录制', action: stopRecording }],
  [ErrorCodes.RECORDING_NO_DATA]: [{ label: '重试', action: retryAction }],
};
