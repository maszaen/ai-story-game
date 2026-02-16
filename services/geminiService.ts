import { GoogleGenAI, Type } from "@google/genai";
import type { Scene, GameStateUpdate, QuestItem, CharacterPortrait } from '../types';
import { getArtStylePrompt, type GameSettings } from './settings';
import { getApiKey } from './apiKey';
import { BACKSOUND_DESCRIPTIONS } from './audioManager';

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
      description: "A shared, EXHAUSTIVELY DETAILED visual description for ALL images in this turn. This is the SINGLE SOURCE OF TRUTH for the environment — every image uses this, so it must be complete enough that two different artists would draw nearly identical backgrounds. Include ALL of the following: (1) Location type & layout — spatial arrangement of key structures/objects (what is left, right, center, foreground, background), (2) Time of day & sky — exact lighting direction, sun/moon position, sky color gradients, (3) Weather & atmosphere — fog density, rain, dust, humidity, visibility range, (4) Color palette — dominant colors of walls, ground, vegetation, structures (e.g. 'rust-red brick walls', 'pale grey cobblestone road'), (5) Primary objects — every significant object with color, material, size, position (e.g. 'tall black iron gate center-frame, flanked by two stone pillars with moss'), (6) Secondary objects — smaller details that establish atmosphere (lanterns, crates, puddles, cracks, vines, signs), (7) Lighting sources — where light comes from, what it illuminates, shadow directions. Write in English. Minimum 4-6 sentences. Example: 'Military compound entrance at night. A tall 4-meter black iron gate with vertical bars stands center, flanked by two concrete guard towers with mounted searchlights casting harsh white cones downward. Sandbag barricades line both sides of a cracked asphalt road leading to the gate. Three armed guards in dark green uniforms stand behind the gate. Red warning signs on the fence read RESTRICTED. Barbed wire coils along the top of a 3-meter concrete wall extending left and right. Dim amber floodlights mounted on the wall cast long shadows. Overcast sky, no stars visible, faint drizzle.'",
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
            description: "A hyper-detailed visual direction that PRECISELY depicts the 'text' of this segment like a movie storyboard frame. This is NOT a vague description — it is a PRECISE CAMERA SHOT INSTRUCTION. CRITICAL RULES: (1) CAMERA PLACEMENT IN SCENE — state WHERE the camera is physically positioned within the environment. Not just 'wide shot' but 'camera inside the pharmacy near the back shelves, looking toward the entrance' or 'camera at street level 5 meters in front of the gate, looking up'. The camera position determines what the viewer sees as foreground/background — be explicit. If the narrative says the character is INSIDE a building, the camera MUST be inside too, not outside looking in. (2) CHARACTER LOCATION ACCURACY — the image MUST show the character at the EXACT location the narrative describes. If the text says 'sudah di dalam apotek' (already inside the pharmacy), the character MUST be depicted inside the pharmacy surrounded by shelves and medicine, NOT at the door or outside approaching. If the text says 'berdiri di tepi jurang' (standing at cliff edge), show them AT the edge, not walking toward it. Match the narrative's spatial state precisely. (3) CHARACTER FACING DIRECTION — state EXACTLY which direction each character faces relative to the camera AND relative to objects/other characters. Ask yourself: logically, what would the character be looking at in this moment? If they just arrived at a gate, they face AWAY from camera TOWARD the gate. If they talk to someone, they face THAT person. NEVER default to 'facing camera' unless the narrative justifies it. Use terms like 'back to camera facing the gate', 'turned left looking at the merchant', 'side profile facing right', 'three-quarter view looking over shoulder'. (4) CHARACTER-ENVIRONMENT SPATIAL RELATION — describe where each character is positioned relative to key environment objects. E.g. 'standing behind the wooden counter', 'leaning against the left wall next to the window', 'crouching beside the overturned cart'. Characters must be ANCHORED to their environment, not floating in space. (5) BODY POSE & GESTURE — exact limb positions (e.g. 'right hand raised palm-forward in a stop gesture', 'crouching with left knee on ground, right hand gripping sword handle'). (6) CAMERA ANGLE — shot type (extreme close-up, close-up, medium, full body, wide establishing, bird's eye, low angle, over-the-shoulder) AND camera height (eye level, low, high). (7) INTERACTION DETAILS — if touching/holding/using an object, describe exactly how (which hand, grip type, distance). (8) TEMPORARY VISUAL FX — blood, tears, glow, sparks, motion blur, dust kicked up, breath vapor. Do NOT repeat scene setting or character base appearance. Write in English. Minimum 3-4 sentences.",
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
      description: "Configuration for MANDATORY voice chat with an NPC. Only meaningful when requiresVoiceChat is true. When requiresVoiceChat is false, fill all fields with empty strings.",
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
    talkableCharacters: {
      type: Type.ARRAY,
      description: "Array of NPC characters the player can OPTIONALLY talk to in this scene. Use this when NPCs are present and talking to them would ADD VALUE but is NOT required. When this is populated, choices MUST also have 3 normal choices. This is mutually exclusive with requiresVoiceChat=true. When requiresVoiceChat=true OR no NPCs are present, this MUST be an empty array []. Use this when: the scene has interesting NPCs like merchants, companions, quest-givers, informants, etc. Multiple NPCs can be listed. Use approximately every 2-4 scenes when NPCs are naturally present.",
      items: {
        type: Type.OBJECT,
        properties: {
          characterName: {
            type: Type.STRING,
            description: "The NPC character's name.",
          },
          characterRole: {
            type: Type.STRING,
            description: "Brief description of who this character is, in Indonesian.",
          },
          voiceName: {
            type: Type.STRING,
            description: "Voice for this character. Must be one of: Zephyr, Puck, Charon, Kore, Fenrir.",
          },
          initialDialogue: {
            type: Type.STRING,
            description: "Character's greeting/opening line in Indonesian.",
          },
          systemInstruction: {
            type: Type.STRING,
            description: "System instruction for the voice AI to roleplay this character. Same format as voiceChatConfig.systemInstruction but for an optional side conversation. The character should be helpful and share information relevant to the scene but NOT make major plot decisions for the player.",
          },
        },
        required: ['characterName', 'characterRole', 'voiceName', 'initialDialogue', 'systemInstruction'],
      },
    },
    newCharacters: {
      type: Type.ARRAY,
      description: "Array of NEW important characters introduced in this scene that do NOT yet have a portrait. Check the list of known character names provided in the system prompt — only include characters whose names are NOT in that list. For each new character, provide a DETAILED visual description for portrait generation. Include the MAIN CHARACTER in the FIRST scene (scene 1). For NPCs, include them when they are narratively important (recurring allies, antagonists, quest-givers, companions) — do NOT include random background NPCs or one-time extras. If no new important characters appear, return an empty array [].",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The character's name. Must match exactly how they are referred to in the story.",
          },
          role: {
            type: Type.STRING,
            description: "Brief role description in Indonesian. E.g. 'Karakter utama', 'Penjaga perpustakaan', 'Teman seperjalanan'.",
          },
          visualDescription: {
            type: Type.STRING,
            description: "EXTREMELY DETAILED visual appearance description for portrait generation. Write in English. Must include ALL of: (1) Age & gender, (2) Face shape & features (eye shape, nose, jawline, cheekbones), (3) Eye color & expression, (4) Hair color, style, length, texture, (5) Skin tone & complexion, (6) Clothing/armor with SPECIFIC colors and materials, (7) Accessories & jewelry, (8) Distinguishing features (scars, tattoos, birthmarks, etc.), (9) Build/physique, (10) Overall vibe/aura. Minimum 4-5 sentences. Example: 'Young woman early 20s, oval face with high cheekbones and a pointed chin. Large almond-shaped emerald green eyes with long dark lashes. Waist-length wavy auburn-red hair, often partially braided at the temples. Fair skin with light freckles across nose and cheeks. Wearing a deep forest-green hooded cloak over a fitted dark brown leather corset and cream linen blouse, brown leather bracers on both forearms. Silver crescent-moon pendant necklace. Slim athletic build. Confident, determined expression.'",
          },
          isMainCharacter: {
            type: Type.BOOLEAN,
            description: "True ONLY for the player's main character (protagonist). False for all NPCs.",
          },
        },
        required: ['name', 'role', 'visualDescription', 'isMainCharacter'],
      },
    },
    sceneCharacterNames: {
      type: Type.ARRAY,
      description: "Names of ALL known/important characters who VISUALLY APPEAR in this scene's images. Include both existing known characters AND any new characters from newCharacters. These names are used to attach reference portrait images when generating scene images for visual consistency. Only include characters who are VISIBLE in the scene — not mentioned-only characters.",
      items: { type: Type.STRING },
    },
    highlightCharacter: {
      type: Type.STRING,
      description: "Name of a character to highlight/feature in the sidebar character gallery. Use this when a character becomes particularly important in the current scene — e.g. a dramatic reveal, first meeting with a key NPC, or an emotional moment with a companion. This moves that character to the front of the gallery display. Set to empty string '' when no particular character should be highlighted.",
    },
    backsound: {
      type: Type.STRING,
      description: `Choose a background music track that fits the MOOD and ATMOSPHERE of this scene. Available options: ${Object.entries(BACKSOUND_DESCRIPTIONS).filter(([k]) => k !== 'homescreen' && k !== 'generating-story').map(([k, v]) => `'${k}' = ${v}`).join(' | ')} | 'none' = no music (for very quiet, tense silence moments, or when the scene doesn't need music). Pick the track that BEST matches the emotional tone of the scene. You can also use 'none' for scenes where silence is more impactful.`,
    },
  },
  required: ['sceneVisualContext', 'characterVisualIdentity', 'locationVisualIdentity', 'storySegments', 'choices', 'inventoryUpdates', 'quests', 'isGameOver', 'gameOverMessage', 'requiresVoiceChat', 'voiceChatConfig', 'talkableCharacters', 'newCharacters', 'sceneCharacterNames', 'highlightCharacter', 'backsound'],
};

export const getNextScene = async (
  storyHistory: { role: string; parts: { text: string }[] }[],
  playerChoice: string,
  settings: GameSettings,
  previousVisualIdentity?: {
    characterVisualIdentity: string;
    locationVisualIdentity: string;
  },
  knownCharacters: CharacterPortrait[] = [],
): Promise<{
  scene: Scene;
  newInventory: string[];
  removedInventory: string[];
  quests: QuestItem[];
  newHistory: { role: string; parts: { text: string }[] }[];
  characterVisualIdentity: string;
  locationVisualIdentity: string;
  newCharacterPortraits: CharacterPortrait[];
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

  // Build known characters context for the system prompt
  const knownCharacterNames = knownCharacters.map(c => c.name);
  const knownCharactersContext = knownCharacters.length > 0
    ? `\n\nKARAKTER YANG SUDAH DIKENAL (sudah punya portrait, JANGAN masukkan ke newCharacters):
${knownCharacters.map(c => `- ${c.name} (${c.role})${c.isMainCharacter ? ' [KARAKTER UTAMA]' : ''}: ${c.visualDescription}`).join('\n')}`
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
- Isi "sceneVisualContext" dengan deskripsi SUPER DETAIL setting visual untuk seluruh scene ini. Bayangkan kamu memberikan brief ke art director film — harus cukup detail sehingga dua seniman berbeda menghasilkan gambar yang hampir identik. Wajib mencakup:
  * Layout spasial lokasi (apa di kiri, kanan, tengah, depan, belakang)
  * Waktu, pencahayaan (arah cahaya, sumber, warna), cuaca
  * WARNA spesifik setiap objek utama (jangan cuma 'gate' tapi 'tall black iron gate with vertical bars')
  * Objek primer DAN sekunder (tanda, tong, batu, tanaman, dll)
  * MINIMAL 4-6 kalimat dalam bahasa Inggris.
- Isi "characterVisualIdentity" dengan deskripsi DETAIL penampilan karakter utama: umur, gender, rambut (warna, gaya, panjang), warna mata, warna kulit, pakaian/armor detail (warna spesifik!), aksesoris, senjata, ciri khas. Tulis dalam bahasa Inggris. PERTAHANKAN deskripsi ini PERSIS SAMA antar giliran kecuali ada perubahan nyata (ganti baju, terluka, transformasi).
- Isi "locationVisualIdentity" dengan deskripsi lokasi saat ini dan fitur visual kuncinya termasuk WARNA dan MATERIAL. Tulis dalam bahasa Inggris. Update HANYA jika karakter pindah ke lokasi yang secara signifikan berbeda.
- Untuk "imagePrompt" di setiap segmen: ini adalah instruksi KRITIS.
  * imagePrompt HARUS merupakan instruksi STORYBOARD FRAME yang presisi — bukan deskripsi samar, tapi arahan kamera film.
  * POSISI KAMERA DI SCENE: Jangan cuma tulis shot type — tulis juga DIMANA kamera ditempatkan di dalam scene. Contoh: 'camera inside the pharmacy behind the counter, looking toward the entrance' atau 'camera at street level, 10 meters from the gate, looking up at the watchtower'. Kalau narasi bilang karakter SUDAH DI DALAM ruangan, kamera HARUS di dalam juga.
  * LOKASI KARAKTER SESUAI NARASI: Gambar HARUS menunjukkan karakter di lokasi PERSIS yang narasi sebutkan. Kalau narasi bilang 'sudah di dalam apotek', karakter HARUS dikelilingi rak obat di dalam apotek — BUKAN masih di pintu atau di luar. Kalau narasi bilang 'berdiri di tepi jurang', tampilkan dia DI TEPI jurang, bukan berjalan ke arah jurang.
  * RELASI KARAKTER-ENVIRONMENT: Deskripsikan posisi karakter relatif terhadap objek environment. Contoh: 'standing behind the wooden counter', 'leaning against the left wall beside the window', 'crouching next to the overturned cart'. Karakter harus TERHUBUNG dengan lingkungannya.
  * ARAH HADAP KARAKTER adalah kesalahan paling umum! Tanyakan: secara logika, ke mana karakter melihat di momen ini? Jika baru tiba di gerbang → karakter MEMBELAKANGI kamera menghadap gerbang. Jika berbicara dengan seseorang → menghadap orang itu. JANGAN PERNAH default ke 'menghadap kamera' kecuali narasi secara eksplisit memerlukan itu.
  * Gunakan istilah arah: 'back to camera facing the gate', 'turned left toward the merchant', 'side profile facing right', 'three-quarter view looking over left shoulder'.
  * Contoh BENAR: text="Mereka tiba di gerbang militer yang dijaga ketat" → imagePrompt="Wide establishing shot, camera at ground level 8 meters behind the characters. The main character and companion seen from behind, walking toward a tall black iron military gate 15 meters ahead, their backs to camera, the character's right hand raised to shield eyes from a harsh searchlight beam from the guard tower above the gate, two armed guards visible as silhouettes behind the gate bars, dust kicked up by their footsteps"
  * Contoh SALAH: text="Mereka tiba di gerbang militer" → imagePrompt="The main character standing in front of a military gate, looking at the camera" (SALAH! Baru tiba berarti menghadap gerbang, bukan kamera! Dan tidak ada posisi kamera!)
  * Contoh BENAR: text="Di dalam apotek, dia bertanya pada apoteker" → imagePrompt="Medium shot, camera inside the pharmacy positioned between two tall medicine shelves, looking toward the front counter. The main character stands in center-frame in front of the counter, leaning slightly forward with both hands resting on the glass countertop, facing the pharmacist across the counter. The pharmacist (elderly woman with white coat) stands behind the counter, gesturing with right hand toward the shelves behind her. Fluorescent lights overhead cast even white lighting."
  * Contoh SALAH: text="Di dalam apotek, dia bertanya pada apoteker" → imagePrompt="The main character at the entrance of a pharmacy" (SALAH! Narasi bilang DI DALAM, bukan di pintu masuk!)
  * Sertakan: pose tubuh spesifik (posisi tangan, kaki), ekspresi wajah, objek yang digunakan, posisi spasial (left-frame/center/right-frame/foreground/background), sudut kamera (shot type + ketinggian + posisi di scene).
  * JANGAN ulangi deskripsi setting atau penampilan dasar karakter (sudah ada di sceneVisualContext dan characterVisualIdentity).
  * Tulis minimal 3-4 kalimat dalam bahasa Inggris.${visualIdentityContext}

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
Ada DUA mode interaksi suara dengan NPC:

**MODE 1: DISKUSI WAJIB (requiresVoiceChat=true)**
- Digunakan ketika scene MEMBUTUHKAN percakapan langsung sebelum cerita bisa lanjut.
- Contoh: merencanakan strategi bersama, negosiasi kritis, interogasi, dialog emosional penting.
- Jika requiresVoiceChat=true: choices HARUS kosong [], voiceChatConfig HARUS diisi LENGKAP, talkableCharacters HARUS kosong [].
- Gunakan ini kira-kira 1 dari setiap 4-6 scene pada momen narasi yang tepat.

**MODE 2: PERCAKAPAN OPSIONAL (talkableCharacters)**
- Digunakan ketika ada NPC menarik di scene yang BISA diajak bicara tapi TIDAK WAJIB.
- Contoh: pedagang yang bisa ditanya soal barang, teman seperjalanan yang bisa dimintai saran, penduduk desa yang punya informasi.
- Jika talkableCharacters diisi: choices HARUS tetap ada (3 pilihan normal), requiresVoiceChat HARUS false, voiceChatConfig diisi string kosong.
- Bisa ada LEBIH DARI SATU karakter dalam array talkableCharacters (misal: pedagang DAN penjaga gerbang).
- Gunakan ini kira-kira setiap 2-4 scene ketika ada NPC yang secara alami hadir di scene.
- Pemain bisa memilih untuk berbicara dengan karakter-karakter ini SEBELUM memilih salah satu dari 3 choices, atau langsung memilih tanpa bicara.

**ATURAN UMUM KEDUA MODE:**
- JANGAN gunakan voice chat di scene pertama (scene pembuka/intro).
- voiceName: Pilih suara sesuai gender dan kepribadian karakter:
  * Perempuan: Kore (tenang/bijak), Zephyr (energik/ceria)
  * Laki-laki: Fenrir (dalam/berwibawa), Charon (misterius/gelap), Puck (ramah/cerdas)
- Untuk systemInstruction: tulis panduan LENGKAP agar AI suara bisa memerankan karakter ini dengan sempurna. Sertakan kepribadian, pengetahuan karakter, konteks situasi, hubungan dengan pemain, tujuan percakapan, dan kapan harus mengakhiri diskusi.
- requiresVoiceChat dan talkableCharacters TIDAK BOLEH aktif bersamaan. Pilih salah satu atau tidak keduanya.

MENANGANI INPUT DISKUSI SUARA:
- Jika input pemain berupa transkrip diskusi suara (ditandai dengan [Pemain berdiskusi langsung dengan ...] atau [Percakapan opsional dengan ...]), lanjutkan cerita berdasarkan HASIL diskusi tersebut.
- Jika ada BEBERAPA log percakapan opsional (ditandai [LOG PERCAKAPAN OPSIONAL]), gunakan SEMUA informasi dari percakapan-percakapan tersebut untuk memengaruhi narasi.
- Gunakan keputusan/rencana yang dibuat dalam diskusi untuk menentukan arah cerita selanjutnya.
- Referensikan percakapan yang terjadi di narasi (misal: 'Setelah berdiskusi panjang dengan Eliot, mereka memutuskan untuk...').

SISTEM KARAKTER & PORTRAIT (SANGAT PENTING):
- Setiap karakter penting akan di-generate portrait-nya untuk konsistensi visual.
- Di SCENE PERTAMA: WAJIB masukkan karakter utama ke newCharacters dengan isMainCharacter=true dan visualDescription yang super detail.
- Untuk NPC penting (teman seperjalanan, antagonis, quest-giver, karakter berulang): masukkan ke newCharacters saat pertama kali muncul.
- JANGAN masukkan NPC random / latar belakang / sekali muncul ke newCharacters.
- Cek daftar "KARAKTER YANG SUDAH DIKENAL" di bawah — karakter yang sudah ada di daftar itu JANGAN dimasukkan lagi ke newCharacters.
- sceneCharacterNames: isi dengan SEMUA nama karakter penting yang TERLIHAT di scene ini (baik yang sudah dikenal maupun yang baru).
- highlightCharacter: isi dengan nama karakter yang paling menonjol/penting di scene ini. Kosongkan '' jika tidak ada yang perlu di-highlight.${knownCharactersContext}

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

  // 2. Generate portraits for new characters
  const newCharacterPortraits: CharacterPortrait[] = [];
  const newCharacterEntries = gameStateUpdate.newCharacters || [];

  if (newCharacterEntries.length > 0) {
    const portraitPromises = newCharacterEntries.map(async (char) => {
      const portraitPrompt = `Character portrait, head and upper body, centered composition, neutral dark background with subtle vignette. ${char.visualDescription}. Style: ${getArtStylePrompt(settings.artStyle)}. High detail face, clear facial features, portrait lighting from upper left.`;
      try {
        const portraitResponse = await ai.models.generateContent({
          model: imageModel,
          contents: { parts: [{ text: portraitPrompt }] },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "256",
            }
          }
        });

        let portraitBase64 = '';
        const candidate = portraitResponse.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              portraitBase64 = part.inlineData.data;
              break;
            }
          }
        }

        if (portraitBase64) {
          return {
            id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: char.name,
            role: char.role,
            visualDescription: char.visualDescription,
            portraitBase64,
            isMainCharacter: char.isMainCharacter,
          } as CharacterPortrait;
        }
        return null;
      } catch (err) {
        console.error(`Portrait generation failed for ${char.name}:`, err);
        return null;
      }
    });

    const portraits = await Promise.all(portraitPromises);
    for (const p of portraits) {
      if (p) newCharacterPortraits.push(p);
    }
  }

  // Combine known characters with newly generated portraits for reference
  const allCharacters = [...knownCharacters, ...newCharacterPortraits];
  const sceneCharNames = gameStateUpdate.sceneCharacterNames || [];

  // Find character portraits that appear in this scene for image reference
  const scenePortraits = allCharacters.filter(c => sceneCharNames.includes(c.name));

  // 3. Generate images for all segments in parallel (with character portrait references)
  // Compose a shared visual prefix from scene context + character identity + location identity
  const visualPrefix = [
    sceneVisualContext && `Scene: ${sceneVisualContext}`,
    characterVisualIdentity && `Main character: ${characterVisualIdentity}`,
    locationVisualIdentity && `Location: ${locationVisualIdentity}`,
  ].filter(Boolean).join('. ');

  // Build character reference text for image prompts
  const charRefText = scenePortraits.length > 0
    ? `. Characters in scene (use the reference portrait images provided for visual consistency): ${scenePortraits.map(c => `${c.name} — ${c.visualDescription}`).join('; ')}`
    : '';

  const imagePromises = storySegments.map(async (segment) => {
    const fullImagePrompt = `${visualPrefix}${charRefText}. Action: ${segment.imagePrompt}. Style: ${getArtStylePrompt(settings.artStyle)}`;

    // Build parts: text prompt + character portrait reference images
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: fullImagePrompt },
    ];

    // Add character portrait images as visual references
    for (const portrait of scenePortraits) {
      if (portrait.portraitBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: portrait.portraitBase64,
          },
        });
      }
    }

    try {
      const imageResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts },
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

  // Extract talkable characters if present (optional talk mode)
  const talkableCharacters = !gameStateUpdate.requiresVoiceChat && gameStateUpdate.talkableCharacters?.length
    ? gameStateUpdate.talkableCharacters
        .filter(c => c.characterName) // filter out empty entries
        .map(c => ({
          characterName: c.characterName,
          characterRole: c.characterRole,
          voiceName: c.voiceName || 'Kore',
          initialDialogue: c.initialDialogue,
          systemInstruction: c.systemInstruction,
        }))
    : [];

  const newScene: Scene = {
    segments,
    choices,
    isGameOver,
    gameOverMessage: gameOverMessage || '',
    voiceChat,
    talkableCharacters: talkableCharacters.length > 0 ? talkableCharacters : undefined,
    sceneCharacterNames: sceneCharNames.length > 0 ? sceneCharNames : undefined,
    highlightCharacter: gameStateUpdate.highlightCharacter || undefined,
    backsound: gameStateUpdate.backsound || undefined,
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
    newCharacterPortraits,
  };
};
