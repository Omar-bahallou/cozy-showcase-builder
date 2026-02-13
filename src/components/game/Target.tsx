import { memo, useState } from "react";

interface TargetProps {
  x: number;
  y: number;
  size: number;
  isHit: boolean;
}

const Target = memo(({ x, y, size, isHit }: TargetProps) => {
  return (
    <div
      className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 ${
        isHit ? "target-hit" : "animate-target-spawn"
      }`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      {/* Outer ring */}
      <div className="target-circle" style={{ width: size, height: size }}>
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
            background: "hsl(var(--game-target) / 0.6)",
            boxShadow: "0 0 12px hsl(var(--game-target) / 0.5)",
          }}
        />
      </div>
    </div>
  );
});

Target.displayName = "Target";
export default Target;
