import { useEffect, useRef, useState, useCallback } from "react";

interface HandPosition {
  x: number;
  y: number;
}

interface UseHandTrackingResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handPosition: HandPosition | null;
  isShooting: boolean;
  isReady: boolean;
  status: string;
}

export function useHandTracking(): UseHandTrackingResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handPosition, setHandPosition] = useState<HandPosition | null>(null);
  const [isShooting, setIsShooting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Sistem hazırlanır...");
  const prevPinch = useRef(false);
  const animFrameRef = useRef<number>(0);

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

    // Mirror the video
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
        setStatus("Kamera açılır...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
        });

        if (!mounted || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setStatus("Əl tanıma yüklənir...");

        // Load MediaPipe Vision
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
        });

        if (!mounted) return;
        setStatus("Hazırdır! Əlinizi göstərin");
        setIsReady(true);

        // Detection loop
        let lastTime = -1;
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
            // Index finger tip (landmark 8)
            const indexTip = landmarks[8];
            // Thumb tip (landmark 4)
            const thumbTip = landmarks[4];

            // Mirror the x position
            const x = 1 - indexTip.x;
            const y = indexTip.y;

            setHandPosition({ x, y });

            // Detect pinch (thumb + index close together)
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const isPinching = dist < 0.06;

            if (isPinching && !prevPinch.current) {
              setIsShooting(true);
              setTimeout(() => setIsShooting(false), 100);
            }
            prevPinch.current = isPinching;
          } else {
            setHandPosition(null);
          }

          requestAnimationFrame(detect);
        }

        detect();
      } catch (err) {
        console.error("Init error:", err);
        setStatus("Xəta: Kamera icazəsi lazımdır");
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

  return { videoRef, canvasRef, handPosition, isShooting, isReady, status };
}
