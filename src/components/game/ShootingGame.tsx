import { useState, useEffect, useCallback, useRef } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameUI from "./GameUI";

interface GameTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  isHit: boolean;
  spawnTime: number;
}

const TARGET_LIFETIME = 3000;
const SPAWN_INTERVAL_BASE = 1500;
const HIT_RADIUS = 0.06;

export default function ShootingGame() {
  const { videoRef, canvasRef, handPosition, isShooting, isReady, status } = useHandTracking();
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const targetIdRef = useRef(0);
  const consecutiveHits = useRef(0);

  // Spawn targets
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      const margin = 0.1;
      const newTarget: GameTarget = {
        id: targetIdRef.current++,
        x: margin + Math.random() * (1 - 2 * margin),
        y: margin + Math.random() * (1 - 2 * margin),
        size: 60 + Math.random() * 40,
        isHit: false,
        spawnTime: Date.now(),
      };
      setTargets((prev) => [...prev, newTarget]);
    }, SPAWN_INTERVAL_BASE / speedMultiplier);

    return () => clearInterval(interval);
  }, [isReady, speedMultiplier]);

  // Remove expired targets
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const alive = prev.filter((t) => {
          if (t.isHit) return now - t.spawnTime < t.spawnTime + 300; // keep hit for animation
          return now - t.spawnTime < TARGET_LIFETIME;
        });
        // Reset consecutive on miss
        const expired = prev.filter((t) => !t.isHit && now - t.spawnTime >= TARGET_LIFETIME);
        if (expired.length > 0) {
          consecutiveHits.current = 0;
          setSpeedMultiplier(1.0);
        }
        return alive;
      });
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  // Handle shooting
  useEffect(() => {
    if (!isShooting || !handPosition) return;

    setTargets((prev) => {
      let hit = false;
      const updated = prev.map((target) => {
        if (target.isHit) return target;
        const dx = target.x - handPosition.x;
        const dy = target.y - handPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HIT_RADIUS + target.size / 2000) {
          hit = true;
          return { ...target, isHit: true };
        }
        return target;
      });

      if (hit) {
        consecutiveHits.current++;
        setScore((s) => s + Math.round(10 * speedMultiplier));
        setSpeedMultiplier((s) => Math.min(s + 0.1, 5.0));
      }

      return updated;
    });
  }, [isShooting, handPosition]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Webcam video (hidden, used as source) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Canvas showing mirrored webcam */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-background/40" />

      {/* Game UI */}
      <GameUI
        score={score}
        speedMultiplier={speedMultiplier}
        status={status}
        isReady={isReady}
      />

      {/* Targets */}
      {targets.map((target) => (
        <Target
          key={target.id}
          x={target.x}
          y={target.y}
          size={target.size}
          isHit={target.isHit}
        />
      ))}

      {/* Crosshair */}
      {handPosition && (
        <Crosshair
          x={handPosition.x}
          y={handPosition.y}
          isShooting={isShooting}
        />
      )}
    </div>
  );
}
