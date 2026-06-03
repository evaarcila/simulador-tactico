import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail, Float, Torus, Line, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { TrajectoryPoint } from '../lib/physics';

export const RealisticTerrain: React.FC<{ onGroundClick?: (pos: [number, number, number]) => void }> = ({ onGroundClick }) => {
  const terrainGeometry = useMemo(() => {
    const size = 1500;
    const segments = 150; 
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      let h = Math.sin(x * 0.008) * Math.cos(y * 0.008) * 40;
      h += Math.sin(x * 0.04) * Math.sin(y * 0.04) * 15;
      h += Math.sin(x * 0.1) * Math.sin(y * 0.1) * 3;
      
      const distToCenter = Math.sqrt(x*x + y*y);
      if (distToCenter < 120) {
        h *= (distToCenter / 120); 
      }
      
      h += (Math.random() - 0.5) * 2;
      pos.setZ(i, h);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (onGroundClick) onGroundClick([e.point.x, e.point.y, e.point.z]);
        }}
      >
        <meshStandardMaterial 
          color="#3a4f35" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Lake / Water area */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -11, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (onGroundClick) onGroundClick([e.point.x, e.point.y, e.point.z]);
        }}
      >
        <planeGeometry args={[1500, 1500]} />
        <meshStandardMaterial color="#1a4b6e" roughness={0.1} metalness={0.8} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export const HtmlLabels: React.FC<{ p1: [number, number, number], p2: [number, number, number], target: [number, number, number], time: number, tMax: number }> = ({ p1, p2, target, time, tMax }) => {
  const showImpact = time >= tMax;

  return (
    <group>
      {/* Posición Inicial Misil 1 */}
      <Html position={p1} center distanceFactor={100}>
        <div className="bg-[#020610]/80 border border-[#1a3a4a] border-l-2 border-l-[#ff2200] p-2 text-[9px] text-white whitespace-nowrap font-sans font-bold shadow-lg backdrop-blur-sm">
          <div className="text-[#ff2200] mb-1 uppercase tracking-widest">POSICIÓN INICIAL MISIL 1</div>
          <div className="text-slate-300 font-mono">LAT: 34.0522° N</div>
          <div className="text-slate-300 font-mono">LON: -118.2437° E</div>
          <div className="text-slate-300 font-mono">ALT: {p1[1].toFixed(1)} km</div>
        </div>
      </Html>

      {/* Posición Inicial Misil 2 */}
      <Html position={p2} center distanceFactor={100}>
        <div className="bg-[#020610]/80 border border-[#1a3a4a] border-l-2 border-l-[#0077ff] p-2 text-[9px] text-white whitespace-nowrap font-sans font-bold shadow-lg backdrop-blur-sm">
          <div className="text-[#0077ff] mb-1 uppercase tracking-widest">POSICIÓN INICIAL MISIL 2</div>
          <div className="text-slate-300 font-mono">LAT: 36.1699° N</div>
          <div className="text-slate-300 font-mono">LON: -115.1398° E</div>
          <div className="text-slate-300 font-mono">ALT: {p2[1].toFixed(1)} km</div>
        </div>
      </Html>

      {/* Objetivo Protegido */}
      <Html position={[target[0], -10, target[2]]} center distanceFactor={100}>
        <div className="bg-[#020610]/80 border border-[#1a3a4a] border-t-2 border-t-emerald-500 p-2 text-[9px] text-white whitespace-nowrap font-sans font-bold shadow-lg mt-12 backdrop-blur-sm">
          <div className="text-emerald-400 mb-1 uppercase tracking-widest text-center">OBJETIVO PROTEGIDO</div>
          <div className="text-slate-300 font-mono text-center">LAT: 35.0000° N</div>
          <div className="text-slate-300 font-mono text-center">LON: -117.0000° E</div>
        </div>
      </Html>
      {/* Target Guide Line */}
      <Line points={[new THREE.Vector3(target[0], -10, target[2]), new THREE.Vector3(target[0], target[1], target[2])]} color="yellow" dashed dashSize={2} gapSize={1} opacity={0.5} transparent />

      {/* Intercepción Exitosa */}
      {showImpact && (
        <Html position={target} center distanceFactor={100}>
          <div className="bg-[#020610]/80 border border-[#1a3a4a] border-t-2 border-t-emerald-500 p-2 text-[9px] text-white whitespace-nowrap font-sans font-bold shadow-lg mb-16 backdrop-blur-sm">
            <div className="text-emerald-400 mb-1 uppercase tracking-widest">INTERCEPCIÓN EXITOSA</div>
            <div className="text-slate-300 font-mono">ALTITUD: {target[1].toFixed(2)} km</div>
            <div className="text-slate-300 font-mono">TIEMPO: 00:00:{tMax.toFixed(3).padStart(6, '0')}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

export const Missile: React.FC<{ points: TrajectoryPoint[], currentTime: number, tMax: number, color: string, isDashed?: boolean }> = ({ points, currentTime, tMax, color, isDashed }) => {
  const meshRef = useRef<THREE.Group>(null);
  const fireRef = useRef<THREE.Mesh>(null);
  
  if (points.length === 0) return null;
  const targetPos = points[points.length - 1].position;
  const hasImpacted = currentTime >= tMax;
  const rawPoints = points.map(p => new THREE.Vector3(...p.position));

  useFrame((state) => {
    if (hasImpacted) return;

    // Determine position based on currentTime
    const progress = Math.max(0, Math.min(currentTime / tMax, 1));
    const idx = Math.floor(progress * (points.length - 1));
    const nextIdx = Math.min(idx + 1, points.length - 1);
    const alpha = (progress * (points.length - 1)) % 1;
    
    const p1 = points[idx].position;
    const p2 = points[nextIdx].position;
    
    if (meshRef.current) {
      meshRef.current.position.set(
        p1[0] + (p2[0] - p1[0]) * alpha,
        p1[1] + (p2[1] - p1[1]) * alpha,
        p1[2] + (p2[2] - p1[2]) * alpha
      );
      
      const vel = new THREE.Vector3(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]);
      if (vel.length() > 0.001) {
        meshRef.current.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          vel.clone().normalize()
        );
      }
    }

    if (fireRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 30) * 0.3;
      fireRef.current.scale.set(s, s*2, s);
    }
  });

  return (
    <group>
      {/* Dashed Trajectory Line */}
      <Line 
        points={rawPoints}
        color={color}
        dashed={isDashed}
        dashSize={5}
        gapSize={2.5}
        lineWidth={2}
        transparent
        opacity={0.7}
      />

      {!hasImpacted && (
        <Trail
          width={4}
          length={40}
          color={new THREE.Color(color)}
          attenuation={(t) => t * t}
        >
          <group ref={meshRef}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 3.5, 12]} />
              <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 2, 0]} castShadow>
              <coneGeometry args={[0.35, 1, 12]} />
              <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.2} />
            </mesh>
            {[0, 90, 180, 270].map(angle => (
               <mesh key={angle} position={[0, -1.2, 0]} rotation={[0, (angle * Math.PI)/180, 0]}>
                 <boxGeometry args={[1.2, 0.6, 0.05]} />
                 <meshStandardMaterial color="#222" />
               </mesh>
            ))}
            <group position={[0, -1.8, 0]}>
              <mesh ref={fireRef} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.4, 2, 8]} />
                <meshBasicMaterial color="#ffcc00" transparent opacity={0.8} />
              </mesh>
              <pointLight intensity={50} color={color} distance={40} />
            </group>
          </group>
        </Trail>
      )}
      
      {hasImpacted && (
        <group position={targetPos}>
          <Sphere args={[5, 32, 32]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </Sphere>
          <Sphere args={[7, 16, 16]}>
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.8} />
          </Sphere>
          <Sphere args={[9, 16, 16]}>
            <meshBasicMaterial color="#ff4400" transparent opacity={0.6} wireframe />
          </Sphere>
          <pointLight intensity={300} color="#ff8800" distance={150} />
          
          <Sparkles count={1000} scale={50} size={6} speed={3} opacity={0.8} color="#ffffff" />
          <Sparkles count={600} scale={40} size={15} speed={2} opacity={1} color="#ff2200" />
          
          <Float speed={5} rotationIntensity={2} floatIntensity={2}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[15, 0.5, 16, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          </Float>
        </group>
      )}
    </group>
  );
};
