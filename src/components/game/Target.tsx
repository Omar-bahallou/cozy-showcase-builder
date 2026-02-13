import { memo, useEffect, useState } from "react";

interface TargetProps {
  x: number;
  y: number;
  size: number;
  isHit: boolean;
  lifetime: number; // 0 to 1, 1 = just spawned, 0 = expired
}

const Target = memo(({ x, y, size, isHit, lifetime }: TargetProps) => {
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

  // Pulsing ring opacity based on lifetime
  const urgency = lifetime < 0.3 ? "animate-pulse" : "";

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
        // Explosion effect
        <div className="relative" style={{ width: size, height: size }}>
          {/* Shockwave */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-shockwave"
            style={{
              width: size,
              height: size,
              border: "2px solid hsl(var(--game-green) / 0.6)",
            }}
          />
          {/* Flash */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-hit-flash"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              background: "radial-gradient(circle, hsl(var(--game-green) / 0.9) 0%, transparent 70%)",
            }}
          />
          {/* Particles */}
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full animate-particle"
              style={{
                width: p.size,
                height: p.size,
                background: i % 2 === 0
                  ? "hsl(var(--game-green))"
                  : "hsl(var(--game-target))",
                boxShadow: `0 0 6px ${i % 2 === 0 ? "hsl(var(--game-green) / 0.8)" : "hsl(var(--game-target) / 0.8)"}`,
                "--particle-x": `${Math.cos((p.angle * Math.PI) / 180) * p.dist}px`,
                "--particle-y": `${Math.sin((p.angle * Math.PI) / 180) * p.dist}px`,
              } as React.CSSProperties}
            />
          ))}
          {/* Score popup */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-score-pop text-primary font-black text-lg">
            +10
          </div>
        </div>
      ) : (
        // Target rings
        <div className={`relative ${urgency}`} style={{ width: size, height: size }}>
          {/* Rotating outer dashed ring */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-spin-slow"
            style={{
              width: size + 10,
              height: size + 10,
              border: "1px dashed hsl(var(--game-target) / 0.3)",
            }}
          />
          {/* Outer ring */}
          <div
            className="target-circle animate-target-pulse"
            style={{ width: size, height: size }}
          >
            {/* Middle ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderColor: "hsl(var(--game-target) / 0.7)",
              }}
            />
            {/* Bullseye */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: size * 0.25,
                height: size * 0.25,
                background: "radial-gradient(circle, hsl(var(--game-target) / 0.8) 0%, hsl(var(--game-target) / 0.3) 100%)",
                boxShadow: "0 0 15px hsl(var(--game-target) / 0.5)",
              }}
            />
          </div>
          {/* Lifetime bar */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full overflow-hidden"
            style={{ width: size * 0.8, background: "hsl(var(--muted) / 0.3)" }}>
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${lifetime * 100}%`,
                background: lifetime > 0.3
                  ? "hsl(var(--game-target))"
                  : "hsl(var(--destructive))",
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
