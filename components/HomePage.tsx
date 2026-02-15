
import React, { useState, useEffect } from 'react';
import { getAllSaves, deleteSave, type SaveData } from '../services/database';
import { hasApiKey } from '../services/apiKey';
import { IconSwords, IconGear, IconSkull, IconShield } from './Icons';

interface HomePageProps {
  onNewGame: () => void;
  onLoadGame: (save: SaveData) => void;
  onOpenSettings: () => void;
  onOpenSavedGames: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNewGame, onLoadGame, onOpenSettings, onOpenSavedGames }) => {
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = async () => {
    setLoading(true);
    try {
      const allSaves = await getAllSaves();
      setSaves(allSaves);
    } catch (e) {
      console.error('Failed to load saves:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSave(id);
      setSaves(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Failed to delete save:', e);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="h-screen flex flex-col items-center p-4 pt-12 md:pt-4 relative overflow-y-auto overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #1a0e05 0%, #0d0704 60%, #000 100%)",
      }}
    >
      {/* Decorative corners */}
      <div
        className="fixed top-0 left-0 w-16 h-16 md:w-32 md:h-32 opacity-30 pointer-events-none"
        style={{
          borderTop: "3px solid #c9a84c",
          borderLeft: "3px solid #c9a84c",
          margin: "10px",
        }}
      />
      <div
        className="fixed top-0 right-0 w-16 h-16 md:w-32 md:h-32 opacity-30 pointer-events-none"
        style={{
          borderTop: "3px solid #c9a84c",
          borderRight: "3px solid #c9a84c",
          margin: "10px",
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-16 h-16 md:w-32 md:h-32 opacity-30 pointer-events-none"
        style={{
          borderBottom: "3px solid #c9a84c",
          borderLeft: "3px solid #c9a84c",
          margin: "10px",
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-16 h-16 md:w-32 md:h-32 opacity-30 pointer-events-none"
        style={{
          borderBottom: "3px solid #c9a84c",
          borderRight: "3px solid #c9a84c",
          margin: "10px",
        }}
      />

      {/* Flexible spacer — centers content vertically when it fits */}
      <div className="flex-auto" />

      {/* Title Section */}
      <div className="text-center mb-6 md:mb-10 z-10">
        <div className="mb-4">
          <span
            className="text-amber-700 text-sm md:text-lg tracking-[0.5em] uppercase font-medium"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <IconSwords size={18} /> Infinite <IconSwords size={18} />
          </span>
        </div>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-3 tracking-wider"
          style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
            color: "#c9a84c",
            textShadow:
              "0 0 40px rgba(201, 168, 76, 0.3), 0 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          ADVENTURE
        </h1>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-700" />
          <span
            className="text-amber-600 text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Mesin Petualangan Tanpa Batas
          </span>
          <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-700" />
        </div>
        <p
          className="text-amber-900/70 text-sm italic max-w-md mx-auto"
          style={{ fontFamily: "'Crimson Text', serif" }}
        >
          "Setiap pilihan membentuk takdirmu. Setiap jalan menuntun ke
          petualangan baru."
        </p>
      </div>

      {/* API Key Warning */}
      {!hasApiKey() && (
        <div
          className="w-full max-w-md z-10 mb-6 stagger-child"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="ornate-divider mx-4 mb-3">
            <span style={{ color: "rgba(139,26,26,0.5)", fontSize: "10px" }}>
              ◆
            </span>
          </div>
          <div
            className="parchment-bg rounded-lg p-5 text-center"
            style={{
              borderColor: "rgba(139, 26, 26, 0.3)",
            }}
          >
            <p
              className="mb-1"
              style={{
                fontFamily: "'Cinzel', serif",
                color: "rgba(201,168,76,0.7)",
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Kunci Gerbang Diperlukan
            </p>
            <p
              className="mb-3"
              style={{
                fontFamily: "'Crimson Text', serif",
                color: "rgba(180,160,120,0.6)",
                fontSize: "0.85rem",
                fontStyle: "italic",
              }}
            >
              Masukkan Gemini API Key di Pengaturan untuk membuka gerbang
              petualangan.
            </p>
            <button
              onClick={onOpenSettings}
              className="btn-medieval rounded px-5 py-2"
              style={{ fontSize: "0.7rem" }}
            >
              Buka Pengaturan
            </button>
          </div>
          <div className="ornate-divider mx-4 mt-3">
            <span style={{ color: "rgba(139,26,26,0.5)", fontSize: "10px" }}>
              ◆
            </span>
          </div>
        </div>
      )}

      {/* New Game Button */}
      <button
        onClick={onNewGame}
        disabled={!hasApiKey()}
        className={`group relative mb-4 z-10 ${
          !hasApiKey() ? "opacity-40 cursor-not-allowed" : ""
        }`}
      >
        <div className="absolute inset-0 bg-amber-700/20 rounded blur-xl group-hover:bg-amber-700/40 transition-all duration-500" />
        <div
          className="relative px-12 py-4 rounded border-2 border-amber-700/60 hover:border-amber-500 transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, rgba(30,20,10,0.9) 0%, rgba(15,10,5,0.95) 100%)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          <span className="text-amber-500 text-lg tracking-widest uppercase group-hover:text-amber-400 transition-colors flex items-center gap-2">
            <IconSwords size={18} /> Petualangan Baru <IconSwords size={18} />
          </span>
        </div>
      </button>

      {/* Settings Button */}
      <button onClick={onOpenSettings} className="group mb-10 z-10">
        <div
          className="relative px-8 py-2.5 rounded border border-amber-900/40 hover:border-amber-700/60 transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(12,8,4,0.8) 100%)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          <span className="text-amber-500 text-sm tracking-widest uppercase group-hover:text-amber-400 transition-colors flex items-center gap-2">
            <IconGear size={14} /> Pengaturan
          </span>
        </div>
      </button>

      {/* Saved Games */}
      <div className="w-full max-w-2xl z-10 px-1">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-800/50" />
          <h2
            className="text-amber-600 text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Petualangan Tersimpan
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-800/50" />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-amber-700/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : saves.length === 0 ? (
          <div
            className="text-center py-8 border border-amber-900/30 rounded-lg"
            style={{ background: "rgba(15,10,5,0.6)" }}
          >
            <p
              className="text-amber-800/60 italic"
              style={{ fontFamily: "'Crimson Text', serif" }}
            >
              Belum ada petualangan tersimpan. Mulailah perjalanan baru!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {saves.slice(0, 2).map((save, index) => (
                <div
                  key={save.id}
                  className="group border border-amber-900/40 rounded-lg overflow-hidden hover:border-amber-700/60 transition-all duration-300 cursor-pointer stagger-child"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(25,18,8,0.8) 0%, rgba(15,10,5,0.9) 100%)",
                    animationDelay: `${0.3 + index * 0.1}s`,
                  }}
                  onClick={() => onLoadGame(save)}
                >
                  <div className="flex items-stretch">
                    {/* Thumbnail */}
                    <div className="w-28 h-20 flex-shrink-0 bg-amber-950/30 overflow-hidden">
                      {save.thumbnail ? (
                        <img
                          src={save.thumbnail}
                          alt=""
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-800/40 text-2xl">
                          <IconShield size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 px-4 py-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-amber-500 font-semibold truncate"
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          {save.name}
                        </h3>
                        <span className="text-amber-800/60 text-xs ml-2 flex-shrink-0">
                          Giliran ke-{save.turnCount}
                        </span>
                      </div>
                      <p
                        className="text-amber-700/60 text-xs mt-1 truncate"
                        style={{ fontFamily: "'Crimson Text', serif" }}
                      >
                        {save.quests
                          ?.filter((q) => !q.completed)
                          .map((q) => q.text)
                          .join(" • ") || "Petualangan menanti..."}
                      </p>
                      {save.isGameOver && (
                        <span
                          className="text-xs mt-1 inline-flex items-center gap-1"
                          style={{
                            color: "#8b1a1a",
                            fontFamily: "'Cinzel', serif",
                            fontSize: "0.6rem",
                            letterSpacing: "0.1em",
                          }}
                        >
                          <IconSkull size={12} /> TAMAT
                        </span>
                      )}
                      <p className="text-amber-900/50 text-xs mt-1">
                        {formatDate(save.updatedAt)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <div className="flex items-center pr-3 flex-shrink-0">
                      {deleteConfirm === save.id ? (
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDelete(save.id)}
                            className="text-red-500 hover:text-red-400 text-xs px-2 py-1 border border-red-800 rounded hover:bg-red-900/30 transition-colors"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-amber-600 hover:text-amber-500 text-xs px-2 py-1 border border-amber-800 rounded hover:bg-amber-900/30 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(save.id);
                          }}
                          className="text-amber-900/40 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                          title="Hapus"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* "View All" button when more than 2 saves */}
            {saves.length > 2 && (
              <div
                className="text-center mt-4 stagger-child"
                style={{ animationDelay: "0.5s" }}
              >
                <button
                  onClick={onOpenSavedGames}
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded border border-amber-900/40 hover:border-amber-700/60 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(20,14,8,0.7) 0%, rgba(12,8,4,0.8) 100%)",
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  <span className="text-amber-500 text-sm tracking-widest uppercase group-hover:text-amber-400 transition-colors">
                    Lihat Semua ({saves.length})
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center z-10 mt-8 mb-4">
        <p
          className="text-amber-900/40 text-xs tracking-wider"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Dibuat dengan AI ✦ Gemini
        </p>
      </div>

      {/* Flexible spacer — bottom */}
      <div className="flex-auto" />
    </div>
  );
};
