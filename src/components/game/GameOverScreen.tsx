import { memo } from "react";

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
}

const GameOverScreen = memo(({ score, highScore, isNewHighScore, onRestart }: GameOverScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6 max-w-lg px-8">
        {/* Game Over Title */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter select-none text-center"
          style={{
            color: "hsl(var(--game-target))",
            textShadow: "0 0 20px hsl(var(--game-target) / 0.6), 0 0 40px hsl(var(--game-target) / 0.3)",
          }}
        >
          GAME OVER
        </h1>

        {/* Decorative line */}
        <div className="w-48 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--game-target)), transparent)" }} />

        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground text-sm uppercase tracking-widest">Final Score</span>
          <span className="text-6xl font-black text-game-green-glow select-none">{score}</span>
        </div>

        {/* New High Score badge */}
        {isNewHighScore && (
          <div className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest animate-pulse select-none"
            style={{
              background: "hsl(var(--game-green) / 0.15)",
              border: "1px solid hsl(var(--game-green) / 0.5)",
              color: "hsl(var(--game-green-glow))",
            }}
          >
            ★ New High Score! ★
          </div>
        )}

        {/* High Score */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground text-xs uppercase tracking-widest">Best</span>
          <span className="text-2xl font-bold text-game-green select-none">{highScore}</span>
        </div>

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="relative mt-4 px-12 py-4 text-2xl font-black uppercase tracking-widest text-primary-foreground rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95 select-none"
          style={{
            background: "hsl(var(--game-green))",
            boxShadow: "0 0 30px hsl(var(--game-green) / 0.4), 0 0 60px hsl(var(--game-green) / 0.2)",
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
});

GameOverScreen.displayName = "GameOverScreen";
export default GameOverScreen;
