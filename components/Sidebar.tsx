import React from 'react';
import type { QuestItem } from '../types';
import { IconSkull, IconBook, IconScroll, IconSword, IconCheck, IconDiamond, IconChevronLeft, IconChevronRight } from './Icons';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  inventory, quests, onBackToMenu, saveName, turnCount,
  totalScenes, currentSceneIndex, onNavigateScene, isGameOver,
}) => {
  const isViewingHistory = currentSceneIndex < totalScenes - 1;

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
                className="flex items-start gap-2 rounded"
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
                  marginTop: '1px',
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
