import { useEffect, useState } from 'react';
import FloatingControls from './components/FloatingControls';
import Hud from './components/Hud';
import OverwriteDialog from './components/OverwriteDialog';
import StartScreen from './components/StartScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { generateSeed, normalizeSeed } from './seed';
import type { SaveSlotIndex } from './save';

export default function App() {
  const [seed, setSeed] = useState(() => generateSeed());
  const [pendingOverwriteSlot, setPendingOverwriteSlot] = useState<SaveSlotIndex | null>(null);
  const {
    canvasRef,
    miniMapRef,
    hud,
    phase,
    saveBundle,
    startNewGame,
    continueGame,
    loadGame,
    pauseGame,
    openMenu,
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

  const menuVisible = phase === 'menu' || phase === 'paused';
  const gameVisible = phase === 'playing' || phase === 'paused';

  const handleNewGame = (slot: 0 | 1 | 2) => {
    if (saveBundle.slots[slot]) {
      setPendingOverwriteSlot(slot);
      return;
    }
    startNewGame(seed, slot);
  };

  const cancelOverwrite = () => {
    setPendingOverwriteSlot(null);
  };

  const confirmOverwrite = () => {
    if (pendingOverwriteSlot === null) {
      return;
    }
    startNewGame(seed, pendingOverwriteSlot);
    setPendingOverwriteSlot(null);
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
          saveBundle={saveBundle}
          paused={phase === 'paused'}
        />
      ) : null}

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

      {pendingOverwriteSlot !== null ? (
        <OverwriteDialog
          slotLabel={`Slot ${pendingOverwriteSlot + 1}`}
          onCancel={cancelOverwrite}
          onConfirm={confirmOverwrite}
        />
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
