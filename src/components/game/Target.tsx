import { memo, useEffect, useState } from "react";
import type { TargetType } from "./ShootingGame";

interface TargetProps {
  x: number;
  y: number;
  size: number;
  isHit: boolean;
  lifetime: number;
  targetType: TargetType;
  points: number;
  colorVar: string;
  hp?: number;
  maxHp?: number;
}

const Target = memo(({ x, y, size, isHit, lifetime, targetType, points, colorVar, hp = 1, maxHp = 1 }: TargetProps) => {
  const [particles, setParticles] = useState<Array<{ angle: number; dist: number; size: number }>>([]);

  useEffect(() => {
    if (isHit) {
      const p = Array.from({ length: 8 }, () => ({
        angle: Math.random() * 360,
        dist: 30 + Math.random() * 50,
        size: 3 + Math.random() * 5,
      }));
      setParticles(p);
    }
  }, [isHit]);

  const color = `hsl(var(${colorVar}))`;
  const colorAlpha = (a: number) => `hsl(var(${colorVar}) / ${a})`;
  const urgency = lifetime < 0.3 ? "animate-pulse" : "";

  const isBonus = targetType === "bonus";
  const isFast = targetType === "fast";
  const isDecoy = targetType === "decoy";
  const isBoss = targetType === "boss";

  return (
    <div
      className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 ${
        isHit ? "" : "animate-target-spawn"
      }`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        willChange: "transform, opacity",
      }}
    >
      {isHit ? (
        <div className="relative" style={{ width: size, height: size }}>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-shockwave"
            style={{ width: size, height: size, border: `2px solid ${colorAlpha(0.6)}` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-hit-flash"
            style={{
              width: size * 0.5,
              height: size * 0.5,
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
                boxShadow: `0 0 6px ${colorAlpha(0.8)}`,
                "--particle-x": `${Math.cos((p.angle * Math.PI) / 180) * p.dist}px`,
                "--particle-y": `${Math.sin((p.angle * Math.PI) / 180) * p.dist}px`,
              } as React.CSSProperties}
            />
          ))}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-score-pop font-black text-lg"
            style={{ color }}
          >
            +{points}
          </div>
        </div>
      ) : (
        <div className={`relative ${urgency}`} style={{ width: size, height: size }}>
          {/* Boss: extra outer glow ring */}
          {isBoss && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
              style={{
                width: size + 24,
                height: size + 24,
                border: `2px solid ${colorAlpha(0.4)}`,
                boxShadow: `0 0 30px ${colorAlpha(0.3)}, 0 0 60px ${colorAlpha(0.15)}`,
              }}
            />
          )}
          {/* Rotating outer dashed ring */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isBoss || isFast ? "animate-spin" : "animate-spin-slow"}`}
            style={{
              width: size + 10,
              height: size + 10,
              border: `${isBoss ? 2 : 1}px dashed ${colorAlpha(isBoss ? 0.5 : 0.3)}`,
            }}
          />
          {/* Outer ring */}
          <div
            className="animate-target-pulse rounded-full"
            style={{
              width: size,
              height: size,
              border: `${isBoss ? 4 : 3}px solid ${color}`,
              boxShadow: isBoss
                ? `0 0 25px ${colorAlpha(0.6)}, 0 0 50px ${colorAlpha(0.3)}, inset 0 0 20px ${colorAlpha(0.15)}`
                : `0 0 20px ${colorAlpha(0.5)}, 0 0 40px ${colorAlpha(0.2)}`,
              background: colorAlpha(0.15),
              position: "relative",
            }}
          >
            {/* Middle ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderColor: colorAlpha(0.7),
              }}
            />
            {/* Bullseye */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: size * 0.25,
                height: size * 0.25,
                background: `radial-gradient(circle, ${colorAlpha(0.8)} 0%, ${colorAlpha(0.3)} 100%)`,
                boxShadow: `0 0 15px ${colorAlpha(0.5)}`,
              }}
            />
            {isBonus && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-black animate-pulse select-none"
                style={{ color, fontSize: size * 0.18 }}
              >
                ★
              </div>
            )}
            {isBoss && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black animate-pulse select-none"
                style={{ color, fontSize: size * 0.22 }}
              >
                👑
              </div>
            )}
            {isDecoy && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-black animate-pulse select-none"
                style={{ color, fontSize: size * 0.25 }}
              >
                💀
              </div>
            )}
          </div>
          {/* Type label */}
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider select-none"
            style={{ color: colorAlpha(0.8) }}
          >
            {targetType === "normal" ? "" : targetType}
          </div>
          {/* Boss HP bar */}
          {isBoss && maxHp > 1 && (
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 h-2 rounded-full overflow-hidden"
              style={{ width: size * 0.9, background: "hsl(var(--muted) / 0.4)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(hp / maxHp) * 100}%`,
                  background: `linear-gradient(90deg, hsl(var(--destructive)), ${color})`,
                  boxShadow: `0 0 6px ${colorAlpha(0.5)}`,
                }}
              />
            </div>
          )}
          {/* Lifetime bar */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 h-1 rounded-full overflow-hidden ${isBoss ? "-bottom-8" : "-bottom-2"}`}
            style={{ width: size * 0.8, background: "hsl(var(--muted) / 0.3)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${lifetime * 100}%`,
                background: lifetime > 0.3 ? color : "hsl(var(--destructive))",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

Target.displayName = "Target";
export default Target;
