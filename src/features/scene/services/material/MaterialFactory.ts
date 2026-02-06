import {
    AdditiveBlending,
    Color,
    DoubleSide,
    type Material,
    MeshStandardMaterial,
    type ShaderMaterial,
    type Texture,
    type WebGLProgramParametersWithUniforms,
} from 'three';

import { createLogger } from '@/core/Logger';
import { RenderStyle } from '@/shared/types';

import {
    AnimeMaterialClass,
    CelMaterialClass,
    CrystalMaterialClass,
    HologramV2MaterialClass,
    InkWashMaterialClass,
    MatrixMaterialClass,
    RetroPixelMaterialClass,
} from '../../materials';

import { STANDARD_MATERIAL } from './MaterialFactory.constants';

export interface MaterialOptions {
  colorMap: Texture | null;
  displacementMap: Texture | null;
  displacementScale?: number;
  edgeFade?: number;
  metalness?: number;
  roughness?: number;
  seamCorrection?: number;
}
interface ShaderProps {
  blending?: typeof AdditiveBlending;
  depthWrite?: boolean;
  side?: typeof DoubleSide;
  transparent?: boolean;
}

const EDGE_FADE = {
  SEAM_CORRECTION_DEFAULT: 0,
  EDGE_FADE_DEFAULT: 0.8,
  SMOOTHSTEP_EDGE: '0.15',
  SEAM_CORRECTION_THRESHOLD: '0.5',
  BLEND_WIDTH: '0.05',
  LEFT_SAMPLE: '0.02',
  RIGHT_SAMPLE: '0.98',
  AVERAGE_MULTIPLIER: '0.5',
};

export const getMaterialFactory = (): MaterialFactoryImpl => MaterialFactoryImpl.getInstance();
const logger = createLogger({ module: 'MaterialFactory' });
const MATERIAL_DEFAULTS = {
  ENV_MAP_INTENSITY: 0.6,
  EMISSIVE_COLOR: 0x000000,
  EMISSIVE_INTENSITY: 0.02,
};

function createShaderMaterial<T extends ShaderMaterial>(
  MaterialClass: new () => T,
  props: ShaderProps
): T {
  const mat = new MaterialClass();

  Object.assign(mat, props);

  return mat;
}
function injectEdgeFade(shader: WebGLProgramParametersWithUniforms): void {
  shader.uniforms['uSeamCorrection'] = { value: EDGE_FADE.SEAM_CORRECTION_DEFAULT };
  shader.uniforms['uEdgeFade'] = { value: EDGE_FADE.EDGE_FADE_DEFAULT };
  shader.vertexShader = `uniform float uSeamCorrection;\nuniform float uEdgeFade;\n${shader.vertexShader}`;

  const edgeFadeFunc = `
    float calculateEdgeFade(vec2 uv) {
        float fadeX = smoothstep(0.0, ${EDGE_FADE.SMOOTHSTEP_EDGE}, uv.x) * smoothstep(0.0, ${EDGE_FADE.SMOOTHSTEP_EDGE}, 1.0 - uv.x);
        float fadeY = smoothstep(0.0, ${EDGE_FADE.SMOOTHSTEP_EDGE}, uv.y) * smoothstep(0.0, ${EDGE_FADE.SMOOTHSTEP_EDGE}, 1.0 - uv.y);
        return mix(1.0, fadeX * fadeY, uEdgeFade);
    }
  `;

  shader.vertexShader = shader.vertexShader.replace(
    'void main() {',
    `${edgeFadeFunc}\nvoid main() {`
  );

  const seamLogic = `
    float disp = texture2D( displacementMap, vUv ).x;
    if (uSeamCorrection > ${EDGE_FADE.SEAM_CORRECTION_THRESHOLD}) {
       float dist = min(vUv.x, 1.0 - vUv.x);
       float blendWidth = ${EDGE_FADE.BLEND_WIDTH};
       if (dist < blendWidth) {
          float dLeft = texture2D(displacementMap, vec2(${EDGE_FADE.LEFT_SAMPLE}, vUv.y)).x;
          float dRight = texture2D(displacementMap, vec2(${EDGE_FADE.RIGHT_SAMPLE}, vUv.y)).x;
          float dAvg = (dLeft + dRight) * ${EDGE_FADE.AVERAGE_MULTIPLIER};
          float t = smoothstep(0.0, blendWidth, dist);
          disp = mix(dAvg, disp, t);
       }
    }
    disp *= calculateEdgeFade(vUv);
    transformed += normalize( objectNormal ) * ( disp * displacementScale + displacementBias );
  `;

  shader.vertexShader = shader.vertexShader.replace('#include <displacementmap_vertex>', seamLogic);

  if (!shader.vertexShader.includes('varying vec2 vUv;')) {
    shader.vertexShader = `varying vec2 vUv;\n${shader.vertexShader}`;
  }
}

class MaterialFactoryImpl {
  private static instance: MaterialFactoryImpl | null = null;

  private constructor() {}

  static getInstance(): MaterialFactoryImpl {
    MaterialFactoryImpl.instance ??= new MaterialFactoryImpl();

    return MaterialFactoryImpl.instance;
  }

  createAnimeMaterial(): ShaderMaterial {
    return createShaderMaterial(AnimeMaterialClass, { side: DoubleSide });
  }

  createCelMaterial(): ShaderMaterial {
    return createShaderMaterial(CelMaterialClass, { side: DoubleSide });
  }

  createCrystalMaterial(): ShaderMaterial {
    return createShaderMaterial(CrystalMaterialClass, {
      transparent: true,
      side: DoubleSide,
    });
  }

  createHologramV2Material(): ShaderMaterial {
    return createShaderMaterial(HologramV2MaterialClass, {
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
  }

  createInkWashMaterial(): ShaderMaterial {
    return createShaderMaterial(InkWashMaterialClass, { side: DoubleSide });
  }

  createMaterialForStyle(style: RenderStyle, options: MaterialOptions): Material | null {
    switch (style) {
      case RenderStyle.ANIME:
        return this.createAnimeMaterial();
      case RenderStyle.CEL_SHADING:
        return this.createCelMaterial();
      case RenderStyle.CRYSTAL:
        return this.createCrystalMaterial();
      case RenderStyle.HOLOGRAM_V2:
        return this.createHologramV2Material();
      case RenderStyle.INK_WASH:
        return this.createInkWashMaterial();
      case RenderStyle.MATRIX:
        return this.createMatrixMaterial();
      case RenderStyle.RETRO_PIXEL:
        return this.createRetroPixelMaterial();
      default:
        logger.warn(`Unknown render style: ${style}`);

        return this.createStandardMaterial(options);
    }
  }

  createMatrixMaterial(): ShaderMaterial {
    return createShaderMaterial(MatrixMaterialClass, { side: DoubleSide });
  }

  createRetroPixelMaterial(): ShaderMaterial {
    return createShaderMaterial(RetroPixelMaterialClass, { side: DoubleSide });
  }

  createStandardMaterial(options: MaterialOptions): MeshStandardMaterial | null {
    if (!options.colorMap || !options.displacementMap) {
      logger.warn('Cannot create standard material: missing textures');

      return null;
    }

    const mat = new MeshStandardMaterial({
      map: options.colorMap,
      displacementMap: options.displacementMap,
      displacementScale: options.displacementScale ?? STANDARD_MATERIAL.DISPLACEMENT_SCALE_DEFAULT,
      side: DoubleSide,
      envMapIntensity: MATERIAL_DEFAULTS.ENV_MAP_INTENSITY,
      toneMapped: true,
      emissive: new Color(MATERIAL_DEFAULTS.EMISSIVE_COLOR),
      emissiveIntensity: MATERIAL_DEFAULTS.EMISSIVE_INTENSITY,
      roughness: options.roughness ?? STANDARD_MATERIAL.ROUGHNESS_DEFAULT,
      metalness: options.metalness ?? STANDARD_MATERIAL.METALNESS_DEFAULT,
    });

    mat.onBeforeCompile = (shader) => {
      injectEdgeFade(shader);
      mat.userData['shader'] = shader;
    };

    return mat;
  }

  disposeMaterial(material: Material | null | undefined): void {
    if (material) {
      material.dispose();
    }
  }
}

export { MaterialFactoryImpl as MaterialFactory };
