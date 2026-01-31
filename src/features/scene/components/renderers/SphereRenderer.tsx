import React from 'react';

import type { Material, Mesh, Points } from 'three';

interface SphereProps {
  density: number;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  radius: number;
  thetaLength: number;
}

export const renderSphere = ({ meshRef, radius, density, thetaLength, material }: SphereProps) => (
  <mesh
    material={material}
    name="SceneMesh"
    ref={meshRef as React.RefObject<Mesh>}
    rotation={[0, -Math.PI / 2, 0]}
    scale={[-1, 1, 1]}
  >
    <sphereGeometry args={[radius, density, density, 0, thetaLength, 0, Math.PI]} />
  </mesh>
);

export type { SphereProps };
