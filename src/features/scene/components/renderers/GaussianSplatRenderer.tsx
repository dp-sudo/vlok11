import React from 'react';

import type { Material, Mesh, Points } from 'three';

interface GaussianSplatProps {
  density: number;
  height: number;
  material: Material;
  meshRef: React.RefObject<Mesh | Points>;
  width: number;
}

export const renderGaussianSplat = ({
  meshRef,
  width,
  height,
  density,
  material,
}: GaussianSplatProps) => (
  <points
    key="SPLAT"
    material={material}
    name="ScenePoints"
    ref={meshRef as React.RefObject<Points>}
  >
    <planeGeometry args={[width, height, density, density]} />
  </points>
);

export type { GaussianSplatProps };
