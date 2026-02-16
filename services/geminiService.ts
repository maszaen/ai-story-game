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
    sceneVisualContext: {
      type: Type.STRING,
      description: "A shared visual description for ALL images in this turn. Describe the current location/environment in detail: time of day, weather, lighting, atmosphere, key environmental features. This will be prepended to every image prompt to ensure visual consistency across all segments. Write in English. Example: 'Dense ancient forest at twilight, thick fog between massive gnarled oak trees, bioluminescent mushrooms casting blue-green glow on mossy ground, shafts of dying orange sunlight filtering through canopy'",
    },
    characterVisualIdentity: {
      type: Type.STRING,
      description: "A persistent, detailed description of the main character's visual appearance. Include: age, gender, hair (color, style, length), eye color, skin tone, clothing/armor details, accessories, weapons, distinguishing features. Update ONLY when the character's appearance actually changes (new outfit, injury, transformation). Keep consistent across turns. Write in English. Example: 'Young man early 20s, messy black hair, brown eyes, tanned skin, wearing a worn brown leather cloak over a dark green tunic, leather boots, carrying a short sword on left hip, small satchel on right'",
    },
    locationVisualIdentity: {
      type: Type.STRING,
      description: "A persistent description of the current location type and its key visual features. Update when the character moves to a significantly different location. Write in English. Example: 'Ancient enchanted forest - massive trees with glowing runes carved in bark, carpet of luminous moss, floating firefly-like spirits, stone ruins overgrown with vines'",
    },
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
            description: "A highly detailed visual description that PRECISELY depicts what happens in the 'text' field of this segment. This prompt MUST be a faithful visual translation of the narrative — every key action, object, interaction, gesture, and emotion mentioned in the text MUST appear in this prompt. Do NOT repeat scene setting or character base appearance (already in sceneVisualContext/characterVisualIdentity). Instead, focus on: (1) EXACT actions & body language (e.g. 'looking down at a silver wristwatch on left wrist, eyes focused on the watch face'), (2) facial expressions & emotions, (3) specific objects being interacted with and HOW they are being used, (4) spatial relationship between characters (who is where, looking at what), (5) camera angle & shot type (close-up, medium shot, over-the-shoulder, etc.), (6) any temporary visual elements (blood, tears, glowing effects, held items). Be extremely literal and specific — if the text says someone looks at a watch, the prompt MUST show them looking at a watch. Write in English. Minimum 2-3 sentences.",
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
    requiresVoiceChat: {
      type: Type.BOOLEAN,
      description: "Set to true when this scene naturally requires the player to have a live voice conversation/discussion with an NPC character before the story can continue. Use this for scenes where: planning together, negotiation, interrogation, emotional heart-to-heart dialogue, asking for directions/information, or collaborative decision-making would be MORE immersive and engaging than simple text choices. When true, the 'choices' array MUST be EMPTY [] and 'voiceChatConfig' must be fully populated. When false, provide normal choices and leave voiceChatConfig with empty strings. Use this approximately once every 3-5 scenes — not too often, but at key narrative moments.",
    },
    voiceChatConfig: {
      type: Type.OBJECT,
      description: "Configuration for voice chat with an NPC. Only meaningful when requiresVoiceChat is true. When requiresVoiceChat is false, fill all fields with empty strings.",
      properties: {
        characterName: {
          type: Type.STRING,
          description: "The NPC character's name. Example: 'Eliot', 'Nyai Roro', 'Kapten Blackwood'",
        },
        characterRole: {
          type: Type.STRING,
          description: "Brief description of who this character is, in Indonesian. Example: 'Teman seperjalanan, ahli dalam menggunakan kunci'",
        },
        voiceName: {
          type: Type.STRING,
          description: "Voice to use for this character. Choose based on character gender and personality: 'Kore' (calm female), 'Zephyr' (energetic female), 'Fenrir' (deep male), 'Charon' (mysterious male), 'Puck' (friendly male). Must be one of: Zephyr, Puck, Charon, Kore, Fenrir.",
        },
        initialDialogue: {
          type: Type.STRING,
          description: "The character's opening dialogue line that starts the conversation, in Indonesian. This should set up the topic of discussion and invite the player to respond. Example: 'Kita perlu rencana. Kunci itu ada di dasar sumur, tapi airnya terlalu dalam. Menurutmu bagaimana?'",
        },
        systemInstruction: {
          type: Type.STRING,
          description: "Complete system instruction for the voice AI to roleplay this character during the live conversation. Write in Indonesian. Must include: (1) Character personality & speaking style, (2) What the character knows about the current situation, (3) Character's relationship with the player, (4) The goal/topic of this conversation, (5) What information or decisions need to be reached, (6) Instruction to naturally conclude when a plan/decision is made — say something like 'Baik, kalau begitu ayo kita lakukan!' when resolved. (7) IMPORTANT: Start the conversation naturally by speaking the opening line. Keep responses to 2-4 sentences to maintain conversational flow.",
        },
      },
      required: ['characterName', 'characterRole', 'voiceName', 'initialDialogue', 'systemInstruction'],
    },
  },
  required: ['sceneVisualContext', 'characterVisualIdentity', 'locationVisualIdentity', 'storySegments', 'choices', 'inventoryUpdates', 'quests', 'isGameOver', 'gameOverMessage', 'requiresVoiceChat', 'voiceChatConfig'],
};

export const getNextScene = async (
  storyHistory: { role: string; parts: { text: string }[] }[],
  playerChoice: string,
  settings: GameSettings,
  previousVisualIdentity?: {
    characterVisualIdentity: string;
    locationVisualIdentity: string;
  }
): Promise<{
  scene: Scene;
  newInventory: string[];
  removedInventory: string[];
  quests: QuestItem[];
  newHistory: { role: string; parts: { text: string }[] }[];
  characterVisualIdentity: string;
  locationVisualIdentity: string;
}> => {
  const ai = getAi();

  const storyModel = 'gemini-3-pro-preview';
  const imageModel = 'gemini-3-pro-image-preview';

  const currentHistory = [...storyHistory, { role: 'user', parts: [{ text: playerChoice }] }];

  // Build visual identity context for the system prompt
  const visualIdentityContext = previousVisualIdentity
    ? `\n\nKONTEKS VISUAL SEBELUMNYA (gunakan sebagai referensi, update jika ada perubahan):
- Penampilan karakter: ${previousVisualIdentity.characterVisualIdentity}
- Lokasi terakhir: ${previousVisualIdentity.locationVisualIdentity}`
    : '';

  // 1. Generate the story
  const storyResponse = await ai.models.generateContent({
    model: storyModel,
    contents: currentHistory,
    config: {
      responseMimeType: 'application/json',
      responseSchema: storyResponseSchema,
      systemInstruction: `Kamu adalah seorang pencerita ulung yang membuat game petualangan interaktif pilih-jalanmu-sendiri. Berdasarkan pilihan pemain dan cerita sejauh ini, buat bagian selanjutnya dari petualangan.

KARAKTER UTAMA:
- Gender karakter utama: ${settings.gender === 'male' ? 'LAKI-LAKI (dia/ia, pemuda, pria)' : 'PEREMPUAN (dia/ia, gadis, wanita)'}
- Gunakan kata ganti dan deskripsi yang SESUAI gender di atas sepanjang cerita.
- Untuk characterVisualIdentity, pastikan deskripsi fisik SESUAI gender (${settings.gender === 'male' ? 'male features, masculine build' : 'female features, feminine build'}).

ATURAN PENTING:
- SEMUA teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.
- Buat tepat ${settings.segmentsPerTurn} segmen cerita per giliran, masing-masing menggambarkan satu momen/kejadian spesifik.
- Setiap segmen harus punya image prompt yang detail untuk momen spesifik itu.

ATURAN KONSISTENSI VISUAL (SANGAT PENTING):
- Isi "sceneVisualContext" dengan deskripsi LENGKAP setting visual untuk seluruh scene ini: lokasi, waktu, cuaca, pencahayaan, atmosfer, detail lingkungan. Tulis dalam bahasa Inggris. Ini akan digunakan untuk SEMUA gambar di scene ini agar konsisten.
- Isi "characterVisualIdentity" dengan deskripsi DETAIL penampilan karakter utama: umur, gender, rambut (warna, gaya, panjang), warna mata, warna kulit, pakaian/armor detail, aksesoris, senjata, ciri khas. Tulis dalam bahasa Inggris. PERTAHANKAN deskripsi ini PERSIS SAMA antar giliran kecuali ada perubahan nyata (ganti baju, terluka, transformasi).
- Isi "locationVisualIdentity" dengan deskripsi lokasi saat ini dan fitur visual kuncinya. Tulis dalam bahasa Inggris. Update HANYA jika karakter pindah ke lokasi yang secara signifikan berbeda.
- Untuk "imagePrompt" di setiap segmen: ini adalah instruksi KRITIS.
  * imagePrompt HARUS merupakan terjemahan visual yang PERSIS dari apa yang diceritakan di "text" segmen itu.
  * SETIAP aksi, objek, interaksi, dan gestur yang disebut di narasi WAJIB muncul di imagePrompt.
  * Contoh BENAR: text="Dia melihat jam tangan, Eliot tersenyum" → imagePrompt="Close-up shot, the main character looking down at a silver wristwatch on their left wrist, Eliot standing beside them with a warm smile, watching them check the time"
  * Contoh SALAH: text="Dia melihat jam tangan, Eliot tersenyum" → imagePrompt="Two young men smiling together" (TIDAK ADA jam tangan!)
  * Sertakan: pose tubuh yang spesifik, ekspresi wajah, objek yang sedang digunakan/dilihat/dipegang, posisi spasial antar karakter, sudut kamera (close-up/medium/wide shot).
  * JANGAN ulangi deskripsi setting atau penampilan dasar karakter (sudah ada di sceneVisualContext dan characterVisualIdentity).
  * Tulis minimal 2-3 kalimat dalam bahasa Inggris.${visualIdentityContext}

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

FITUR DISKUSI SUARA (VOICE CHAT) DENGAN KARAKTER NPC:
- Dalam beberapa scene, alih-alih memberikan 3 pilihan teks, kamu bisa membuat scene yang memerlukan DISKUSI LANGSUNG pemain dengan karakter NPC melalui suara.
- Set requiresVoiceChat=true jika scene ini secara alami membutuhkan percakapan langsung: merencanakan strategi bersama, negosiasi, interogasi, curhat/dialog emosional, bertanya arah/informasi penting, atau pengambilan keputusan kolaboratif.
- Jika requiresVoiceChat=true: choices HARUS kosong [], dan voiceChatConfig HARUS diisi LENGKAP.
- Jika requiresVoiceChat=false: berikan choices normal (3 pilihan), dan voiceChatConfig diisi string kosong untuk semua field.
- Gunakan fitur ini secara SEIMBANG — kira-kira 1 dari setiap 3-5 scene. Jangan terlalu sering, tapi jangan juga terlalu jarang. Gunakan pada momen narasi yang tepat untuk meningkatkan imersi.
- JANGAN gunakan voice chat di scene pertama (scene pembuka/intro).
- voiceName: Pilih suara sesuai gender dan kepribadian karakter:
  * Perempuan: Kore (tenang/bijak), Zephyr (energik/ceria)
  * Laki-laki: Fenrir (dalam/berwibawa), Charon (misterius/gelap), Puck (ramah/cerdas)
- Untuk systemInstruction di voiceChatConfig: tulis panduan LENGKAP agar AI suara bisa memerankan karakter ini dengan sempurna. Sertakan kepribadian, pengetahuan karakter, konteks situasi, hubungan dengan pemain, tujuan percakapan, dan kapan harus mengakhiri diskusi.

MENANGANI INPUT DISKUSI SUARA:
- Jika input pemain berupa transkrip diskusi suara (ditandai dengan [Pemain berdiskusi langsung dengan ...]), lanjutkan cerita berdasarkan HASIL diskusi tersebut.
- Gunakan keputusan/rencana yang dibuat dalam diskusi untuk menentukan arah cerita selanjutnya.
- Referensikan percakapan yang terjadi di narasi (misal: 'Setelah berdiskusi panjang dengan Eliot, mereka memutuskan untuk...').

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

  const { storySegments, choices, inventoryUpdates, quests, isGameOver, gameOverMessage,
    sceneVisualContext, characterVisualIdentity, locationVisualIdentity } = gameStateUpdate;

  // 2. Generate images for all segments in parallel
  // Compose a shared visual prefix from scene context + character identity + location identity
  const visualPrefix = [
    sceneVisualContext && `Scene: ${sceneVisualContext}`,
    characterVisualIdentity && `Main character: ${characterVisualIdentity}`,
    locationVisualIdentity && `Location: ${locationVisualIdentity}`,
  ].filter(Boolean).join('. ');

  const imagePromises = storySegments.map(async (segment) => {
    const fullImagePrompt = `${visualPrefix}. Action: ${segment.imagePrompt}. Style: ${getArtStylePrompt(settings.artStyle)}`;
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
      if (candidate?.content?.parts) {
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

  // Extract voice chat config if present
  const voiceChat = gameStateUpdate.requiresVoiceChat && gameStateUpdate.voiceChatConfig?.characterName
    ? {
        characterName: gameStateUpdate.voiceChatConfig.characterName,
        characterRole: gameStateUpdate.voiceChatConfig.characterRole,
        voiceName: gameStateUpdate.voiceChatConfig.voiceName || 'Kore',
        initialDialogue: gameStateUpdate.voiceChatConfig.initialDialogue,
        systemInstruction: gameStateUpdate.voiceChatConfig.systemInstruction,
      }
    : null;

  const newScene: Scene = {
    segments,
    choices,
    isGameOver,
    gameOverMessage: gameOverMessage || '',
    voiceChat,
  };

  const newHistory = [...currentHistory, { role: 'model', parts: [{ text: JSON.stringify(gameStateUpdate) }] }];

  return {
    scene: newScene,
    newInventory: inventoryUpdates.add || [],
    removedInventory: inventoryUpdates.remove || [],
    quests: quests || [],
    newHistory,
    characterVisualIdentity: characterVisualIdentity || '',
    locationVisualIdentity: locationVisualIdentity || '',
  };
};
