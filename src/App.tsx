import { useEffect, useState } from 'react';
import FloatingControls from './components/FloatingControls';
import Hud from './components/Hud';
import MapOverlay from './components/MapOverlay';
import MapToggleButton from './components/MapToggleButton';
import { useGameLoop } from './hooks/useGameLoop';
import { useScreenMode } from './hooks/useScreenMode';

export default function App() {
  const [mapOpen, setMapOpen] = useState(false);
  const { hud, canvasRef, restartGame, setMovement, beginFire, endFire } = useGameLoop(mapOpen);
  const screen = useScreenMode(hud.gameOver, mapOpen, setMapOpen);

  useEffect(() => {
    if (screen.mode !== 'play') {
      setMovement({ x: 0, y: 0, active: false });
    }
  }, [screen.mode, setMovement]);

  return (
    <main className="app">
      <canvas ref={canvasRef} className="game-canvas" />

      <Hud hud={hud} />
      <MapToggleButton open={screen.mapOpen} onToggle={screen.toggleMap} />

      {hud.gameOver ? (
        <div className="overlay">
          <div className="overlay__panel">
            <h1>Game Over</h1>
            <button className="overlay__button" type="button" onClick={restartGame}>
              Restart
            </button>
          </div>
        </div>
      ) : null}

      {screen.mapOpen ? <MapOverlay onClose={screen.closeMap} /> : null}

      <FloatingControls
        enabled={screen.mode === 'play'}
        onMovementChange={setMovement}
        onFireStart={beginFire}
        onFireEnd={endFire}
      />
    </main>
  );
}
