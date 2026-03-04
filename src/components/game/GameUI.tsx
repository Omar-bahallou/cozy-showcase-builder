import { memo } from "react";

interface GameUIProps {
  score: number;
  speedMultiplier: number;
  status: string;
  isReady: boolean;
  combo: number;
  misses: number;
  maxMisses: number;
}

const GameUI = memo(({ score, speedMultiplier, status, isReady, combo, misses, maxMisses }: GameUIProps) => {
  return (
    <div className="fixed top-4 left-4 z-40 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <h1 className="text-5xl font-black text-game-green-glow tracking-tighter select-none">
          SCORE: <span>{score}</span>
        </h1>
        <div className="speed-badge text-xl font-bold select-none">
          SPEED: {speedMultiplier.toFixed(1)}x
        </div>
        {combo > 1 && (
          <div className="text-2xl font-black text-game-green-glow animate-pulse select-none">
            {combo}x COMBO!
          </div>
        )}
      </div>
      {/* Lives / Misses indicator */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs uppercase tracking-widest text-muted-foreground select-none">Lives:</span>
        <div className="flex gap-1">
          {Array.from({ length: maxMisses }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{
                background: i < maxMisses - misses
                  ? "hsl(var(--game-green))"
                  : "hsl(var(--game-target) / 0.3)",
                boxShadow: i < maxMisses - misses
                  ? "0 0 8px hsl(var(--game-green) / 0.5)"
                  : "none",
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 px-3 py-1 border border-muted rounded text-xs uppercase tracking-widest inline-block w-max text-muted-foreground select-none">
        {status}
      </div>
    </div>
  );
});

GameUI.displayName = "GameUI";
export default GameUI;
