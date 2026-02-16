import type { Scene, QuestItem, CharacterPortrait, ChatMessage } from '../types';

const DB_NAME = 'adventure-engine-db';
const DB_VERSION = 2;
const SAVES_STORE = 'saves';

export interface SaveData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** All past scenes for history navigation */
  sceneHistory: Scene[];
  /** Index of the currently viewed scene */
  currentSceneIndex: number;
  inventory: string[];
  quests: QuestItem[];
  storyHistory: { role: string; parts: { text: string }[] }[];
  /** Thumbnail: first image of latest scene */
  thumbnail: string;
  turnCount: number;
  isGameOver: boolean;
  gameOverMessage: string;
  /** Persistent visual identity of the main character */
  characterVisualIdentity: string;
  /** Persistent visual identity of the current location */
  locationVisualIdentity: string;
  /** Known characters with generated portraits for visual consistency */
  knownCharacters: CharacterPortrait[];
  /** Optional NPC conversation logs for the current scene (keyed by character name) */
  conversationLogs?: Record<string, ChatMessage[]>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SAVES_STORE)) {
        const store = db.createObjectStore(SAVES_STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSaves(): Promise<SaveData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVES_STORE, 'readonly');
    const store = tx.objectStore(SAVES_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const saves = request.result as SaveData[];
      saves.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(saves);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSave(id: string): Promise<SaveData | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVES_STORE, 'readonly');
    const store = tx.objectStore(SAVES_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as SaveData | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function putSave(save: SaveData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVES_STORE, 'readwrite');
    const store = tx.objectStore(SAVES_STORE);
    store.put(save);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSave(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAVES_STORE, 'readwrite');
    const store = tx.objectStore(SAVES_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function generateSaveId(): string {
  return `save_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
