import { PERSPECTIVE_ORTHO } from '@/shared/constants/camera';
import { degToRad } from '@/shared/utils';

import type { FovZoomEquivalence } from '@/shared/types';

export function calculateCameraSync(
  currentMode: 'perspective' | 'orthographic',
  fovOrZoom: number,
  cameraDistance: number
): CameraSyncResult {
  if (currentMode === 'perspective') {
    const zoom = syncOrthoZoomFromPerspective(fovOrZoom, cameraDistance);
    const halfFov = degToRad(fovOrZoom / 2);
    const visibleHeight = 2 * cameraDistance * Math.tan(halfFov);

    return { perspectiveFov: fovOrZoom, orthoZoom: zoom, visibleHeight };
  }

  const fov = syncPerspectiveFovFromOrtho(fovOrZoom, cameraDistance);
  const halfFov = degToRad(fov / 2);
  const visibleHeight = 2 * cameraDistance * Math.tan(halfFov);

  return { perspectiveFov: fov, orthoZoom: fovOrZoom, visibleHeight };
}
export function calculateEquivalence(
  fov: number,
  referenceDistance = DEFAULT_REFERENCE_DISTANCE
): FovZoomEquivalence {
  const zoom = fovToZoom(fov, referenceDistance);
  const halfFovRad = degToRad(fov / 2);
  const referenceHeight = 2 * referenceDistance * Math.tan(halfFovRad);

  return { fov, zoom, referenceHeight };
}
export function fovToZoom(fov: number, referenceDistance = DEFAULT_REFERENCE_DISTANCE): number {
  const halfFovRad = degToRad(fov / 2);
  const visibleHeight = 2 * referenceDistance * Math.tan(halfFovRad);

  return (DEFAULT_REFERENCE_HEIGHT / visibleHeight) * PERSPECTIVE_ORTHO.BASE_ZOOM;
}
export function syncOrthoZoomFromPerspective(
  perspectiveFov: number,
  cameraDistance: number,
  baseOrthoZoom = 20
): number {
  const halfFovRad = degToRad(perspectiveFov / 2);
  const visibleHeight = 2 * cameraDistance * Math.tan(halfFovRad);
  const defaultVisibleHeight =
    2 * DEFAULT_REFERENCE_DISTANCE * Math.tan(degToRad(PERSPECTIVE_ORTHO.DEFAULT_FOV / 2));

  return baseOrthoZoom * (defaultVisibleHeight / visibleHeight);
}
export function syncPerspectiveFovFromOrtho(
  orthoZoom: number,
  cameraDistance: number,
  baseFov = 55
): number {
  const baseZoom = PERSPECTIVE_ORTHO.BASE_ZOOM;
  const zoomRatio = orthoZoom / baseZoom;
  const baseHalfFov = degToRad(baseFov / 2);
  const baseVisibleHeight = 2 * DEFAULT_REFERENCE_DISTANCE * Math.tan(baseHalfFov);
  const currentVisibleHeight = baseVisibleHeight / zoomRatio;
  const halfHeight = currentVisibleHeight / 2;
  const newHalfFov = Math.atan(halfHeight / cameraDistance);

  return Math.max(
    PERSPECTIVE_ORTHO.FOV_MIN,
    Math.min(
      PERSPECTIVE_ORTHO.FOV_MAX,
      ((newHalfFov * PERSPECTIVE_ORTHO.DEG_TO_RAD_HALF) / Math.PI) * 2
    )
  );
}
export function zoomToFov(zoom: number, referenceDistance = DEFAULT_REFERENCE_DISTANCE): number {
  const normalizedZoom = zoom / PERSPECTIVE_ORTHO.BASE_ZOOM;
  const visibleHeight = DEFAULT_REFERENCE_HEIGHT / normalizedZoom;
  const halfHeight = visibleHeight / 2;
  const halfFovRad = Math.atan(halfHeight / referenceDistance);

  return ((halfFovRad * PERSPECTIVE_ORTHO.DEG_TO_RAD_HALF) / Math.PI) * 2;
}

export interface CameraSyncResult {
  orthoZoom: number;
  perspectiveFov: number;
  visibleHeight: number;
}

const DEFAULT_REFERENCE_DISTANCE = 9;
const DEFAULT_REFERENCE_HEIGHT = 10;
