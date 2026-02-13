import { memo } from "react";

interface CrosshairProps {
  x: number;
  y: number;
  isShooting: boolean;
}

const Crosshair = memo(({ x, y, isShooting }: CrosshairProps) => {
  return (
    <div
      className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
    >
      {/* Outer ring */}
      <div
        className={`crosshair-ring w-12 h-12 flex items-center justify-center transition-all duration-75 ${
          isShooting ? "scale-75 opacity-50" : "scale-100 opacity-100"
        }`}
        style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
      >
        {/* Inner dot */}
        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--game-green)/0.8)]" />
      </div>

      {/* Cross lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute w-px h-4 bg-primary -top-6 left-0" />
        <div className="absolute w-px h-4 bg-primary top-2 left-0" />
        <div className="absolute w-4 h-px bg-primary top-0 -left-6" />
        <div className="absolute w-4 h-px bg-primary top-0 left-2" />
      </div>
    </div>
  );
});

Crosshair.displayName = "Crosshair";
export default Crosshair;
