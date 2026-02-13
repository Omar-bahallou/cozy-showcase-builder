import { useEffect, useRef, useState, useCallback } from "react";

interface HandPosition {
  x: number;
  y: number;
}

interface UseHandTrackingResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handPosition: HandPosition | null;
  smoothPosition: HandPosition | null;
  isShooting: boolean;
  isReady: boolean;
  status: string;
}

// Smooth position with exponential moving average
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useHandTracking(): UseHandTrackingResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handPosition, setHandPosition] = useState<HandPosition | null>(null);
  const [smoothPosition, setSmoothPosition] = useState<HandPosition | null>(null);
  const [isShooting, setIsShooting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing system...");
  const prevPinch = useRef(false);
  const animFrameRef = useRef<number>(0);
  const smoothRef = useRef<HandPosition | null>(null);
  const rawRef = useRef<HandPosition | null>(null);

  // Smooth position update loop (decoupled from detection for 60fps smoothness)
  useEffect(() => {
    let running = true;
    function smoothLoop() {
      if (!running) return;
      const raw = rawRef.current;
      if (raw) {
        const prev = smoothRef.current || raw;
        const smoothed = {
          x: lerp(prev.x, raw.x, 0.35),
          y: lerp(prev.y, raw.y, 0.35),
        };
        smoothRef.current = smoothed;
        setSmoothPosition({ ...smoothed });
      }
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
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (!mounted) return;
        setStatus("Ready! Show your hand");
        setIsReady(true);

        let lastTime = -1;
        let shootCooldown = false;

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

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const indexTip = landmarks[8];
            const indexDip = landmarks[7];
            const thumbTip = landmarks[4];
            const middleTip = landmarks[12];

            // Use average of index tip for more stability
            const x = 1 - indexTip.x;
            const y = indexTip.y;

            const pos = { x, y };
            rawRef.current = pos;
            setHandPosition(pos);

            // Better pinch detection: thumb-index distance relative to hand size
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

            if (isPinching && !prevPinch.current && !shootCooldown) {
              setIsShooting(true);
              shootCooldown = true;
              setTimeout(() => setIsShooting(false), 150);
              setTimeout(() => { shootCooldown = false; }, 250);
            }
            prevPinch.current = isPinching;
          } else {
            rawRef.current = null;
            setHandPosition(null);
            setSmoothPosition(null);
            smoothRef.current = null;
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

  return { videoRef, canvasRef, handPosition, smoothPosition, isShooting, isReady, status };
}
