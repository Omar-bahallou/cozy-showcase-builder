import { memo, useMemo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  isShooting: boolean;
  handIndex?: number;
}

const HAND_COLORS = [
  { ring: "hsl(var(--game-green))", glow: "hsl(var(--game-green) / 0.5)", dot: "bg-primary" },
  { ring: "hsl(200, 80%, 55%)", glow: "hsl(200, 80%, 55% / 0.5)", dot: "bg-blue-400" },
];

const Crosshair = memo(({ x, y, isShooting, handIndex = 0 }: CrosshairProps) => {
  const style = useMemo(() => ({
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    willChange: "left, top" as const,
  }), [x, y]);

  const color = HAND_COLORS[handIndex % HAND_COLORS.length];

  return (
    <div
      className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      {/* Muzzle flash on shoot */}
      {isShooting && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full animate-muzzle-flash"
            style={{
              background: `radial-gradient(circle, ${color.ring}CC 0%, ${color.ring}44 30%, transparent 65%)`,
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full animate-muzzle-flash"
            style={{
              background: `radial-gradient(circle, white 0%, ${color.ring}88 40%, transparent 70%)`,
              animationDuration: "0.1s",
            }}
          />
        </>
      )}

      {/* Outer ring */}
      <div
        className={`flex items-center justify-center rounded-full transition-all duration-75 ${
          isShooting ? "w-7 h-7" : "w-12 h-12"
        }`}
        style={{
          border: `2px solid ${color.ring}`,
          boxShadow: `0 0 15px ${color.glow}, inset 0 0 10px ${color.glow}`,
          animation: isShooting ? "none" : "pulse-glow 2s ease-in-out infinite",
        }}
      >
        {/* Inner dot */}
        <div className={`rounded-full transition-all duration-75 ${
          isShooting ? "w-1 h-1" : "w-2 h-2"
        } ${color.dot}`}
          style={{ boxShadow: `0 0 8px ${color.glow}` }}
        />
      </div>

      {/* Cross lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[
          { cls: `w-[1.5px] ${isShooting ? "h-3 -top-4" : "h-4 -top-6"}`, pos: { left: "-0.75px" } },
          { cls: `w-[1.5px] ${isShooting ? "h-3 top-1" : "h-4 top-2"}`, pos: { left: "-0.75px" } },
          { cls: `h-[1.5px] ${isShooting ? "w-3 -left-4" : "w-4 -left-6"}`, pos: { top: "-0.75px" } },
          { cls: `h-[1.5px] ${isShooting ? "w-3 left-1" : "w-4 left-2"}`, pos: { top: "-0.75px" } },
        ].map((line, i) => (
          <div key={i} className={`absolute transition-all duration-75 ${line.cls}`}
            style={{ ...line.pos, background: color.ring }} />
        ))}
      </div>

      {/* Corner brackets */}
      {[
        "-top-3 -left-3 border-t border-l",
        "-top-3 -right-3 border-t border-r",
        "-bottom-3 -left-3 border-b border-l",
        "-bottom-3 -right-3 border-b border-r",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-2 h-2 ${cls}`}
          style={{ borderColor: `${color.ring}80` }} />
      ))}
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
