import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Choice } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
  isGameOver: boolean;
  onBackToMenu: () => void;
}

/**
 * Wrapper that smoothly animates height changes between its children.
 * Measures the inner content and transitions height via CSS.
 */
const AnimatedHeight: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const firstRender = useRef(true);

  const measure = useCallback(() => {
    if (innerRef.current) {
      const h = innerRef.current.scrollHeight;
      setHeight(h);
    }
  }, []);

  // Measure on every render of children
  useEffect(() => {
    // Skip transition on very first mount
    if (firstRender.current) {
      measure();
      firstRender.current = false;
      return;
    }
    measure();
  });

  // Also observe resize
  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        transition: firstRender.current ? 'none' : 'height 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
      }}
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  );
};

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onChoice, isLoading, isGameOver, onBackToMenu }) => {
  // Track which choice was clicked for exit animation
  const [exitingChoice, setExitingChoice] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(true);

  const handleChoiceClick = (choice: string, index: number) => {
    setExitingChoice(index);
    setShowContent(false);
    // Small delay for the exit animation, then fire the actual choice
    setTimeout(() => {
      onChoice(choice);
      setExitingChoice(null);
    }, 350);
  };

  // Reset show state when loading finishes and new choices appear
  useEffect(() => {
    if (!isLoading && choices.length > 0) {
      setShowContent(true);
    }
  }, [isLoading, choices.length]);

  if (isGameOver) {
    return (
      <AnimatedHeight>
        <div className="flex-shrink-0 p-4">
          <div className="w-full max-w-4xl mx-auto text-center">
            <p className="mb-4" style={{
              fontFamily: "'Cinzel', serif",
              color: 'rgba(139,26,26,0.7)',
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              Petualangan ini telah berakhir
            </p>
            <button
              onClick={onBackToMenu}
              className="btn-medieval rounded-lg px-8 py-3"
              style={{ borderColor: 'rgba(139,26,26,0.4)' }}
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </AnimatedHeight>
    );
  }

  return (
    <AnimatedHeight>
      <div className="flex-shrink-0 p-4">
        <div className="w-full max-w-4xl mx-auto">
          {isLoading || exitingChoice !== null ? (
            <div className="flex flex-col items-center justify-center parchment-bg-light p-5 rounded-lg choice-loader-enter">
              <LoadingSpinner />
              <span
                className="mt-4 glow-pulse"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "#c9a84c",
                  fontSize: "0.8rem",
                  letterSpacing: "0.12em",
                }}
              >
                Merangkai takdirmu...
              </span>
              <span
                className="mt-1"
                style={{
                  fontFamily: "'Crimson Text', serif",
                  color: "rgba(201,168,76,0.35)",
                  fontSize: "0.75rem",
                  fontStyle: "italic",
                }}
              >
                Bintang-bintang sedang berputar
              </span>
            </div>
          ) : showContent && choices.length > 0 ? (
            <div className="space-y-3">
              <p
                className="text-center mb-2"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "rgba(201,168,76,0.5)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Pilih jalanmu
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoiceClick(choice.text, index)}
                    disabled={isLoading || exitingChoice !== null}
                    className={`btn-choice rounded-lg choice-enter flex items-start text-left ${
                      exitingChoice !== null && exitingChoice !== index
                        ? "choice-exit-fade"
                        : ""
                    } ${exitingChoice === index ? "choice-exit-selected" : ""}`}
                  >
                    <span
                      className="mr-2 mt-1 shrink-0"
                      style={{
                        color: "#c9a84c",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.7rem",
                      }}
                    >
                      {["I", "II", "III"][index] || index + 1}.
                    </span>
                    <span>{choice.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AnimatedHeight>
  );
};
