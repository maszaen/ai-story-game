import React from 'react';
import { IconScroll } from './Icons';

interface AssetLoaderProps {
  progress: number; // 0-100
  currentFile: string;
  onStart: () => void;
}

export const AssetLoader: React.FC<AssetLoaderProps> = ({ progress, currentFile, onStart }) => {
  const isComplete = progress === 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0e05 0%, #0d0704 60%, #000 100%)',
      }}
    >
      {/* Blurred background elements for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-amber-900/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[20%] right-[20%] w-80 h-80 bg-amber-700/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative text-center w-full max-w-2xl animate-pulse-slow px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-widest text-[#c9a84c] drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
            style={{ fontFamily: "'Cinzel Decorative', cursive" }}>
          AI INFINITY
        </h1>
        <p className="text-amber-800/60 text-xs md:text-sm tracking-[0.4em] mb-10 uppercase font-serif">
          Choose Your Own Path
        </p>

        {/* <div className="mb-8 flex justify-center transform scale-125" style={{ color: '#c9a84c' }}>
          <IconScroll size={48} />
        </div> */}
        
        {isComplete ? (
          <></>
        ) : (
          <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-widest text-[#f0e6d2]" 
              style={{ fontFamily: "'Cinzel', serif" }}>
            MENYIAPKAN CERITA
          </h2>
        )}
        
        {!isComplete ? (
          <>
            <p className="text-amber-800/80 italic mb-8"
              style={{ fontFamily: "'Crimson Text', serif", fontSize: '1.1rem' }}>
              Mendownload dan menyiapkan aset... {progress}%
            </p>

            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-[#1a1005] border border-[#5c3a10] rounded-full overflow-hidden shadow-inner p-[1px]">
              {/* Progress Bar Fill */}
              <div 
                className="h-full bg-gradient-to-r from-[#946c29] via-[#c9a84c] to-[#946c29] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(201, 168, 76, 0.5)' }}
              />
            </div>

            <p className="text-[#8b5a2b] text-xs mt-3 h-4" 
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>
              {currentFile ? `Memuat: ${currentFile}` : '...'}
            </p>
          </>
        ) : (
          <div className="mt-8 animate-in fade-in zoom-in duration-500">
            <button
              onClick={onStart}
              className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-300 transform"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-900/0 via-amber-600/20 to-amber-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 border border-[#c9a84c]/30 group-hover:border-[#c9a84c] transition-colors duration-300" />
              
              <span className="relative z-10 text-[#c9a84c] text-lg tracking-[0.2em] font-bold uppercase group-hover:text-[#f0e6d2] transition-colors"
                    style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Mulai Petualangan
              </span>
            </button>
            <p className="text-amber-800/60 text-xs mt-4 italic">
              Klik untuk menyalakan audio & masuk
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
