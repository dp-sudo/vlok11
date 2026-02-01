import type React from 'react';
import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import type {
  BoxGeometry,
  BufferAttribute,
  InterleavedBufferAttribute,
  Material,
  Mesh,
  Points,
} from 'three';
import { ProjectionMode } from '@/shared/types';

import {
  renderCornerSystem,
  renderCylinder,
  renderDomeSphere,
  renderGaussianSplat,
  renderPanoramaSphere,
  renderSphere,
} from './renderers';
import {
  BOUNDING_EXPANSION_MULTIPLIER,
  BOX_DENSITY,
  BOX_FACE,
  CYLINDER_RADIUS_FACTOR,
  DEG_TO_RAD,
  INFINITE_BOX_SCALE,
  MAX_CORNER_PLANE_RES,
  MAX_SPLAT_DENSITY,
  SPHERE_RADIUS,
  UV_BOUNDS,
} from './SceneGeometry.constants';

type UVAttribute = BufferAttribute | InterleavedBufferAttribute;

interface SceneGeometryProps {
  density: number;
  displacementScale: number;
  height: number;
  material: Material;
  projectionAngle: number;
  projectionMode: ProjectionMode;
  width: number;
}

const mirrorFaceUVs = (
  uvAttr: UVAttribute,
  faceIndex: number,
  mirrorU: boolean,
  mirrorV: boolean
) => {
  const start = faceIndex * BOX_FACE.VERTICES_PER_FACE;

  for (let i = 0; i < BOX_FACE.VERTICES_PER_FACE; i++) {
    const idx = start + i;
    let u = uvAttr.getX(idx);
    let v = uvAttr.getY(idx);

    if (mirrorU) u = UV_BOUNDS.ONE - u;
    if (mirrorV) v = UV_BOUNDS.ONE - v;
    uvAttr.setXY(idx, u, v);
  }
};

const renderGeometryForMode = ({
  meshRef,
  infiniteBoxRef,
  cubeRef,
  caveFrontRef,
  caveLeftRef,
  caveRightRef,
  caveFloorRef,
  caveCeilingRef,
  projectionMode,
  projectionAngle,
  width,
  height,
  density,
  material,
}: {
  caveCeilingRef: React.RefObject<Mesh>;
  caveFloorRef: React.RefObject<Mesh>;
  caveFrontRef: React.RefObject<Mesh>;
  caveLeftRef: React.RefObject<Mesh>;
  caveRightRef: React.RefObject<Mesh>;
  cubeRef: React.RefObject<Mesh>;
  density: number;
  height: number;
  infiniteBoxRef: React.RefObject<Mesh>;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  projectionAngle: number;
  projectionMode: ProjectionMode;
  width: number;
}) => {
  const thetaLength = projectionAngle * DEG_TO_RAD;

  switch (projectionMode) {
    case ProjectionMode.GAUSSIAN_SPLAT: {
      const splatDensity = Math.min(density, MAX_SPLAT_DENSITY);

      return renderGaussianSplat({ meshRef, width, height, density: splatDensity, material });
    }
    case ProjectionMode.SPHERE: {
      return renderSphere({
        meshRef,
        radius: width * SPHERE_RADIUS.STANDARD,
        density,
        thetaLength,
        material,
      });
    }
    case ProjectionMode.PANORAMA: {
      return renderPanoramaSphere({
        meshRef,
        radius: width * SPHERE_RADIUS.PANORAMA,
        density,
        material,
      });
    }
    case ProjectionMode.DOME: {
      return renderDomeSphere({ meshRef, radius: width * SPHERE_RADIUS.DOME, density, material });
    }
    case ProjectionMode.CYLINDER: {
      const radius = (width / (2 * Math.sin(thetaLength / 2))) * CYLINDER_RADIUS_FACTOR;

      return renderCylinder({ meshRef, radius, height, density, thetaLength, material });
    }
    case ProjectionMode.CUBE: {
      const boxSize = Math.max(width, height);
      const boxDensity = density / BOX_DENSITY.CUBE_DIVISOR;

      return (
        <mesh material={material} name="SceneMesh" ref={cubeRef} scale={[-1, 1, 1]}>
          <boxGeometry args={[boxSize, boxSize, boxSize, boxDensity, boxDensity, boxDensity]} />
        </mesh>
      );
    }
    case ProjectionMode.INFINITE_BOX: {
      const boxSize = Math.max(width, height) * INFINITE_BOX_SCALE;
      const boxDensity = density / BOX_DENSITY.INFINITE_BOX_DIVISOR;

      return (
        <mesh material={material} name="InfiniteBoxMesh" ref={infiniteBoxRef} scale={[-1, 1, 1]}>
          <boxGeometry args={[boxSize, boxSize, boxSize, boxDensity, boxDensity, boxDensity]} />
        </mesh>
      );
    }
    case ProjectionMode.CORNER: {
      const roomScale = Math.max(width, height);
      const planeRes = Math.min(density, MAX_CORNER_PLANE_RES);

      return renderCornerSystem({
        roomScale,
        planeRes,
        material,
        caveFrontRef,
        caveLeftRef,
        caveRightRef,
        caveFloorRef,
        caveCeilingRef,
      });
    }
    default:
      return (
        <mesh
          frustumCulled
          key="PLANE"
          material={material}
          name="SceneMesh"
          ref={meshRef as React.RefObject<Mesh>}
        >
          <planeGeometry args={[width, height, density, density]} />
        </mesh>
      );
  }
};

const SceneGeometryComponent: React.FC<SceneGeometryProps> = ({
  width,
  height,
  density,
  displacementScale,
  material,
  projectionMode,
  projectionAngle,
}) => {
  const meshRef = useRef<Mesh | Points>(null);
  const caveFrontRef = useRef<Mesh>(null);
  const caveLeftRef = useRef<Mesh>(null);
  const caveRightRef = useRef<Mesh>(null);
  const caveFloorRef = useRef<Mesh>(null);
  const caveCeilingRef = useRef<Mesh>(null);
  const infiniteBoxRef = useRef<Mesh>(null);
  const cubeRef = useRef<Mesh>(null);

  useEffect(() => {
    if (meshRef.current?.geometry) {
      const geo = meshRef.current.geometry;

      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      const expansion = Math.abs(displacementScale) * BOUNDING_EXPANSION_MULTIPLIER;

      if (geo.boundingBox) geo.boundingBox.expandByScalar(expansion);
      if (geo.boundingSphere) geo.boundingSphere.radius += expansion;
    }
  }, [width, height, density, displacementScale, projectionMode, projectionAngle]);
  useLayoutEffect(() => {
    if (projectionMode === ProjectionMode.CORNER) {
      updateUVs(
        caveFrontRef.current,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER
      );
      updateUVs(
        caveLeftRef.current,
        UV_BOUNDS.ZERO,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER
      );
      updateUVs(
        caveRightRef.current,
        UV_BOUNDS.THREE_QUARTER,
        UV_BOUNDS.ONE,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER
      );
      updateUVs(
        caveCeilingRef.current,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER,
        UV_BOUNDS.THREE_QUARTER,
        UV_BOUNDS.ONE
      );
      updateUVs(
        caveFloorRef.current,
        UV_BOUNDS.QUARTER,
        UV_BOUNDS.THREE_QUARTER,
        UV_BOUNDS.ZERO,
        UV_BOUNDS.QUARTER
      );
    }
    if (projectionMode === ProjectionMode.INFINITE_BOX && infiniteBoxRef.current) {
      const geo = infiniteBoxRef.current.geometry as BoxGeometry;
      const uvAttr = geo.attributes.uv;

      if (!uvAttr) return;
      mirrorFaceUVs(uvAttr, BOX_FACE.FRONT, true, false);
      mirrorFaceUVs(uvAttr, BOX_FACE.BACK, false, false);
      mirrorFaceUVs(uvAttr, BOX_FACE.TOP, false, true);
      mirrorFaceUVs(uvAttr, BOX_FACE.BOTTOM, false, false);
      mirrorFaceUVs(uvAttr, BOX_FACE.RIGHT, true, true);
      mirrorFaceUVs(uvAttr, BOX_FACE.LEFT, false, true);
      uvAttr.needsUpdate = true;
    }
  }, [projectionMode, width, height, density]);

  return renderGeometryForMode({
    meshRef: meshRef as React.RefObject<Mesh | Points>,
    infiniteBoxRef: infiniteBoxRef as React.RefObject<Mesh>,
    cubeRef: cubeRef as React.RefObject<Mesh>,
    caveFrontRef: caveFrontRef as React.RefObject<Mesh>,
    caveLeftRef: caveLeftRef as React.RefObject<Mesh>,
    caveRightRef: caveRightRef as React.RefObject<Mesh>,
    caveFloorRef: caveFloorRef as React.RefObject<Mesh>,
    caveCeilingRef: caveCeilingRef as React.RefObject<Mesh>,
    projectionMode,
    projectionAngle,
    width,
    height,
    density,
    material,
  });
};

const updateUVs = (mesh: Mesh | null, uMin: number, uMax: number, vMin: number, vMax: number) => {
  if (!mesh?.geometry) return;
  const uvAttribute = mesh.geometry.attributes.uv;

  if (!uvAttribute) return;
  for (let i = 0; i < uvAttribute.count; i++) {
    const u = uvAttribute.getX(i);
    const v = uvAttribute.getY(i);
    const newU = uMin + u * (uMax - uMin);
    const newV = vMin + v * (vMax - vMin);

    uvAttribute.setXY(i, newU, newV);
  }
  uvAttribute.needsUpdate = true;
};

const SceneGeometry = memo(SceneGeometryComponent);

export default SceneGeometry;
export type { SceneGeometryProps };

SceneGeometry.displayName = 'SceneGeometry';
