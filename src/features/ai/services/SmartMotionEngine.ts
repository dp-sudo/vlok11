import type { CameraPose, Vec3 } from '@/shared/types';

import { lightSceneAnalyzer, type SimpleInsight, type MotionStyle, type SimpleSceneType, type SceneMood } from './LightSceneAnalyzer';

export interface MotionWaypoint {
  position: Vec3;
  target: Vec3;
  duration: number;
  fov?: number;
}

export interface MotionPath {
  style: MotionStyle;
  waypoints: MotionWaypoint[];
  loop: boolean;
  easing: string;
}

export interface SmartMotionParams {
  orbitRadius: number;
  orbitSpeed: number;
  elevationAngle: number;
  targetOffset: Vec3;
  fovRange: { min: number; max: number };
  smoothness: number;
}

const SCENE_MOTION_PARAMS: Record<SimpleSceneType, Partial<SmartMotionParams>> = {
  indoor: {
    orbitRadius: 0.3,
    orbitSpeed: 0.8,
    elevationAngle: 15,
    fovRange: { min: 45, max: 55 },
    smoothness: 0.9,
  },
  nature: {
    orbitRadius: 0.5,
    orbitSpeed: 0.6,
    elevationAngle: 25,
    fovRange: { min: 50, max: 70 },
    smoothness: 0.85,
  },
  urban: {
    orbitRadius: 0.4,
    orbitSpeed: 0.7,
    elevationAngle: 20,
    fovRange: { min: 55, max: 75 },
    smoothness: 0.8,
  },
  portrait: {
    orbitRadius: 0.2,
    orbitSpeed: 0.5,
    elevationAngle: 5,
    fovRange: { min: 35, max: 50 },
    smoothness: 0.95,
  },
  architecture: {
    orbitRadius: 0.45,
    orbitSpeed: 0.65,
    elevationAngle: 30,
    fovRange: { min: 50, max: 65 },
    smoothness: 0.75,
  },
};

const MOOD_SPEED_MULTIPLIER: Record<SceneMood, number> = {
  bright: 1.2,
  dark: 0.6,
  vivid: 1.4,
  calm: 0.7,
  warm: 0.9,
  cool: 1.0,
  neutral: 1.0,
};

export class SmartMotionEngine {
  private cachedInsight: SimpleInsight | null = null;
  private cachedParams: SmartMotionParams | null = null;

  analyzeAndPrepare(image: HTMLImageElement): SimpleInsight {
    this.cachedInsight = lightSceneAnalyzer.analyze(image);
    this.cachedParams = this.computeSmartParams(this.cachedInsight);

    return this.cachedInsight;
  }

  private computeSmartParams(insight: SimpleInsight): SmartMotionParams {
    const baseParams = SCENE_MOTION_PARAMS[insight.type];
    const speedMultiplier = MOOD_SPEED_MULTIPLIER[insight.mood];

    return {
      orbitRadius: baseParams.orbitRadius ?? 0.4,
      orbitSpeed: (baseParams.orbitSpeed ?? 0.7) * speedMultiplier,
      elevationAngle: baseParams.elevationAngle ?? 20,
      targetOffset: { x: 0, y: 0, z: 0 },
      fovRange: baseParams.fovRange ?? { min: 45, max: 60 },
      smoothness: baseParams.smoothness ?? 0.85,
    };
  }

  generatePath(
    insight: { mood: string; suggestedMotion: MotionStyle; type?: SimpleSceneType },
    currentPose: CameraPose,
    duration = 10
  ): MotionPath {
    const style = insight.suggestedMotion;
    const sceneType = insight.type ?? 'indoor';
    const sceneMood = insight.mood as SceneMood;

    const params = this.cachedParams ?? this.computeSmartParams({
      type: sceneType,
      mood: sceneMood,
      suggestedMotion: style,
      confidence: 0.5,
    });

    const distance = this.calcDistance(currentPose.position, currentPose.target);
    const adjustedDistance = Math.max(3, Math.min(8, distance * params.orbitRadius * 2 + 4));
    const adjustedDuration = duration / params.orbitSpeed;

    const waypoints = this.generateSmartWaypoints(
      style,
      currentPose,
      adjustedDistance,
      adjustedDuration,
      params
    );

    return {
      style,
      waypoints,
      loop: true,
      easing: this.getEasingForStyle(style, params.smoothness),
    };
  }

  private calcDistance(pos: Vec3, target: Vec3): number {
    const dx = pos.x - target.x;
    const dy = pos.y - target.y;
    const dz = pos.z - target.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private generateSmartWaypoints(
    style: MotionStyle,
    basePose: CameraPose,
    distance: number,
    duration: number,
    params: SmartMotionParams
  ): MotionWaypoint[] {
    const elevationRad = (params.elevationAngle * Math.PI) / 180;

    switch (style) {
      case 'cinematic':
        return this.generateCinematicPath(basePose, distance, duration, elevationRad, params);
      case 'dynamic':
        return this.generateDynamicPath(basePose, distance, duration, params);
      case 'focus':
        return this.generateFocusPath(basePose, distance, duration, params);
      case 'exploration':
        return this.generateExplorationPath(basePose, distance, duration, elevationRad, params);
      default:
        return this.generateCinematicPath(basePose, distance, duration, elevationRad, params);
    }
  }

  private generateCinematicPath(
    basePose: CameraPose,
    distance: number,
    duration: number,
    elevationRad: number,
    params: SmartMotionParams
  ): MotionWaypoint[] {
    const steps = 6;
    const waypoints: MotionWaypoint[] = [];
    const stepDuration = duration / steps;
    const { fovRange } = params;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 0.6;
      const elevation = Math.sin(t * Math.PI) * elevationRad;

      const x = Math.sin(angle) * distance * 0.4;
      const z = Math.cos(angle) * distance * 0.8;
      const y = Math.sin(elevation) * distance * 0.15;

      const fov = fovRange.min + (fovRange.max - fovRange.min) * Math.sin(t * Math.PI);

      waypoints.push({
        position: {
          x: basePose.target.x + x,
          y: basePose.target.y + y + 1,
          z: basePose.target.z + z,
        },
        target: basePose.target,
        duration: stepDuration,
        fov,
      });
    }

    return waypoints;
  }

  private generateDynamicPath(
    basePose: CameraPose,
    distance: number,
    duration: number,
    params: SmartMotionParams
  ): MotionWaypoint[] {
    const amplitude = distance * 0.6;
    const { fovRange } = params;

    return [
      {
        position: {
          x: basePose.target.x - amplitude * 0.8,
          y: basePose.target.y + 0.5,
          z: basePose.target.z + distance * 0.5,
        },
        target: basePose.target,
        duration: duration * 0.25,
        fov: fovRange.max,
      },
      {
        position: {
          x: basePose.target.x,
          y: basePose.target.y + 1,
          z: basePose.target.z + distance * 0.3,
        },
        target: basePose.target,
        duration: duration * 0.2,
        fov: fovRange.min,
      },
      {
        position: {
          x: basePose.target.x + amplitude * 0.8,
          y: basePose.target.y + 0.5,
          z: basePose.target.z + distance * 0.5,
        },
        target: basePose.target,
        duration: duration * 0.25,
        fov: fovRange.max,
      },
      {
        position: {
          x: basePose.target.x,
          y: basePose.target.y + 0.8,
          z: basePose.target.z + distance * 0.6,
        },
        target: basePose.target,
        duration: duration * 0.3,
        fov: (fovRange.min + fovRange.max) / 2,
      },
    ];
  }

  private generateFocusPath(
    basePose: CameraPose,
    distance: number,
    duration: number,
    params: SmartMotionParams
  ): MotionWaypoint[] {
    const { fovRange } = params;
    const closeDistance = distance * 0.5;

    return [
      {
        position: {
          x: basePose.target.x,
          y: basePose.target.y + 0.8,
          z: basePose.target.z + distance * 0.7,
        },
        target: basePose.target,
        duration: duration * 0.4,
        fov: fovRange.max,
      },
      {
        position: {
          x: basePose.target.x + 0.3,
          y: basePose.target.y + 0.5,
          z: basePose.target.z + closeDistance,
        },
        target: basePose.target,
        duration: duration * 0.3,
        fov: fovRange.min,
      },
      {
        position: {
          x: basePose.target.x - 0.3,
          y: basePose.target.y + 0.5,
          z: basePose.target.z + closeDistance,
        },
        target: basePose.target,
        duration: duration * 0.3,
        fov: fovRange.min,
      },
    ];
  }

  private generateExplorationPath(
    basePose: CameraPose,
    distance: number,
    duration: number,
    elevationRad: number,
    params: SmartMotionParams
  ): MotionWaypoint[] {
    const steps = 8;
    const waypoints: MotionWaypoint[] = [];
    const stepDuration = duration / steps;
    const { fovRange } = params;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2;
      const heightWave = Math.sin(t * Math.PI * 2) * 0.3;

      waypoints.push({
        position: {
          x: basePose.target.x + Math.sin(angle) * distance * 0.5,
          y: basePose.target.y + Math.sin(elevationRad) * 1.5 + heightWave,
          z: basePose.target.z + Math.cos(angle) * distance * 0.5,
        },
        target: basePose.target,
        duration: stepDuration,
        fov: fovRange.min + (fovRange.max - fovRange.min) * (0.5 + heightWave),
      });
    }

    return waypoints;
  }

  private getEasingForStyle(style: MotionStyle, smoothness: number): string {
    const easingMap: Record<MotionStyle, string[]> = {
      cinematic: ['easeInOutSine', 'easeInOutQuad', 'easeInOutCubic'],
      dynamic: ['easeOutQuad', 'easeOutCubic', 'easeOutQuart'],
      focus: ['easeInOutQuad', 'easeInOutCubic', 'easeInOutSine'],
      exploration: ['linear', 'easeInOutSine', 'easeInOutQuad'],
    };

    const options = easingMap[style] || easingMap.cinematic;
    const index = Math.round((1 - smoothness) * (options.length - 1));

    return options[Math.min(index, options.length - 1)];
  }

  getRecommendedCameraDistance(insight: SimpleInsight): number {
    const baseDistances: Record<SimpleSceneType, number> = {
      indoor: 5,
      nature: 8,
      urban: 7,
      portrait: 4,
      architecture: 6,
    };

    return baseDistances[insight.type] ?? 6;
  }
}

export const smartMotionEngine = new SmartMotionEngine();
