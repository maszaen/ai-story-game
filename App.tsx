import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StoryPanel } from './components/StoryPanel';
import { ChoiceButtons } from './components/ChoiceButtons';
import { HomePage } from './components/HomePage';
import { SettingsPage } from './components/SettingsPage';
import { GenrePicker } from './components/GenrePicker';
import { SavedGamesPage } from './components/SavedGamesPage';
import { getNextScene } from './services/geminiService';
import { putSave, generateSaveId, type SaveData } from './services/database';
import { getSettings, saveSettings, type GameSettings } from './services/settings';
import { IconBook, IconSwords, IconScroll } from './components/Icons';
import type { Scene, QuestItem } from './types';
import type { Genre } from './constants';

type AppView = 'home' | 'settings' | 'genre-picker' | 'saved-games' | 'game';

// Page transition wrapper — re-mounts children on key change to trigger CSS animation
const PageTransition: React.FC<{ viewKey: string; children: React.ReactNode }> = ({ viewKey, children }) => {
  return (
    <div key={viewKey} className="page-enter" style={{ height: '100%' }}>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [settings, setSettings] = useState<GameSettings>(getSettings);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [turnCount, setTurnCount] = useState(0);

  // Scene history: array of all scenes played
  const [sceneHistory, setSceneHistory] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1);

  const [inventory, setInventory] = useState<string[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [storyHistory, setStoryHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll story to top when scene changes
  useEffect(() => {
    if (storyScrollRef.current) {
      storyScrollRef.current.scrollTop = 0;
    }
  }, [currentSceneIndex]);

  const currentScene = currentSceneIndex >= 0 && currentSceneIndex < sceneHistory.length
    ? sceneHistory[currentSceneIndex]
    : null;

  const isViewingLatest = currentSceneIndex === sceneHistory.length - 1;

  // Save to IndexedDB
  const saveProgress = useCallback(async (
    scenes: Scene[],
    sceneIdx: number,
    inv: string[],
    q: QuestItem[],
    sHistory: { role: string; parts: { text: string }[] }[],
    saveId: string,
    name: string,
    turns: number,
    gameOver: boolean,
    goMessage: string,
  ) => {
    const latestScene = scenes[scenes.length - 1];
    const save: SaveData = {
      id: saveId,
      name: name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sceneHistory: scenes,
      currentSceneIndex: sceneIdx,
      inventory: inv,
      quests: q,
      storyHistory: sHistory,
      thumbnail: latestScene?.segments?.[0]?.image || '',
      turnCount: turns,
      isGameOver: gameOver,
      gameOverMessage: goMessage,
    };
    await putSave(save);
  }, []);

  const handleNewGame = useCallback(() => {
    setView('genre-picker');
  }, []);

  const handleSelectGenre = useCallback((genre: Genre) => {
    const id = generateSaveId();
    const name = `${genre.name} — ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    setCurrentSaveId(id);
    setSaveName(name);
    setSelectedGenre(genre);
    setTurnCount(0);
    setSceneHistory([]);
    setCurrentSceneIndex(-1);
    setInventory([]);
    setQuests([]);
    setStoryHistory([]);
    setGameStarted(false);
    setIsGameOver(false);
    setGameOverMessage('');
    setError(null);
    setView('game');
  }, []);

  const handleLoadGame = useCallback((save: SaveData) => {
    setCurrentSaveId(save.id);
    setSaveName(save.name);
    setTurnCount(save.turnCount);
    setSceneHistory(save.sceneHistory);
    setCurrentSceneIndex(save.sceneHistory.length - 1);
    setInventory(save.inventory);
    setQuests(save.quests);
    setStoryHistory(save.storyHistory);
    setGameStarted(true);
    setIsGameOver(save.isGameOver);
    setGameOverMessage(save.gameOverMessage);
    setError(null);
    setView('game');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setView('home');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleOpenSavedGames = useCallback(() => {
    setView('saved-games');
  }, []);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleNavigateScene = useCallback((index: number) => {
    setCurrentSceneIndex(index);
  }, []);

  const startGame = useCallback(async () => {
    setGameStarted(true);
    setIsLoading(true);
    setError(null);
    try {
      const prompt = selectedGenre
        ? `${selectedGenre.initialPrompt}\n\nPENTING: Semua teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.`
        : 'Mulai petualangan fantasi baru. Pemain terbangun di hutan kuno misterius. Quest awal: "Temukan siapa dirimu." SEMUA teks HARUS dalam Bahasa Indonesia.';
      const result = await getNextScene([], prompt, settings);
      const newTurnCount = 1;
      setTurnCount(newTurnCount);

      const newScenes = [result.scene];
      setSceneHistory(newScenes);
      setCurrentSceneIndex(0);

      const newInv = result.newInventory;
      setInventory(newInv);
      setQuests(result.quests);
      setStoryHistory(result.newHistory);
      setIsGameOver(result.scene.isGameOver);
      setGameOverMessage(result.scene.gameOverMessage);

      if (currentSaveId && settings.autoSave) {
        await saveProgress(
          newScenes, 0, newInv, result.quests, result.newHistory,
          currentSaveId, saveName, newTurnCount,
          result.scene.isGameOver, result.scene.gameOverMessage
        );
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal memulai petualangan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [settings, selectedGenre, currentSaveId, saveName, saveProgress]);

  const handleChoice = useCallback(async (choice: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getNextScene(storyHistory, choice, settings);

      const newTurnCount = turnCount + 1;
      setTurnCount(newTurnCount);

      const newScenes = [...sceneHistory, result.scene];
      const newIdx = newScenes.length - 1;
      setSceneHistory(newScenes);
      setCurrentSceneIndex(newIdx);

      // Update inventory: add new, remove used
      const updatedInv = [...new Set([...inventory, ...result.newInventory])]
        .filter(item => !(result.removedInventory || []).includes(item));
      setInventory(updatedInv);

      setQuests(result.quests);
      setStoryHistory(result.newHistory);
      setIsGameOver(result.scene.isGameOver);
      setGameOverMessage(result.scene.gameOverMessage);

      if (currentSaveId && settings.autoSave) {
        await saveProgress(
          newScenes, newIdx, updatedInv, result.quests, result.newHistory,
          currentSaveId, saveName, newTurnCount,
          result.scene.isGameOver, result.scene.gameOverMessage
        );
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal melanjutkan cerita. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [storyHistory, inventory, settings, currentSaveId, saveName, turnCount, sceneHistory, saveProgress]);

  // HOME VIEW
  if (view === 'home') {
    return (
      <PageTransition viewKey="home">
        <HomePage onNewGame={handleNewGame} onLoadGame={handleLoadGame} onOpenSettings={handleOpenSettings} onOpenSavedGames={handleOpenSavedGames} />
      </PageTransition>
    );
  }

  // SETTINGS VIEW
  if (view === 'settings') {
    return (
      <PageTransition viewKey="settings">
        <SettingsPage settings={settings} onChange={handleSettingsChange} onBack={() => setView('home')} />
      </PageTransition>
    );
  }

  // SAVED GAMES VIEW
  if (view === 'saved-games') {
    return (
      <PageTransition viewKey="saved-games">
        <SavedGamesPage onLoadGame={handleLoadGame} onBack={() => setView('home')} />
      </PageTransition>
    );
  }

  // GENRE PICKER VIEW
  if (view === 'genre-picker') {
    return (
      <PageTransition viewKey="genre-picker">
        <GenrePicker onSelectGenre={handleSelectGenre} onBack={() => setView('home')} />
      </PageTransition>
    );
  }

  // GAME VIEW
  return (
    <div className="game-layout page-enter" key="game">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — on mobile it's an overlay drawer */}
      <div className={`
        md:contents
        fixed inset-y-0 left-0 z-50 md:relative md:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          inventory={inventory}
          quests={quests}
          onBackToMenu={() => { setSidebarOpen(false); handleBackToMenu(); }}
          saveName={saveName}
          turnCount={turnCount}
          totalScenes={sceneHistory.length}
          currentSceneIndex={currentSceneIndex}
          onNavigateScene={(idx) => { handleNavigateScene(idx); }}
          isGameOver={isGameOver}
        />
      </div>

      <div className="game-main">
        {/* Mobile top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 md:hidden border-b border-amber-900/20"
          style={{ background: 'linear-gradient(180deg, rgba(15,10,5,0.98) 0%, rgba(10,7,3,0.95) 100%)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-amber-600 hover:text-amber-400 transition-colors p-1"
          >
            <IconScroll size={20} />
          </button>
          <span className="text-amber-700/60 text-xs truncate mx-2" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.65rem' }}>
            {saveName}
          </span>
          <span className="text-amber-800/50 text-xs flex-shrink-0" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.6rem' }}>
            {sceneHistory.length > 0 ? `${currentSceneIndex + 1}/${sceneHistory.length}` : ''}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 p-4">
            <div className="w-full max-w-4xl mx-auto p-4 rounded-lg" style={{
              background: 'rgba(139, 26, 26, 0.2)',
              border: '1px solid rgba(139, 26, 26, 0.4)',
              color: '#d4a0a0',
              fontFamily: "'Crimson Text', serif",
            }}>
              {error}
            </div>
          </div>
        )}

        {/* History viewing banner */}
        {gameStarted && sceneHistory.length > 0 && !isViewingLatest && (
          <div className="history-banner">
            <span style={{
              fontFamily: "'Cinzel', serif",
              color: 'rgba(201,168,76,0.7)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
            }}>
              <IconBook size={16} /> Melihat babak {currentSceneIndex + 1} dari {sceneHistory.length}
            </span>
            <button
              onClick={() => setCurrentSceneIndex(sceneHistory.length - 1)}
              className="ml-4 btn-medieval py-1 px-3 rounded"
              style={{ fontSize: '0.65rem' }}
            >
              Ke babak terbaru ↪
            </button>
          </div>
        )}

        {!gameStarted ? (
          /* Start screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-6">
                <span className="tracking-[0.4em] uppercase" style={{
                  fontFamily: "'Cinzel', serif",
                  color: 'rgba(201,168,76,0.5)',
                  fontSize: '0.75rem',
                }}>
                  Babak Baru Dimulai
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{
                fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                color: '#c9a84c',
                textShadow: '0 0 40px rgba(201, 168, 76, 0.2)',
              }}>
                {saveName}
              </h1>
              <p className="mb-6" style={{
                fontFamily: "'Crimson Text', serif",
                color: 'rgba(180,160,120,0.6)',
                fontStyle: 'italic',
                fontSize: '1.1rem',
              }}>
                Ceritamu menunggu untuk ditulis. Apakah kamu siap?
              </p>
              <button
                onClick={startGame}
                disabled={isLoading}
                className="btn-medieval rounded-lg text-base px-10 py-4"
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="medieval-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    Memuat...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><IconSwords size={18} /> Mulai Petualangan <IconSwords size={18} /></span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable story area */}
            <div className="story-scroll-area" ref={storyScrollRef}>
              <StoryPanel
                scene={currentScene}
                isLoading={isLoading && sceneHistory.length === 0}
              />
            </div>

            {/* Fixed bottom: choices (only on latest scene) */}
            {isViewingLatest && (
              <div className="game-bottom-bar-wrapper">
                <div className="game-bottom-bar">
                  <ChoiceButtons
                    choices={currentScene?.choices || []}
                    onChoice={handleChoice}
                    isLoading={isLoading}
                    isGameOver={isGameOver}
                    onBackToMenu={handleBackToMenu}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
