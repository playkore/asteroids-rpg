import { useEffect, useState } from 'react';
import FloatingControls from './components/FloatingControls';
import Hud from './components/Hud';
import MapOverlay from './components/MapOverlay';
import MapToggleButton from './components/MapToggleButton';
import StartScreen from './components/StartScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { useScreenMode } from './hooks/useScreenMode';
import { generateSeed, normalizeSeed } from './seed';

export default function App() {
  const [started, setStarted] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [seed, setSeed] = useState(() => generateSeed());
  const { hud, mapState, canvasRef, miniMapRef, restartGame, setMovement } = useGameLoop(
    mapOpen,
    started,
    seed,
  );
  const screen = useScreenMode(started, hud.gameOver, mapOpen, setMapOpen);

  useEffect(() => {
    if (screen.mode !== 'play') {
      setMovement({ x: 0, y: 0, centerX: 0, centerY: 0, active: false });
    }
  }, [screen.mode, setMovement]);

  useEffect(() => {
    if (started) {
      setSeed((current) => normalizeSeed(current));
    }
  }, [started]);

  return (
    <main className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      <canvas ref={miniMapRef} className="mini-map" aria-hidden="true" />

      {screen.mode !== 'start' ? <Hud hud={hud} /> : null}
      {screen.mode === 'start' ? (
        <StartScreen
          seed={seed}
          onSeedChange={(value) => setSeed(normalizeSeed(value))}
          onRoll={() => setSeed(generateSeed())}
          onStart={() => setStarted(true)}
        />
      ) : null}
      {!screen.mapOpen && screen.mode === 'play' ? (
        <MapToggleButton open={screen.mapOpen} onToggle={screen.toggleMap} />
      ) : null}

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

      {screen.mapOpen ? <MapOverlay mapState={mapState} onClose={screen.closeMap} /> : null}

      <FloatingControls
        enabled={screen.mode === 'play'}
        onMovementChange={setMovement}
      />
    </main>
  );
}
