import { GoogleGenAI, Type } from "@google/genai";
import type { Scene, GameStateUpdate, QuestItem } from '../types';
import { getArtStylePrompt, type GameSettings } from './settings';
import { getApiKey } from './apiKey';

const getAi = () => {
  const key = getApiKey();
  if (!key) throw new Error('API Key belum diatur. Silakan masukkan API Key di Pengaturan.');
  return new GoogleGenAI({ apiKey: key });
};

const storyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    storySegments: {
      type: Type.ARRAY,
      description: "Array of 2-3 story segments. Each segment is a short paragraph describing one moment/event in the scene, paired with an image prompt for that specific moment. This creates a visual narrative flow like a comic or storyboard.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "A short paragraph (2-4 sentences) describing this specific moment in the scene.",
          },
          imagePrompt: {
            type: Type.STRING,
            description: "A concise but detailed visual description for an image generator for THIS specific moment. Capture the key action, characters, and mood. Keep character/location descriptions consistent with story history.",
          },
        },
        required: ['text', 'imagePrompt'],
      },
    },
    choices: {
      type: Type.ARRAY,
      description: "An array of 3 distinct and meaningful choices the player can make. If isGameOver is true, this MUST be an empty array.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The text for a single choice."
          },
        },
        required: ['text'],
      },
    },
    inventoryUpdates: {
      type: Type.OBJECT,
      description: "Updates to the player's inventory based on the story.",
      properties: {
        add: {
          type: Type.ARRAY,
          description: "A list of new items the player has acquired. Can be empty.",
          items: { type: Type.STRING },
        },
        remove: {
          type: Type.ARRAY,
          description: "A list of items the player has used or lost. Can be empty.",
          items: { type: Type.STRING },
        },
      },
      required: ['add', 'remove'],
    },
    quests: {
      type: Type.ARRAY,
      description: "The FULL list of all quests (both active and completed). Mark completed quests with completed=true. Add new quests as they emerge from the story. Keep old completed quests in the list.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The quest description.",
          },
          completed: {
            type: Type.BOOLEAN,
            description: "Whether this quest has been completed based on story events.",
          },
        },
        required: ['text', 'completed'],
      },
    },
    isGameOver: {
      type: Type.BOOLEAN,
      description: "Set to true ONLY when the character has truly died or met an inescapable end with absolutely no narrative path forward. Death does NOT always mean game over — if there is any possible story continuation (resurrection, afterlife adventure, rescue, divine intervention, time reversal, dream sequence, etc.), keep this false and continue the story. Only set true for truly final, absolute endings.",
    },
    gameOverMessage: {
      type: Type.STRING,
      description: "A dramatic, poetic game-over message in Indonesian. Only used when isGameOver is true. Otherwise set to empty string.",
    },
  },
  required: ['storySegments', 'choices', 'inventoryUpdates', 'quests', 'isGameOver', 'gameOverMessage'],
};

export const getNextScene = async (
  storyHistory: { role: string; parts: { text: string }[] }[],
  playerChoice: string,
  settings: GameSettings
): Promise<{
  scene: Scene;
  newInventory: string[];
  removedInventory: string[];
  quests: QuestItem[];
  newHistory: { role: string; parts: { text: string }[] }[];
}> => {
  const ai = getAi();

  const storyModel = 'gemini-3-pro-preview';
  const imageModel = 'gemini-3-pro-image-preview';

  const currentHistory = [...storyHistory, { role: 'user', parts: [{ text: playerChoice }] }];

  // 1. Generate the story
  const storyResponse = await ai.models.generateContent({
    model: storyModel,
    contents: currentHistory,
    config: {
      responseMimeType: 'application/json',
      responseSchema: storyResponseSchema,
      systemInstruction: `Kamu adalah seorang pencerita ulung yang membuat game petualangan interaktif pilih-jalanmu-sendiri. Berdasarkan pilihan pemain dan cerita sejauh ini, buat bagian selanjutnya dari petualangan.

ATURAN PENTING:
- SEMUA teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.
- Buat tepat ${settings.segmentsPerTurn} segmen cerita per giliran, masing-masing menggambarkan satu momen/kejadian spesifik.
- Setiap segmen harus punya image prompt yang detail untuk momen spesifik itu.

ATURAN INVENTORY:
- Inventory HANYA berisi item yang BENAR-BENAR sudah dimiliki/diambil pemain.
- Jika pemain belum mengambil atau menerima item apapun, inventory HARUS kosong (add: []).
- JANGAN menambahkan item ke inventory hanya karena item tersebut disebutkan atau terlihat dalam cerita.
- Item hanya masuk inventory jika pemain SECARA EKSPLISIT mengambil, menerima, membeli, atau menemukan dan menyimpannya.
- Jika pemain memakai atau kehilangan item, masukkan ke remove.

ATURAN QUEST:
- Kelola daftar quest: tandai quest yang sudah selesai (completed=true), tambahkan quest baru sesuai alur cerita.
- Pertahankan quest lama yang sudah selesai di daftar.

ATURAN GAME OVER:
- Set isGameOver=true HANYA jika karakter benar-benar mati tanpa jalan cerita apapun ke depan.
- Kematian TIDAK selalu berarti game over — jika ada kemungkinan kelanjutan cerita (kebangkitan, petualangan alam baka, pertolongan, intervensi ilahi, dsb), JANGAN set game over. Biarkan cerita berlanjut.
- Jika isGameOver=true, choices HARUS kosong [].

Pastikan ceritanya koheren, pilihan bermakna, dan dunia game diperbarui secara logis.

Balas hanya dengan objek JSON yang diminta.`,
    }
  });

  if (!storyResponse.text) {
    throw new Error("Respons model kosong.");
  }

  const cleanedJson = storyResponse.text.trim()
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '');
  const gameStateUpdate = JSON.parse(cleanedJson) as GameStateUpdate;

  const { storySegments, choices, inventoryUpdates, quests, isGameOver, gameOverMessage } = gameStateUpdate;

  // 2. Generate images for all segments in parallel
  const imagePromises = storySegments.map(async (segment) => {
    const fullImagePrompt = `${segment.imagePrompt}, ${getArtStylePrompt(settings.artStyle)}`;
    try {
      const imageResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: fullImagePrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: settings.imageSize,
          }
        }
      });

      let imageBase64 = '';
      const candidate = imageResponse.candidates?.[0];
      if (candidate) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            break;
          }
        }
      }

      return imageBase64 ? `data:image/png;base64,${imageBase64}` : '';
    } catch (err) {
      console.error('Image generation failed for segment:', err);
      return '';
    }
  });

  const images = await Promise.all(imagePromises);

  // Build scene segments
  const segments = storySegments.map((seg, i) => ({
    text: seg.text,
    image: images[i] || '',
  }));

  const newScene: Scene = {
    segments,
    choices,
    isGameOver,
    gameOverMessage: gameOverMessage || '',
  };

  const newHistory = [...currentHistory, { role: 'model', parts: [{ text: JSON.stringify(gameStateUpdate) }] }];

  return {
    scene: newScene,
    newInventory: inventoryUpdates.add || [],
    removedInventory: inventoryUpdates.remove || [],
    quests: quests || [],
    newHistory,
  };
};
