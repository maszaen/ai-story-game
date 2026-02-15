import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from './apiKey';

const getAi = () => {
  const key = getApiKey();
  if (!key) throw new Error('API Key belum diatur. Silakan masukkan API Key di Pengaturan.');
  return new GoogleGenAI({ apiKey: key });
};

// In-memory audio cache — survives within session, cleared on refresh
const audioCache = new Map<string, string>();

/**
 * Generate speech audio from text using Gemini TTS.
 * Returns raw PCM base64 audio data. Cached per session.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const cached = audioCache.get(text);
  if (cached) return cached;

  const ai = getAi();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this naturally in a storytelling voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Tidak ada data audio dari API.");
  }

  audioCache.set(text, base64Audio);
  return base64Audio;
};

// --- Audio decoding utilities ---

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode raw PCM base64 audio into a playable AudioBuffer.
 * Gemini TTS returns 24kHz mono PCM.
 */
export function decodeAudioData(
  base64Audio: string,
  ctx: AudioContext,
  sampleRate = 24000,
  numChannels = 1,
): AudioBuffer {
  const data = decodeBase64(base64Audio);
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
