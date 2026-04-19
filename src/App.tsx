import { useEffect, useState } from 'react';
import FloatingControls from './components/FloatingControls';
import Hud from './components/Hud';
import MapOverlay from './components/MapOverlay';
import MapToggleButton from './components/MapToggleButton';
import StartScreen from './components/StartScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { generateSeed, normalizeSeed } from './seed';

export default function App() {
  const [seed, setSeed] = useState(() => generateSeed());
  const {
    canvasRef,
    miniMapRef,
    hud,
    mapState,
    phase,
    mapOpen,
    saveBundle,
    startNewGame,
    continueGame,
    loadGame,
    pauseGame,
    resumeGame,
    openMenu,
    closeMap,
    toggleMap,
    setMovement,
    restartCurrentGame,
  } = useGameLoop();

  useEffect(() => {
    if (phase === 'playing') {
      setSeed((current) => normalizeSeed(current));
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') {
      setMovement({ x: 0, y: 0, centerX: 0, centerY: 0, active: false });
    }
  }, [phase, setMovement]);

  const menuVisible = phase === 'menu' || (phase === 'paused' && !mapOpen);
  const gameVisible = phase === 'playing' || phase === 'paused';

  const handleNewGame = (slot: 0 | 1 | 2) => {
    if (saveBundle.slots[slot]) {
      const confirmed = window.confirm('This slot already has progress. Starting a new game will overwrite it.');
      if (!confirmed) {
        return;
      }
    }
    startNewGame(seed, slot);
  };

  const handleContinue = () => {
    const slot = saveBundle.lastSlot;
    if (slot === null) {
      return;
    }
    const snapshot = saveBundle.slots[slot];
    if (!snapshot) {
      return;
    }
    setSeed(snapshot.seed);
    continueGame();
  };

  const handleLoadGame = (slot: 0 | 1 | 2) => {
    const snapshot = saveBundle.slots[slot];
    if (snapshot) {
      setSeed(snapshot.seed);
    }
    loadGame(slot);
  };

  return (
    <main className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      <canvas ref={miniMapRef} className="mini-map" aria-hidden="true" />

      {gameVisible ? <Hud hud={hud} /> : null}

      {menuVisible ? (
        <StartScreen
          seed={seed}
          onSeedChange={(value) => setSeed(normalizeSeed(value))}
          onRoll={() => setSeed(generateSeed())}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onLoadGame={handleLoadGame}
          onResume={phase === 'paused' ? resumeGame : undefined}
          saveBundle={saveBundle}
          paused={phase === 'paused'}
        />
      ) : null}

      {phase === 'playing' && !mapOpen ? <MapToggleButton open={false} onToggle={toggleMap} /> : null}

      {mapOpen ? <MapOverlay mapState={mapState} onClose={closeMap} /> : null}

      {phase === 'gameover' ? (
        <div className="overlay">
          <div className="overlay__panel">
            <h1>Game Over</h1>
            <button className="overlay__button" type="button" onClick={restartCurrentGame}>
              Restart
            </button>
            <button className="overlay__button" type="button" onClick={openMenu}>
              Menu
            </button>
          </div>
        </div>
      ) : null}

      <FloatingControls
        enabled={phase === 'playing'}
        onMovementChange={setMovement}
      />

      {phase === 'playing' ? (
        <button className="menu-button" type="button" onClick={pauseGame}>
          Menu
        </button>
      ) : null}
    </main>
  );
}
