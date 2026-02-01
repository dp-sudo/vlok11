import type React from 'react';
import type { Material, Mesh } from 'three';
import { CORNER_POSITION_OFFSET } from '../SceneGeometry.constants';

interface CornerSystemProps {
  caveCeilingRef: React.RefObject<Mesh>;
  caveFloorRef: React.RefObject<Mesh>;
  caveFrontRef: React.RefObject<Mesh>;
  caveLeftRef: React.RefObject<Mesh>;
  caveRightRef: React.RefObject<Mesh>;
  material: Material;
  planeRes: number;
  roomScale: number;
}

export const renderCornerSystem = ({
  roomScale,
  planeRes,
  material,
  caveFrontRef,
  caveLeftRef,
  caveRightRef,
  caveFloorRef,
  caveCeilingRef,
}: CornerSystemProps) => (
  <group name="CAVE_SYSTEM" position={[0, 0, roomScale * CORNER_POSITION_OFFSET]}>
    <mesh material={material} position={[0, 0, -roomScale / 2]} ref={caveFrontRef}>
      <planeGeometry args={[roomScale, roomScale, planeRes, planeRes]} />
    </mesh>
    <mesh
      material={material}
      position={[-roomScale / 2, 0, 0]}
      ref={caveLeftRef}
      rotation={[0, Math.PI / 2, 0]}
    >
      <planeGeometry args={[roomScale, roomScale, planeRes, planeRes]} />
    </mesh>
    <mesh
      material={material}
      position={[roomScale / 2, 0, 0]}
      ref={caveRightRef}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <planeGeometry args={[roomScale, roomScale, planeRes, planeRes]} />
    </mesh>
    <mesh
      material={material}
      position={[0, -roomScale / 2, 0]}
      ref={caveFloorRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[roomScale, roomScale, planeRes, planeRes]} />
    </mesh>
    <mesh
      material={material}
      position={[0, roomScale / 2, 0]}
      ref={caveCeilingRef}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[roomScale, roomScale, planeRes, planeRes]} />
    </mesh>
  </group>
);

export type { CornerSystemProps };
