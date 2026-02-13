import { memo } from "react";

interface GameUIProps {
  score: number;
  speedMultiplier: number;
  status: string;
  isReady: boolean;
  combo: number;
}

const GameUI = memo(({ score, speedMultiplier, status, isReady, combo }: GameUIProps) => {
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
      <div className="mt-2 px-3 py-1 border border-muted rounded text-xs uppercase tracking-widest inline-block w-max text-muted-foreground select-none">
        {status}
      </div>
    </div>
  );
});

GameUI.displayName = "GameUI";
export default GameUI;
