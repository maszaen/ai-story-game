import React from 'react';
import { GENRES, type Genre } from '../constants';
import { GENRE_ICONS, IconSwords } from './Icons';

interface GenrePickerProps {
  onSelectGenre: (genre: Genre) => void;
  onBack: () => void;
}

export const GenrePicker: React.FC<GenrePickerProps> = ({ onSelectGenre, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0e05 0%, #0d0704 60%, #000 100%)' }}>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-30"
        style={{ borderTop: '3px solid #c9a84c', borderLeft: '3px solid #c9a84c', margin: '20px' }} />
      <div className="absolute top-0 right-0 w-32 h-32 opacity-30"
        style={{ borderTop: '3px solid #c9a84c', borderRight: '3px solid #c9a84c', margin: '20px' }} />

      {/* Back button */}
      <div className="w-full max-w-3xl z-10 mt-6 mb-4">
        <button
          onClick={onBack}
          className="text-amber-600 hover:text-amber-400 transition-colors flex items-center gap-2"
          style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}
        >
          ← Kembali
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8 z-10">
        <div className="mb-3">
          <span className="text-amber-700 text-sm tracking-[0.4em] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
            Pilih Perjalananmu
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider mb-2"
          style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
            color: '#c9a84c',
            textShadow: '0 0 30px rgba(201, 168, 76, 0.2)',
          }}>
          Genre Petualangan
        </h1>
        <p className="text-amber-800/60 text-sm italic max-w-md mx-auto" style={{ fontFamily: "'Crimson Text', serif" }}>
          "Setiap genre membawa dunia yang berbeda. Pilih takdirmu."
        </p>
      </div>

      {/* Genre grid */}
      <div className="w-full max-w-3xl z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-10">
        {GENRES.map(genre => (
          <button
            key={genre.id}
            onClick={() => onSelectGenre(genre)}
            className="group relative p-4 rounded-lg border border-amber-900/40 hover:border-amber-600/70 transition-all duration-300 text-left overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(25,18,8,0.8) 0%, rgba(15,10,5,0.95) 100%)',
            }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />

            <div className="relative z-10">
              <div className="mb-2" style={{ color: 'rgba(201,168,76,0.6)' }}>
                {(() => { const Icon = GENRE_ICONS[genre.id]; return Icon ? <Icon size={28} /> : <IconSwords size={28} />; })()}
              </div>
              <h3 className="text-amber-500 font-semibold group-hover:text-amber-400 transition-colors mb-1"
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}>
                {genre.name}
              </h3>
              <p className="text-amber-800/50 text-xs leading-relaxed group-hover:text-amber-700/60 transition-colors"
                style={{ fontFamily: "'Crimson Text', serif" }}>
                {genre.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
