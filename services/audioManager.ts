import homescreenAudio from '/assets/backsounds/homescreen-backsound.mp3';
import generatingStoryAudio from '/assets/backsounds/generating-story-backsound.mp3';
import comedyAudio from '/assets/backsounds/comedy-backsound.mp3';
import happyAudio from '/assets/backsounds/happy-backsound.mp3';
import horrorAudio from '/assets/backsounds/horror-backsound.mp3';
import horrorSlowAudio from '/assets/backsounds/horror-slow-backsound.mp3';
import romanticAudio from '/assets/backsounds/romantic-backsound.mp3';
import romanticSlowAudio from '/assets/backsounds/romantic-slow-backsound.mp3';
import sadAudio from '/assets/backsounds/sad-backsound.mp3';
import suspiciousAudio from '/assets/backsounds/suspicious-backsound.mp3';
import relaxAudio from '/assets/backsounds/relax-backsound.mp3';
import tenseAudio from '/assets/backsounds/tense-backsound.mp3';
import netralAudio from '/assets/backsounds/netral-sunrise-sunset-calm-backsound.mp3';

// Available backsound tracks
export type BacksoundId =
  | 'homescreen'
  | 'generating-story'
  | 'comedy'
  | 'happy'
  | 'horror'
  | 'horror-slow'
  | 'romantic'
  | 'romantic-slow'
  | 'sad'
  | 'suspicious'
  | 'relax'
  | 'tense'
  | 'netral'
  | 'none';

const TRACK_FILES: Record<Exclude<BacksoundId, 'none'>, string> = {
  'homescreen': homescreenAudio,
  'generating-story': generatingStoryAudio,
  'comedy': comedyAudio,
  'happy': happyAudio,
  'horror': horrorAudio,
  'horror-slow': horrorSlowAudio,
  'romantic': romanticAudio,
  'romantic-slow': romanticSlowAudio,
  'sad': sadAudio,
  'suspicious': suspiciousAudio,
  'relax': relaxAudio,
  'tense': tenseAudio,
  'netral': netralAudio,
};

/** Descriptions for each track — used in AI prompt so it can choose wisely */
export const BACKSOUND_DESCRIPTIONS: Record<Exclude<BacksoundId, 'none'>, string> = {
  'homescreen': 'Calm, ambient menu music — only for title/home screen, never for scenes.',
  'generating-story': 'Suspenseful waiting music — only for loading/generating screens, never for scenes.',
  'comedy': 'Light-hearted, funny, playful moments — comedic situations, humorous dialogue, silly events.',
  'happy': 'Joyful, uplifting, warm — celebrations, victories, reunions, peaceful moments, discovery of beauty.',
  'horror': 'Intense horror, terrifying, high danger — monsters attacking, extreme fear, nightmares, panic.',
  'horror-slow': 'Eerie, unsettling, creepy atmosphere — dark places, feeling watched, mild supernatural presence, unease without immediate attack.',
  'romantic': 'Intense, emotional, deep intimacy — passionate love scenes, critical relationship moments, strong romantic feelings.',
  'romantic-slow': 'Gentle, subtle, sweet — early romance, flirting, calm conversations, neutral but warm feelings, friendship moments.',
  'sad': 'Melancholic, sorrowful, poignant — loss, defeat, tragic events, emotional pain, farewell.',
  'suspicious': 'Mysterious, uneasy, intriguing — investigations, secrets, suspicious characters, plot twists, puzzles.',
  'relax': 'Calm, relief, safe — moments of rest after danger, taverns, peaceful villages, safe havens, unwinding.',
  'tense': 'High stakes, urgent, action — chase scenes, escaping danger, combat buildup, time pressure, critical threats.',
  'netral': 'Neutral, chill, peaceful — sunrise, sunset, walking, waiting, everyday moments with no strong emotion or danger.',
};

const CROSSFADE_MS = 1500;
const FADE_STEPS = 30;
const DB_NAME = 'FantasyAudioDB';
const STORE_NAME = 'audio_cache';
const DB_VERSION = 1;

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrack: BacksoundId = 'none';
  private _volume = 0.5; // 0–1
  private fading = false;
  private db: IDBDatabase | null = null;
  /** Map of track ID to Blob URL */
  private audioCache = new Map<string, string>();
  private initialized = false;

  get volume() { return this._volume; }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.currentAudio && !this.fading) {
      this.currentAudio.volume = this._volume;
    }
  }

  /** Initialize DB and Preload all assets */
  async init(onProgress?: (percent: number, currentFile: string) => void): Promise<void> {
    if (this.initialized) {
      onProgress?.(100, 'Done');
      return;
    }

    try {
      await this.openDB();
      const tracks = Object.keys(TRACK_FILES) as Exclude<BacksoundId, 'none'>[];
      let completed = 0;

      for (const id of tracks) {
        const url = TRACK_FILES[id];
        onProgress?.(Math.round((completed / tracks.length) * 100), id);
        
        try {
          const blob = await this.fetchAndCache(id, url);
          const blobUrl = URL.createObjectURL(blob);
          this.audioCache.set(id, blobUrl);
        } catch (err) {
          console.error(`Failed to preload ${id}:`, err);
          // Fallback to original URL if caching fails
          this.audioCache.set(id, url);
        }
        
        completed++;
      }
      
      this.initialized = true;
      onProgress?.(100, 'Siap!');
    } catch (err) {
      console.error('Audio initialization failed:', err);
      // Fallback: mark initialized anyway so app can run using direct URLs
      this.initialized = true;
    }
  }

  /** Try to unlock audio context on earliest interaction */
  resumeContext() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
  }

  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async fetchAndCache(id: string, url: string): Promise<Blob> {
    // 1. Check DB first
    const cachedBlob = await this.getFromDB(id);
    if (cachedBlob) {
      console.log(`Loaded ${id} from cache`);
      return cachedBlob;
    }

    // 2. Fetch if not in DB
    console.log(`Fetching ${id} from network...`);
    const response = await fetch(url);
    const blob = await response.blob();
    
    // 3. Store in DB
    await this.putToDB(id, blob);
    return blob;
  }

  private getFromDB(key: string): Promise<Blob | undefined> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(undefined);
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as Blob);
      req.onerror = () => resolve(undefined);
    });
  }

  private putToDB(key: string, blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // don't fail hard on write error
    });
  }

  /** Play a track with crossfade Using Cached Blob URL. */
  play(id: BacksoundId) {
    if (id === this.currentTrack) return;

    if (id === 'none') {
      this.fadeOut();
      return;
    }

    // Use cached Blob URL if available, otherwise fallback to imported path
    const src = this.audioCache.get(id) || TRACK_FILES[id];
    if (!src) return;

    const newAudio = new Audio(src);
    newAudio.loop = true;
    newAudio.volume = 0;

    // Fade out old, fade in new
    const oldAudio = this.currentAudio;
    this.currentAudio = newAudio;
    this.currentTrack = id;

    // Attempt play - browser might block if no interaction yet
    const playPromise = newAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Play started successfully
          this.crossfade(oldAudio, newAudio);
        })
        .catch(error => {
          console.warn('Playback prevented (autoplay policy). Waiting for interaction.', error);
          // Don't crossfade yet if we can't play. 
          // We leave currentAudio set, so a global click handler can call resumeContext()
        });
    }
  }

  /** Stop all playback with fade out */
  fadeOut() {
    if (this.currentAudio) {
      this.fadeAudioOut(this.currentAudio);
      this.currentAudio = null;
      this.currentTrack = 'none';
    }
  }

  /** Stop immediately (for cleanup) */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
      this.currentTrack = 'none';
    }
  }

  get currentlyPlaying(): BacksoundId {
    return this.currentTrack;
  }

  private crossfade(oldAudio: HTMLAudioElement | null, newAudio: HTMLAudioElement) {
    this.fading = true;
    const stepTime = CROSSFADE_MS / FADE_STEPS;
    const targetVol = this._volume;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / FADE_STEPS;

      // Fade out old
      if (oldAudio) {
        oldAudio.volume = Math.max(0, targetVol * (1 - progress));
      }
      // Fade in new
      // Check if newAudio is still valid (might have been replaced during fade)
      if (newAudio === this.currentAudio) {
         newAudio.volume = Math.min(targetVol, targetVol * progress);
      } else {
         // If replaced, stop fading this one in
         newAudio.volume = 0;
         newAudio.pause();
      }

      if (step >= FADE_STEPS) {
        clearInterval(interval);
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.src = '';
        }
        if (newAudio === this.currentAudio) {
           newAudio.volume = targetVol;
        }
        this.fading = false;
      }
    }, stepTime);
  }

  private fadeAudioOut(audio: HTMLAudioElement) {
    this.fading = true;
    const stepTime = CROSSFADE_MS / FADE_STEPS;
    const startVol = audio.volume;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / FADE_STEPS;
      audio.volume = Math.max(0, startVol * (1 - progress));

      if (step >= FADE_STEPS) {
        clearInterval(interval);
        audio.pause();
        audio.src = '';
        this.fading = false;
      }
    }, stepTime);
  }
}

// Singleton instance
export const audioManager = new AudioManager();
