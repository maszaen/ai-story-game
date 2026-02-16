
export enum VoiceName {
  Zephyr = 'Zephyr',
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
}

export interface Character {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  voice: VoiceName;
  avatar: string;
  tagline: string;
}

export interface UserSettings {
  name: string;
  gender: string;
  interests: string;
  background: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'model';
  text: string;
}
