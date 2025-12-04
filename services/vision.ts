import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export interface HandData {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  isDetected: boolean;
  gesture: 'OPEN_HAND' | 'POINTING' | 'CLOSED_FIST' | 'UNKNOWN';
}

let handLandmarker: HandLandmarker | undefined;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";
let lastVideoTime = -1;

export const initializeVision = async () => {
  if (handLandmarker) return;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 1
  });
};

export const detectHand = (video: HTMLVideoElement): HandData => {
  const result: HandData = { x: 0.5, y: 0.5, isDetected: false, gesture: 'UNKNOWN' };
  
  if (!handLandmarker) return result;
  if (video.currentTime === lastVideoTime) return result;
  
  lastVideoTime = video.currentTime;
  const startTimeMs = performance.now();
  
  const detections = handLandmarker.detectForVideo(video, startTimeMs);

  if (detections.landmarks && detections.landmarks.length > 0) {
    const landmarks = detections.landmarks[0];
    
    // Landmark 9 (Middle Finger MCP - Knuckle) is a good stable center point for the hand position
    const handCenter = landmarks[9]; 
    result.x = 1 - handCenter.x; // Mirror horizontally
    result.y = handCenter.y;
    result.isDetected = true;

    // --- GESTURE RECOGNITION LOGIC ---
    
    // Helper: Distance squared between two landmarks
    const distSq = (p1: any, p2: any) => Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2);
    
    const wrist = landmarks[0];
    
    // Tips
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Knuckles (MCP)
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    // Calculate distances from wrist to tips vs wrist to knuckles
    // This provides scale-invariance (works regardless of distance from camera)
    
    let curledCount = 0;
    const fingers = [
      { tip: indexTip, mcp: indexMcp },
      { tip: middleTip, mcp: middleMcp },
      { tip: ringTip, mcp: ringMcp },
      { tip: pinkyTip, mcp: pinkyMcp }
    ];

    for (const f of fingers) {
      const tipDist = distSq(f.tip, wrist);
      const mcpDist = distSq(f.mcp, wrist);
      
      // If tip is closer to wrist than some factor of the knuckle distance, it's curled
      // Or simply: tip is very close to mcp
      const tipToMcp = distSq(f.tip, f.mcp);
      
      // Heuristic: A curled finger tip is physically closer to the wrist/palm area
      if (tipDist < mcpDist * 1.2 || tipToMcp < mcpDist * 0.5) {
        curledCount++;
      }
    }

    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const isThumbCurled = distSq(thumbTip, pinkyMcp) < distSq(thumbIp, pinkyMcp); // Thumb folded across palm

    // Classification
    if (curledCount >= 3) {
      // If most fingers are curled, it's a fist or charging state
      result.gesture = 'CLOSED_FIST';
    } else if (curledCount === 0) {
      result.gesture = 'OPEN_HAND';
    } else if (curledCount === 3 && !isThumbCurled) { 
        // Only index extended? (Rough check, refined from previous logic)
        result.gesture = 'POINTING';
    } else {
        result.gesture = 'UNKNOWN';
    }
  }

  return result;
};