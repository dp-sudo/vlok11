import type { ProjectData } from '@/core/types/project';

// Global type declarations for window extensions

declare global {
  interface Window {
    __IMMERSA_LAST_DOWNLOAD__?: {
      filename: string;
      kind: 'blob' | 'data-url';
      mimeType?: string;
      size?: number;
    };
    __IMMERSA_TEST_API__?: {
      exportProjectData: () => Promise<ProjectData>;
      getSessionSummary: () => {
        hasResult: boolean;
        hasVideo: boolean;
        lastDownload?: {
          filename: string;
          kind: 'blob' | 'data-url';
          mimeType?: string;
          size?: number;
        };
        status: string;
      };
      importProjectData: (projectData: ProjectData) => Promise<void>;
      isSceneReady?: () => boolean;
      resetSession: () => void;
      triggerSceneExport?: () => boolean;
      triggerSnapshotExport?: () => boolean;
    };
    __TEST_MODE__?: boolean;
  }
}

// Make this file a module to enable global augmentation
