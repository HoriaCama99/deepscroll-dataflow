import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface DatacubeLayerProps {
  index: number;
  total: number;
  scrollProgress: number;
  hoveredLayer: number | null;
  onHover: (i: number | null) => void;
  color: string;
  label: string;
}

const DatacubeLayer = ({ index, total, scrollProgress, hoveredLayer, onHover, color }: DatacubeLayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const assembleProgress = Math.min(1, Math.max(0, scrollProgress * 3));
  const baseSpacing = 0.35;

  const isHovered = hoveredLayer === index;
  const hasHover = hoveredLayer !== null;

  useFrame(() => {
    if (!meshRef.current) return;
    const targetY = (index - total / 2) * baseSpacing;
    const hoverOffset = hasHover
      ? isHovered
        ? 0.3
        : (index - hoveredLayer!) * 0.15
      : 0;

    const scatterY = (1 - assembleProgress) * (index - total / 2) * 3;
    const scatterX = (1 - assembleProgress) * Math.sin(index * 1.5) * 2;

    meshRef.current.position.y += ((targetY + hoverOffset + scatterY) - meshRef.current.position.y) * 0.1;
    meshRef.current.position.x += (scatterX - meshRef.current.position.x) * 0.1;

    const targetOpacity = assembleProgress < 0.3 ? assembleProgress / 0.3 : 1;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * 0.1;
  });

  return (
    <mesh
      ref={meshRef}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
    >
      <boxGeometry args={[2, 0.12, 2]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0}
        emissive={color}
        emissiveIntensity={isHovered ? 0.2 : 0.05}
      />
    </mesh>
  );
};

interface DatacubeSceneProps {
  scrollProgress: number;
  hoveredLayer: number | null;
  onHoverLayer: (i: number | null) => void;
}

const LAYERS = [
  { color: "#6b9080", label: "NDVI" },
  { color: "#7ca5b8", label: "LST" },
  { color: "#c08b5c", label: "SAR" },
  { color: "#8b7eb8", label: "Elevation" },
  { color: "#b87e8b", label: "Cloud Mask" },
  { color: "#5c9e9e", label: "Reflectance" },
];

const Scene = ({ scrollProgress, hoveredLayer, onHoverLayer }: DatacubeSceneProps) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-3, 3, -3]} intensity={0.2} color="#6b9080" />

      <group rotation={[0.5, -0.7, 0]}>
        {LAYERS.map((layer, i) => (
          <DatacubeLayer
            key={i}
            index={i}
            total={LAYERS.length}
            scrollProgress={scrollProgress}
            hoveredLayer={hoveredLayer}
            onHover={onHoverLayer}
            color={layer.color}
            label={layer.label}
          />
        ))}
      </group>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
};

const DatacubeCanvas = (props: DatacubeSceneProps) => {
  return (
    <Canvas camera={{ position: [4, 3, 4], fov: 35 }} style={{ height: "100%" }}>
      <Scene {...props} />
    </Canvas>
  );
};

export default DatacubeCanvas;
export { LAYERS };
