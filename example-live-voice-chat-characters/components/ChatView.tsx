import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: `LiveSession` is not an exported member of `@google/genai`.
// `Blob` is imported for use in the local `LiveSession` interface.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Character, UserSettings, ChatMessage } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../services/geminiService';

interface ChatViewProps {
  character: Character;
  userSettings: UserSettings;
  onBack: () => void;
}

// FIX: Define a local interface for the live session object as `LiveSession` is not exported from the SDK.
// This interface is based on the methods used in this component (`sendRealtimeInput`, `close`).
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const MicIcon: React.FC<{ listening: boolean }> = ({ listening }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${listening ? 'text-red-500' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
  </svg>
);

const ChatView: React.FC<ChatViewProps> = ({ character, userSettings, onBack }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click start to begin conversation');
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  
  const buildSystemInstruction = useCallback(() => {
    let instruction = character.systemInstruction;
    const userDetails: string[] = [];
    if (userSettings.name) userDetails.push(`Their name is ${userSettings.name}.`);
    if (userSettings.gender) userDetails.push(`They identify as ${userSettings.gender}.`);
    if (userSettings.interests) userDetails.push(`Their interests include ${userSettings.interests}.`);
    if (userSettings.background) userDetails.push(`Here is some background information they have shared: "${userSettings.background}".`);
    
    if (userDetails.length > 0) {
      instruction += `\n\nHere is some information about the user you are talking to. Use this to personalize the conversation: ${userDetails.join(' ')}`;
    }
    return instruction;
  }, [character.systemInstruction, userSettings]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, streamingMessage]);

  const stopSession = useCallback(async () => {
    setStatusMessage('Session ended.');
    setIsSessionActive(false);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }

    if(sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
        sessionPromiseRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
     if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    setTranscript([]);
    setStreamingMessage(null);
    setStatusMessage('Initializing...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputGainNodeRef.current = outputAudioContextRef.current.createGain();
      outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatusMessage('Connection open. Start speaking.');
            setIsSessionActive(true);
            
            mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current!.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const inputChunk = message.serverContent?.inputTranscription?.text;
            const outputChunk = message.serverContent?.outputTranscription?.text;
    
            if (inputChunk) {
                setStreamingMessage(prev => {
                    if (prev && prev.sender === 'model' && prev.text.trim()) {
                        setTranscript(t => [...t, prev]);
                    }
                    const newText = (prev && prev.sender === 'user') ? prev.text + inputChunk : inputChunk;
                    return { id: Date.now(), sender: 'user', text: newText };
                });
            }
        
            if (outputChunk) {
                setStreamingMessage(prev => {
                    if (prev && prev.sender === 'user' && prev.text.trim()) {
                        setTranscript(t => [...t, prev]);
                    }
                    const newText = (prev && prev.sender === 'model') ? prev.text + outputChunk : outputChunk;
                    return { id: Date.now(), sender: 'model', text: newText };
                });
            }
        
            if (message.serverContent?.turnComplete) {
                setStreamingMessage(prev => {
                    if (prev && prev.text.trim()) {
                        setTranscript(t => [...t, prev]);
                    }
                    return null;
                });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGainNodeRef.current!);
              source.addEventListener('ended', () => sources.delete(source));
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
              sources.add(source);
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatusMessage(`Error: ${e.message}. Please try again.`);
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: character.voice } },
          },
          systemInstruction: buildSystemInstruction(),
        },
      });

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatusMessage('Error: Could not access microphone.');
    }
  }, [character.voice, buildSystemInstruction, stopSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);


  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gray-800 rounded-lg shadow-2xl">
      <header className="flex items-center p-4 border-b border-gray-700">
        <button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors" aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src={character.avatar} alt={character.name} className="w-12 h-12 rounded-full object-cover" />
        <div className="ml-4">
          <h2 className="text-xl font-semibold">{character.name}</h2>
          <p className="text-sm text-gray-400">{character.tagline}</p>
        </div>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
            {transcript.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                        <p>{msg.text}</p>
                    </div>
                </div>
            ))}
            {streamingMessage && streamingMessage.text && (
                 <div className={`flex ${streamingMessage.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${streamingMessage.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                         <p>
                             {streamingMessage.text}
                             <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-1 align-middle"></span>
                         </p>
                     </div>
                 </div>
            )}
            <div ref={transcriptEndRef} />
        </div>
      </main>

      <footer className="p-4 border-t border-gray-700 flex flex-col items-center">
        <p className="text-sm text-gray-400 mb-4 h-5">{statusMessage}</p>
        <button
            onClick={handleToggleSession}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isSessionActive ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-green-500/20 hover:bg-green-500/30'}`}
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isSessionActive ? 'bg-red-500' : 'bg-green-500'}`}>
                <MicIcon listening={isSessionActive} />
            </div>
        </button>
      </footer>
    </div>
  );
};

export default ChatView;