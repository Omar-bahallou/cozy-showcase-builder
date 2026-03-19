import { useState, useEffect, useRef, useCallback } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useGameAudio } from "@/hooks/useGameAudio";
import Crosshair from "./Crosshair";
import Target from "./Target";
import PowerUp, { POWER_UP_TYPES, type PowerUpType } from "./PowerUp";
import PowerUpIndicator from "./PowerUpIndicator";
import GameUI from "./GameUI";
import StartScreen from "./StartScreen";
import GameOverScreen from "./GameOverScreen";

export type TargetType = "normal" | "fast" | "heavy" | "bonus" | "decoy" | "boss";

export interface TargetTypeConfig {
  sizeRange: [number, number];
  lifetime: number;
  points: number;
  color: string; // CSS variable name
  label: string;
}

export const TARGET_TYPES: Record<TargetType, TargetTypeConfig> = {
  normal: { sizeRange: [55, 80], lifetime: 3000, points: 10, color: "--game-target", label: "+10" },
  fast:   { sizeRange: [35, 50], lifetime: 1800, points: 25, color: "--game-green", label: "+25" },
  heavy:  { sizeRange: [85, 110], lifetime: 4500, points: 5, color: "--game-heavy", label: "+5" },
  bonus:  { sizeRange: [40, 55], lifetime: 1200, points: 50, color: "--game-bonus", label: "+50" },
  decoy:  { sizeRange: [60, 75], lifetime: 3500, points: -20, color: "--destructive", label: "-20" },
};

interface GameTarget {
  id: number;
  x: number;
  y: number;
  size: number;
  type: TargetType;
  isHit: boolean;
  hitTime: number;
  spawnTime: number;
}

interface GamePowerUp {
  id: number;
  x: number;
  y: number;
  size: number;
  type: PowerUpType;
  isCollected: boolean;
  collectedTime: number;
  spawnTime: number;
}

interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  duration: number;
}

type GameState = "start" | "playing" | "gameover";

const SPAWN_INTERVAL_BASE = 1500;
const HIT_RADIUS = 0.07;
const MAX_MISSES = 5;
const HIGH_SCORE_KEY = "hand-shooter-high-score";
const POWER_UP_SPAWN_INTERVAL = 8000; // 8 seconds
const POWER_UP_COLLECTION_RADIUS = 0.08;

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
  const [powerUps, setPowerUps] = useState<GamePowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [highScore, setHighScoreState] = useState(getHighScore);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const { playShoot, playHit, playCombo, playMiss, playGameOver } = useGameAudio();
  const targetIdRef = useRef(0);
  const powerUpIdRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const handleStart = useCallback(() => {
    startTracking();
    setGameState("playing");
    setScore(0);
    setSpeedMultiplier(1.0);
    setTargets([]);
    setPowerUps([]);
    setActivePowerUps([]);
    setCombo(0);
    setMisses(0);
    setIsNewHighScore(false);
    targetIdRef.current = 0;
    powerUpIdRef.current = 0;
  }, [startTracking]);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState("gameover");
    playGameOver();
    const prev = getHighScore();
    if (finalScore > prev) {
      setHighScore(finalScore);
      setHighScoreState(finalScore);
      setIsNewHighScore(true);
    } else {
      setIsNewHighScore(false);
    }
  }, [playGameOver]);

  // Force re-render for lifetime bars
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, [gameState]);

  // Spawn targets
  useEffect(() => {
    if (!isReady || gameState !== "playing") return;
    
    // Apply slow motion power-up
    const hasSlowmo = activePowerUps.some(p => p.type === "slowmo" && Date.now() - p.startTime < p.duration);
    const effectiveSpeedMultiplier = hasSlowmo ? speedMultiplier * 0.3 : speedMultiplier;
    
    const interval = setInterval(() => {
      const margin = 0.12;
      // Pick random type with weighted probability
      const roll = Math.random();
      let type: TargetType;
      if (roll < 0.4) type = "normal";
      else if (roll < 0.65) type = "fast";
      else if (roll < 0.82) type = "heavy";
      else if (roll < 0.94) type = "bonus";
      else type = "decoy";

      const config = TARGET_TYPES[type];
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

      const newTarget: GameTarget = {
        id: targetIdRef.current++,
        x: margin + Math.random() * (1 - 2 * margin),
        y: margin + Math.random() * (1 - 2 * margin),
        size,
        type,
        isHit: false,
        hitTime: 0,
        spawnTime: Date.now(),
      };
      setTargets((prev) => [...prev, newTarget]);
    }, SPAWN_INTERVAL_BASE / effectiveSpeedMultiplier);
    return () => clearInterval(interval);
  }, [isReady, speedMultiplier, gameState, activePowerUps]);

  // Spawn power-ups
  useEffect(() => {
    if (!isReady || gameState !== "playing") return;
    const interval = setInterval(() => {
      const margin = 0.15;
      const powerUpTypes: PowerUpType[] = ["slowmo", "shield", "multiplier"];
      const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

      const newPowerUp: GamePowerUp = {
        id: powerUpIdRef.current++,
        x: margin + Math.random() * (1 - 2 * margin),
        y: margin + Math.random() * (1 - 2 * margin),
        size: 50,
        type,
        isCollected: false,
        collectedTime: 0,
        spawnTime: Date.now(),
      };
      setPowerUps((prev) => [...prev, newPowerUp]);
    }, POWER_UP_SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [isReady, gameState]);

  // Remove expired power-ups and update active power-ups
  useEffect(() => {
    if (gameState !== "playing") return;
    const cleanup = setInterval(() => {
      const now = Date.now();
      
      // Clean up collected power-ups
      setPowerUps((prev) => prev.filter((p) => {
        if (p.isCollected) return now - p.collectedTime < 1000;
        return now - p.spawnTime < 15000; // 15 second lifetime
      }));

      // Clean up expired active power-ups
      setActivePowerUps((prev) => prev.filter((p) => now - p.startTime < p.duration));
    }, 100);
    return () => clearInterval(cleanup);
  }, [gameState]);

  // Remove expired/hit targets & track misses
  useEffect(() => {
    if (gameState !== "playing") return;
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const missed = prev.filter((t) => !t.isHit && now - t.spawnTime >= TARGET_TYPES[t.type].lifetime);
        if (missed.length > 0) {
          setCombo(0);
          setSpeedMultiplier(1.0);
          playMiss();
          setMisses((m) => m + missed.length);
        }
        return prev.filter((t) => {
          if (t.isHit) return now - t.hitTime < 500;
          return now - t.spawnTime < TARGET_TYPES[t.type].lifetime;
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
      playShoot();
      const pos = hand.smoothPosition;

      // Check for power-up collection
      setPowerUps((prev) => {
        let collected = false;
        const updated = prev.map((powerUp) => {
          if (powerUp.isCollected) return powerUp;
          const dx = powerUp.x - pos.x;
          const dy = powerUp.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < POWER_UP_COLLECTION_RADIUS + powerUp.size / 2000) {
            collected = true;
            const config = POWER_UP_TYPES[powerUp.type];
            setActivePowerUps((active) => [
              ...active.filter(p => p.type !== powerUp.type), // Remove existing same type
              { type: powerUp.type, startTime: Date.now(), duration: config.duration }
            ]);
            return { ...powerUp, isCollected: true, collectedTime: Date.now() };
          }
          return powerUp;
        });
        return updated;
      });

      // Check for target hits
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
          const hitTarget = updated.find((t) => t.isHit && t.hitTime === Date.now());
          const hitType = hitTarget?.type || "normal";
          const basePts = hitTarget ? TARGET_TYPES[hitType].points : 10;
          
          // Apply multiplier power-up
          const hasMultiplier = activePowerUps.some(p => p.type === "multiplier" && Date.now() - p.startTime < p.duration);
          const pts = hasMultiplier ? basePts * 2 : basePts;
          
          playHit(hitType);
          if (hitType === "decoy") {
            // Decoy penalty: reset combo, reduce speed, subtract points
            // Shield protects from decoy penalty
            const hasShield = activePowerUps.some(p => p.type === "shield" && Date.now() - p.startTime < p.duration);
            if (!hasShield) {
              setCombo(0);
              setSpeedMultiplier(1.0);
              setScore((s) => Math.max(0, s + basePts)); // basePts is negative for decoy
              setMisses((m) => m + 1); // Count as a miss
            } else {
              // Shield absorbs the decoy hit, still give positive points
              setScore((s) => s + Math.abs(basePts));
            }
          } else {
            setCombo((c) => {
              const newCombo = c + 1;
              if (newCombo >= 3 && newCombo % 3 === 0) playCombo(newCombo);
              return newCombo;
            });
            setScore((s) => s + Math.round(pts * speedMultiplier));
            setSpeedMultiplier((s) => Math.min(s + 0.1, 5.0));
          }
        }
        return updated;
      });
    });
  }, [hands.map((h) => h.isShooting).join(","), gameState, activePowerUps]);

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
          <PowerUpIndicator activePowerUps={activePowerUps} currentTime={now} />
          <GameUI
            score={score}
            speedMultiplier={speedMultiplier}
            status={status}
            isReady={isReady}
            combo={combo}
            misses={misses}
            maxMisses={MAX_MISSES}
          />

          {targets.map((target) => {
            const config = TARGET_TYPES[target.type];
            return (
              <Target
                key={target.id}
                x={target.x}
                y={target.y}
                size={target.size}
                isHit={target.isHit}
                lifetime={target.isHit ? 0 : Math.max(0, 1 - (now - target.spawnTime) / config.lifetime)}
                targetType={target.type}
                points={config.points}
                colorVar={config.color}
              />
            );
          })}

          {powerUps.map((powerUp) => (
            <PowerUp
              key={powerUp.id}
              x={powerUp.x}
              y={powerUp.y}
              size={powerUp.size}
              type={powerUp.type}
              isCollected={powerUp.isCollected}
              collectedTime={powerUp.collectedTime}
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
