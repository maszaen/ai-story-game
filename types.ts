export interface Choice {
  text: string;
}

export interface QuestItem {
  text: string;
  completed: boolean;
}

/** Configuration for a voice chat scene with an NPC character */
export interface VoiceChatConfig {
  characterName: string;
  characterRole: string;
  voiceName: string; // Zephyr | Puck | Charon | Kore | Fenrir
  initialDialogue: string;
  systemInstruction: string;
}

/** A single message in a voice chat conversation */
export interface ChatMessage {
  id: number;
  sender: 'user' | 'character';
  text: string;
}

export interface GameStateUpdate {
  /** Shared visual context for ALL images in this scene — location, time, weather, lighting */
  sceneVisualContext: string;
  /** Persistent description of the main character's appearance (updated when appearance changes) */
  characterVisualIdentity: string;
  /** Persistent description of the current location/environment */
  locationVisualIdentity: string;
  /** Story segments — each segment pairs with one image */
  storySegments: {
    text: string;
    imagePrompt: string;
  }[];
  choices: Choice[];
  inventoryUpdates: {
    add: string[];
    remove: string[];
  };
  quests: QuestItem[];
  /** AI sets true when the character truly dies with no way to continue */
  isGameOver: boolean;
  /** Short game-over message when isGameOver is true */
  gameOverMessage: string;
  /** Whether this scene requires a voice chat with an NPC instead of choices */
  requiresVoiceChat: boolean;
  /** Voice chat configuration — only populated when requiresVoiceChat is true */
  voiceChatConfig: {
    characterName: string;
    characterRole: string;
    voiceName: string;
    initialDialogue: string;
    systemInstruction: string;
  };
}

export interface Scene {
  /** Multiple story segments, each with its own image */
  segments: {
    text: string;
    image: string; // base64 data URL
  }[];
  choices: Choice[];
  isGameOver: boolean;
  gameOverMessage: string;
  /** Voice chat configuration when this scene requires NPC conversation */
  voiceChat?: VoiceChatConfig | null;
}
