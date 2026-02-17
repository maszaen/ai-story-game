import type { ImageSize } from '../components/ImageSizeSelector';

export type ArtStyle = 'ghibli' | 'dark-fantasy' | 'watercolor' | 'realistic' | 'pixel-art' | 'comic';
export type SegmentCount = 2 | 3;
export type Gender = 'male' | 'female';

export const GENDER_LABELS: Record<Gender, string> = {
  'male': 'Laki-laki',
  'female': 'Perempuan',
};

export interface GameSettings {
  imageSize: ImageSize;
  segmentsPerTurn: SegmentCount;
  artStyle: ArtStyle;
  autoSave: boolean;
  gender: Gender;
  /** When true, API key is stored in localStorage (survives refresh). Otherwise sessionStorage. */
  persistApiKey: boolean;
  /** Volume controls (0-1) */
  masterVolume: number;
  musicVolume: number;
  voiceVolume: number;
}

const SETTINGS_KEY = 'adventure-engine-settings';

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  'ghibli': 'Studio Ghibli',
  'dark-fantasy': 'Dark Fantasy',
  'watercolor': 'Cat Air (Watercolor)',
  'realistic': 'Realistis',
  'pixel-art': 'Pixel Art',
  'comic': 'Komik / Manga',
};

export const ART_STYLE_PROMPTS: Record<ArtStyle, string> = {
  'ghibli': 'in a vibrant, detailed digital painting style with a hint of Ghibli-inspired fantasy, maintaining consistent character designs throughout.',
  'dark-fantasy': 'in a dark, atmospheric fantasy art style with dramatic lighting, deep shadows, and rich textures reminiscent of Dark Souls concept art.',
  'watercolor': 'in a beautiful traditional watercolor painting style with soft edges, flowing colors, and delicate brushstrokes.',
  'realistic': 'in a photorealistic digital art style with cinematic lighting, high detail, and realistic textures.',
  'pixel-art': 'in a detailed pixel art style with vibrant colors, reminiscent of classic 16-bit RPG games.',
  'comic': 'in a detailed manga/comic book art style with bold linework, dynamic compositions, and expressive characters.',
};

const DEFAULT_SETTINGS: GameSettings = {
  imageSize: '1K',
  segmentsPerTurn: 2,
  artStyle: 'ghibli',
  autoSave: true,
  gender: 'male',
  persistApiKey: false,
  masterVolume: 1,
  musicVolume: 0.1,
  voiceVolume: 1,
};

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getArtStylePrompt(style: ArtStyle): string {
  return ART_STYLE_PROMPTS[style] || ART_STYLE_PROMPTS['ghibli'];
}
