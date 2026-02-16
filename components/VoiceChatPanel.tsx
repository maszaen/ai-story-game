import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import type { VoiceChatConfig, ChatMessage } from '../types';
import { getApiKey } from '../services/apiKey';
import { decodeBase64ToBytes, decodeAudioData, createPcmBlob } from '../services/liveVoiceService';

interface VoiceChatPanelProps {
  voiceChat: VoiceChatConfig;
  onComplete: (conversationSummary: string, messages: ChatMessage[]) => void;
  onCancel: () => void;
  /** Previous messages to restore when re-opening a conversation */
  previousMessages?: ChatMessage[];
}

/** Local interface for the live session object (not exported from SDK) */
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const MicIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
  </svg>
);

const StopIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({ voiceChat, onComplete, onCancel, previousMessages }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    previousMessages && previousMessages.length > 0
      ? 'Lanjutkan percakapan — ketuk mikrofon'
      : 'Ketuk mikrofon untuk mulai berdiskusi'
  );
  const [transcript, setTranscript] = useState<ChatMessage[]>(
    // Restore previous conversation or start fresh with initial dialogue
    previousMessages && previousMessages.length > 0
      ? previousMessages
      : [{ id: 0, sender: 'character', text: voiceChat.initialDialogue }]
  );
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Use a ref as the single source of truth for the streaming message
  // to avoid React batching / stale closure issues in onmessage callbacks
  const streamingRef = useRef<ChatMessage | null>(null);
  const lastCommittedIdRef = useRef<number>(-1);
  const transcriptRef = useRef<ChatMessage[]>(transcript);

  // Keep transcriptRef in sync
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  /** Commit the current streaming message to transcript (dedup by id) */
  const commitStreaming = useCallback(() => {
    const msg = streamingRef.current;
    if (msg && msg.text.trim() && msg.id !== lastCommittedIdRef.current) {
      lastCommittedIdRef.current = msg.id;
      setTranscript(t => [...t, msg]);
    }
    streamingRef.current = null;
    setStreamingMessage(null);
  }, []);

  // Audio refs
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, streamingMessage]);

  const stopSession = useCallback(async () => {
    setStatusMessage('Diskusi berakhir.');
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
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch { /* ignore */ }
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
    setStatusMessage('Membuka gerbang komunikasi...');
    setHasStarted(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const apiKey = getApiKey();
      if (!apiKey) throw new Error('API Key belum diatur');
      const ai = new GoogleGenAI({ apiKey });

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
            setStatusMessage('Berbicara...');
            setIsSessionActive(true);

            mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (ev) => {
              const inputData = ev.inputBuffer.getChannelData(0);
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

            // User speech transcription
            if (inputChunk) {
              const prev = streamingRef.current;
              // If we were accumulating a character message, commit it first
              if (prev && prev.sender === 'character') {
                commitStreaming();
              }
              // Append to existing user message or start new one
              const existing = streamingRef.current;
              const newText = (existing && existing.sender === 'user') ? existing.text + inputChunk : inputChunk;
              const newMsg: ChatMessage = {
                id: (existing && existing.sender === 'user') ? existing.id : Date.now(),
                sender: 'user',
                text: newText,
              };
              streamingRef.current = newMsg;
              setStreamingMessage(newMsg);
            }

            // Character speech transcription
            if (outputChunk) {
              const prev = streamingRef.current;
              // If we were accumulating a user message, commit it first
              if (prev && prev.sender === 'user') {
                commitStreaming();
              }
              // Append to existing character message or start new one
              const existing = streamingRef.current;
              const newText = (existing && existing.sender === 'character') ? existing.text + outputChunk : outputChunk;
              const newMsg: ChatMessage = {
                id: (existing && existing.sender === 'character') ? existing.id : Date.now(),
                sender: 'character',
                text: newText,
              };
              streamingRef.current = newMsg;
              setStreamingMessage(newMsg);
            }

            // Turn complete — commit whatever is currently streaming
            if (message.serverContent?.turnComplete) {
              commitStreaming();
            }

            // Play audio response
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decodeBase64ToBytes(base64Audio),
                outputAudioContextRef.current,
                24000, 1
              );
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
            console.error('Voice chat error:', e);
            setStatusMessage(`Kesalahan: ${e.message}. Coba lagi.`);
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceChat.voiceName } },
          },
          systemInstruction: voiceChat.systemInstruction,
        },
      });
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setStatusMessage('Gagal mengakses mikrofon. Periksa izin browser.');
    }
  }, [voiceChat, stopSession, commitStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopSession(); };
  }, [stopSession]);

  const handleEndDiscussion = useCallback(() => {
    // Commit any pending streaming message before compiling
    if (streamingRef.current && streamingRef.current.text.trim()) {
      commitStreaming();
    }
    stopSession();

    // Use the ref for the most up-to-date transcript (state may be stale in closure)
    const allMessages = [...transcriptRef.current];
    // Also include streamingRef just in case commitStreaming's setState hasn't flushed
    const pending = streamingRef.current;
    if (pending && pending.text.trim() && pending.id !== lastCommittedIdRef.current) {
      allMessages.push(pending);
    }

    // Skip the pre-populated initial dialogue (index 0) to avoid duplication
    const conversationMessages = allMessages.filter((_, i) => i > 0);
    const transcriptText = conversationMessages
      .map(m => `${m.sender === 'user' ? 'Pemain' : voiceChat.characterName}: ${m.text}`)
      .join('\n');

    onComplete(
      `[Pemain berdiskusi langsung dengan ${voiceChat.characterName} (${voiceChat.characterRole})]\n` +
      `${voiceChat.characterName} memulai percakapan: "${voiceChat.initialDialogue}"\n\n` +
      `Isi diskusi:\n${transcriptText}\n\n` +
      `[Diskusi selesai — lanjutkan cerita berdasarkan hasil percakapan dan keputusan yang dibuat di atas]`,
      allMessages
    );
  }, [voiceChat, onComplete, stopSession, commitStreaming]);

  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const characterInitial = voiceChat.characterName.charAt(0).toUpperCase();

  return (
    <div className="voice-chat-panel">
      {/* Character Header */}
      <div className="voice-chat-header">
        <div className="voice-chat-avatar">
          {characterInitial}
        </div>
        <div className="voice-chat-header-info">
          <span className="voice-chat-name">{voiceChat.characterName}</span>
          <span className="voice-chat-role">{voiceChat.characterRole}</span>
        </div>
        {hasStarted && (
          <button
            onClick={handleEndDiscussion}
            className="voice-chat-end-btn"
          >
            Selesai Berdiskusi →
          </button>
        )}
        {!hasStarted && (
          <button
            onClick={onCancel}
            className="voice-chat-back-btn"
          >
            ← Kembali
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="voice-chat-messages">
        {transcript.map((msg) => (
          <div key={msg.id} className={`voice-chat-bubble ${msg.sender === 'user' ? 'vc-bubble-user' : 'vc-bubble-char'}`}>
            {msg.sender === 'character' && (
              <span className="vc-bubble-sender">{voiceChat.characterName}</span>
            )}
            {msg.sender === 'user' && (
              <span className="vc-bubble-sender vc-sender-user">Kamu</span>
            )}
            <p>{msg.text}</p>
          </div>
        ))}
        {streamingMessage && streamingMessage.text && (
          <div className={`voice-chat-bubble ${streamingMessage.sender === 'user' ? 'vc-bubble-user' : 'vc-bubble-char'}`}>
            {streamingMessage.sender === 'character' && (
              <span className="vc-bubble-sender">{voiceChat.characterName}</span>
            )}
            {streamingMessage.sender === 'user' && (
              <span className="vc-bubble-sender vc-sender-user">Kamu</span>
            )}
            <p>
              {streamingMessage.text}
              <span className="vc-typing-cursor">|</span>
            </p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Controls */}
      <div className="voice-chat-controls">
        <span className="voice-chat-status">{statusMessage}</span>
        <div className="voice-chat-actions">
          <button
            onClick={handleToggleSession}
            className={`voice-chat-mic-btn ${isSessionActive ? 'vc-mic-active' : ''}`}
            title={isSessionActive ? 'Hentikan mikrofon' : 'Mulai berbicara'}
          >
            <div className={`voice-chat-mic-inner ${isSessionActive ? 'vc-mic-inner-active' : ''}`}>
              {isSessionActive ? <StopIcon size={24} /> : <MicIcon size={24} />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
