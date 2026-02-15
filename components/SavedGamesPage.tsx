import React, { useState, useEffect } from 'react';
import { getAllSaves, deleteSave, type SaveData } from '../services/database';
import { IconSkull, IconShield, IconScroll } from './Icons';

interface SavedGamesPageProps {
  onLoadGame: (save: SaveData) => void;
  onBack: () => void;
}

export const SavedGamesPage: React.FC<SavedGamesPageProps> = ({ onLoadGame, onBack }) => {
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

      {/* Fixed header: back button + title */}
      <div className="flex-shrink-0 flex flex-col items-center px-4 pt-4 relative z-10">
        <div className="w-full max-w-2xl mt-6 mb-4">
          <button
            onClick={onBack}
            className="text-amber-600 hover:text-amber-400 transition-colors flex items-center gap-2"
            style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem" }}
          >
            ← Kembali
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="mb-3">
            <span
              className="text-amber-700 text-sm tracking-[0.4em] uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Arsip Petualangan
            </span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              color: "#c9a84c",
              textShadow: "0 0 30px rgba(201, 168, 76, 0.2)",
            }}
          >
            <IconScroll
              size={28}
              style={{
                display: "inline-block",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            />
            Petualangan Tersimpan
          </h1>
          <p
            className="text-amber-800/60 text-sm italic max-w-md mx-auto"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            {saves.length > 0
              ? `${saves.length} petualangan tercatat dalam arsip`
              : "Arsip masih kosong"}
          </p>
        </div>
      </div>

      {/* Scrollable saves list */}
      <div
        className="flex-1 overflow-y-auto relative px-4 pb-8"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#c9a84c33 transparent",
        }}
      >
        {/* Gradient fade overlay at top of scroll area */}
        <div
          className="sticky top-0 left-0 right-0 h-8 pointer-events-none z-10 -mb-8"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,7,4,1) 0%, rgba(13,7,4,0) 100%)",
          }}
        />
        <div
          className="w-full max-w-2xl mx-auto mt-8"
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-2 border-amber-700/30 border-t-amber-500 rounded-full animate-spin" />
              <p
                className="mt-4 text-amber-700/50 text-sm"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Memuat arsip...
              </p>
            </div>
          ) : saves.length === 0 ? (
            <div
              className="text-center py-16 border border-amber-900/30 rounded-lg"
              style={{ background: "rgba(15,10,5,0.6)" }}
            >
              <IconShield
                size={48}
                style={{
                  display: "inline-block",
                  color: "rgba(201,168,76,0.2)",
                  marginBottom: "12px",
                }}
              />
              <p
                className="text-amber-800/60 italic"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Belum ada petualangan tersimpan. Mulailah perjalanan baru!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {saves.map((save, index) => (
                <div
                  key={save.id}
                  className="group border border-amber-900/40 rounded-lg overflow-hidden hover:border-amber-700/60 transition-all duration-300 cursor-pointer stagger-child"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(25,18,8,0.8) 0%, rgba(15,10,5,0.9) 100%)",
                    animationDelay: `${index * 0.07}s`,
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
          )}
        </div>
      </div>
    </div>
  );
};
