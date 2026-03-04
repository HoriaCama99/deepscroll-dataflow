import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Simplified world border coordinates (lon, lat pairs for continental outlines)
const WORLD_POINTS: [number, number][] = [];

// Generate points along continental borders using simplified polygon data
function generateContinentPoints() {
  const points: [number, number][] = [];
  
  // Africa outline
  const africa: [number, number][] = [
    [-17, 14], [-12, 15], [-5, 17], [0, 18], [10, 20], [12, 32], [10, 37],
    [0, 36], [-5, 34], [-1, 5], [10, 2], [12, -5], [15, -10], [20, -15],
    [35, -22], [40, -15], [50, -12], [51, 12], [43, 12], [42, 15],
    [37, 18], [32, 31], [25, 31], [20, 30], [10, 37],
  ];
  
  // Europe outline
  const europe: [number, number][] = [
    [-10, 36], [-9, 43], [-2, 43], [0, 46], [3, 47], [5, 48], [8, 54],
    [10, 54], [12, 55], [15, 55], [20, 58], [25, 60], [30, 60], [28, 65],
    [25, 70], [20, 70], [15, 69], [10, 63], [5, 62], [0, 58], [-5, 55],
    [-8, 52], [-10, 44],
  ];
  
  // Asia outline (simplified)
  const asia: [number, number][] = [
    [30, 60], [40, 55], [50, 55], [55, 50], [60, 45], [70, 40], [75, 35],
    [80, 30], [85, 25], [90, 22], [95, 20], [100, 15], [105, 10],
    [110, 5], [115, 5], [120, 10], [125, 15], [130, 20], [135, 35],
    [140, 40], [145, 45], [150, 50], [155, 55], [160, 60], [170, 65],
    [180, 68], [170, 70], [150, 70], [140, 65], [130, 55], [120, 50],
    [110, 45], [100, 40], [90, 40], [80, 45], [70, 50], [60, 55],
    [50, 55],
  ];
  
  // North America
  const northAmerica: [number, number][] = [
    [-170, 65], [-160, 60], [-150, 60], [-140, 58], [-130, 55],
    [-125, 50], [-120, 45], [-118, 35], [-115, 30], [-105, 25],
    [-100, 20], [-95, 18], [-90, 20], [-85, 25], [-82, 30],
    [-80, 35], [-75, 40], [-70, 43], [-65, 47], [-60, 50],
    [-55, 52], [-60, 55], [-65, 60], [-70, 65], [-80, 70],
    [-100, 72], [-120, 72], [-140, 70], [-160, 70],
  ];
  
  // South America
  const southAmerica: [number, number][] = [
    [-80, 10], [-75, 5], [-70, 0], [-75, -5], [-80, -5], [-78, -10],
    [-70, -15], [-65, -20], [-60, -25], [-55, -25], [-50, -20],
    [-45, -15], [-40, -10], [-35, -5], [-40, 0], [-50, 5],
    [-60, 10], [-70, 12], [-75, 10],
  ];
  
  // Australia
  const australia: [number, number][] = [
    [115, -20], [120, -15], [130, -12], [140, -12], [145, -15],
    [150, -20], [153, -28], [150, -35], [145, -38], [135, -35],
    [130, -32], [120, -30], [115, -25],
  ];

  const continents = [africa, europe, asia, northAmerica, southAmerica, australia];
  
  for (const continent of continents) {
    for (let i = 0; i < continent.length - 1; i++) {
      const [lon1, lat1] = continent[i];
      const [lon2, lat2] = continent[i + 1];
      const steps = Math.max(3, Math.floor(Math.sqrt((lon2-lon1)**2 + (lat2-lat1)**2) / 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const lon = lon1 + (lon2 - lon1) * t + (Math.random() - 0.5) * 1.5;
        const lat = lat1 + (lat2 - lat1) * t + (Math.random() - 0.5) * 1.5;
        points.push([lon, lat]);
      }
    }
  }
  
  // Add some scatter points within continents for density
  for (let i = 0; i < 400; i++) {
    const continent = continents[Math.floor(Math.random() * continents.length)];
    const idx = Math.floor(Math.random() * (continent.length - 1));
    const [lon1, lat1] = continent[idx];
    const [lon2, lat2] = continent[(idx + 1) % continent.length];
    const t = Math.random();
    points.push([
      lon1 + (lon2 - lon1) * t + (Math.random() - 0.5) * 8,
      lat1 + (lat2 - lat1) * t + (Math.random() - 0.5) * 8,
    ]);
  }
  
  return points;
}

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const GlobePoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseRef = useRef(new THREE.Vector2(-10, -10));
  const raycaster = useRef(new THREE.Raycaster());
  const { camera, gl } = useThree();
  
  const { positions, originalPositions, count } = useMemo(() => {
    const pts = generateContinentPoints();
    const pos = new Float32Array(pts.length * 3);
    const origPos = new Float32Array(pts.length * 3);
    
    pts.forEach(([lon, lat], i) => {
      const v = latLonToVec3(lat, lon, 2);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
      origPos[i * 3] = v.x;
      origPos[i * 3 + 1] = v.y;
      origPos[i * 3 + 2] = v.z;
    });
    
    return { positions: pos, originalPositions: origPos, count: pts.length };
  }, []);
  
  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = 2.0 + Math.random() * 1.5;
    }
    return s;
  }, [count]);
  
  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    // Matte pastel colors: sage, dusty blue, terracotta mix
    const palette = [
      [0.45, 0.58, 0.48],  // sage
      [0.5, 0.6, 0.7],     // dusty blue
      [0.7, 0.5, 0.42],    // terracotta
      [0.55, 0.55, 0.5],   // warm gray
    ];
    for (let i = 0; i < count; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      c[i * 3] = col[0];
      c[i * 3 + 1] = col[1];
      c[i * 3 + 2] = col[2];
    }
    return c;
  }, [count]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    gl.domElement.addEventListener("mousemove", onMove);
    return () => gl.domElement.removeEventListener("mousemove", onMove);
  }, [gl]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    // Slow rotation
    pointsRef.current.rotation.y += 0.001;
    
    // Mouse repulsion
    raycaster.current.setFromCamera(mouseRef.current, camera);
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.color.array as Float32Array;
    const sz = geo.attributes.size.array as Float32Array;
    
    // Create a sphere for intersection
    const sphereCenter = new THREE.Vector3();
    pointsRef.current.getWorldPosition(sphereCenter);
    
    const mouseWorld = new THREE.Vector3();
    raycaster.current.ray.at(camera.position.length(), mouseWorld);
    
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      
      // Get world position of this point
      const px = originalPositions[ix];
      const py = originalPositions[ix + 1];
      const pz = originalPositions[ix + 2];
      
      // Apply current rotation to original position
      const rotY = pointsRef.current.rotation.y;
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      const rpx = px * cosR + pz * sinR;
      const rpz = -px * sinR + pz * cosR;
      
      const dx = rpx - mouseWorld.x;
      const dy = py - mouseWorld.y;
      const dz = rpz - mouseWorld.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      const repelRadius = 1.2;
      
      if (dist < repelRadius) {
        const strength = (1 - dist / repelRadius) * 0.4;
        const normal = new THREE.Vector3(px, py, pz).normalize();
        // Push outward along normal
        pos[ix] += (px + normal.x * strength - pos[ix]) * 0.1;
        pos[ix + 1] += (py + normal.y * strength - pos[ix + 1]) * 0.1;
        pos[ix + 2] += (pz + normal.z * strength - pos[ix + 2]) * 0.1;
        
        // Brighten
        const bright = 0.3 + (1 - dist / repelRadius) * 0.7;
        col[ix] = Math.min(1, col[ix] + bright * 0.05);
        col[ix + 1] = Math.min(1, col[ix + 1] + bright * 0.05);
        col[ix + 2] = Math.min(1, col[ix + 2] + bright * 0.05);
        
        sz[i] = 2.0 + (1 - dist / repelRadius) * 3.0;
      } else {
        // Return to original
        pos[ix] += (px - pos[ix]) * 0.05;
        pos[ix + 1] += (py - pos[ix + 1]) * 0.05;
        pos[ix + 2] += (pz - pos[ix + 2]) * 0.05;
        
        // Reset colors gradually
        const palette = [[0.45, 0.58, 0.48], [0.5, 0.6, 0.7], [0.7, 0.5, 0.42], [0.55, 0.55, 0.5]];
        const origCol = palette[i % palette.length];
        col[ix] += (origCol[0] - col[ix]) * 0.02;
        col[ix + 1] += (origCol[1] - col[ix + 1]) * 0.02;
        col[ix + 2] += (origCol[2] - col[ix + 2]) * 0.02;
        
        sz[i] += (2.0 + Math.random() * 1.5 - sz[i]) * 0.02;
      }
    }
    
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={3}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
};

const ParticleGlobe = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      style={{ height: "100%", width: "100%" }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <GlobePoints />
    </Canvas>
  );
};

export default ParticleGlobe;
