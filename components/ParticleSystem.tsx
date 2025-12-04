
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, TimeMode } from '../types';
import { HandData } from '../services/vision';

interface ParticleSystemProps {
  mode: TimeMode;
  targetShape: ShapeType;
  handData?: HandData;
}

const COUNT = 6000;
const SPACE_SIZE = 15;

const getGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
};

// --- Helper Functions per le coordinate ---
const getShapeCoordinates = (type: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;

    if (type === ShapeType.RANDOM) {
       // Random cloud (Universe)
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos((Math.random() * 2) - 1);
       const r = Math.pow(Math.random(), 1/3) * SPACE_SIZE; 
       x = r * Math.sin(phi) * Math.cos(theta);
       y = r * Math.sin(phi) * Math.sin(theta);
       z = r * Math.cos(phi);
    } else if (type === ShapeType.SPHERE) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 4 + Math.random() * 0.5;
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    } else if (type === ShapeType.TORUS) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const R = 4;
      const r = 1.5;
      x = (R + r * Math.cos(v)) * Math.cos(u);
      y = (R + r * Math.cos(v)) * Math.sin(u);
      z = r * Math.sin(v);
    } else if (type === ShapeType.SPIRAL) {
      const angle = i * 0.1;
      const r = (i / count) * 8;
      x = r * Math.cos(angle);
      y = (i / count) * 12 - 6;
      z = r * Math.sin(angle);
    } else if (type === ShapeType.CUBE) {
      const side = 5;
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * side;
      const v = (Math.random() - 0.5) * side;
      const d = side / 2;
      switch(face) {
        case 0: x = d; y = u; z = v; break;
        case 1: x = -d; y = u; z = v; break;
        case 2: x = u; y = d; z = v; break;
        case 3: x = u; y = -d; z = v; break;
        case 4: x = u; y = v; z = d; break;
        case 5: x = u; y = v; z = -d; break;
      }
    } else if (type === ShapeType.HEART) {
      let t = Math.random() * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      const scale = 0.25;
      x = hx * scale;
      y = hy * scale;
      z = (Math.random() - 0.5) * 1; 
    } else if (type === ShapeType.STAR) {
       const r = Math.pow(Math.random(), 3) * 6;
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos((Math.random() * 2) - 1);
       const spike = 1 + Math.sin(theta * 5) * Math.sin(phi * 5) * 0.5;
       x = r * spike * Math.sin(phi) * Math.cos(theta);
       y = r * spike * Math.sin(phi) * Math.sin(theta);
       z = r * spike * Math.cos(phi);
    } else if (type === ShapeType.FACE) {
       const theta = Math.random() * Math.PI; 
       const phi = Math.random() * Math.PI; 
       const r = 4;
       x = r * Math.sin(theta) * Math.cos(phi);
       y = r * Math.sin(theta) * Math.sin(phi) * 1.5; 
       z = r * Math.cos(theta) * 0.5; 
       if (y > 0.5 && y < 2 && Math.abs(x) > 1 && Math.abs(x) < 2.5) z = -100;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
};

// --- Component Principale ---

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ mode, targetShape, handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { clock, viewport } = useThree();
  
  // Physics buffers
  const velocities = useRef(new Float32Array(COUNT * 3));
  
  // State for EVOCA logic (Charging System)
  const chargingRef = useRef<number>(0); // 0.0 to 1.0
  const isExplodingRef = useRef<boolean>(false);
  
  // Visual state for the "Growing Fist" sphere
  const [fistScale, setFistScale] = useState(0);
  const [handPos, setHandPos] = useState<[number, number, number]>([0,0,0]);
  
  const glowTexture = useMemo(() => getGlowTexture(), []);

  // Target positions for morphing (Future/Past)
  const targetPositions = useMemo(() => {
    return getShapeCoordinates(targetShape, COUNT);
  }, [targetShape]);

  // Initial Geometry (Universe Cloud)
  const initialPositions = useMemo(() => getShapeCoordinates(ShapeType.RANDOM, COUNT), []);
  
  const positionsAttribute = useMemo(() => new THREE.BufferAttribute(new Float32Array(initialPositions), 3), [initialPositions]);
  const colorsAttribute = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for(let i=0; i<COUNT*3; i++) arr[i] = 1; 
    return new THREE.BufferAttribute(arr, 3);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colorsArr = pointsRef.current.geometry.attributes.color.array as Float32Array;
    
    const time = clock.getElapsedTime();

    // Hand Coords mapping
    let handX = 0, handY = 0, handZ = 0;
    if (handData && handData.isDetected) {
        handX = (handData.x - 0.5) * viewport.width;
        handY = -(handData.y - 0.5) * viewport.height;
        handZ = 0; 
        setHandPos([handX, handY, handZ]);
    }

    // --- LOGICA EVOCA: CHARGING SYSTEM ---
    if (mode === TimeMode.EVOCA) {
        // Charging Logic (Independent of particles loop)
        if (handData?.isDetected) {
            if (handData.gesture === 'CLOSED_FIST') {
                // Charge up faster!
                chargingRef.current = Math.min(chargingRef.current + 0.08, 1.0); 
                isExplodingRef.current = false;
            } else if (handData.gesture === 'OPEN_HAND') {
                // Trigger explosion if charged
                if (chargingRef.current > 0.15) {
                    isExplodingRef.current = true;
                    chargingRef.current = 0; 
                } else {
                     chargingRef.current = Math.max(chargingRef.current - 0.1, 0);
                }
            } else {
                chargingRef.current = Math.max(chargingRef.current - 0.05, 0);
            }
        } else {
             chargingRef.current = 0;
        }
        
        // Update Fist Visual Scale
        setFistScale(chargingRef.current);
    }

    const currentCharge = chargingRef.current;
    const exploding = isExplodingRef.current;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      
      // LOGICA FISICA ATTIVA (SOLO EVOCA)
      if (mode === TimeMode.EVOCA) {
        
        let px = positions[i3];
        let py = positions[i3+1];
        let pz = positions[i3+2];
        
        let vx = velocities.current[i3];
        let vy = velocities.current[i3+1];
        let vz = velocities.current[i3+2];

        if (currentCharge > 0.01) {
            // --- FASE DI CARICAMENTO (FIREBALL EFFECT) ---
            
            const dx = handX - px;
            const dy = handY - py;
            const dz = handZ - pz;
            let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 0.001) dist = 0.001;

            // Stronger Pull for snappier feel
            const pullForce = 0.06 * currentCharge; 
            
            vx += dx * pullForce;
            vy += dy * pullForce;
            vz += dz * pullForce;

            // Fireball Chaos: Add random turbulence
            // This simulates the "burning" and vibrating nature of a fireball
            const chaos = 0.05 * currentCharge;
            vx += (Math.random() - 0.5) * chaos;
            vy += (Math.random() - 0.5) * chaos;
            vz += (Math.random() - 0.5) * chaos;

            // Core Repulsion: Tighter core (smaller radius) for density
            if (dist < 1.0) {
               const pushForce = 0.1 * currentCharge; 
               vx -= dx * pushForce;
               vy -= dy * pushForce;
               vz -= dz * pushForce;
            }

            // Damping (Friction)
            vx *= 0.88;
            vy *= 0.88;
            vz *= 0.88;

            // Colors: Purple/Red charging
            colorsArr[i3] = 0.5 + currentCharge * 0.5; 
            colorsArr[i3+1] = 0.5 - currentCharge * 0.3; 
            colorsArr[i3+2] = 0.8 + currentCharge * 0.2;

        } else if (exploding) {
            // --- FASE ESPLOSIONE (SOFT RANDOM SCATTER) ---
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            const speed = 1.0 + Math.random() * 2.5; // Soft explosion speed
            
            vx = speed * Math.sin(phi) * Math.cos(theta);
            vy = speed * Math.sin(phi) * Math.sin(theta);
            vz = speed * Math.cos(phi);

            // Flash White
            colorsArr[i3] = 1.0;
            colorsArr[i3+1] = 1.0;
            colorsArr[i3+2] = 1.0;

        } else {
            // --- FASE IDLE (LIVING UNIVERSE) ---
            // Movimento randomico soft ("Flow Field")
            
            // 1. Weak Tether to Initial Position (so they don't wander off screen)
            const tx = initialPositions[i3];
            const ty = initialPositions[i3+1];
            const tz = initialPositions[i3+2];
            
            vx += (tx - px) * 0.0005; 
            vy += (ty - py) * 0.0005; 
            vz += (tz - pz) * 0.0005; 

            // 2. Sine Wave Flow (The "Random" organic movement)
            // Different phase for each particle based on position
            const noiseScale = 0.2;
            const timeScale = time * 0.3;
            
            vx += Math.sin(py * noiseScale + timeScale) * 0.003;
            vy += Math.cos(pz * noiseScale + timeScale) * 0.003;
            vz += Math.sin(px * noiseScale + timeScale) * 0.003;
            
            // 3. High Damping for underwater feel
            vx *= 0.96;
            vy *= 0.96;
            vz *= 0.96;

            // 4. Restore original color slowly
            colorsArr[i3] += (0.8 - colorsArr[i3]) * 0.02;
            colorsArr[i3+1] += (0.8 - colorsArr[i3+1]) * 0.02;
            colorsArr[i3+2] += (0.8 - colorsArr[i3+2]) * 0.02;
        }

        px += vx;
        py += vy;
        pz += vz;

        positions[i3] = px;
        positions[i3+1] = py;
        positions[i3+2] = pz;

        velocities.current[i3] = vx;
        velocities.current[i3+1] = vy;
        velocities.current[i3+2] = vz;

      } else {
        // --- FUTURE / PAST MODES (Morphing) ---
        const lerpFactor = 0.04; 
        const noiseX = Math.sin(time * 0.5 + i) * 0.02;
        const noiseY = Math.cos(time * 0.3 + i * 0.2) * 0.02;

        let tx = targetPositions[i3];
        let ty = targetPositions[i3 + 1];
        let tz = targetPositions[i3 + 2];

        positions[i3] += (tx - positions[i3]) * lerpFactor + noiseX;
        positions[i3 + 1] += (ty - positions[i3 + 1]) * lerpFactor + noiseY;
        positions[i3 + 2] += (tz - positions[i3 + 2]) * lerpFactor;

        colorsArr[i3] = 0.8;
        colorsArr[i3+1] = 0.8;
        colorsArr[i3+2] = 0.8;
      }
    }
    
    // Stop explosion trigger after one frame
    if (isExplodingRef.current) isExplodingRef.current = false;

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    
    // Rotazione lenta globale solo in Future/Past
    if (mode === TimeMode.FUTURE || mode === TimeMode.PAST) {
       pointsRef.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      {/* PARTICLES */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" {...positionsAttribute} />
          <bufferAttribute attach="attributes-color" {...colorsAttribute} />
        </bufferGeometry>
        <pointsMaterial
          size={mode === TimeMode.EVOCA ? 0.28 : 0.25} 
          map={glowTexture}
          vertexColors={true}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ENERGY CORE (GROWING FIST) - Solo in EVOCA e se mano rilevata */}
      {mode === TimeMode.EVOCA && handData?.isDetected && (
          <mesh position={handPos} scale={0.2 + fistScale * 2.5}>
             <sphereGeometry args={[1, 32, 32]} />
             <meshBasicMaterial 
               color={new THREE.Color().setHSL(0.8 - fistScale * 0.2, 1, 0.5)} // Purple to Reddish
               transparent 
               opacity={0.1 + fistScale * 0.2} 
               blending={THREE.AdditiveBlending}
               depthWrite={false}
             />
          </mesh>
      )}
    </>
  );
};
