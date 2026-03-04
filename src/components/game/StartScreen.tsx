import { memo } from "react";

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
}

const StartScreen = memo(({ onStart, highScore }: StartScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 max-w-lg px-8">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black text-game-green-glow tracking-tighter select-none text-center">
          HAND
          <br />
          <span className="text-foreground">SHOOTER</span>
        </h1>

        {/* Decorative line */}
        <div className="w-48 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--game-green)), transparent)" }} />

        {/* Instructions */}
        <div className="flex flex-col gap-4 text-center">
          <div className="flex items-center gap-3 text-muted-foreground text-sm uppercase tracking-widest">
            <span className="w-8 h-8 rounded-full border border-muted flex items-center justify-center text-game-green font-bold">1</span>
            Show your hands to the camera
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-sm uppercase tracking-widest">
            <span className="w-8 h-8 rounded-full border border-muted flex items-center justify-center text-game-green font-bold">2</span>
            Move hands to aim the crosshairs
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-sm uppercase tracking-widest">
            <span className="w-8 h-8 rounded-full border border-muted flex items-center justify-center text-game-green font-bold">3</span>
            Pinch thumb + index to shoot
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-sm uppercase tracking-widest">
            <span className="w-8 h-8 rounded-full border border-muted flex items-center justify-center text-game-green font-bold">!</span>
            Miss 5 targets and it's game over
          </div>
        </div>

        {highScore > 0 && (
          <div className="text-game-green-glow text-lg font-bold select-none">
            HIGH SCORE: {highScore}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={onStart}
          className="relative px-12 py-4 text-2xl font-black uppercase tracking-widest text-primary-foreground rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95 select-none"
          style={{
            background: "hsl(var(--game-green))",
            boxShadow: "0 0 30px hsl(var(--game-green) / 0.4), 0 0 60px hsl(var(--game-green) / 0.2)",
          }}
        >
          START GAME
        </button>

        <p className="text-muted-foreground text-xs uppercase tracking-widest select-none">
          Camera permission required • Both hands supported
        </p>
      </div>
    </div>
  );
});

StartScreen.displayName = "StartScreen";
export default StartScreen;
