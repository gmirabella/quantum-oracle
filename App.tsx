
import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleSystem } from './components/ParticleSystem';
import { WallGrid } from './components/WallGrid';
import { UI } from './components/UI';
import { TimeMode, ShapeType } from './types';
import { consultOracle } from './services/gemini';
import { initializeVision, detectHand, HandData } from './services/vision';

const App: React.FC = () => {
  const [mode, setMode] = useState<TimeMode>(TimeMode.FUTURE);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for the visualization
  const [targetShape, setTargetShape] = useState<ShapeType>(ShapeType.RANDOM);
  const [oracleMessage, setOracleMessage] = useState<string | null>(null);

  // Vision / Evoca State
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error' | null>(null);
  const [handData, setHandData] = useState<HandData | undefined>(undefined);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    // Clean up webcam when unmounting or switching modes if needed
    return () => {
      cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Mode Switching to Evoca (Webcam activation)
  useEffect(() => {
    if (mode === TimeMode.EVOCA) {
      startCamera();
    } else {
      // Stop camera if leaving vision modes
       if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
         setCameraStatus(null);
      }
    }
  }, [mode]);

  const startCamera = async () => {
    if (cameraStatus === 'active') return; // Already running

    setCameraStatus('loading');
    try {
      await initializeVision();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      videoRef.current.onloadeddata = () => {
        setCameraStatus('active');
        loopVision();
      };
    } catch (e) {
      console.error("Camera failed", e);
      setCameraStatus('error');
    }
  };

  const loopVision = () => {
    if (mode === TimeMode.EVOCA && videoRef.current.readyState === 4) {
      const data = detectHand(videoRef.current);
      setHandData(data);
    }
    requestRef.current = requestAnimationFrame(loopVision);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setOracleMessage(null);
    setTargetShape(ShapeType.RANDOM); // Scatter before forming

    // API Call
    const response = await consultOracle(inputText, mode);

    setTargetShape(response.shape);
    setOracleMessage(response.message);
    setLoading(false);
    setInputText('');
  };

  const handleModeChange = (newMode: TimeMode) => {
    setMode(newMode);
    setTargetShape(ShapeType.RANDOM);
    setOracleMessage(null);
    setInputText('');
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      
      <UI 
        mode={mode}
        setMode={handleModeChange}
        inputText={inputText}
        setInputText={setInputText}
        onSubmit={handleSubmit}
        loading={loading}
        oracleMessage={oracleMessage}
        cameraStatus={cameraStatus}
      />

      <Canvas
        camera={{ position: [0, 0, 18], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        
        <Suspense fallback={null}>
          <WallGrid />
          <ParticleSystem mode={mode} targetShape={targetShape} handData={handData} />
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={5} 
          maxDistance={30} 
          rotateSpeed={0.5}
          // Stop rotation in vision modes
          autoRotate={mode === TimeMode.FUTURE || mode === TimeMode.PAST} 
          autoRotateSpeed={0.5}
        />
        
        {/* Subtle ambient fog for depth */}
        <fog attach="fog" args={['#050505', 10, 40]} />
      </Canvas>
    </div>
  );
};

export default App;
