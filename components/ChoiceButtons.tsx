import React from 'react';
import type { Choice } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
  isGameOver: boolean;
  onBackToMenu: () => void;
}

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onChoice, isLoading, isGameOver, onBackToMenu }) => {
  if (isGameOver) {
    return (
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
    );
  }

  return (
    <div className="flex-shrink-0 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center parchment-bg-light p-5 rounded-lg">
            <LoadingSpinner />
            <span
              className="ml-4 glow-pulse"
              style={{
                fontFamily: "'Cinzel', serif",
                color: "#c9a84c",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
              }}
            >
              Menunggu takdirmu...
            </span>
          </div>
        ) : choices.length > 0 ? (
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
                  onClick={() => onChoice(choice.text)}
                  disabled={isLoading}
                  className="btn-choice rounded-lg choice-enter flex items-start text-left"
                >
                  <span
                    className="mr-2 mt-1 shrink-0"
                    style={{
                      color: "rgba(201,168,76,0.6)",
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
  );
};
