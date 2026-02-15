import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech, decodeAudioData } from '../services/speechService';

interface SpeakableTextProps {
  text: string;
}

/**
 * A story text paragraph with an inline Play/Stop button that triggers TTS
 * with real-time word highlighting. Medieval-themed UI.
 */
export const SpeakableText: React.FC<SpeakableTextProps> = ({ text }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const wordTimestampsRef = useRef<number[]>([]);
  const playbackStartTimeRef = useRef<number>(0);

  const cleanupPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (_) { /* already stopped */ }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    cancelAnimationFrame(animationFrameIdRef.current);
    setStatus('idle');
    setHighlightedWordIndex(-1);
  }, []);

  const handlePlay = async () => {
    if (status === 'loading') return;
    if (status === 'playing') {
      cleanupPlayback();
      return;
    }

    cleanupPlayback();
    setStatus('loading');

    try {
      const base64Audio = await generateSpeech(text);

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = decodeAudioData(base64Audio, audioContextRef.current, 24000, 1);

      // Calculate word timestamps for highlighting
      const words = text.trim().split(/\s+/);
      const totalNonSpaceChars = text.replace(/\s+/g, '').length;
      const timePerChar = audioBuffer.duration / totalNonSpaceChars;

      let charCount = 0;
      wordTimestampsRef.current = words.map(word => {
        const startTime = charCount * timePerChar;
        charCount += word.length;
        return startTime;
      });

      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBuffer;
      audioSourceRef.current.connect(audioContextRef.current.destination);
      audioSourceRef.current.onended = cleanupPlayback;

      playbackStartTimeRef.current = audioContextRef.current.currentTime;
      audioSourceRef.current.start(0);
      setStatus('playing');

      // Word highlight animation loop
      const tick = () => {
        if (!audioContextRef.current) return;
        const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current;

        const timestamps = wordTimestampsRef.current;
        let currentIndex = timestamps.findIndex(time => time > elapsedTime) - 1;
        if (currentIndex === -2) {
          // All timestamps are less than elapsed → last word
          currentIndex = timestamps.length - 1;
        }
        currentIndex = Math.max(0, currentIndex);

        setHighlightedWordIndex(currentIndex);
        animationFrameIdRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e: any) {
      console.error('TTS error:', e);
      cleanupPlayback();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanupPlayback]);

  // Split text into words and whitespace, preserving original formatting
  const wordsAndSpaces = text.split(/(\s+)/);

  return (
    <p className="story-text whitespace-pre-wrap">
      {/* Inline play/stop button — looks like part of the text */}
      <span
        onClick={handlePlay}
        className={`speech-btn ${status === 'playing' ? 'speech-btn-playing' : ''} ${status === 'loading' ? 'speech-btn-loading' : ''}`}
        title={status === 'playing' ? 'Hentikan narasi' : 'Dengarkan narasi'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePlay(); }}
      >
        {status === 'loading' ? (
          <svg className="speech-btn-icon speech-btn-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        ) : status === 'playing' ? (
          <svg className="speech-btn-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="4" width="3.5" height="12" rx="0.8" />
            <rect x="11.5" y="4" width="3.5" height="12" rx="0.8" />
          </svg>
        ) : (
          <svg className="speech-btn-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 4.2a.8.8 0 0 1 1.2-.69l8 4.8a.8.8 0 0 1 0 1.38l-8 4.8A.8.8 0 0 1 6.5 13.8V4.2Z" />
          </svg>
        )}
      </span>
      {/* Rendered text with word highlighting */}
      {wordsAndSpaces.map((segment, index) => {
        const wordIndex = Math.floor(index / 2);
        const isWord = segment.trim() !== '';
        const isHighlighted = isWord && status === 'playing' && wordIndex === highlightedWordIndex;

        return (
          <span
            key={index}
            className={isHighlighted ? 'speech-word-highlight' : ''}
          >
            {segment}
          </span>
        );
      })}
    </p>
  );
};
