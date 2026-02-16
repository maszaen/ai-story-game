import React, { useState, useMemo } from 'react';
import type { QuestItem, CharacterPortrait } from '../types';
import { IconSkull, IconBook, IconScroll, IconSword, IconCheck, IconDiamond, IconChevronLeft, IconChevronRight, IconPeopleGroup } from './Icons';

interface SidebarProps {
  inventory: string[];
  quests: QuestItem[];
  onBackToMenu: () => void;
  saveName: string;
  turnCount: number;
  /** Scene history navigation */
  totalScenes: number;
  currentSceneIndex: number;
  onNavigateScene: (index: number) => void;
  isGameOver: boolean;
  knownCharacters: CharacterPortrait[];
  highlightCharacter?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  inventory, quests, onBackToMenu, saveName, turnCount,
  totalScenes, currentSceneIndex, onNavigateScene, isGameOver,
  knownCharacters, highlightCharacter,
}) => {
  const isViewingHistory = currentSceneIndex < totalScenes - 1;
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  // Order characters: highlighted first, then main character, then others
  const orderedCharacters = useMemo(() => {
    if (knownCharacters.length === 0) return [];
    const sorted = [...knownCharacters];
    sorted.sort((a, b) => {
      // Highlighted character goes first
      if (highlightCharacter) {
        if (a.name === highlightCharacter && b.name !== highlightCharacter) return -1;
        if (b.name === highlightCharacter && a.name !== highlightCharacter) return 1;
      }
      // Main character next
      if (a.isMainCharacter && !b.isMainCharacter) return -1;
      if (b.isMainCharacter && !a.isMainCharacter) return 1;
      return 0;
    });
    return sorted;
  }, [knownCharacters, highlightCharacter]);

  const visibleCharacters = orderedCharacters.slice(0, 4);
  const hasMore = orderedCharacters.length > 4;

  return (
    <aside className="game-sidebar">
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        className="btn-medieval text-xs py-2 px-4 rounded self-start flex-shrink-0"
        style={{ fontSize: '0.7rem' }}
      >
        ← Kembali ke Menu
      </button>

      {/* Save info */}
      <div className="flex-shrink-0">
        <h3 className="heading-medieval text-xs mb-1" style={{ fontSize: '0.65rem', color: 'rgba(201,168,76,0.5)' }}>
          Petualangan
        </h3>
        <p style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', fontSize: '0.85rem' }}>
          {saveName}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span style={{ color: 'rgba(180,160,120,0.4)', fontSize: '0.75rem' }}>
            Giliran ke-{turnCount}
          </span>
          {isGameOver && (
            <span style={{
              color: '#8b1a1a',
              fontSize: '0.65rem',
              fontFamily: "'Cinzel', serif",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              <IconSkull size={12} /> Tamat
            </span>
          )}
        </div>
      </div>

      {/* Scene History Navigation */}
      {totalScenes > 1 && (
        <>
          <div className="ornate-divider flex-shrink-0">
            <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '10px' }}>✦</span>
          </div>
          <div className="flex-shrink-0">
            <h2 className="heading-medieval text-sm mb-2 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
              <span style={{ fontSize: '14px' }}><IconBook size={14} /></span>
              Riwayat Babak
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateScene(Math.max(0, currentSceneIndex - 1))}
                disabled={currentSceneIndex <= 0}
                className="btn-medieval py-1 px-2 rounded text-xs disabled:opacity-30"
                style={{ fontSize: '0.7rem' }}
              >
                <IconChevronLeft size={14} />
              </button>
              <span style={{
                color: isViewingHistory ? 'rgba(201,168,76,0.8)' : 'rgba(180,160,120,0.5)',
                fontSize: '0.8rem',
                fontFamily: "'Cinzel', serif",
                minWidth: '60px',
                textAlign: 'center',
              }}>
                {currentSceneIndex + 1} / {totalScenes}
              </span>
              <button
                onClick={() => onNavigateScene(Math.min(totalScenes - 1, currentSceneIndex + 1))}
                disabled={currentSceneIndex >= totalScenes - 1}
                className="btn-medieval py-1 px-2 rounded text-xs disabled:opacity-30"
                style={{ fontSize: '0.7rem' }}
              >
                <IconChevronRight size={14} />
              </button>
            </div>
            {isViewingHistory && (
              <button
                onClick={() => onNavigateScene(totalScenes - 1)}
                className="btn-medieval py-1 px-3 rounded text-xs mt-2 w-full"
                style={{ fontSize: '0.65rem' }}
              >
                ↪ Ke babak terbaru
              </button>
            )}
          </div>
        </>
      )}

      {/* Divider */}
      <div className="ornate-divider flex-shrink-0">
        <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '10px' }}>✦</span>
      </div>

      {/* Known Characters Gallery */}
      {orderedCharacters.length > 0 && (
        <>
          <div className="flex-shrink-0">
            <h2 className="heading-medieval text-sm mb-3 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
              <span style={{ fontSize: '14px' }}><IconPeopleGroup size={14} /></span>
              Karakter yang Dikenal
            </h2>
            <div className="char-gallery-grid">
              {visibleCharacters.map((char) => (
                <div
                  key={char.id}
                  className={`char-portrait-cell${char.name === highlightCharacter ? ' char-highlighted' : ''}${char.isMainCharacter ? ' char-main' : ''}`}
                  title={`${char.name}\n${char.role}`}
                >
                  {char.portraitBase64 ? (
                    <img
                      src={`data:image/png;base64,${char.portraitBase64}`}
                      alt={char.name}
                      className="char-portrait-img"
                    />
                  ) : (
                    <div className="char-portrait-placeholder">?</div>
                  )}
                  <div className="char-portrait-name">{char.name}</div>
                  {char.isMainCharacter && (
                    <div className="char-badge-main" title="Karakter Utama">★</div>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowAllCharacters(true)}
                className="char-see-more-btn"
              >
                Selengkapnya ({orderedCharacters.length - 4} lagi)
              </button>
            )}
          </div>

          <div className="ornate-divider flex-shrink-0">
            <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '10px' }}>✦</span>
          </div>
        </>
      )}

      {/* Full Character Overlay */}
      {showAllCharacters && (
        <div className="char-overlay-backdrop" onClick={() => setShowAllCharacters(false)}>
          <div className="char-overlay-panel" onClick={(e) => e.stopPropagation()}>
            <div className="char-overlay-header">
              <h2 className="heading-medieval" style={{ fontSize: '0.9rem', margin: 0, color: '#c9a84c' }}>
                Karakter yang Dikenal
              </h2>
              <button
                onClick={() => setShowAllCharacters(false)}
                className="char-overlay-close"
              >
                ✕
              </button>
            </div>
            <div className="char-overlay-list">
              {orderedCharacters.map((char) => (
                <div key={char.id} className="char-overlay-item">
                  <div className="char-overlay-portrait">
                    {char.portraitBase64 ? (
                      <img
                        src={`data:image/png;base64,${char.portraitBase64}`}
                        alt={char.name}
                        className="char-portrait-img"
                      />
                    ) : (
                      <div className="char-portrait-placeholder">?</div>
                    )}
                  </div>
                  <div className="char-overlay-info">
                    <div className="char-overlay-name">
                      {char.name}
                      {char.isMainCharacter && <span className="char-badge-inline">★ Utama</span>}
                    </div>
                    <div className="char-overlay-role">{char.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quests */}
      <div className="flex-shrink-0">
        <h2 className="heading-medieval text-sm mb-3 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
          <span style={{ fontSize: '14px' }}><IconScroll size={14} /></span>
          Quest
        </h2>
        <div className="space-y-2">
          {quests.length > 0 ? (
            quests.map((quest, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded"
                style={{
                  padding: '6px 10px',
                  border: `1px solid ${quest.completed ? 'rgba(100,160,80,0.25)' : 'rgba(201,168,76,0.12)'}`,
                  background: quest.completed ? 'rgba(60,100,40,0.1)' : 'rgba(20,14,8,0.5)',
                  opacity: quest.completed ? 0.7 : 1,
                }}
              >
                <span style={{
                  color: quest.completed ? '#6a9a50' : 'rgba(201,168,76,0.5)',
                  fontSize: '14px',
                  flexShrink: 0,
                  marginBottom: '5px',
                  marginTop: '3px',
                }}>
                  {quest.completed ? <IconCheck size={14} /> : <IconDiamond size={12} />}
                </span>
                <span style={{
                  fontFamily: "'Crimson Text', serif",
                  color: quest.completed ? 'rgba(150,180,130,0.7)' : '#b8a882',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  textDecoration: quest.completed ? 'line-through' : 'none',
                }}>
                  {quest.text}
                </span>
              </div>
            ))
          ) : (
            <p style={{
              color: 'rgba(180,160,120,0.35)',
              fontStyle: 'italic',
              fontFamily: "'Crimson Text', serif",
              fontSize: '0.85rem',
            }}>
              Belum ada quest.
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="ornate-divider flex-shrink-0">
        <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '10px' }}>✦</span>
      </div>

      {/* Inventory */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <h2 className="heading-medieval text-sm mb-3 flex items-center gap-2" style={{ fontSize: '0.75rem' }}>
          <span style={{ fontSize: '14px' }}><IconSword size={14} /></span>
          Inventaris
        </h2>
        <div className="space-y-2">
          {inventory.length > 0 ? (
            inventory.map((item, index) => (
              <div key={index} className="inventory-item rounded">
                {item}
              </div>
            ))
          ) : (
            <p style={{
              color: 'rgba(180,160,120,0.35)',
              fontStyle: 'italic',
              fontFamily: "'Crimson Text', serif",
              fontSize: '0.85rem',
            }}>
              Inventarismu kosong.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
