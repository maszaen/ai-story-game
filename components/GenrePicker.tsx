import React from 'react';
import { GENRES, type Genre } from '../constants';
import { GENRE_ICONS, IconSwords } from './Icons';

interface GenrePickerProps {
  onSelectGenre: (genre: Genre) => void;
  onBack: () => void;
}

export const GenrePicker: React.FC<GenrePickerProps> = ({ onSelectGenre, onBack }) => {
  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #1a0e05 0%, #0d0704 60%, #000 100%)",
      }}
    >
      {/* Decorative corners */}
      <div
        className="absolute top-0 left-0 w-16 h-16 md:w-32 md:h-32 opacity-30"
        style={{
          borderTop: "3px solid #c9a84c",
          borderLeft: "3px solid #c9a84c",
          margin: "10px",
        }}
      />
      <div
        className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 opacity-30"
        style={{
          borderTop: "3px solid #c9a84c",
          borderRight: "3px solid #c9a84c",
          margin: "10px",
        }}
      />

      {/* Fixed header */}
      <div className="flex-shrink-0 flex flex-col items-center px-4 pt-4 relative z-10">
        <div className="w-full max-w-3xl mt-4 md:mt-6 mb-3 md:mb-4">
          <button
            onClick={onBack}
            className="text-amber-600 hover:text-amber-400 transition-colors flex items-center gap-2"
            style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem" }}
          >
            ← Kembali
          </button>
        </div>

        <div className="text-center mb-3 md:mb-4">
          <div className="mb-2 md:mb-3">
            <span
              className="text-amber-700 text-xs md:text-sm tracking-[0.4em] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Pilih Perjalananmu
            </span>
          </div>
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              color: "#c9a84c",
              textShadow: "0 0 30px rgba(201, 168, 76, 0.2)",
            }}
          >
            Genre Petualangan
          </h1>
          <p
            className="text-amber-800/60 text-xs md:text-sm italic max-w-md mx-auto"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            "Setiap genre membawa dunia yang berbeda. Pilih takdirmu."
          </p>
        </div>
      </div>

      {/* Scrollable genre grid */}
      <div
        className="flex-1 overflow-y-auto relative px-4 pb-8"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#c9a84c33 transparent",
        }}
      >
        <div
          className="sticky top-0 left-0 right-0 h-6 pointer-events-none z-[999] -mb-6"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,7,4,1) 0%, rgba(13,7,4,0) 100%)",
          }}
        />
        <div className="w-full max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 pt-8">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onSelectGenre(genre)}
              className="group relative p-4 rounded-lg border border-amber-900/40 hover:border-amber-600/70 transition-all duration-300 text-left overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, rgba(25,18,8,0.8) 0%, rgba(15,10,5,0.95) 100%)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(201,168,76,0.08) 0%, transparent 70%)",
                }}
              />

              <div className="relative z-10">
                <div className="mb-2" style={{ color: "rgba(201,168,76,0.6)" }}>
                  {(() => {
                    const Icon = GENRE_ICONS[genre.id];
                    return Icon ? <Icon size={28} /> : <IconSwords size={28} />;
                  })()}
                </div>
                <h3
                  className="text-amber-500 font-semibold group-hover:text-amber-400 transition-colors mb-1"
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem" }}
                >
                  {genre.name}
                </h3>
                <p
                  className="text-amber-800/50 text-xs leading-relaxed group-hover:text-amber-700/60 transition-colors"
                  style={{ fontFamily: "'Crimson Text', serif" }}
                >
                  {genre.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
