import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Trail, Float, Torus, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { TrajectoryPoint } from '../lib/physics';
import { Sparkles } from '@react-three/drei';

interface MissileProps {
  points: TrajectoryPoint[];
  isActive: boolean;
  onComplete: () => void;
}

export const Missile: React.FC<MissileProps> = ({ points, isActive, onComplete }) => {
  const meshRef = useRef<THREE.Group>(null);
  const fireRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const [hasImpacted, setHasImpacted] = React.useState(false);
  
  useFrame((state, delta) => {
    if (!isActive || points.length === 0) {
      timeRef.current = 0;
      setHasImpacted(false);
      return;
    }
    
    if (hasImpacted) return;

    timeRef.current += delta * 0.5; // Slightly faster
    
    if (timeRef.current >= 1) {
      timeRef.current = 1;
      setHasImpacted(true);
      onComplete();
      return;
    }
    
    const index = Math.floor(timeRef.current * (points.length - 1));
    const nextIndex = Math.min(index + 1, points.length - 1);
    const alpha = (timeRef.current * (points.length - 1)) % 1;
    
    const p1 = points[index].position;
    const p2 = points[nextIndex].position;
    
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
  });

  useFrame((state) => {
    if (fireRef.current && isActive && points.length > 0) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 30) * 0.3;
      fireRef.current.scale.set(s, s*2, s);
    }
  });

  if (!isActive || points.length === 0) return null;

  const targetPos = points[points.length - 1].position;

  return (
    <group>
      {!hasImpacted && (
        <Trail
          width={4}
          length={80}
          color={new THREE.Color('#00f2ff')}
          attenuation={(t) => t * t}
        >
          <group ref={meshRef}>
            {/* Missile Body */}
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.22, 2.5, 12]} />
              <meshPhysicalMaterial 
                color="#1a1a1a" 
                metalness={0.9} 
                roughness={0.1} 
                clearcoat={1}
                clearcoatRoughness={0.1}
                emissive="#00f2ff" 
                emissiveIntensity={0.2} 
              />
            </mesh>
            {/* Warhead */}
            <mesh position={[0, 1.5, 0]} castShadow>
              <coneGeometry args={[0.22, 0.8, 12]} />
              <meshPhysicalMaterial 
                color="#00f2ff" 
                metalness={0.8}
                roughness={0.2}
                emissive="#00f2ff" 
                emissiveIntensity={2} 
              />
            </mesh>
            {/* Fins */}
            {[0, 90, 180, 270].map(angle => (
               <mesh key={angle} position={[0, -0.8, 0]} rotation={[0, (angle * Math.PI)/180, 0]}>
                 <boxGeometry args={[0.8, 0.4, 0.05]} />
                 <meshStandardMaterial color="#333" />
               </mesh>
            ))}
            {/* Fire / Propulsion Engine */}
            <group position={[0, -1.3, 0]}>
              <mesh ref={fireRef} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.25, 1.5, 8]} />
                <meshBasicMaterial color="#ff4400" transparent opacity={0.8} />
              </mesh>
              <pointLight intensity={30} color="#ff3300" distance={20} />
              <Sphere args={[0.4, 8, 8]}>
                 <meshBasicMaterial color="#ffcc00" transparent opacity={0.6} />
              </Sphere>
            </group>
          </group>
        </Trail>
      )}
      
      {hasImpacted && (
        <group position={targetPos}>
          <Sphere args={[2, 16, 16]}>
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.8} wireframe />
          </Sphere>
          <pointLight intensity={100} color="#00f2ff" distance={50} />
          <Float speed={10} rotationIntensity={5} floatIntensity={5}>
            <Text
              position={[0, 5, 0]}
              fontSize={2}
              color="#00f2ff"
              anchorX="center"
              anchorY="middle"
            >
              IMPACTO CONFIRMADO
            </Text>
          </Float>
        </group>
      )}

      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <mesh position={targetPos} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[1.5, 0.15, 16, 32]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.4} />
        </mesh>
      </Float>
    </group>
  );
};

export const Intruder: React.FC<{ points: TrajectoryPoint[], isActive?: boolean }> = ({ points, isActive }) => {
  const meshRef = useRef<THREE.Group>(null);
  const fireRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  
  if (points.length === 0) return null;
  const targetPos = points[points.length - 1].position;
  
  useFrame((state, delta) => {
    if (!isActive || points.length === 0) {
       timeRef.current = 0;
       return;
    }
    
    timeRef.current += delta * 0.5;
    if (timeRef.current >= 1) {
       timeRef.current = 1;
    }

    if (meshRef.current && isActive) {
      const idx = Math.floor(timeRef.current * (points.length - 1));
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const alpha = (timeRef.current * (points.length - 1)) % 1;
      
      const p1 = points[idx].position;
      const p2 = points[nextIdx].position;
      
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
    } else if (meshRef.current) {
      meshRef.current.position.set(targetPos[0], targetPos[1], targetPos[2]);
    }

    if (fireRef.current) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 40) * 0.4;
        fireRef.current.scale.set(s, s * 2.5, s);
    }
  });

  return (
    <group>
      <Line 
        points={points.map(p => new THREE.Vector3(...p.position))} 
        color="#ff2200" 
        lineWidth={3}
        transparent
        opacity={0.15}
      />
      
      <group ref={meshRef}>
         <Trail width={1.5} length={60} color={new THREE.Color('#ff2200')} attenuation={t => t*t}>
            <group>
               <mesh castShadow>
                  <cylinderGeometry args={[0.2, 0.25, 1.8, 8]} />
                  <meshPhysicalMaterial color="#111" metalness={0.8} roughness={0.3} emissive="#ff0000" emissiveIntensity={0.5} />
               </mesh>
               <mesh position={[0, 1.1, 0]} castShadow>
                  <coneGeometry args={[0.25, 0.5, 8]} />
                  <meshPhysicalMaterial color="#ff0000" metalness={0.5} roughness={0.2} emissive="#ff0000" emissiveIntensity={3} />
               </mesh>
               {/* Engine fire */}
               <group position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
                  <mesh ref={fireRef}>
                     <coneGeometry args={[0.2, 1.2, 8]} />
                     <meshBasicMaterial color="#ff3300" transparent opacity={0.7} />
                  </mesh>
                  <pointLight intensity={15} color="#ff0000" distance={15} />
               </group>
            </group>
         </Trail>
      </group>
    </group>
  );
};

export const Globe: React.FC<{ 
  basePos?: [number, number, number],
  onGroundClick?: (pos: [number, number, number]) => void
}> = ({ basePos = [0, -5, 0], onGroundClick }) => {
  const terrainGeometry = useMemo(() => {
    const size = 1500;
    const segments = 100; 
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Topography of region
      let h = Math.sin(x * 0.008) * Math.cos(y * 0.008) * 20;
      h += Math.sin(x * 0.04) * Math.sin(y * 0.04) * 10;
      
      const distToCenter = Math.sqrt(x*x + y*y);
      if (distToCenter < 120) {
        h *= (distToCenter / 120); // Base clearing
      }
      
      h += (Math.random() - 0.5) * 3; // Ground noise
      pos.setZ(i, h);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  const ruins = useMemo(() => {
    const items = [];
    const count = 300;
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 450;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Building ruins: irregular boxes
      const h = 5 + Math.random() * 25;
      const w = 4 + Math.random() * 10;
      const d = 4 + Math.random() * 10;
      const rot = Math.random() * Math.PI;
      const status = Math.random(); // 0-1 degree of destruction
      
      items.push({ x, z, h, w, d, rot, status });
    }
    return items;
  }, []);

  return (
    <group>
      {/* Ground mesh */}
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (onGroundClick) {
            onGroundClick([e.point.x, e.point.y, e.point.z]);
          }
        }}
      >
        <meshPhysicalMaterial 
          color="#080a0c" 
          roughness={0.8}
          metalness={0.2}
          clearcoat={0.1}
          emissive="#001122"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* City Ruins */}
      {ruins.map((r, i) => (
        <group key={i} position={[r.x, -10 + r.h/2 - (r.status * r.h * 0.4), r.z]} rotation={[0, r.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[r.w, r.h * (1 - r.status * 0.5), r.d]} />
            <meshPhysicalMaterial 
              color={r.status > 0.6 ? "#05070a" : "#111"} 
              roughness={0.7}
              metalness={0.3}
              clearcoat={r.status > 0.6 ? 0.2 : 0}
              emissive="#00f2ff"
              emissiveIntensity={r.status < 0.2 ? 0.5 : 0} 
            />
          </mesh>
          {/* Debris around buildings */}
          {r.status > 0.5 && (
            <mesh position={[0, -r.h/2, 0]} rotation={[Math.random(), Math.random(), Math.random()]}>
               <boxGeometry args={[r.w * 1.5, 1, r.d * 1.5]} />
               <meshStandardMaterial color="#111" />
            </mesh>
          )}
        </group>
      ))}

      {/* Grid and Tactical Fog */}
      <gridHelper args={[2000, 100, 0x00f2ff, 0x002244]} position={[0, -9.8, 0]} />
      <fogExp2 attach="fog" args={['#02050a', 0.003]} />
      
      {/* Jerusalem Tactical Base */}
      <group position={basePos}>
        <mesh position={[0, -4.5, 0]}>
          <cylinderGeometry args={[8, 10, 3, 6]} />
          <meshStandardMaterial color="#000" emissive="#00f2ff" emissiveIntensity={5} wireframe />
        </mesh>
        <pointLight position={[0, 12, 0]} intensity={45} color="#00f2ff" distance={300} />
        
        {[1, 2.5, 4.5].map(i => (
           <Torus key={i} args={[12 * i, 0.15, 16, 120]} rotation={[Math.PI/2, 0, 0]}>
              <meshBasicMaterial color="#00f2ff" transparent opacity={0.5 / i} />
           </Torus>
        ))}
      </group>

      <primitive object={new THREE.AxesHelper(200)} />
    </group>
  );
};
