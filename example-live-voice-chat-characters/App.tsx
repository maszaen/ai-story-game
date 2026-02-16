
import React, { useState, useCallback } from 'react';
import { Character, UserSettings } from './types';
import CharacterSelection from './components/CharacterSelection';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';

type View = 'selection' | 'chat' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('selection');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('user-settings', {
    name: '',
    gender: '',
    interests: '',
    background: '',
  });

  const handleCharacterSelect = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setCurrentView('chat');
  }, []);

  const handleNavigate = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return selectedCharacter && (
          <ChatView
            character={selectedCharacter}
            userSettings={userSettings}
            onBack={() => handleNavigate('selection')}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={userSettings}
            onSave={setUserSettings}
            onBack={() => handleNavigate('selection')}
          />
        );
      case 'selection':
      default:
        return (
          <CharacterSelection
            onCharacterSelect={handleCharacterSelect}
            onGoToSettings={() => handleNavigate('settings')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 max-w-4xl">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
