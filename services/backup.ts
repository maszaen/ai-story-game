/**
 * Backup & Restore Service
 * 
 * Creates a ZIP file containing all game saves with images stored efficiently
 * as binary PNG files instead of base64 strings.
 * 
 * Format:
 *   backup.zip
 *   ├── manifest.json            — metadata (version, date, save count)
 *   ├── saves.json               — all save data (images replaced with "ref:..." references)
 *   └── images/
 *       ├── s0_seg0_a1b2c3.png   — scene segment images (binary)
 *       ├── s0_port_Name.png     — character portraits (binary)
 *       └── ...
 */

import JSZip from 'jszip';
import { getAllSaves, putSave, type SaveData } from './database';

// ── Types ────────────────────────────────────────────────

interface BackupManifest {
  version: 1;
  appName: string;
  createdAt: string;
  saveCount: number;
  saveIds: string[];
}

export interface BackupProgress {
  phase: 'reading' | 'extracting' | 'packing' | 'done';
  message: string;
  percent: number;
}

export interface RestoreProgress {
  phase: 'parsing' | 'images' | 'writing' | 'done';
  message: string;
  percent: number;
}

// ── Helpers ──────────────────────────────────────────────

/** Decode a base64 string (with or without data URL prefix) to a Uint8Array */
function base64ToUint8Array(b64: string): Uint8Array {
  // Strip data URL prefix if present: "data:image/png;base64,..."
  const raw = b64.includes(',') ? b64.split(',')[1] : b64;
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Encode a Uint8Array back to a base64 data URL */
function uint8ArrayToDataUrl(bytes: Uint8Array, mime = 'image/png'): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Encode a Uint8Array to raw base64 (no data URL prefix) */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Generate a short hash from a string for unique filenames */
function shortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(input.length, 200); i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

/** Sanitize a string for use in a filename */
function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
}

// ── Backup ───────────────────────────────────────────────

const IMAGE_REF_PREFIX = 'ref:';

export async function createBackup(
  onProgress?: (p: BackupProgress) => void
): Promise<void> {
  const report = (phase: BackupProgress['phase'], message: string, percent: number) => {
    onProgress?.({ phase, message, percent });
  };

  // 1. Read all saves
  report('reading', 'Membaca catatan petualangan...', 5);
  const saves = await getAllSaves();
  if (saves.length === 0) {
    throw new Error('Tidak ada save yang ditemukan untuk di-backup.');
  }

  const zip = new JSZip();
  const imgFolder = zip.folder('images')!;
  let imageCount = 0;

  // 2. Process each save — extract images
  report('extracting', 'Mengumpulkan artefak dan lukisan...', 10);

  // Deep clone saves so we don't mutate the originals
  const processedSaves: SaveData[] = JSON.parse(JSON.stringify(saves));

  for (let si = 0; si < processedSaves.length; si++) {
    const save = processedSaves[si];
    const progress = 10 + (si / processedSaves.length) * 60;
    report('extracting', `Mengemas petualangan ${si + 1}/${processedSaves.length}...`, progress);

    // Extract scene segment images
    if (save.sceneHistory) {
      for (let sci = 0; sci < save.sceneHistory.length; sci++) {
        const scene = save.sceneHistory[sci];
        if (scene.segments) {
          for (let segi = 0; segi < scene.segments.length; segi++) {
            const seg = scene.segments[segi];
            if (seg.image && seg.image.startsWith('data:')) {
              const filename = `s${si}_sc${sci}_seg${segi}_${shortHash(seg.image)}.png`;
              try {
                const bytes = base64ToUint8Array(seg.image);
                imgFolder.file(filename, bytes);
                seg.image = IMAGE_REF_PREFIX + filename;
                imageCount++;
              } catch { /* skip corrupt images */ }
            }
          }
        }
      }
    }

    // Extract character portraits
    if (save.knownCharacters) {
      for (let ci = 0; ci < save.knownCharacters.length; ci++) {
        const char = save.knownCharacters[ci];
        if (char.portraitBase64 && char.portraitBase64.length > 100) {
          const filename = `s${si}_port_${sanitize(char.name)}_${ci}.png`;
          try {
            const bytes = base64ToUint8Array(char.portraitBase64);
            imgFolder.file(filename, bytes);
            char.portraitBase64 = IMAGE_REF_PREFIX + filename;
            imageCount++;
          } catch { /* skip corrupt portraits */ }
        }
      }
    }

    // Extract thumbnail
    if (save.thumbnail && save.thumbnail.startsWith('data:')) {
      const filename = `s${si}_thumb_${shortHash(save.thumbnail)}.png`;
      try {
        const bytes = base64ToUint8Array(save.thumbnail);
        imgFolder.file(filename, bytes);
        save.thumbnail = IMAGE_REF_PREFIX + filename;
        imageCount++;
      } catch { /* skip */ }
    }
  }

  // 3. Build manifest
  report('packing', 'Menyegel gulungan perkamen...', 75);

  const manifest: BackupManifest = {
    version: 1,
    appName: 'AI Infinity: Choose Your Own Path',
    createdAt: new Date().toISOString(),
    saveCount: saves.length,
    saveIds: saves.map(s => s.id),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('saves.json', JSON.stringify(processedSaves, null, 2));

  // 4. Generate ZIP and trigger download
  report('packing', `Mengompresi ${imageCount} lukisan ke dalam arsip...`, 85);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }, (meta) => {
    const pct = 85 + (meta.percent / 100) * 14;
    report('packing', `Mengemas arsip... ${Math.round(meta.percent)}%`, pct);
  });

  // 5. Download
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // 2026-02-16
  const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // 2013
  const filename = `AI-Infinity-Backup_${dateStr}_${timeStr}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  report('done', `Backup selesai — ${saves.length} save, ${imageCount} gambar.`, 100);
}

// ── Restore ──────────────────────────────────────────────

export async function restoreBackup(
  file: File,
  onProgress?: (p: RestoreProgress) => void
): Promise<{ saveCount: number; imageCount: number }> {
  const report = (phase: RestoreProgress['phase'], message: string, percent: number) => {
    onProgress?.({ phase, message, percent });
  };

  // 1. Parse ZIP
  report('parsing', 'Membuka segel arsip...', 5);
  const zip = await JSZip.loadAsync(file);

  // 2. Validate manifest
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Arsip backup tidak valid — manifest.json tidak ditemukan.');
  }
  const manifest: BackupManifest = JSON.parse(await manifestFile.async('string'));
  if (manifest.version !== 1) {
    throw new Error(`Versi backup tidak didukung: ${manifest.version}`);
  }

  // 3. Read saves
  report('parsing', 'Membaca catatan petualangan...', 15);
  const savesFile = zip.file('saves.json');
  if (!savesFile) {
    throw new Error('Arsip backup tidak valid — saves.json tidak ditemukan.');
  }
  const saves: SaveData[] = JSON.parse(await savesFile.async('string'));

  // 4. Rebuild images from references
  let imageCount = 0;
  const imageCache = new Map<string, Uint8Array>();

  report('images', 'Memulihkan lukisan dan artefak...', 25);

  // Pre-load all images into cache
  const imgFolder = zip.folder('images');
  if (imgFolder) {
    const imageFiles: string[] = [];
    imgFolder.forEach((relativePath) => {
      imageFiles.push(relativePath);
    });

    for (let i = 0; i < imageFiles.length; i++) {
      const fname = imageFiles[i];
      const imgFile = imgFolder.file(fname);
      if (imgFile) {
        const bytes = await imgFile.async('uint8array');
        imageCache.set(fname, bytes);
        imageCount++;
      }
      const pct = 25 + (i / imageFiles.length) * 40;
      report('images', `Memulihkan lukisan ${i + 1}/${imageFiles.length}...`, pct);
    }
  }

  // 5. Reconstruct saves with images
  report('writing', 'Menulis ulang catatan ke perkamen baru...', 70);

  for (let si = 0; si < saves.length; si++) {
    const save = saves[si];
    const pct = 70 + (si / saves.length) * 25;
    report('writing', `Menyimpan petualangan ${si + 1}/${saves.length}...`, pct);

    // Restore scene segment images
    if (save.sceneHistory) {
      for (const scene of save.sceneHistory) {
        if (scene.segments) {
          for (const seg of scene.segments) {
            if (seg.image && seg.image.startsWith(IMAGE_REF_PREFIX)) {
              const fname = seg.image.substring(IMAGE_REF_PREFIX.length);
              const bytes = imageCache.get(fname);
              if (bytes) {
                seg.image = uint8ArrayToDataUrl(bytes);
              } else {
                seg.image = ''; // image not found, clear it
              }
            }
          }
        }
      }
    }

    // Restore character portraits
    if (save.knownCharacters) {
      for (const char of save.knownCharacters) {
        if (char.portraitBase64 && char.portraitBase64.startsWith(IMAGE_REF_PREFIX)) {
          const fname = char.portraitBase64.substring(IMAGE_REF_PREFIX.length);
          const bytes = imageCache.get(fname);
          if (bytes) {
            char.portraitBase64 = uint8ArrayToBase64(bytes);
          } else {
            char.portraitBase64 = '';
          }
        }
      }
    }

    // Restore thumbnail
    if (save.thumbnail && save.thumbnail.startsWith(IMAGE_REF_PREFIX)) {
      const fname = save.thumbnail.substring(IMAGE_REF_PREFIX.length);
      const bytes = imageCache.get(fname);
      if (bytes) {
        save.thumbnail = uint8ArrayToDataUrl(bytes);
      } else {
        save.thumbnail = '';
      }
    }

    // Write to IndexedDB
    await putSave(save);
  }

  report('done', `Restore selesai — ${saves.length} petualangan dipulihkan.`, 100);
  return { saveCount: saves.length, imageCount };
}
