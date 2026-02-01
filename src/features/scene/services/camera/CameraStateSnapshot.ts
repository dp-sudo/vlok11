import type { CameraMode, CameraStateSnapshot, ProjectionMode, Vec3 } from '@/shared/types';
import { useCameraStore } from '@/stores/index';

export function captureSnapshot(
  overrides?: Partial<Pick<CameraStateSnapshot, 'cameraMode' | 'projectionMode'>>
): CameraStateSnapshot {
  const state = useCameraStore.getState();
  const snapshot: CameraStateSnapshot = {
    position: { ...state.pose.position },
    target: { ...state.pose.target },
    up: { ...state.pose.up },
    fov: state.pose.fov,
    zoom: 20,
    cameraMode: overrides?.cameraMode ?? ('perspective' as CameraMode),
    projectionMode: overrides?.projectionMode ?? ('PLANE' as unknown as ProjectionMode),
    timestamp: Date.now(),
  };

  snapshotHistory.unshift(snapshot);
  if (snapshotHistory.length > MAX_SNAPSHOTS) {
    snapshotHistory.pop();
  }

  return snapshot;
}
export function clearSnapshots(): void {
  snapshotHistory.length = 0;
}
export function createSnapshot(
  position: Vec3,
  target: Vec3,
  fov: number,
  cameraMode: CameraMode,
  projectionMode: ProjectionMode,
  zoom = 20
): CameraStateSnapshot {
  return {
    position: { ...position },
    target: { ...target },
    up: { x: 0, y: 1, z: 0 },
    fov,
    zoom,
    cameraMode,
    projectionMode,
    timestamp: Date.now(),
  };
}
export function getLatestSnapshot(): CameraStateSnapshot | null {
  return snapshotHistory[0] ?? null;
}
export function getSnapshotByProjection(mode: ProjectionMode): CameraStateSnapshot | null {
  return snapshotHistory.find((s) => s.projectionMode === mode) ?? null;
}
export function interpolateSnapshots(
  from: CameraStateSnapshot,
  to: CameraStateSnapshot,
  t: number
): Pick<CameraStateSnapshot, 'position' | 'target' | 'fov' | 'zoom'> {
  return {
    position: {
      x: from.position.x + (to.position.x - from.position.x) * t,
      y: from.position.y + (to.position.y - from.position.y) * t,
      z: from.position.z + (to.position.z - from.position.z) * t,
    },
    target: {
      x: from.target.x + (to.target.x - from.target.x) * t,
      y: from.target.y + (to.target.y - from.target.y) * t,
      z: from.target.z + (to.target.z - from.target.z) * t,
    },
    fov: from.fov + (to.fov - from.fov) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t,
  };
}

const MAX_SNAPSHOTS = 10;
const snapshotHistory: CameraStateSnapshot[] = [];
