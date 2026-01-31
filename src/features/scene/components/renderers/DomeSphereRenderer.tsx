import React from 'react';

import { DOME_PHI_LENGTH } from '../SceneGeometry.constants';

import type { Material, Mesh, Points } from 'three';

interface DomeSphereProps {
  density: number;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  radius: number;
}

export const renderDomeSphere = ({ meshRef, radius, density, material }: DomeSphereProps) => (
  <mesh
    material={material}
    name="SceneMesh"
    ref={meshRef as React.RefObject<Mesh>}
    rotation={[-Math.PI / 2, 0, 0]}
    scale={[-1, 1, 1]}
  >
    <sphereGeometry args={[radius, density, density, 0, Math.PI * 2, 0, DOME_PHI_LENGTH]} />
  </mesh>
);

export type { DomeSphereProps };
