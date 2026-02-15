import { useEffect, useRef, useState, useCallback } from "react";

interface HandPosition {
  x: number;
  y: number;
}

interface HandState {
  handPosition: HandPosition | null;
  smoothPosition: HandPosition | null;
  isShooting: boolean;
}

interface UseHandTrackingResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hands: HandState[];
  isReady: boolean;
  status: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const SMOOTH_FACTOR = 0.5;
const NUM_HANDS = 2;

export function useHandTracking(): UseHandTrackingResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hands, setHands] = useState<HandState[]>([
    { handPosition: null, smoothPosition: null, isShooting: false },
    { handPosition: null, smoothPosition: null, isShooting: false },
  ]);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing system...");

  const prevPinch = useRef<boolean[]>([false, false]);
  const smoothRefs = useRef<(HandPosition | null)[]>([null, null]);
  const rawRefs = useRef<(HandPosition | null)[]>([null, null]);
  const animFrameRef = useRef<number>(0);

  // 60fps smooth loop
  useEffect(() => {
    let running = true;
    function smoothLoop() {
      if (!running) return;
      const updated: HandState[] = [];
      for (let i = 0; i < NUM_HANDS; i++) {
        const raw = rawRefs.current[i];
        if (raw) {
          const prev = smoothRefs.current[i] || raw;
          const smoothed = {
            x: lerp(prev.x, raw.x, SMOOTH_FACTOR),
            y: lerp(prev.y, raw.y, SMOOTH_FACTOR),
          };
          smoothRefs.current[i] = smoothed;
          updated.push({
            handPosition: raw,
            smoothPosition: { ...smoothed },
            isShooting: false, // managed separately
          });
        } else {
          smoothRefs.current[i] = null;
          updated.push({ handPosition: null, smoothPosition: null, isShooting: false });
        }
      }
      // Preserve isShooting from current state
      setHands((prev) =>
        updated.map((h, i) => ({ ...h, isShooting: prev[i]?.isShooting || false }))
      );
      requestAnimationFrame(smoothLoop);
    }
    smoothLoop();
    return () => { running = false; };
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  useEffect(() => {
    let handLandmarker: any = null;
    let mounted = true;

    async function init() {
      try {
        setStatus("Opening camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
        });
        if (!mounted || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setStatus("Loading hand detection...");
        const vision = await import("@mediapipe/tasks-vision");
        const { HandLandmarker, FilesetResolver } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: NUM_HANDS,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        if (!mounted) return;
        setStatus("Ready! Show your hands");
        setIsReady(true);

        let lastTime = -1;
        const shootCooldowns = [false, false];

        function detect() {
          if (!mounted || !videoRef.current || !handLandmarker) return;
          const video = videoRef.current;
          if (video.readyState < 2) {
            requestAnimationFrame(detect);
            return;
          }
          const now = performance.now();
          if (now === lastTime) {
            requestAnimationFrame(detect);
            return;
          }
          lastTime = now;

          const results = handLandmarker.detectForVideo(video, now);

          // Reset all raw refs first
          for (let i = 0; i < NUM_HANDS; i++) {
            rawRefs.current[i] = null;
          }

          if (results.landmarks) {
            for (let i = 0; i < Math.min(results.landmarks.length, NUM_HANDS); i++) {
              const landmarks = results.landmarks[i];
              const indexTip = landmarks[8];
              const thumbTip = landmarks[4];

              const x = 1 - indexTip.x;
              const y = indexTip.y;
              rawRefs.current[i] = { x, y };

              // Pinch detection
              const handSpan = Math.sqrt(
                Math.pow(landmarks[0].x - landmarks[9].x, 2) +
                Math.pow(landmarks[0].y - landmarks[9].y, 2)
              );
              const pinchDist = Math.sqrt(
                Math.pow(indexTip.x - thumbTip.x, 2) +
                Math.pow(indexTip.y - thumbTip.y, 2)
              );
              const normalizedPinch = pinchDist / (handSpan || 0.1);
              const isPinching = normalizedPinch < 0.55;

              if (isPinching && !prevPinch.current[i] && !shootCooldowns[i]) {
                const handIdx = i;
                setHands((prev) =>
                  prev.map((h, idx) =>
                    idx === handIdx ? { ...h, isShooting: true } : h
                  )
                );
                shootCooldowns[i] = true;
                setTimeout(() => {
                  setHands((prev) =>
                    prev.map((h, idx) =>
                      idx === handIdx ? { ...h, isShooting: false } : h
                    )
                  );
                }, 180);
                setTimeout(() => { shootCooldowns[i] = false; }, 280);
              }
              prevPinch.current[i] = isPinching;
            }
          }

          requestAnimationFrame(detect);
        }
        detect();
      } catch (err) {
        console.error("Init error:", err);
        setStatus("Error: Camera permission required");
      }
    }

    init();
    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [processFrame]);

  return { videoRef, canvasRef, hands, isReady, status };
}
