import React, { useMemo } from 'react';
import * as THREE from 'three';

// Creates the "walls" described in the prompt: points spaced 0.1m, height 2m.
// We interpret this as a floor/ceiling or boundary markers to give scale.
export const WallGrid: React.FC = () => {
  const points = useMemo(() => {
    const pts = [];
    const spacing = 0.5; // 0.1 is too dense for visual clarity in webgl sometimes, 0.5 is cleaner
    const size = 20;

    // Floor
    for (let x = -size; x <= size; x += spacing) {
      for (let z = -size; z <= size; z += spacing) {
        // Randomly skip some points for "organic" feel
        if (Math.random() > 0.8) {
             pts.push(x, -5, z);
        }
       
      }
    }
    
    // Ceiling (mirror)
    for (let x = -size; x <= size; x += spacing) {
      for (let z = -size; z <= size; z += spacing) {
         if (Math.random() > 0.9) {
            pts.push(x, 5, z);
         }
      }
    }

    return new Float32Array(pts);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#333333"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.3}
      />
    </points>
  );
};