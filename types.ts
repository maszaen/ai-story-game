export interface Choice {
  text: string;
}

export interface QuestItem {
  text: string;
  completed: boolean;
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
}
