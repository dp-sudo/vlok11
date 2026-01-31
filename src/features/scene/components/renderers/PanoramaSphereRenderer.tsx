import React from 'react';

import type { Material, Mesh, Points } from 'three';

interface PanoramaSphereProps {
  density: number;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  radius: number;
}

export const renderPanoramaSphere = ({
  meshRef,
  radius,
  density,
  material,
}: PanoramaSphereProps) => (
  <mesh
    material={material}
    name="SceneMesh"
    ref={meshRef as React.RefObject<Mesh>}
    rotation={[0, -Math.PI / 2, 0]}
    scale={[-1, 1, 1]}
  >
    <sphereGeometry args={[radius, density, density]} />
  </mesh>
);

export type { PanoramaSphereProps };
