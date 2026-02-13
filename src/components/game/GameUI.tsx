import { memo } from "react";

interface GameUIProps {
  score: number;
  speedMultiplier: number;
  status: string;
  isReady: boolean;
}

const GameUI = memo(({ score, speedMultiplier, status, isReady }: GameUIProps) => {
  return (
    <div className="fixed top-4 left-4 z-40 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <h1 className="text-5xl font-black text-game-green-glow tracking-tighter">
          XAL: <span className="text-game-green-glow">{score}</span>
        </h1>
        <div className="speed-badge text-xl font-bold">
          SÜRƏT: {speedMultiplier.toFixed(1)}x
        </div>
      </div>
      <div className="mt-2 px-3 py-1 border border-muted rounded text-xs uppercase tracking-widest inline-block w-max text-muted-foreground">
        {status}
      </div>
    </div>
  );
});

GameUI.displayName = "GameUI";
export default GameUI;
