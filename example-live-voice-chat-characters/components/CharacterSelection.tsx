
import React from 'react';
import { CHARACTERS } from '../constants';
import { Character } from '../types';

interface CharacterSelectionProps {
  onCharacterSelect: (character: Character) => void;
  onGoToSettings: () => void;
}

const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onCharacterSelect, onGoToSettings }) => {
  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 flex-grow">
          Choose Your Companion
        </h1>
        <button onClick={onGoToSettings} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Settings">
            <SettingsIcon />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {CHARACTERS.map((character) => (
          <button
            key={character.id}
            onClick={() => onCharacterSelect(character)}
            className="group bg-gray-800 rounded-lg p-6 text-left shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 flex items-start space-x-4"
          >
            <img src={character.avatar} alt={character.name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 group-hover:border-indigo-500 transition-colors" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white">{character.name}</h2>
              <p className="text-sm font-medium text-indigo-400 mt-1 mb-2">{character.tagline}</p>
              <p className="text-gray-400">{character.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;
