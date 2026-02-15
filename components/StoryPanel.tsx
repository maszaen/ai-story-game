import React, { useState, useCallback, useEffect } from 'react';
import type { Scene } from '../types';
import { IconSkull } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface StoryPanelProps {
  scene: Scene | null;
  isLoading: boolean;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({ scene, isLoading }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [lightboxClosing, setLightboxClosing] = useState(false);

  const closeLightbox = useCallback(() => {
    setLightboxClosing(true);
    setTimeout(() => {
      setExpandedImage(null);
      setLightboxClosing(false);
    }, 250);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!expandedImage) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expandedImage, closeLightbox]);

  if (isLoading) {
    return null;
  }

  if (!scene) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto scene-enter" key={scene.segments.map(s => s.text.slice(0, 30)).join('|')}>
          {scene.segments.map((segment, index) => (
            <div key={index} className="mb-2 stagger-child">
              {/* Image */}
              {segment.image && (
                <div
                  className="medieval-frame cursor-pointer group image-reveal"
                  onClick={() => setExpandedImage(segment.image)}
                >
                  <div className="relative w-full aspect-video overflow-hidden" style={{ background: '#0a0705' }}>
                    <img
                      src={segment.image}
                      alt={`Adegan ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ opacity: 0.92 }}
                    />
                    {/* Vignette */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
                      }}
                    />
                    {/* Expand hint */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity"
                      style={{ color: '#c9a84c', fontSize: '0.7rem', fontFamily: "'Cinzel', serif" }}>
                      Klik untuk perbesar
                    </div>
                  </div>
                </div>
              )}

              {/* Text */}
              <div className="px-6 md:px-8 py-4">
                <p className="story-text whitespace-pre-wrap">{segment.text}</p>
              </div>

              {/* Segment divider (not after last) */}
              {index < scene.segments.length - 1 && (
                <div className="ornate-divider mx-6">
                  <span style={{ color: 'rgba(201,168,76,0.35)', fontSize: '10px' }}>◆</span>
                </div>
              )}
            </div>
          ))}

          {/* Game Over banner */}
          {scene.isGameOver && (
            <div className="mx-6 mb-6 p-6 rounded-lg text-center game-over-enter" style={{
              background: 'linear-gradient(180deg, rgba(80, 10, 10, 0.4) 0%, rgba(40, 5, 5, 0.6) 100%)',
              border: '1px solid rgba(139, 26, 26, 0.5)',
            }}>
              <h2 style={{
                fontFamily: "'Cinzel Decorative', serif",
                color: '#8b1a1a',
                fontSize: '2rem',
                textShadow: '0 0 20px rgba(139, 26, 26, 0.3)',
                marginBottom: '12px',
              }}>
                <span className="flex items-center justify-center gap-3"><IconSkull size={28} /> GAME OVER <IconSkull size={28} /></span>
              </h2>
              <p style={{
                fontFamily: "'Crimson Text', serif",
                color: '#d4a0a0',
                fontStyle: 'italic',
                fontSize: '1.1rem',
                lineHeight: '1.7',
              }}>
                {scene.gameOverMessage}
              </p>
            </div>
          )}
      </div>

      {/* Fullscreen image overlay with animation */}
      {expandedImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center cursor-pointer p-4 ${lightboxClosing ? 'lightbox-overlay-exit' : 'lightbox-overlay-enter'}`}
          onClick={closeLightbox}
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          <img
            src={expandedImage}
            alt="Gambar diperbesar"
            className={`max-w-full max-h-full object-contain rounded ${lightboxClosing ? 'lightbox-image-exit' : 'lightbox-image-enter'}`}
            style={{ boxShadow: '0 0 80px rgba(201,168,76,0.15), 0 0 200px rgba(0,0,0,0.8)' }}
          />
          <div className={`absolute top-4 right-4 ${lightboxClosing ? 'lightbox-image-exit' : 'lightbox-image-enter'}`} style={{
            color: 'rgba(201,168,76,0.6)',
            fontFamily: "'Cinzel', serif",
            fontSize: '0.8rem',
          }}>
            Klik untuk tutup
          </div>
        </div>
      )}
    </>
  );
};
