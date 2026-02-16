import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StoryPanel } from './components/StoryPanel';
import { ChoiceButtons } from './components/ChoiceButtons';
import { VoiceChatPanel } from './components/VoiceChatPanel';
import { HomePage } from './components/HomePage';
import { SettingsPage } from './components/SettingsPage';
import { GenrePicker } from './components/GenrePicker';
import { SavedGamesPage } from './components/SavedGamesPage';
import { getNextScene, type SceneStreamCallbacks } from './services/geminiService';
import { putSave, generateSaveId, type SaveData } from './services/database';
import { getSettings, saveSettings, type GameSettings } from './services/settings';
import { audioManager, type BacksoundId } from './services/audioManager';
import { AssetLoader } from './components/AssetLoader';
import { IconBook, IconSwords, IconScroll } from './components/Icons';
import favicon from './assets/infinite.png';
import type { Scene, QuestItem, VoiceChatConfig, ChatMessage, CharacterPortrait } from './types';
import type { Genre } from './constants';

type AppView = 'home' | 'settings' | 'genre-picker' | 'saved-games' | 'game';

const LOADER_TEXTS = [
  'Sang penulis takdir menorehkan tinta di lembaran nasibmu...',
  'Dunia baru sedang tercipta dari kekosongan...',
  'Bintang-bintang bergeser, membentuk jalan petualanganmu...',
  'Ramalan kuno berbisik tentang kedatanganmu...',
  'Kabut waktu menyingkap tabir takdirmu...',
  'Para dewa merajut benang ceritamu...',
  'Gerbang dimensi terbuka, menanti langkah pertamamu...',
  'Kitab nasib membuka halamannya untukmu...',
];

const MedievalTypewriterLoader: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'idle' | 'fading'>('typing');
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fullText = LOADER_TEXTS[textIndex % LOADER_TEXTS.length];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const punctuation = '.,?!;:-–…';

    if (phase === 'typing') {
      setOpacity(1);
      let i = 0;
      // Simulate human typing: variable base speed that drifts gradually
      let currentSpeed = 38;

      const type = () => {
        if (i < fullText.length) {
          const char = fullText.charAt(i);
          setDisplayText(fullText.slice(0, i + 1));
          i++;

          // Drift the base speed slightly (like a human's rhythm shifting)
          currentSpeed += (Math.random() - 0.5) * 12;
          currentSpeed = Math.max(25, Math.min(65, currentSpeed)); // clamp 25-65ms

          let delay = currentSpeed + Math.random() * 20;

          // Pause longer on punctuation (thinking pause)
          if (punctuation.includes(char)) {
            delay += 280 + Math.random() * 150;
          }

          // Occasional micro-hesitation mid-word (~12% chance)
          if (Math.random() < 0.12 && !punctuation.includes(char) && char !== ' ') {
            delay += 60 + Math.random() * 80;
          }

          // Slight pause after spaces (word boundary)
          if (char === ' ') {
            delay += 15 + Math.random() * 30;
          }

          const t = setTimeout(type, delay);
          timers.push(t);
        } else {
          setPhase('idle');
        }
      };

      const starter = setTimeout(type, 80);
      timers.push(starter);

      return () => { for (const t of timers) clearTimeout(t); };
    }

    if (phase === 'idle') {
      const t = setTimeout(() => setPhase('fading'), 3500);
      timers.push(t);
      return () => { for (const t of timers) clearTimeout(t); };
    }

    if (phase === 'fading') {
      setOpacity(0);
      const t = setTimeout(() => {
        setTextIndex(prev => prev + 1);
        setDisplayText('');
        // Go straight to typing — no fade in, typewriter starts from empty
        setPhase('typing');
      }, 600);
      timers.push(t);
      return () => { for (const t of timers) clearTimeout(t); };
    }
  }, [phase, textIndex]);

  return (
    <div className="text-center loader-entrance">
      {/* Decorative top ornament */}
      <div className="mb-6" style={{ color: 'rgba(201,168,76,0.3)' }}>
        <span style={{ fontSize: '1.5rem', letterSpacing: '0.5em' }}>⸎ ◆ ⸎</span>
      </div>

      {/* Spinner */}
      <div className="flex justify-center mb-8">
        <div className="medieval-quill-loader">
          <div className="quill-orbit">
            <span className="quill-dot" />
            <span className="quill-dot" />
            <span className="quill-dot" />
          </div>
        </div>
      </div>

      {/* Typewriter text */}
      <div className="min-h-[3rem] flex items-center justify-center px-4">
        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            color: '#c9a84c',
            fontSize: '1.15rem',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
            lineHeight: '1.7',
            opacity,
            transition: phase === 'fading' ? 'opacity 0.5s ease' : 'none',
            maxWidth: '480px',
          }}
        >
          {displayText}
          <span className="typewriter-cursor">|</span>
        </p>
      </div>

      {/* Decorative bottom ornament */}
      <div className="mt-6" style={{ color: 'rgba(201,168,76,0.2)' }}>
        <span style={{ fontSize: '0.7rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Mohon tunggu sejenak
        </span>
      </div>
    </div>
  );
};

// Page transition wrapper — re-mounts children on key change to trigger CSS animation
const PageTransition: React.FC<{ viewKey: string; children: React.ReactNode }> = ({ viewKey, children }) => {
  return (
    <div key={viewKey} className="page-enter" style={{ height: '100%' }}>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [viewStack, setViewStack] = useState<AppView[]>(['home']);
  const view = viewStack[viewStack.length - 1];

  const pushView = useCallback((v: AppView) => setViewStack(prev => [...prev, v]), []);
  const popView = useCallback(() => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev), []);
  const resetView = useCallback((v: AppView = 'home') => setViewStack([v]), []);
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

  const [characterVisualIdentity, setCharacterVisualIdentity] = useState('');
  const [locationVisualIdentity, setLocationVisualIdentity] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  /** Whether scene images are still being generated (streaming mode) */
  const [imagesLoading, setImagesLoading] = useState(false);
  const [showStartLoader, setShowStartLoader] = useState(false);
  const [startFadingOut, setStartFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  /** Which voice chat mode is active: 'mandatory' (no choices) or 'optional' (alongside choices) */
  const [voiceChatMode, setVoiceChatMode] = useState<'mandatory' | 'optional'>('mandatory');
  /** The character config currently being talked to */
  const [activeVoiceChatChar, setActiveVoiceChatChar] = useState<VoiceChatConfig | null>(null);
  /** Accumulated conversation messages per character (keyed by characterName) for optional talks */
  const [conversationLogs, setConversationLogs] = useState<Record<string, ChatMessage[]>>({});
  /** Known characters with generated portraits for visual consistency */
  const [knownCharacters, setKnownCharacters] = useState<CharacterPortrait[]>([]);
  /** Music volume (0-1), default 50% */
  const [musicVolume, setMusicVolume] = useState(0.2);

  // Asset Loading State
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  // Initial Asset Load
  useEffect(() => {
    // Set favicon dynamically (handles cache busting via Vite)
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    (link as HTMLLinkElement).type = 'image/png';
    (link as HTMLLinkElement).rel = 'icon';
    (link as HTMLLinkElement).href = favicon;
    document.getElementsByTagName('head')[0].appendChild(link);

    const initAudio = async () => {
      await audioManager.init((progress, file) => {
         setLoadProgress(progress);
         setCurrentFile(file);
      });
      // Do not auto-set assetsLoaded. Wait for user interaction.
      setLoadProgress(100); 
    };
    initAudio();
  }, []);

  const handleEnterWorld = useCallback(() => {
    audioManager.resumeContext();
    setAssetsLoaded(true);
  }, []);

  // Play homescreen music on non-game views (ONLY after assets loaded)
  useEffect(() => {
    if (assetsLoaded && view !== 'game') {
      audioManager.play('homescreen');
    }
  }, [view, assetsLoaded]);

  // Play scene backsound when scene changes
  useEffect(() => {
    if (view !== 'game' || !gameStarted) return;
    const scene = currentSceneIndex >= 0 && currentSceneIndex < sceneHistory.length
      ? sceneHistory[currentSceneIndex]
      : null;
    if (scene?.backsound) {
      audioManager.play(scene.backsound as BacksoundId);
    }
  }, [view, gameStarted, currentSceneIndex, sceneHistory, assetsLoaded]); // Added assetsLoaded dependecy just in case

  // Play generating music during loading (initial or between scenes)
  useEffect(() => {
    if (isLoading) {
      audioManager.play('generating-story');
    }
  }, [isLoading]);

  // Sync volume
  useEffect(() => {
    audioManager.setVolume(musicVolume);
  }, [musicVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => audioManager.stop();
  }, []);

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
    charVisual: string,
    locVisual: string,
    chars: CharacterPortrait[],
    chatLogs?: Record<string, ChatMessage[]>,
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
      characterVisualIdentity: charVisual,
      locationVisualIdentity: locVisual,
      knownCharacters: chars,
      conversationLogs: chatLogs && Object.keys(chatLogs).length > 0 ? chatLogs : undefined,
    };
    await putSave(save);
  }, []);

  const handleNewGame = useCallback(() => {
    pushView('genre-picker');
  }, [pushView]);

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
    setCharacterVisualIdentity('');
    setLocationVisualIdentity('');
    setGameStarted(false);
    setStartFadingOut(false);
    setShowStartLoader(false);
    setIsGameOver(false);
    setGameOverMessage('');
    setError(null);
    setKnownCharacters([]);
    setConversationLogs({});
    pushView('game');
  }, [pushView]);

  const handleLoadGame = useCallback((save: SaveData) => {
    setCurrentSaveId(save.id);
    setSaveName(save.name);
    setTurnCount(save.turnCount);
    setSceneHistory(save.sceneHistory);
    setCurrentSceneIndex(save.sceneHistory.length - 1);
    setInventory(save.inventory);
    setQuests(save.quests);
    setStoryHistory(save.storyHistory);
    setCharacterVisualIdentity(save.characterVisualIdentity || '');
    setLocationVisualIdentity(save.locationVisualIdentity || '');
    setGameStarted(true);
    setIsGameOver(save.isGameOver);
    setGameOverMessage(save.gameOverMessage);
    setError(null);
    setKnownCharacters(save.knownCharacters || []);
    setConversationLogs(save.conversationLogs || {});
    pushView('game');
  }, [pushView]);

  const handleBackToMenu = useCallback(() => {
    resetView('home');
  }, [resetView]);

  const handleOpenSettings = useCallback(() => {
    pushView('settings');
  }, [pushView]);

  const handleOpenSavedGames = useCallback(() => {
    pushView('saved-games');
  }, [pushView]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleNavigateScene = useCallback((index: number) => {
    setCurrentSceneIndex(index);
  }, []);

  const startGame = useCallback(async () => {
    // Phase 1: fade out start screen text
    setStartFadingOut(true);
    setIsLoading(true);
    setError(null);

    // Phase 2: after fade animation, show the typewriter loader
    await new Promise(r => setTimeout(r, 700));
    setShowStartLoader(true);

    try {
      const randomSeed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const prompt = selectedGenre
        ? `${selectedGenre.initialPrompt}\n\n[SEED: ${randomSeed}]\n\nATURAN REALISME: Cerita harus kreatif dan unik, tapi LATAR/SETTING harus MASUK AKAL dan KOHEREN. Lokasi harus realistis sesuai genre — benda-benda di dalamnya harus punya alasan logis untuk ada di sana. Dunia boleh fantastis/magis jika genre meminta, tapi harus punya logika internal yang konsisten seperti dunia nyata.\n\nPENTING: Semua teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.`
        : `Mulai petualangan fantasi baru yang unik dan original. Setting harus realistis dan koheren. Seed: ${randomSeed}. SEMUA teks HARUS dalam Bahasa Indonesia.`;
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
      setCharacterVisualIdentity(result.characterVisualIdentity);
      setLocationVisualIdentity(result.locationVisualIdentity);
      setIsGameOver(result.scene.isGameOver);
      setGameOverMessage(result.scene.gameOverMessage);

      // Store new character portraits
      const updatedChars = [...result.newCharacterPortraits];
      setKnownCharacters(updatedChars);

      if (currentSaveId && settings.autoSave) {
        await saveProgress(
          newScenes, 0, newInv, result.quests, result.newHistory,
          currentSaveId, saveName, newTurnCount,
          result.scene.isGameOver, result.scene.gameOverMessage,
          result.characterVisualIdentity, result.locationVisualIdentity,
          updatedChars, {}
        );
      }

      // Phase 3: loading done — switch to game view
      setGameStarted(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal memulai petualangan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setShowStartLoader(false);
      setStartFadingOut(false);
    }
  }, [settings, selectedGenre, currentSaveId, saveName, saveProgress]);

  const handleChoice = useCallback(async (choice: string) => {
    setIsLoading(true);
    setImagesLoading(true);
    setError(null);

    // If there are accumulated conversation logs from optional talks, prepend them to the choice
    let fullChoice = choice;
    const logEntries = Object.entries(conversationLogs) as [string, ChatMessage[]][];
    if (logEntries.length > 0) {
      const logsText = logEntries.map(([charName, messages]) => {
        const textParts = messages.filter((_, i) => i > 0)
          .map(m => `${m.sender === 'user' ? 'Pemain' : charName}: ${m.text}`)
          .join('\n');
        return `[Percakapan opsional dengan ${charName}]\n${textParts}`;
      }).join('\n\n');
      fullChoice = `[LOG PERCAKAPAN OPSIONAL]\n${logsText}\n\n[PILIHAN PEMAIN]: ${choice}`;
    }

    // Track scene index for image streaming updates
    let streamedSceneIdx = -1;

    // Streaming callbacks — show text+choices immediately, images stream in later
    const streamCallbacks: SceneStreamCallbacks = {
      onStoryReady: (partialScene, meta) => {
        const newTurnCount = turnCount + 1;
        setTurnCount(newTurnCount);

        const newScenes = [...sceneHistory, partialScene];
        streamedSceneIdx = newScenes.length - 1;
        setSceneHistory(newScenes);
        setCurrentSceneIndex(streamedSceneIdx);

        // Update inventory: add new, remove used
        const updatedInv = [...new Set([...inventory, ...meta.newInventory])]
          .filter(item => !(meta.removedInventory || []).includes(item));
        setInventory(updatedInv);

        setQuests(meta.quests);
        setStoryHistory(meta.newHistory);
        setCharacterVisualIdentity(meta.characterVisualIdentity);
        setLocationVisualIdentity(meta.locationVisualIdentity);
        setIsGameOver(partialScene.isGameOver);
        setGameOverMessage(partialScene.gameOverMessage);

        // Reset conversation logs for new scene
        setConversationLogs({});

        // Loading is done for text — user can interact with choices/voice now
        setIsLoading(false);
      },

      onImageReady: (segmentIndex, imageDataUrl) => {
        // Update the specific segment's image in the scene history
        setSceneHistory(prev => {
          const updated = [...prev];
          const targetIdx = streamedSceneIdx >= 0 ? streamedSceneIdx : updated.length - 1;
          if (targetIdx >= 0 && targetIdx < updated.length) {
            const scene = { ...updated[targetIdx] };
            const segments = [...scene.segments];
            if (segmentIndex >= 0 && segmentIndex < segments.length) {
              segments[segmentIndex] = { ...segments[segmentIndex], image: imageDataUrl };
              scene.segments = segments;
              updated[targetIdx] = scene;
            }
          }
          return updated;
        });
      },

      onAllImagesReady: () => {
        setImagesLoading(false);
      },
    };

    try {
      const result = await getNextScene(storyHistory, fullChoice, settings, {
        characterVisualIdentity,
        locationVisualIdentity,
      }, knownCharacters, streamCallbacks);

      // Merge new character portraits with existing ones
      const updatedChars = result.newCharacterPortraits.length > 0
        ? [...knownCharacters, ...result.newCharacterPortraits]
        : knownCharacters;
      setKnownCharacters(updatedChars);

      // Final save with complete data (all images done)
      if (currentSaveId && settings.autoSave) {
        // Get latest scene history ref for saving
        const finalScenes = [...sceneHistory, result.scene];
        // But the streaming may have already added it, so check
        const saveIdx = streamedSceneIdx >= 0 ? streamedSceneIdx : finalScenes.length - 1;

        // Update the scene at the streamed index with final images
        setSceneHistory(prev => {
          const updated = [...prev];
          if (saveIdx >= 0 && saveIdx < updated.length) {
            updated[saveIdx] = result.scene;
          }
          return updated;
        });

        const newTurnCount = turnCount + 1;
        const updatedInv = [...new Set([...inventory, ...result.newInventory])]
          .filter(item => !(result.removedInventory || []).includes(item));

        // We need the final scene list for saving
        const scenesForSave = [...sceneHistory];
        if (saveIdx >= 0 && saveIdx < scenesForSave.length) {
          scenesForSave[saveIdx] = result.scene;
        } else {
          scenesForSave.push(result.scene);
        }

        await saveProgress(
          scenesForSave, saveIdx, updatedInv, result.quests, result.newHistory,
          currentSaveId, saveName, newTurnCount,
          result.scene.isGameOver, result.scene.gameOverMessage,
          result.characterVisualIdentity, result.locationVisualIdentity,
          updatedChars, {}
        );
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal melanjutkan cerita. ${errorMessage}`);
      setIsLoading(false);
    } finally {
      setImagesLoading(false);
    }
  }, [storyHistory, inventory, settings, currentSaveId, saveName, turnCount, sceneHistory, saveProgress, characterVisualIdentity, locationVisualIdentity, conversationLogs, knownCharacters]);

  /** Start mandatory voice chat (existing behavior) */
  const handleStartVoiceChat = useCallback(() => {
    if (currentScene?.voiceChat) {
      setActiveVoiceChatChar(currentScene.voiceChat);
      setVoiceChatMode('mandatory');
      setShowVoiceChat(true);
    }
  }, [currentScene]);

  /** Start optional voice chat with a specific talkable character */
  const handleStartOptionalTalk = useCallback((character: VoiceChatConfig) => {
    setActiveVoiceChatChar(character);
    setVoiceChatMode('optional');
    setShowVoiceChat(true);
  }, []);

  const handleVoiceChatComplete = useCallback((conversationSummary: string, messages: ChatMessage[]) => {
    setShowVoiceChat(false);

    if (voiceChatMode === 'mandatory') {
      // Mandatory mode: feed transcript as the next "choice" to continue story
      handleChoice(conversationSummary);
    } else {
      // Optional mode: store raw messages for this character so they can be restored
      if (activeVoiceChatChar) {
        const updatedLogs = {
          ...conversationLogs,
          [activeVoiceChatChar.characterName]: messages,
        };
        setConversationLogs(updatedLogs);

        // Auto-save with updated conversation logs
        if (currentSaveId && settings.autoSave) {
          saveProgress(
            sceneHistory, currentSceneIndex, inventory, quests, storyHistory,
            currentSaveId, saveName, turnCount,
            isGameOver, gameOverMessage,
            characterVisualIdentity, locationVisualIdentity,
            knownCharacters, updatedLogs
          );
        }
      }
    }

    setActiveVoiceChatChar(null);
  }, [voiceChatMode, handleChoice, activeVoiceChatChar, conversationLogs, currentSaveId, settings.autoSave, saveProgress, sceneHistory, currentSceneIndex, inventory, quests, storyHistory, saveName, turnCount, isGameOver, gameOverMessage, characterVisualIdentity, locationVisualIdentity, knownCharacters]);

  const handleVoiceChatCancel = useCallback(() => {
    setShowVoiceChat(false);
    setActiveVoiceChatChar(null);
  }, []);

  /** Build story context summary for voice chat memory continuity */
  const buildStoryContext = useCallback(() => {
    if (sceneHistory.length === 0) return '';
    // Take last 5 scenes to keep context manageable for Live API
    const recentScenes = sceneHistory.slice(-5);
    const startIdx = Math.max(0, sceneHistory.length - 5);

    const sceneSummaries = recentScenes.map((scene, i) =>
      `Babak ${startIdx + i + 1}: ${scene.segments.map(s => s.text).join(' ')}`
    ).join('\n\n');

    const inventoryText = inventory.length > 0
      ? `\nInventory pemain saat ini: ${inventory.join(', ')}`
      : '';

    const activeQuests = quests.filter(q => !q.completed);
    const questText = activeQuests.length > 0
      ? `\nQuest aktif: ${activeQuests.map(q => q.text).join(', ')}`
      : '';

    return `${sceneSummaries}${inventoryText}${questText}`;
  }, [sceneHistory, inventory, quests]);

  // 1. ASSET LOADER (First View)
  if (!assetsLoaded) {
    return <AssetLoader progress={loadProgress} currentFile={currentFile} onStart={handleEnterWorld} />;
  }

  // 2. HOME VIEW
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
        <SettingsPage 
          settings={settings} 
          onChange={handleSettingsChange} 
          onBack={popView}
          musicVolume={musicVolume}
          onVolumeChange={setMusicVolume}
        />
      </PageTransition>
    );
  }

  // SAVED GAMES VIEW
  if (view === 'saved-games') {
    return (
      <PageTransition viewKey="saved-games">
        <SavedGamesPage onLoadGame={handleLoadGame} onBack={popView} />
      </PageTransition>
    );
  }

  // GENRE PICKER VIEW
  if (view === 'genre-picker') {
    return (
      <PageTransition viewKey="genre-picker">
        <GenrePicker onSelectGenre={handleSelectGenre} onBack={popView} />
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
          knownCharacters={knownCharacters}
          highlightCharacter={currentScene?.highlightCharacter}
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
          <div className="flex-shrink-0 relative">
            <div className="px-4 pt-4">
              <div className="w-full max-w-4xl mx-auto p-4 rounded-lg" style={{
                background: 'linear-gradient(180deg, rgba(40,18,12,0.85) 0%, rgba(25,10,8,0.9) 100%)',
                border: '1px solid rgba(160,100,60,0.35)',
                boxShadow: '0 0 20px rgba(160,100,60,0.08), inset 0 1px 0 rgba(201,168,76,0.05)',
              }}>
                <p style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '0.8rem',
                  color: '#c9a84c',
                  marginBottom: '4px',
                  letterSpacing: '0.05em',
                }}>
                  Terjadi Kesalahan
                </p>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '0.9rem',
                  color: 'rgba(200,160,120,0.7)',
                  lineHeight: 1.5,
                }}>
                  {error}
                </p>
              </div>
            </div>
            {/* Gradient fade below error banner */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '60px',
              background: 'linear-gradient(to bottom, rgba(10, 7, 3, 0.95) 0%, rgba(10, 7, 3, 0) 100%)',
              pointerEvents: 'none',
              zIndex: 9999999,
              transform: 'translateY(100%)',
            }} />
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
          /* Start screen — fades out, then shows typewriter loader */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {!showStartLoader ? (
              <div className={`text-center ${startFadingOut ? 'start-screen-exit' : ''}`}>
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
                  <span className="flex items-center gap-2"><IconSwords size={18} /> Mulai Petualangan <IconSwords size={18} /></span>
                </button>
              </div>
            ) : (
              <MedievalTypewriterLoader />
            )}
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

            {/* Fixed bottom: choices or voice chat trigger (only on latest scene, not during initial generation) */}
            {isViewingLatest && !(isLoading && sceneHistory.length === 0) && (
              <div className="game-bottom-bar-wrapper">
                <div className="game-bottom-bar">
                  <ChoiceButtons
                    choices={currentScene?.choices || []}
                    onChoice={handleChoice}
                    isLoading={isLoading}
                    isGameOver={isGameOver}
                    onBackToMenu={handleBackToMenu}
                    voiceChat={currentScene?.voiceChat}
                    onStartVoiceChat={handleStartVoiceChat}
                    talkableCharacters={currentScene?.talkableCharacters}
                    onStartOptionalTalk={handleStartOptionalTalk}
                    conversationLogs={conversationLogs}
                    scrollContainerRef={storyScrollRef}
                  />
                </div>
              </div>
            )}

            {/* Voice Chat Overlay (both mandatory and optional modes) */}
            {showVoiceChat && activeVoiceChatChar && (
              <div className="voice-chat-overlay">
              <VoiceChatPanel
                  voiceChat={activeVoiceChatChar}
                  onComplete={handleVoiceChatComplete}
                  onCancel={handleVoiceChatCancel}
                  previousMessages={conversationLogs[activeVoiceChatChar.characterName]}
                  storyContext={buildStoryContext()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
