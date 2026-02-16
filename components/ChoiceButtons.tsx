import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Choice, VoiceChatConfig, ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoice: (choice: string) => void;
  isLoading: boolean;
  isGameOver: boolean;
  onBackToMenu: () => void;
  /** Mandatory voice chat config (no choices shown) */
  voiceChat?: VoiceChatConfig | null;
  onStartVoiceChat?: () => void;
  /** Optional talkable characters (shown alongside choices) */
  talkableCharacters?: VoiceChatConfig[];
  onStartOptionalTalk?: (character: VoiceChatConfig) => void;
  /** Accumulated conversation messages per character */
  conversationLogs?: Record<string, ChatMessage[]>;
  /** Ref to the story scroll container for auto-collapse logic */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
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

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  choices, onChoice, isLoading, isGameOver, onBackToMenu,
  voiceChat, onStartVoiceChat,
  talkableCharacters, onStartOptionalTalk, conversationLogs,
  scrollContainerRef,
}) => {
  // Track which choice was clicked for exit animation
  const [exitingChoice, setExitingChoice] = useState<number | null>(null);
  const [showContent, setShowContent] = useState(true);

  // Collapse/expand state
  const [collapsed, setCollapsed] = useState(true);
  // Auto-collapse arming: becomes true once user has scrolled to bottom after expanding
  const autoCollapseArmedRef = useRef(false);

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

  // Auto-collapse on scene change (choices array reference changes)
  const prevChoicesRef = useRef(choices);
  useEffect(() => {
    if (choices !== prevChoicesRef.current) {
      setCollapsed(true);
      autoCollapseArmedRef.current = false;
      prevChoicesRef.current = choices;
    }
  }, [choices]);

  // Determine if scroll is near bottom
  const isNearBottom = useCallback((el: HTMLElement, offset = 50) => {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= offset;
  }, []);

  // Handle expand click
  const handleExpand = useCallback(() => {
    setCollapsed(false);
    // Never arm immediately — always require scrolling to bottom first.
    // This avoids the bug where expanding from bottom shrinks clientHeight,
    // inflating distanceFromBottom past the threshold before user even scrolls.
    autoCollapseArmedRef.current = false;
  }, []);

  // Scroll listener for auto-collapse
  useEffect(() => {
    if (collapsed) return;
    const el = scrollContainerRef?.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const threshold50 = clientHeight * 0.5;

      if (!autoCollapseArmedRef.current) {
        // Not yet armed — watch for reaching bottom
        if (distanceFromBottom <= 50) {
          autoCollapseArmedRef.current = true;
        }
      } else {
        // Armed — collapse when scrolling up past 50% from bottom
        if (distanceFromBottom > threshold50) {
          setCollapsed(true);
          autoCollapseArmedRef.current = false;
        }
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [collapsed, scrollContainerRef]);

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

  // Voice Chat mode — show mic button instead of choices (no collapse for mandatory)
  if (voiceChat && !isLoading && exitingChoice === null) {
    return (
      <AnimatedHeight>
        <div className="flex-shrink-0 p-4">
          <div className="w-full max-w-4xl mx-auto">
            <div className="voice-chat-trigger parchment-bg-light rounded-lg p-5">
              <p
                className="text-center mb-1"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "rgba(201,168,76,0.5)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Diskusi Langsung
              </p>
              <p
                className="text-center mb-4"
                style={{
                  fontFamily: "'Crimson Text', serif",
                  color: "rgba(180,160,120,0.5)",
                  fontSize: "0.75rem",
                  fontStyle: "italic",
                }}
              >
                Scene ini memerlukan percakapan dengan karakter
              </p>
              <div className="flex flex-col items-center">
                <button
                  onClick={onStartVoiceChat}
                  className="voice-trigger-btn group"
                >
                  <div className="voice-trigger-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="voice-trigger-label">
                    Diskusi dengan {voiceChat.characterName}
                  </span>
                </button>
                <span
                  className="mt-3"
                  style={{
                    fontFamily: "'Crimson Text', serif",
                    color: "rgba(201,168,76,0.3)",
                    fontSize: "0.7rem",
                    fontStyle: "italic",
                  }}
                >
                  Gunakan mikrofon untuk berbicara langsung
                </span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedHeight>
    );
  }

  // Check if there are talkable characters for optional talk mode
  const hasTalkableChars = talkableCharacters && talkableCharacters.length > 0 && !isLoading && exitingChoice === null;

  // Count how many characters have been talked to
  const chatCount = conversationLogs ? Object.keys(conversationLogs).length : 0;

  // Determine if we should show the collapse button (only for non-loading, non-gameover, with actual choices)
  const canCollapse = !isLoading && exitingChoice === null && showContent && choices.length > 0 && !voiceChat;

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
            <>
              {/* Collapsed: single expand button */}
              {canCollapse && collapsed ? (
                <button
                  onClick={handleExpand}
                  className="choice-collapse-btn w-full rounded-lg choice-enter"
                >
                  <span className="choice-collapse-label" style={{ color: '#c9a84c' }}>Pilih aksi selanjutnya</span>
                  <span className="choice-collapse-chevron" style={{ color: '#c9a84c' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </span>
                </button>
              ) : (
                /* Expanded: full choices */
                <div className={`space-y-3 ${!collapsed ? 'choices-expand-enter' : ''}`}>
                  {/* Collapse button */}
                  {canCollapse && (
                    <button
                      onClick={() => { setCollapsed(true); autoCollapseArmedRef.current = false; }}
                      className="choice-collapse-btn choice-collapse-btn--active w-full rounded-lg"
                    >
                      <span className="choice-collapse-label" style={{ color: '#c9a84c' }}>Sembunyikan pilihan</span>
                      <span className="choice-collapse-chevron choice-collapse-chevron--open" style={{ color: '#c9a84c' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </span>
                    </button>
                  )}

                  {/* Optional talk buttons — shown above choices when talkable NPCs exist */}
                  {hasTalkableChars && (
                    <div className="optional-talk-section">
                      {/* <p
                        className="text-center mb-2"
                        style={{
                          fontFamily: "'Cinzel', serif",
                          color: "rgba(201,168,76,0.5)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}
                      >
                        Ajak Bicara
                      </p> */}
                      <div className="optional-talk-buttons">
                        {talkableCharacters!.map((char, idx) => {
                          const hasPreviousChat = conversationLogs && conversationLogs[char.characterName];
                          return (
                            <button
                              key={idx}
                              onClick={() => onStartOptionalTalk?.(char)}
                              className="optional-talk-btn"
                              title={char.characterRole}
                            >
                              <div className="optional-talk-avatar">
                                {char.characterName.charAt(0).toUpperCase()}
                              </div>
                              <div className="optional-talk-info">
                                <span className="optional-talk-name">{char.characterName}</span>
                                <span className="optional-talk-role">{char.characterRole}</span>
                              </div>
                              <div className="optional-talk-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
                                </svg>
                                {hasPreviousChat && (
                                  <span className="optional-talk-badge" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {chatCount > 0 && (
                        <p
                          className="text-center mt-2"
                          style={{
                            fontFamily: "'Crimson Text', serif",
                            color: "rgba(201,168,76,0.35)",
                            fontSize: "0.7rem",
                            fontStyle: "italic",
                          }}
                        >
                          {chatCount} percakapan tercatat — bisa dilanjutkan atau pilih jalanmu
                        </p>
                      )}
                    </div>
                  )}

                  {/* Divider between talk buttons and choices */}
                  {hasTalkableChars && (
                    <div className="optional-talk-divider">
                      <span>atau</span>
                    </div>
                  )}

                  {/* <p
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
                  </p> */}
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

                  {/* 4th option: continue based on conversation plans — only when there are conversation logs */}
                  {chatCount > 0 && (
                    <button
                      onClick={() => handleChoiceClick(
                        "[Lanjutkan cerita sesuai percakapan dan rencana yang telah dibicarakan dengan karakter-karakter di atas]",
                        choices.length
                      )}
                      disabled={isLoading || exitingChoice !== null}
                      className={`btn-choice rounded-lg flex items-start text-left w-full ${
                        exitingChoice !== null && exitingChoice !== choices.length
                          ? "choice-exit-fade"
                          : ""
                      } ${exitingChoice === choices.length ? "choice-exit-selected" : ""}`}
                    >
                      <span
                        className="mr-2 mt-1 shrink-0"
                        style={{
                          color: "#c9a84c",
                          fontFamily: "'Cinzel', serif",
                          fontSize: "0.7rem",
                        }}
                      >
                        IV.
                      </span>
                      <span>Lanjut sesuai percakapan dan rencana yang telah dibicarakan</span>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </AnimatedHeight>
  );
};
