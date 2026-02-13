import { useState, useEffect, useRef } from "react";
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
  hitTime: number;
  spawnTime: number;
}

const TARGET_LIFETIME = 3000;
const SPAWN_INTERVAL_BASE = 1500;
const HIT_RADIUS = 0.07;

export default function ShootingGame() {
  const { videoRef, canvasRef, handPosition, smoothPosition, isShooting, isReady, status } = useHandTracking();
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [combo, setCombo] = useState(0);
  const targetIdRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // Force re-render for lifetime bars
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Spawn targets
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      const margin = 0.12;
      const newTarget: GameTarget = {
        id: targetIdRef.current++,
        x: margin + Math.random() * (1 - 2 * margin),
        y: margin + Math.random() * (1 - 2 * margin),
        size: 60 + Math.random() * 40,
        isHit: false,
        hitTime: 0,
        spawnTime: Date.now(),
      };
      setTargets((prev) => [...prev, newTarget]);
    }, SPAWN_INTERVAL_BASE / speedMultiplier);

    return () => clearInterval(interval);
  }, [isReady, speedMultiplier]);

  // Remove expired/hit targets
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const next = prev.filter((t) => {
          if (t.isHit) return now - t.hitTime < 500;
          return now - t.spawnTime < TARGET_LIFETIME;
        });
        // Check for misses
        const missed = prev.filter((t) => !t.isHit && now - t.spawnTime >= TARGET_LIFETIME);
        if (missed.length > 0) {
          setCombo(0);
          setSpeedMultiplier(1.0);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  // Handle shooting
  useEffect(() => {
    if (!isShooting || !smoothPosition) return;

    setTargets((prev) => {
      let hit = false;
      const updated = prev.map((target) => {
        if (target.isHit) return target;
        const dx = target.x - smoothPosition.x;
        const dy = target.y - smoothPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HIT_RADIUS + target.size / 1500) {
          hit = true;
          return { ...target, isHit: true, hitTime: Date.now() };
        }
        return target;
      });

      if (hit) {
        setCombo((c) => c + 1);
        setScore((s) => s + Math.round(10 * speedMultiplier));
        setSpeedMultiplier((s) => Math.min(s + 0.1, 5.0));
      }

      return updated;
    });
  }, [isShooting, smoothPosition]);

  const now = Date.now();
  const aimPos = smoothPosition || handPosition;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden cursor-none">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/40" />

      <GameUI
        score={score}
        speedMultiplier={speedMultiplier}
        status={status}
        isReady={isReady}
        combo={combo}
      />

      {targets.map((target) => (
        <Target
          key={target.id}
          x={target.x}
          y={target.y}
          size={target.size}
          isHit={target.isHit}
          lifetime={target.isHit ? 0 : Math.max(0, 1 - (now - target.spawnTime) / TARGET_LIFETIME)}
        />
      ))}

      {aimPos && (
        <Crosshair
          x={aimPos.x}
          y={aimPos.y}
          isShooting={isShooting}
        />
      )}
    </div>
  );
}
