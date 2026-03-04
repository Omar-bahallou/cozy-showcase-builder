import { useState, useEffect, useRef, useCallback } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import Crosshair from "./Crosshair";
import Target from "./Target";
import GameUI from "./GameUI";
import StartScreen from "./StartScreen";
import GameOverScreen from "./GameOverScreen";

interface GameTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  isHit: boolean;
  hitTime: number;
  spawnTime: number;
}

type GameState = "start" | "playing" | "gameover";

const TARGET_LIFETIME = 3000;
const SPAWN_INTERVAL_BASE = 1500;
const HIT_RADIUS = 0.07;
const MAX_MISSES = 5;
const HIGH_SCORE_KEY = "hand-shooter-high-score";

function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch { return 0; }
}

function setHighScore(score: number) {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)); } catch {}
}

export default function ShootingGame() {
  const { videoRef, canvasRef, hands, isReady, status, startTracking } = useHandTracking();
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [highScore, setHighScoreState] = useState(getHighScore);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const targetIdRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const handleStart = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setSpeedMultiplier(1.0);
    setTargets([]);
    setCombo(0);
    setMisses(0);
    setIsNewHighScore(false);
    targetIdRef.current = 0;
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState("gameover");
    const prev = getHighScore();
    if (finalScore > prev) {
      setHighScore(finalScore);
      setHighScoreState(finalScore);
      setIsNewHighScore(true);
    } else {
      setIsNewHighScore(false);
    }
  }, []);

  // Force re-render for lifetime bars
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, [gameState]);

  // Spawn targets
  useEffect(() => {
    if (!isReady || gameState !== "playing") return;
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
  }, [isReady, speedMultiplier, gameState]);

  // Remove expired/hit targets & track misses
  useEffect(() => {
    if (gameState !== "playing") return;
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const missed = prev.filter((t) => !t.isHit && now - t.spawnTime >= TARGET_LIFETIME);
        if (missed.length > 0) {
          setCombo(0);
          setSpeedMultiplier(1.0);
          setMisses((m) => {
            const newMisses = m + missed.length;
            return newMisses;
          });
        }
        return prev.filter((t) => {
          if (t.isHit) return now - t.hitTime < 500;
          return now - t.spawnTime < TARGET_LIFETIME;
        });
      });
    }, 100);
    return () => clearInterval(cleanup);
  }, [gameState]);

  // Check for game over
  useEffect(() => {
    if (gameState === "playing" && misses >= MAX_MISSES) {
      handleGameOver(score);
    }
  }, [misses, gameState, score, handleGameOver]);

  // Handle shooting for each hand
  useEffect(() => {
    if (gameState !== "playing") return;
    hands.forEach((hand) => {
      if (!hand.isShooting || !hand.smoothPosition) return;
      const pos = hand.smoothPosition;

      setTargets((prev) => {
        let hit = false;
        const updated = prev.map((target) => {
          if (target.isHit) return target;
          const dx = target.x - pos.x;
          const dy = target.y - pos.y;
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
    });
  }, [hands.map((h) => h.isShooting).join(","), gameState]);

  const now = Date.now();

  return (
    <div className="fixed inset-0 bg-background overflow-hidden cursor-none">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/40" />

      {gameState === "start" && (
        <StartScreen onStart={handleStart} highScore={highScore} />
      )}

      {gameState === "gameover" && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={handleStart}
        />
      )}

      {gameState === "playing" && (
        <>
          <GameUI
            score={score}
            speedMultiplier={speedMultiplier}
            status={status}
            isReady={isReady}
            combo={combo}
            misses={misses}
            maxMisses={MAX_MISSES}
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

          {hands.map((hand, i) => {
            const aimPos = hand.smoothPosition || hand.handPosition;
            if (!aimPos) return null;
            return (
              <Crosshair
                key={i}
                x={aimPos.x}
                y={aimPos.y}
                isShooting={hand.isShooting}
                handIndex={i}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
