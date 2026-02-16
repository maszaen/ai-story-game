
import React, { useState } from 'react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onBack }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
       <header className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors" aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Personalize Your Experience
        </h1>
      </header>
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g., Alex"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">Your Gender</label>
          <input
            type="text"
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g., Male, Female, Non-binary"
          />
        </div>
        <div>
          <label htmlFor="interests" className="block text-sm font-medium text-gray-300 mb-2">Your Interests</label>
          <textarea
            id="interests"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g., hiking, coding, sci-fi movies"
          />
        </div>
        <div>
          <label htmlFor="background" className="block text-sm font-medium text-gray-300 mb-2">Things your companion should know about you</label>
          <textarea
            id="background"
            name="background"
            value={formData.background}
            onChange={handleChange}
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g., I'm a student from California. I have a pet dog named Sparky."
          />
        </div>
        <div className="flex items-center justify-end">
            {saved && <span className="text-green-400 mr-4 transition-opacity">Saved!</span>}
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition">
                Save Settings
            </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
