import React from 'react';

import type { Material, Mesh, Points } from 'three';

interface CylinderProps {
  density: number;
  height: number;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  radius: number;
  thetaLength: number;
}

export const renderCylinder = ({
  meshRef,
  radius,
  height,
  density,
  thetaLength,
  material,
}: CylinderProps) => (
  <mesh
    material={material}
    name="SceneMesh"
    ref={meshRef as React.RefObject<Mesh>}
    rotation={[0, Math.PI - thetaLength / 2, 0]}
    scale={[-1, 1, 1]}
  >
    <cylinderGeometry args={[radius, radius, height, density, density, true, 0, thetaLength]} />
  </mesh>
);

export type { CylinderProps };
