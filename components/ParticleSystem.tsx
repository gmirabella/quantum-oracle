
import React, { useRef, useMemo, useEffect } from 'react';
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

// --- Helper Functions per le coordinate (come prima) ---
const getShapeCoordinates = (type: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;

    if (type === ShapeType.RANDOM) {
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
  const { clock, camera, viewport } = useThree();
  
  // Physics buffers
  const velocities = useRef(new Float32Array(COUNT * 3));
  
  // State for EVOCA logic
  const prevGestureRef = useRef<'OPEN_HAND' | 'POINTING' | 'CLOSED_FIST' | 'UNKNOWN'>('UNKNOWN');
  
  const glowTexture = useMemo(() => getGlowTexture(), []);

  // Target positions for morphing (Future/Past)
  const targetPositions = useMemo(() => {
    return getShapeCoordinates(targetShape, COUNT);
  }, [targetShape]);

  // Initial Geometry
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
    }

    // --- LOGICA EVOCA: CHECK EXPLOSION TRIGGER ---
    let isExploding = false;
    if (mode === TimeMode.EVOCA && handData?.isDetected) {
        if (prevGestureRef.current === 'CLOSED_FIST' && handData.gesture === 'OPEN_HAND') {
            isExploding = true;
        }
    }
    prevGestureRef.current = handData?.gesture || 'UNKNOWN';

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

        if (handData?.isDetected && handData.gesture === 'CLOSED_FIST') {
            // --- FASE DI CARICAMENTO (ACCUMULO) ---
            const dx = handX - px;
            const dy = handY - py;
            const dz = handZ - pz;
            
            // Strong attraction to center
            const force = 0.08; 
            vx += dx * force;
            vy += dy * force;
            vz += dz * force;

            // Strong damping to hold them in a tight ball
            vx *= 0.6;
            vy *= 0.6;
            vz *= 0.6;

            // Jitter (Energy vibration)
            vx += (Math.random() - 0.5) * 0.2;
            vy += (Math.random() - 0.5) * 0.2;
            vz += (Math.random() - 0.5) * 0.2;

            // Color Shift -> Magma/Purple
            colorsArr[i3] = 1.0;     // Red
            colorsArr[i3+1] = 0.2;   // Green
            colorsArr[i3+2] = 0.8;   // Blue (Purple hue)

        } else if (isExploding) {
            // --- FASE ESPLOSIONE (TRIGGER UNICO) ---
            const dx = px - handX;
            const dy = py - handY;
            const dz = pz - handZ;
            
            // Normalizza e spara via
            const len = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.001;
            const blastForce = 3.0 + Math.random() * 2.0;
            
            vx = (dx / len) * blastForce;
            vy = (dy / len) * blastForce;
            vz = (dz / len) * blastForce;

            // Flash White
            colorsArr[i3] = 1.0;
            colorsArr[i3+1] = 1.0;
            colorsArr[i3+2] = 1.0;

        } else {
            // --- FASE IDLE / RILASCIO DOPO ESPLOSIONE ---
            // Drag naturale
            vx *= 0.96;
            vy *= 0.96;
            vz *= 0.96;

            // Return to neutral color
            colorsArr[i3] += (0.8 - colorsArr[i3]) * 0.05;
            colorsArr[i3+1] += (0.8 - colorsArr[i3+1]) * 0.05;
            colorsArr[i3+2] += (0.8 - colorsArr[i3+2]) * 0.05;

            // Gentle drift
            vx += Math.sin(time * 0.5 + i) * 0.002;
            vy += Math.cos(time * 0.3 + i * 0.1) * 0.002;
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

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    
    // Rotazione lenta globale solo in Future/Past
    if (mode === TimeMode.FUTURE || mode === TimeMode.PAST) {
       pointsRef.current.rotation.y += 0.001;
    }
  });

  return (
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
  );
};
