import { memo, useMemo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  isShooting: boolean;
}

const Crosshair = memo(({ x, y, isShooting }: CrosshairProps) => {
  const style = useMemo(() => ({
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    willChange: "left, top" as const,
  }), [x, y]);

  return (
    <div
      className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      {/* Muzzle flash on shoot */}
      {isShooting && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full animate-muzzle-flash"
          style={{
            background: "radial-gradient(circle, hsl(var(--game-green) / 0.8) 0%, hsl(var(--game-green) / 0.3) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Outer ring */}
      <div
        className={`crosshair-ring flex items-center justify-center transition-all duration-100 ${
          isShooting ? "w-8 h-8 border-[3px]" : "w-12 h-12 border-2"
        }`}
        style={{ animation: isShooting ? "none" : "pulse-glow 2s ease-in-out infinite" }}
      >
        {/* Inner dot */}
        <div className={`rounded-full bg-primary transition-all duration-75 ${
          isShooting ? "w-1.5 h-1.5" : "w-2 h-2"
        }`}
          style={{ boxShadow: "0 0 8px hsl(var(--game-green) / 0.8)" }}
        />
      </div>

      {/* Cross lines with gaps */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`absolute w-[1.5px] bg-primary transition-all duration-75 ${isShooting ? "h-3 -top-4" : "h-4 -top-6"}`} style={{ left: "-0.75px" }} />
        <div className={`absolute w-[1.5px] bg-primary transition-all duration-75 ${isShooting ? "h-3 top-1" : "h-4 top-2"}`} style={{ left: "-0.75px" }} />
        <div className={`absolute h-[1.5px] bg-primary transition-all duration-75 ${isShooting ? "w-3 -left-4" : "w-4 -left-6"}`} style={{ top: "-0.75px" }} />
        <div className={`absolute h-[1.5px] bg-primary transition-all duration-75 ${isShooting ? "w-3 left-1" : "w-4 left-2"}`} style={{ top: "-0.75px" }} />
      </div>

      {/* Corner brackets */}
      <div className="absolute -top-3 -left-3 w-2 h-2 border-t border-l border-primary/50" />
      <div className="absolute -top-3 -right-3 w-2 h-2 border-t border-r border-primary/50" />
      <div className="absolute -bottom-3 -left-3 w-2 h-2 border-b border-l border-primary/50" />
      <div className="absolute -bottom-3 -right-3 w-2 h-2 border-b border-r border-primary/50" />
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
