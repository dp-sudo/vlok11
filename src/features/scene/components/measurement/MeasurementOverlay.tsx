import { Html } from '@react-three/drei';
import { memo, useEffect, useState } from 'react';
import type { Vector3 } from 'three';
import { getEventBus } from '@/core/EventBus';
import {
  getMeasurementService,
  type Measurement,
} from '../../services/measurement/MeasurementService';

interface MeasurementOverlayProps {
  visible?: boolean;
}

const MeasurementOverlayComponent: React.FC<MeasurementOverlayProps> = ({ visible = true }) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Vector3[]>([]);

  // 订阅测量变化
  useEffect(() => {
    const service = getMeasurementService();
    const eventBus = getEventBus();

    const handleCompleted = (payload: unknown) => {
      const { measurement } = payload as { measurement: Measurement };

      setMeasurements((prev) => [...prev, measurement]);

      setCurrentPoints([]);
    };

    const handleCleared = () => {
      setMeasurements([]);

      setCurrentPoints([]);
    };

    const handlePointAdded = () => {
      setCurrentPoints(service.getCurrentPoints());
    };

    const handleDeleted = (payload: unknown) => {
      const { id } = payload as { id: string };

      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    };

    // 使用事件监听
    eventBus.on('measurement:completed', handleCompleted);
    eventBus.on('measurement:cleared', handleCleared);
    eventBus.on('measurement:point-added', handlePointAdded);
    eventBus.on('measurement:deleted', handleDeleted);

    // 初始化当前测量
    setMeasurements(service.getMeasurements());
    setCurrentPoints(service.getCurrentPoints());

    return () => {
      eventBus.off('measurement:completed', handleCompleted);
      eventBus.off('measurement:cleared', handleCleared);
      eventBus.off('measurement:point-added', handlePointAdded);
      eventBus.off('measurement:deleted', handleDeleted);
    };
  }, []);

  if (!visible) return null;

  return (
    <group name="MeasurementOverlay">
      {/* 完成的测量 */}
      {measurements.map((measurement) => (
        <MeasurementItem key={measurement.id} measurement={measurement} />
      ))}

      {/* 当前正在进行的测量 */}
      {currentPoints.length > 0 && <CurrentMeasurementPoints points={currentPoints} />}
    </group>
  );
};

// 单个测量项组件
const MeasurementItem: React.FC<{ measurement: Measurement }> = memo(({ measurement }) => {
  if (measurement.type === 'distance') {
    const [p1, p2] = measurement.points;

    // 计算中点用于显示标签
    const midpoint = p1.clone().add(p2).multiplyScalar(0.5);

    return (
      <group>
        {/* 连接线 */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              args={[new Float32Array([...p1.toArray(), ...p2.toArray()]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00ff88" linewidth={2} />
        </line>

        {/* 端点标记 */}
        <mesh position={p1}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>
        <mesh position={p2}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00ff88" />
        </mesh>

        {/* 标签 */}
        <Html position={[midpoint.x, midpoint.y + 0.5, midpoint.z]} center>
          <div className="px-2 py-1 bg-black/80 text-green-400 text-xs rounded border border-green-500/50 whitespace-nowrap">
            {measurement.label}
          </div>
        </Html>
      </group>
    );
  }

  if (measurement.type === 'angle' && measurement.points.length === 3) {
    const [p1, p2, p3] = measurement.points;

    return (
      <group>
        {/* 连接线 */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={3}
              args={[new Float32Array([...p1.toArray(), ...p2.toArray(), ...p3.toArray()]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ff8800" linewidth={2} />
        </line>

        {/* 端点标记 */}
        {measurement.points.map((point) => (
          <mesh key={`${point.x}-${point.y}-${point.z}`} position={point}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ff8800" />
          </mesh>
        ))}

        {/* 角度标签 */}
        <Html position={measurement.points[1].toArray()} center>
          <div className="px-2 py-1 bg-black/80 text-orange-400 text-xs rounded border border-orange-500/50 whitespace-nowrap">
            {measurement.label}
          </div>
        </Html>
      </group>
    );
  }

  return null;
});

// 当前测量点组件
const CurrentMeasurementPoints: React.FC<{ points: Vector3[] }> = memo(({ points }) => {
  return (
    <group>
      {/* 连接线 */}
      {points.length === 2 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              args={[new Float32Array([...points[0].toArray(), ...points[1].toArray()]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00aaff" linewidth={2} transparent opacity={0.7} />
        </line>
      )}

      {/* 点标记 */}
      {points.map((point) => (
        <mesh key={`${point.x}-${point.y}-${point.z}`} position={point}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#00aaff" />
        </mesh>
      ))}
    </group>
  );
});

export const MeasurementOverlay = memo(MeasurementOverlayComponent);

export default MeasurementOverlay;
