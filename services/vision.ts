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
    
    // Landmark 9 (Middle Finger MCP) is the most stable center of the palm
    const handCenter = landmarks[9]; 
    result.x = 1 - handCenter.x; // Mirroring X for intuitive interaction
    result.y = handCenter.y;
    result.isDetected = true;

    // --- SIMPLIFIED ROBUST ALGORITHM ---
    // We use the distance between Wrist(0) and MiddleMCP(9) as a reference "Unit Scale".
    // Closed fingers (Fist) will have tips closer to the wrist (approx 1 Unit).
    // Open fingers will have tips far from wrist (approx 1.8 - 2.0 Units).

    const dSq = (p1: any, p2: any) => Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2); // 2D is enough and more stable
    const dist = (p1: any, p2: any) => Math.sqrt(dSq(p1, p2));

    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    
    // The "Size" of the palm
    const palmSize = dist(wrist, middleMCP); 
    
    // Threshold: If tip is within 1.4x the palm size, it's curled.
    // If it's further, it's extended.
    const CLOSED_THRESHOLD = palmSize * 1.4; 

    // Finger Tips indices: Index(8), Middle(12), Ring(16), Pinky(20)
    const tips = [8, 12, 16, 20];
    let closedFingers = 0;

    for (const tipIdx of tips) {
      const tipDistance = dist(wrist, landmarks[tipIdx]);
      if (tipDistance < CLOSED_THRESHOLD) {
        closedFingers++;
      }
    }

    // Classification
    // 4 Fingers closed = FIST (Thumb is unreliable, ignored)
    if (closedFingers >= 3) {
      result.gesture = 'CLOSED_FIST';
    } 
    // 0 or 1 Fingers closed = OPEN
    else if (closedFingers <= 1) {
      result.gesture = 'OPEN_HAND';
    } 
    else {
      result.gesture = 'UNKNOWN';
    }
  }

  return result;
};