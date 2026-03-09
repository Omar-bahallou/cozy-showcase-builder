import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { POWER_UP_TYPES, type PowerUpType } from "./PowerUp";

interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  duration: number;
}

interface PowerUpIndicatorProps {
  activePowerUps: ActivePowerUp[];
  currentTime: number;
}

const PowerUpIndicator = memo(({ activePowerUps, currentTime }: PowerUpIndicatorProps) => {
  if (activePowerUps.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 min-w-[180px]">
      {activePowerUps.map((powerUp, index) => {
        const config = POWER_UP_TYPES[powerUp.type];
        const elapsed = currentTime - powerUp.startTime;
        const remaining = Math.max(0, powerUp.duration - elapsed);
        const progress = (remaining / powerUp.duration) * 100;
        const color = `hsl(var(${config.color}))`;
        const colorAlpha = (a: number) => `hsl(var(${config.color}) / ${a})`;

        return (
          <div
            key={`${powerUp.type}-${powerUp.startTime}-${index}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg border backdrop-blur-sm"
            style={{
              background: colorAlpha(0.1),
              borderColor: colorAlpha(0.3),
              boxShadow: `0 4px 20px ${colorAlpha(0.2)}`,
            }}
          >
            <div
              className="text-lg animate-pulse select-none"
              style={{
                color,
                textShadow: `0 0 8px ${colorAlpha(0.6)}`,
              }}
            >
              {config.icon}
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1 select-none"
                style={{ color }}
              >
                {config.label}
              </div>
              <Progress
                value={progress}
                className="h-2 w-full"
                style={{
                  backgroundColor: colorAlpha(0.2),
                }}
              />
            </div>
            <div
              className="text-xs font-mono tabular-nums select-none"
              style={{ color: colorAlpha(0.8) }}
            >
              {Math.ceil(remaining / 1000)}s
            </div>
          </div>
        );
      })}
    </div>
  );
});

PowerUpIndicator.displayName = "PowerUpIndicator";
export default PowerUpIndicator;