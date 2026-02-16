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
  /** Story context from previous scenes for memory continuity */
  storyContext?: string;
}

/** Local interface for the live session object (not exported from SDK) */
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  sendClientContent(content: { turns: Array<{ role: string; parts: Array<{ text: string }> }> }): void;
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

const MicMutedIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .87-.16 1.71-.46 2.49" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const KeyboardIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="14" rx="2" ry="2" />
    <line x1="6" y1="8" x2="6.01" y2="8" />
    <line x1="10" y1="8" x2="10.01" y2="8" />
    <line x1="14" y1="8" x2="14.01" y2="8" />
    <line x1="18" y1="8" x2="18.01" y2="8" />
    <line x1="6" y1="12" x2="6.01" y2="12" />
    <line x1="10" y1="12" x2="10.01" y2="12" />
    <line x1="14" y1="12" x2="14.01" y2="12" />
    <line x1="18" y1="12" x2="18.01" y2="12" />
    <line x1="8" y1="16" x2="16" y2="16" />
  </svg>
);

const SendIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({ voiceChat, onComplete, onCancel, previousMessages, storyContext }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Membuka gerbang komunikasi...');
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>(
    // Restore previous conversation or start fresh with initial dialogue
    previousMessages && previousMessages.length > 0
      ? previousMessages
      : [{ id: 0, sender: 'character', text: voiceChat.initialDialogue }]
  );
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
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

      // Build enhanced system instruction with story context
      const enhancedInstruction = storyContext
        ? `${voiceChat.systemInstruction}\n\nKONTEKS CERITA SEJAUH INI (kamu HARUS ingat dan mereferensikan kejadian-kejadian ini dalam percakapan):\n${storyContext}`
        : voiceChat.systemInstruction;

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
              // Skip sending audio when muted (keyboard mode)
              if (isMutedRef.current) return;
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
          systemInstruction: enhancedInstruction,
        },
      });
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setStatusMessage('Gagal mengakses mikrofon. Periksa izin browser.');
    }
  }, [voiceChat, stopSession, commitStreaming, storyContext]);

  // Auto-start session on mount, cleanup on unmount
  useEffect(() => {
    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      startSession();
    }
    return () => { stopSession(); };
  }, [startSession, stopSession]);

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

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (newMuted) {
      setStatusMessage('Mikrofon dibisukan');
    } else {
      // Unmute — also close text input if open
      setShowTextInput(false);
      setStatusMessage('Berbicara...');
    }
  };

  const handleToggleTextInput = () => {
    const newShowTextInput = !showTextInput;
    setShowTextInput(newShowTextInput);
    // Mute mic when keyboard is shown, unmute when hidden
    isMutedRef.current = newShowTextInput;
    setIsMuted(newShowTextInput);
    if (newShowTextInput) {
      setStatusMessage('Mikrofon dibisukan — mode ketik aktif');
      setTimeout(() => textInputRef.current?.focus(), 50);
    } else {
      setStatusMessage('Berbicara...');
    }
  };

  const handleSendText = useCallback(async () => {
    const text = textInputValue.trim();
    if (!text) return;

    // Add user message to transcript
    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text };
    setTranscript(t => [...t, userMsg]);
    setTextInputValue('');
    // Reset textarea height
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
    }

    // Send to live session if active
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text }] }],
        });
      } catch (e) {
        console.error('Failed to send text to session:', e);
      }
    }
  }, [textInputValue]);

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
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
        {isSessionActive && (
          <button
            onClick={handleEndDiscussion}
            className="voice-chat-end-btn"
          >
            Selesai Berdiskusi →
          </button>
        )}
        {!isSessionActive && !hasStarted && (
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

      {/* Text Input Form */}
      {showTextInput && (
        <div className="vc-text-input-panel">
          <div className="vc-text-input-wrapper">
            <textarea
              ref={textInputRef}
              className="vc-text-input"
              value={textInputValue}
              onChange={e => setTextInputValue(e.target.value)}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 4 * 1.5 * 16) + 'px';
              }}
              onKeyDown={handleTextKeyDown}
              placeholder="Tulis pesanmu di sini..."
              rows={1}
            />
            <button
              className="vc-text-send-btn"
              onClick={handleSendText}
              disabled={!textInputValue.trim()}
              title="Kirim pesan (Enter)"
            >
              <SendIcon size={18} />
            </button>
          </div>
          <span className="vc-text-hint">Enter kirim · Shift+Enter baris baru</span>
        </div>
      )}

      {/* Controls */}
      <div className="voice-chat-controls">
        <span className="voice-chat-status">{statusMessage}</span>
        <div className="voice-chat-actions">
          {/* Keyboard button — only visible when session is active */}
          {isSessionActive && (
            <button
              onClick={handleToggleTextInput}
              className={`vc-keyboard-btn vc-btn-reveal ${showTextInput ? 'vc-keyboard-active' : ''}`}
              title={showTextInput ? 'Kembali ke suara (unmute)' : 'Ketik pesan (mute mikrofon)'}
            >
              {showTextInput ? <MicIcon size={20} /> : <KeyboardIcon size={20} />}
            </button>
          )}
          <button
            onClick={handleToggleMute}
            className={`voice-chat-mic-btn ${isSessionActive ? 'vc-mic-active' : ''} ${isMuted ? 'vc-mic-muted' : ''} ${hasStarted && !isSessionActive ? 'vc-mic-connecting' : ''}`}
            title={isMuted ? 'Aktifkan mikrofon' : 'Bisukan mikrofon'}
            disabled={!isSessionActive}
          >
            <div className={`voice-chat-mic-inner ${isSessionActive ? 'vc-mic-inner-active' : ''} ${isMuted ? 'vc-mic-inner-muted' : ''} ${hasStarted && !isSessionActive ? 'vc-mic-inner-connecting' : ''}`}>
              {hasStarted && !isSessionActive
                ? <div className="vc-mic-loader" />
                : isMuted ? <MicMutedIcon size={24} /> : <MicIcon size={24} />
              }
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
