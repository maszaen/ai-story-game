
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { decodeAudioData } from './utils/audio';
import { WordHighlighter } from './components/WordHighlighter';
import { LoaderIcon, PlayIcon, StopIcon, SpeakerIcon } from './components/icons';

const App: React.FC = () => {
  const [text, setText] = useState<string>('Hello, world! This is a demonstration of real-time text-to-speech with word highlighting, powered by Gemini.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const wordTimestampsRef = useRef<number[]>([]);
  const playbackStartTimeRef = useRef<number>(0);

  const cleanupPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    cancelAnimationFrame(animationFrameIdRef.current);
    setIsPlaying(false);
    setHighlightedWordIndex(-1);
  }, []);

  const handleStop = () => {
    cleanupPlayback();
  };

  const handleGenerateAndPlay = async () => {
    if (isLoading || isPlaying) return;
    if (!text.trim()) {
      setError("Please enter some text to synthesize.");
      return;
    }
    
    cleanupPlayback();
    setError(null);
    setIsLoading(true);

    try {
      const base64Audio = await generateSpeech(text);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current, 24000, 1);
      
      // --- Calculate word timestamps for highlighting ---
      const words = text.trim().split(/\s+/);
      const totalNonSpaceChars = text.replace(/\s+/g, '').length;
      const timePerChar = audioBuffer.duration / totalNonSpaceChars;
      
      let charCount = 0;
      wordTimestampsRef.current = words.map(word => {
          const startTime = charCount * timePerChar;
          charCount += word.length;
          return startTime;
      });
      // --- End of timestamp calculation ---

      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBuffer;
      audioSourceRef.current.connect(audioContextRef.current.destination);
      audioSourceRef.current.onended = cleanupPlayback;

      playbackStartTimeRef.current = audioContextRef.current.currentTime;
      audioSourceRef.current.start(0);
      setIsPlaying(true);
      
      const tick = () => {
        if (!audioContextRef.current) return;
        const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current;
        
        const timestamps = wordTimestampsRef.current;
        let currentIndex = timestamps.findIndex(time => time > elapsedTime) -1;
        if (currentIndex === -2) { // all timestamps are less than elapsed, so it must be the last word
            currentIndex = timestamps.length - 1;
        }
        currentIndex = Math.max(0, currentIndex);

        setHighlightedWordIndex(currentIndex);
        animationFrameIdRef.current = requestAnimationFrame(tick);
      };
      tick();

    } catch (e: any) {
      setError(`Failed to generate speech: ${e.message}`);
      console.error(e);
      cleanupPlayback();
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    return () => {
      cleanupPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanupPlayback]);

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <header className="flex items-center space-x-3">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
            <SpeakerIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AI Speech Synthesizer</h1>
            <p className="text-gray-500">Bring your text to life with Gemini.</p>
          </div>
        </header>

        <div className="space-y-4">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
            Enter your text
          </label>
          <textarea
            id="text-input"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isPlaying || isLoading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Type or paste your text here..."
          />
        </div>
        
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px]">
          <WordHighlighter text={text} highlightedIndex={highlightedWordIndex} />
        </div>

        <div className="flex justify-center pt-2">
            {!isPlaying ? (
                <button
                    onClick={handleGenerateAndPlay}
                    disabled={isLoading}
                    className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-wait transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />
                            Synthesizing...
                        </>
                    ) : (
                        <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Start Playback
                        </>
                    )}
                </button>
            ) : (
                <button
                    onClick={handleStop}
                    className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105"
                >
                    <StopIcon className="w-5 h-5 mr-2" />
                    Stop Playback
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
