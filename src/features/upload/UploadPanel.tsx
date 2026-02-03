import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileImage,
  FileVideo,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  X,
} from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { HexIcon } from '@/shared/components/ui/HexIcon';
import { TechCard } from '@/shared/components/ui/TechCard';
import { formatFileSize } from '@/shared/utils';

interface UploadPanelProps {
  acceptedFormats: string;
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  maxFileSize?: number; // 默认 200MB
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

// 3D Perspective Grid & Glitch Particles
const HolographicGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();

    let { width, height } = canvas;

    let time = 0;
    const speed = 0.5;

    const particles = Array.from({ length: window.innerWidth < 768 ? 20 : 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animationFrameId: number;

    const render = () => {
      ({ width, height } = canvas);

      ctx.clearRect(0, 0, width, height);

      time += speed;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;

      const horizonY = height * 0.4;
      const gridSpacing = 40;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSpacing * 0.8 * (width / 1000)) {
        const centerX = width / 2;
        const xOffset = x - centerX;

        ctx.moveTo(centerX + xOffset * 0.05, horizonY);
        ctx.lineTo(x, height);
      }

      const loopHeight = height - horizonY;
      const offset = time % gridSpacing;

      for (let y = horizonY; y < height; y += gridSpacing) {
        let currentY = y + offset;

        if (currentY > height) currentY -= loopHeight;

        const alpha = Math.max(0, (currentY - horizonY) / loopHeight);

        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.2})`;

        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width, currentY);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        const alpha = Math.min(1, p.opacity);

        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y);
        ctx.fill();
      });

      if (Math.random() > 0.98) {
        const y = Math.random() * height;

        ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.05})`;
        ctx.fillRect(0, y, width, Math.random() * 5 + 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none mix-blend-screen" />
  );
};

// 验证文件
const validateFile = (file: File, maxSize: number): FileValidationResult => {
  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件过大 (${formatFileSize(file.size)})。最大支持 ${formatFileSize(maxSize)}`,
    };
  }

  // 检查文件类型
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
  const validTypes = [...validImageTypes, ...validVideoTypes];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件格式 (${file.type})。请上传图片 (JPG, PNG, WebP) 或视频 (MP4, WebM, MOV)`,
    };
  }

  // 警告大文件
  if (file.size > maxSize * 0.8) {
    return {
      valid: true,
      warning: '文件较大，处理可能需要较长时间',
    };
  }

  return { valid: true };
};

// 验证 URL
const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);

    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// 获取文件图标
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return <FileImage className="w-6 h-6 text-cyan-400" />;
  }
  if (type.startsWith('video/')) {
    return <FileVideo className="w-6 h-6 text-purple-400" />;
  }

  return <ImageIcon className="w-6 h-6 text-zinc-400" />;
};

export const UploadPanel = memo(
  ({
    acceptedFormats,
    onFileUpload,
    onUrlSubmit,
    maxFileSize = 200 * 1024 * 1024, // 200MB
  }: UploadPanelProps) => {
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationWarning, setValidationWarning] = useState<string | null>(null);
    const [isUrlValid, setIsUrlValid] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // URL 验证
    useEffect(() => {
      if (urlInput) {
        setIsUrlValid(validateUrl(urlInput));
      } else {
        setIsUrlValid(false);
      }
    }, [urlInput]);

    // 处理文件选择
    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const result = validateFile(file, maxFileSize);

        if (!result.valid) {
          setValidationError(result.error || '文件验证失败');
          setSelectedFile(null);
          setValidationWarning(null);

          return;
        }

        setValidationError(null);
        setValidationWarning(result.warning || null);
        setSelectedFile(file);

        // 延迟一下让用户看到文件信息，然后上传
        setTimeout(() => {
          onFileUpload(file);
        }, 500);
      },
      [maxFileSize, onFileUpload]
    );

    // 处理拖拽
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];

        if (!file) return;

        const result = validateFile(file, maxFileSize);

        if (!result.valid) {
          setValidationError(result.error || '文件验证失败');
          setSelectedFile(null);
          setValidationWarning(null);

          return;
        }

        setValidationError(null);
        setValidationWarning(result.warning || null);
        setSelectedFile(file);

        setTimeout(() => {
          onFileUpload(file);
        }, 500);
      },
      [maxFileSize, onFileUpload]
    );

    // 处理 URL 提交
    const handleUrlSubmit = useCallback(() => {
      if (!urlInput || !isUrlValid) return;
      onUrlSubmit(urlInput);
    }, [urlInput, isUrlValid, onUrlSubmit]);

    // 清除选择的文件
    const clearSelectedFile = useCallback(() => {
      setSelectedFile(null);
      setValidationError(null);
      setValidationWarning(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, []);

    return (
      <>
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-zinc-950" />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_25s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(6,182,212,0.1)_60deg,transparent_120deg)] mix-blend-screen" />
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_35s_linear_infinite_reverse] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(167,139,250,0.1)_60deg,transparent_120deg)] mix-blend-screen" />
          </div>
          <HolographicGrid />
        </div>

        <TechCard className="w-full max-w-lg mx-4 md:mx-auto relative overflow-hidden group/card shadow-[0_0_80px_rgba(6,182,212,0.15)] border border-cyan-500/20 backdrop-blur-xl bg-zinc-900/60 z-10">
          <div className="flex flex-col items-center text-center space-y-6 relative z-10 p-4">
            <div className="mb-2 relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
              <HexIcon active>
                <ImageIcon className="w-8 h-8 relative z-10 text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </HexIcon>
            </div>

            {!showUrlInput ? (
              <>
                <div className="space-y-4 pt-4">
                  <h2 className="text-2xl md:text-4xl font-bold text-white font-orbitron tracking-[0.15em] md:tracking-[0.2em] glow-text drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-[pulse_4s_ease-in-out_infinite]">
                    DATA IMPORT
                  </h2>
                  <div className="flex flex-col gap-1">
                    <p className="text-cyan-400 font-tech text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] uppercase opacity-90 typing-effect">
                      SYSTEM READY FOR INGESTION
                    </p>
                    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-3 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-zinc-200 text-lg font-medium max-w-xs mx-auto leading-relaxed font-sans tracking-wide">
                      支持 4K 超清视频与全景照片
                    </p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto font-mono">
                      {'>'} AI 深度估计技术将把它们转化为交互式 3D 场景
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 mt-2">
                      <span className="px-2 py-1 bg-zinc-800/50 rounded">最大 200MB</span>
                      <span className="px-2 py-1 bg-zinc-800/50 rounded">JPG PNG WebP</span>
                      <span className="px-2 py-1 bg-zinc-800/50 rounded">MP4 WebM MOV</span>
                    </div>
                  </div>
                </div>

                {/* 错误提示 */}
                {validationError && (
                  <div className="w-full max-w-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm text-red-200">{validationError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 警告提示 */}
                {validationWarning && (
                  <div className="w-full max-w-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3 p-3 bg-yellow-950/50 border border-yellow-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm text-yellow-200">{validationWarning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 文件预览 */}
                {selectedFile && (
                  <div className="w-full max-w-sm animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-cyan-500/30 rounded-lg">
                      {getFileIcon(selectedFile.type)}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm text-white truncate">{selectedFile.name}</p>
                        <p className="text-xs text-zinc-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`relative group w-full max-w-sm pt-6 pb-2 ${
                    isDragging ? 'scale-105' : ''
                  } transition-transform duration-300`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-cyan-500/30 rounded-xl blur-lg transition duration-500 animate-[pulse_3s_ease-in-out_infinite] ${
                      isDragging ? 'opacity-80' : 'opacity-30 group-hover:opacity-60'
                    }`}
                  />
                  <div className="relative">
                    <div
                      className={`absolute inset-0 border-2 border-dashed rounded-xl transition-all duration-300 pointer-events-none ${
                        isDragging
                          ? 'border-cyan-400 bg-cyan-900/30'
                          : 'border-cyan-500/20 group-hover:border-cyan-400/80 group-hover:bg-cyan-900/10'
                      }`}
                    />

                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500 rounded-br-sm opacity-50 group-hover:opacity-100 transition-opacity" />

                    <input
                      ref={fileInputRef}
                      accept={acceptedFormats}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={handleFileChange}
                      type="file"
                    />

                    <div
                      className={`w-full py-12 px-6 bg-zinc-950/80 backdrop-blur-md rounded-xl flex flex-col items-center justify-center gap-5 transition-all z-10 ${
                        isDragging ? 'bg-cyan-950/50' : ''
                      }`}
                    >
                      <div
                        className={`p-4 rounded-full bg-zinc-900 group-hover:bg-cyan-500 text-zinc-500 group-hover:text-white transition-all duration-300 ring-1 ring-white/10 group-hover:ring-cyan-300 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] ${
                          isDragging ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                      >
                        <Upload className="w-8 h-8 transition-transform group-hover:-translate-y-1" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="tracking-[0.2em] font-orbitron text-sm text-zinc-300 group-hover:text-white transition-colors">
                          {isDragging ? 'RELEASE TO UPLOAD' : 'INITIALIZE UPLOAD'}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-700 group-hover:text-cyan-400/80 tracking-widest">
                          [ DROP FILE OR CLICK TO SCAN ]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-4 w-full opacity-70 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="group flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 hover:border-cyan-500/50 bg-white/5 hover:bg-cyan-950/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    onClick={() => setShowUrlInput(true)}
                  >
                    <LinkIcon className="w-3 h-3 text-cyan-600 group-hover:text-cyan-300 transition-colors" />
                    <span className="font-mono text-[10px] tracking-widest text-zinc-500 group-hover:text-cyan-200">
                      LOAD FROM REMOTE URL
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between mb-8 border-b border-cyan-900/30 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                    <h2 className="text-xl font-bold text-white font-orbitron tracking-wider glow-text">
                      NETWORK LINK
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/30 p-2 rounded-full transition-all duration-200"
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput('');
                      setValidationError(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 mb-6">
                  <p className="text-xs text-cyan-400/80 mb-2 text-left font-mono flex items-center gap-2">
                    <span className="animate-pulse">_</span>
                    {urlInput
                      ? isUrlValid
                        ? 'VALID URL FORMAT'
                        : 'INVALID URL FORMAT'
                      : 'WAITING FOR INPUT STREAM...'}
                  </p>

                  {/* URL 验证状态 */}
                  {urlInput && (
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      {isUrlValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">URL 格式有效</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">请输入有效的 HTTP/HTTPS URL</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex gap-0 shadow-lg">
                    <input
                      className="flex-1 bg-black/40 border border-zinc-700 border-r-0 rounded-l-md px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-black/60 font-mono placeholder:text-zinc-700 transition-all"
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setValidationError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isUrlValid) {
                          void handleUrlSubmit();
                        }
                      }}
                      placeholder="https://example.com/media..."
                      type="text"
                      value={urlInput}
                    />
                    <button
                      type="button"
                      className={`px-6 rounded-r-md flex items-center justify-center border transition-all duration-300 ${
                        isUrlValid
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : 'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-not-allowed'
                      }`}
                      disabled={!isUrlValid}
                      onClick={handleUrlSubmit}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-left space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <span className="w-1 h-4 bg-cyan-500 rounded-full" />
                    SUPPORTED SOURCES
                  </h3>
                  <ul className="space-y-2 text-xs text-zinc-500 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Direct image URLs (JPG, PNG, WebP)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Direct video URLs (MP4, WebM)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-yellow-500">!</span>
                      URLs must allow CORS access
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      YouTube, Vimeo, or streaming sites
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </TechCard>
      </>
    );
  }
);

UploadPanel.displayName = 'UploadPanel';
