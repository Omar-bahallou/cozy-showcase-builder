import { memo, useEffect, useState } from "react";

export type PowerUpType = "slowmo" | "shield" | "multiplier";

export interface PowerUpConfig {
  icon: string;
  color: string; // CSS variable name
  duration: number; // in milliseconds
  label: string;
}

export const POWER_UP_TYPES: Record<PowerUpType, PowerUpConfig> = {
  slowmo: { icon: "⏰", color: "--game-green", duration: 8000, label: "SLOW" },
  shield: { icon: "🛡️", color: "--game-bonus", duration: 10000, label: "SHIELD" },
  multiplier: { icon: "✨", color: "--primary", duration: 12000, label: "x2" },
};

interface PowerUpProps {
  x: number;
  y: number;
  size: number;
  type: PowerUpType;
  isCollected: boolean;
  collectedTime: number;
}

const PowerUp = memo(({ x, y, size, type, isCollected, collectedTime }: PowerUpProps) => {
  const [particles, setParticles] = useState<Array<{ angle: number; dist: number; size: number }>>([]);

  useEffect(() => {
    if (isCollected) {
      const p = Array.from({ length: 12 }, () => ({
        angle: Math.random() * 360,
        dist: 40 + Math.random() * 60,
        size: 2 + Math.random() * 4,
      }));
      setParticles(p);
    }
  }, [isCollected]);

  const config = POWER_UP_TYPES[type];
  const color = `hsl(var(${config.color}))`;
  const colorAlpha = (a: number) => `hsl(var(${config.color}) / ${a})`;

  return (
    <div
      className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 ${
        isCollected ? "" : "animate-bounce"
      }`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        willChange: "transform, opacity",
      }}
    >
      {isCollected ? (
        <div className="relative" style={{ width: size, height: size }}>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-shockwave"
            style={{ width: size * 1.5, height: size * 1.5, border: `2px solid ${colorAlpha(0.8)}` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-hit-flash"
            style={{
              width: size * 0.7,
              height: size * 0.7,
              background: `radial-gradient(circle, ${colorAlpha(0.9)} 0%, transparent 70%)`,
            }}
          />
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full animate-particle"
              style={{
                width: p.size,
                height: p.size,
                background: color,
                boxShadow: `0 0 8px ${colorAlpha(0.8)}`,
                "--particle-x": `${Math.cos((p.angle * Math.PI) / 180) * p.dist}px`,
                "--particle-y": `${Math.sin((p.angle * Math.PI) / 180) * p.dist}px`,
              } as React.CSSProperties}
            />
          ))}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-score-pop font-black text-sm"
            style={{ color }}
          >
            {config.label}
          </div>
        </div>
      ) : (
        <div className="relative" style={{ width: size, height: size }}>
          {/* Outer rotating ring */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow border-2 border-dashed"
            style={{
              width: size + 8,
              height: size + 8,
              borderColor: colorAlpha(0.4),
            }}
          />
          {/* Main power-up body */}
          <div
            className="animate-target-pulse rounded-full flex items-center justify-center"
            style={{
              width: size,
              height: size,
              border: `3px solid ${color}`,
              boxShadow: `0 0 25px ${colorAlpha(0.6)}, 0 0 50px ${colorAlpha(0.3)}`,
              background: `linear-gradient(135deg, ${colorAlpha(0.2)}, ${colorAlpha(0.4)})`,
            }}
          >
            <div
              className="text-center font-black animate-pulse select-none"
              style={{ 
                color,
                fontSize: size * 0.4,
                textShadow: `0 0 10px ${colorAlpha(0.8)}`,
              }}
            >
              {config.icon}
            </div>
          </div>
          {/* Type label */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider select-none"
            style={{ color: colorAlpha(0.9) }}
          >
            {config.label}
          </div>
        </div>
      )}
    </div>
  );
});

PowerUp.displayName = "PowerUp";
export default PowerUp;