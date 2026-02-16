export interface Choice {
  text: string;
}

export interface QuestItem {
  text: string;
  completed: boolean;
}

/** A known character with a generated portrait for visual consistency */
export interface CharacterPortrait {
  id: string;
  name: string;
  role: string;
  visualDescription: string;
  portraitBase64: string; // base64 image data without data URL prefix
  isMainCharacter: boolean;
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
  /** Whether this scene requires a MANDATORY voice chat with an NPC instead of choices */
  requiresVoiceChat: boolean;
  /** Voice chat configuration — only populated when requiresVoiceChat is true */
  voiceChatConfig: {
    characterName: string;
    characterRole: string;
    voiceName: string;
    initialDialogue: string;
    systemInstruction: string;
  };
  /** Optional: NPCs the player can OPTIONALLY talk to alongside normal choices.
   *  When populated, choices are shown normally AND talk buttons appear for each character.
   *  Mutually exclusive with requiresVoiceChat=true. */
  talkableCharacters: {
    characterName: string;
    characterRole: string;
    voiceName: string;
    initialDialogue: string;
    systemInstruction: string;
  }[];
  /** New important characters introduced in this scene that need portrait generation */
  newCharacters: {
    name: string;
    role: string;
    visualDescription: string;
    isMainCharacter: boolean;
  }[];
  /** Names of known characters who appear in this scene's images */
  sceneCharacterNames: string[];
  /** Optional: character name to highlight/move to front in the sidebar gallery */
  highlightCharacter: string;
  /** Backsound track for this scene — AI picks based on mood. Can be 'none' for silence. */
  backsound: string;
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
  /** Voice chat configuration when this scene requires MANDATORY NPC conversation */
  voiceChat?: VoiceChatConfig | null;
  /** NPCs the player can optionally talk to (shown alongside choices) */
  talkableCharacters?: VoiceChatConfig[];
  /** Names of characters appearing in this scene */
  sceneCharacterNames?: string[];
  /** Character to highlight in sidebar gallery */
  highlightCharacter?: string;
  /** Backsound track for this scene */
  backsound?: string;
}
