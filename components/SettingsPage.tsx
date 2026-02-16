import React, { useState, useRef } from 'react';
import type { GameSettings, ArtStyle, SegmentCount, Gender } from '../services/settings';
import { ART_STYLE_LABELS, GENDER_LABELS } from '../services/settings';
import { setApiKey, isEnvKey, hasSessionKey, migratePersistence } from '../services/apiKey';
import { createBackup, restoreBackup, type BackupProgress, type RestoreProgress } from '../services/backup';
import type { ImageSize } from './ImageSizeSelector';
import { IconGear, IconShield, IconScroll } from './Icons';

interface SettingsPageProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
  musicVolume: number;
  onVolumeChange: (v: number) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onChange, onBack, musicVolume, onVolumeChange }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const envKeyActive = isEnvKey();
  const sessionKeyActive = hasSessionKey();

  const update = (partial: Partial<GameSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    setApiKey(apiKeyInput, settings.persistApiKey);
    setApiKeyInput('');
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleTogglePersist = () => {
    const newPersist = !settings.persistApiKey;
    migratePersistence(newPersist);
    update({ persistApiKey: newPersist });
  };

  // ── Backup & Restore state ──
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isWorking = (backupProgress && backupProgress.phase !== 'done') || (restoreProgress && restoreProgress.phase !== 'done');

  const handleBackup = async () => {
    setBackupError(null);
    setBackupProgress({ phase: 'reading', message: 'Memulai...', percent: 0 });
    try {
      await createBackup((p) => setBackupProgress({ ...p }));
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : 'Backup gagal.');
      setBackupProgress(null);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    setRestoreSuccess(null);
    setRestoreProgress({ phase: 'parsing', message: 'Memulai...', percent: 0 });
    try {
      const result = await restoreBackup(file, (p) => setRestoreProgress({ ...p }));
      setRestoreSuccess(`${result.saveCount} petualangan dan ${result.imageCount} lukisan berhasil dipulihkan.`);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Restore gagal.');
      setRestoreProgress(null);
    }
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0e05 0%, #0d0704 60%, #000 100%)' }}>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-16 h-16 md:w-32 md:h-32 opacity-30"
        style={{ borderTop: '3px solid #c9a84c', borderLeft: '3px solid #c9a84c', margin: '10px' }} />
      <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 opacity-30"
        style={{ borderTop: '3px solid #c9a84c', borderRight: '3px solid #c9a84c', margin: '10px' }} />

      {/* Fixed header: back button + title */}
      <div className="flex-shrink-0 flex flex-col items-center px-4 pt-4 relative z-10">
        <div className="w-full max-w-xl mt-6 mb-4">
          <button
            onClick={onBack}
            className="text-amber-600 hover:text-amber-400 transition-colors flex items-center gap-2"
            style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}
          >
            ← Kembali
          </button>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              color: '#c9a84c',
              textShadow: '0 0 30px rgba(201, 168, 76, 0.2)',
            }}>
            <IconGear size={28} style={{ display: 'inline-block', marginRight: '8px' }} /> Pengaturan
          </h1>
          <p className="text-amber-800/60 text-sm italic" style={{ fontFamily: "'Crimson Text', serif" }}>
            Sesuaikan pengalaman petualanganmu
          </p>
        </div>

      </div>

      {/* Scrollable settings cards */}
      <div className="flex-1 overflow-y-auto relative px-4 pb-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c9a84c33 transparent' }}>
        {/* Gradient fade overlay at top of scroll area */}
        <div className="sticky top-0 left-0 right-0 h-8 pointer-events-none z-10 -mb-8" style={{
          background: 'linear-gradient(to bottom, rgba(13,7,4,1) 0%, rgba(13,7,4,0) 100%)',
        }} />
        <div className="w-full max-w-xl mx-auto space-y-4 mt-8">

        {/* API Key — only show when no env var */}
        {!envKeyActive && (
          <SettingCard title="Gemini API Key" desc={settings.persistApiKey ? 'Key disimpan permanen di browser ini.' : 'Key tidak disimpan permanen — akan hilang setelah menutup browser.'}>
            {sessionKeyActive && !keySaved ? (
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 px-3 py-2 rounded border border-amber-800/30 bg-amber-950/20"
                  style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', color: 'rgba(201,168,76,0.5)' }}>
                  ••••••••••••••••••••
                </div>
                <span className="text-xs" style={{ color: 'rgba(100,160,80,0.7)', fontFamily: "'Cinzel', serif" }}>Aktif</span>
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => { setApiKeyInput(e.target.value); setKeySaved(false); }}
                placeholder={sessionKeyActive ? 'Tulis ulang key baru...' : 'Masukkan API Key...'}
                className="flex-1 px-3 py-2 rounded border border-amber-900/40 bg-amber-950/30 text-amber-300 placeholder-amber-800/40 focus:border-amber-500 focus:outline-none transition-colors"
                style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.9rem' }}
                autoComplete="off"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className={`px-4 py-2 rounded border transition-all duration-300 ${
                  keySaved
                    ? 'border-green-600 bg-green-900/30 text-green-400'
                    : !apiKeyInput.trim()
                      ? 'border-amber-900/30 bg-amber-950/10 text-amber-800/40 cursor-not-allowed'
                      : 'border-amber-700/50 bg-amber-900/20 text-amber-500 hover:border-amber-500 hover:bg-amber-900/40'
                }`}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem' }}
              >
                {keySaved ? 'Tersimpan!' : 'Simpan'}
              </button>
            </div>
            {!sessionKeyActive && !keySaved && (
              <p className="mt-2 text-xs" style={{ color: 'rgba(180,160,120,0.5)', fontFamily: "'Crimson Text', serif" }}>
                Dapatkan key di{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400 transition-colors" style={{ color: 'rgba(201,168,76,0.6)' }}>
                  Google AI Studio
                </a>
              </p>
            )}

            {/* Persistent API key toggle */}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              <button
                onClick={handleTogglePersist}
                className="flex items-center gap-3 w-full"
              >
                <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
                  settings.persistApiKey ? 'bg-amber-700' : 'bg-amber-950 border border-amber-900/40'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
                    settings.persistApiKey
                      ? 'left-[26px] bg-amber-400'
                      : 'left-0.5 bg-amber-800'
                  }`} />
                </div>
                <span className={`text-sm ${settings.persistApiKey ? 'text-amber-400' : 'text-amber-700/60'}`}
                  style={{ fontFamily: "'Crimson Text', serif" }}>
                  {settings.persistApiKey ? 'Simpan Permanen' : 'Sementara (hilang saat refresh)'}
                </span>
              </button>
            </div>
          </SettingCard>
        )}
        {/* Volume */}
        <SettingCard title="Volume Musik" desc="Atur volume musik latar petualanganmu.">
          <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0 }}>
              {musicVolume === 0 ? (
                <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
              ) : (
                <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></>
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(musicVolume * 100)}
              onChange={e => onVolumeChange(Number(e.target.value) / 100)}
              className="volume-slider flex-1"
              style={{ accentColor: '#c9a84c' }}
            />
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.75rem',
              color: '#c9a84c',
              minWidth: '36px',
              textAlign: 'right',
            }}>
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </SettingCard>

        {/* Gender */}
        <SettingCard title="Gender Karakter" desc="Gender karakter utama dalam cerita. Mempengaruhi narasi dan penampilan visual.">
          <div className="flex gap-2">
            {(Object.entries(GENDER_LABELS) as [Gender, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => update({ gender: key })}
                className={`flex-1 py-2 rounded border transition-all duration-200 ${
                  settings.gender === key
                    ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                    : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
                }`}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Image Quality */}
        <SettingCard title="Kualitas Gambar" desc="Resolusi gambar yang dihasilkan AI. Lebih tinggi = lebih detail tapi lebih lambat.">
          <div className="flex gap-2">
            {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
              <button
                key={size}
                onClick={() => update({ imageSize: size })}
                className={`flex-1 py-2 rounded border transition-all duration-200 ${
                  settings.imageSize === size
                    ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                    : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
                }`}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}
              >
                {size === '1K' ? 'Standar (1K)' : size === '2K' ? 'Tinggi (2K)' : 'Ultra (4K)'}
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Art Style */}
        <SettingCard title="Gaya Seni" desc="Gaya visual untuk gambar yang dihasilkan.">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(ART_STYLE_LABELS) as [ArtStyle, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => update({ artStyle: key })}
                className={`py-2 px-3 rounded border transition-all duration-200 text-left ${
                  settings.artStyle === key
                    ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                    : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
                }`}
                style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.85rem' }}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Segments per turn */}
        <SettingCard title="Gambar per Giliran" desc="Jumlah segmen cerita (masing-masing dengan gambar) per giliran.">
          <div className="flex gap-2">
            {([2, 3] as SegmentCount[]).map(count => (
              <button
                key={count}
                onClick={() => update({ segmentsPerTurn: count })}
                className={`flex-1 py-2 rounded border transition-all duration-200 ${
                  settings.segmentsPerTurn === count
                    ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                    : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
                }`}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}
              >
                {count} Gambar
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Auto-save */}
        <SettingCard title="Simpan Otomatis" desc="Otomatis menyimpan progres setiap giliran.">
          <button
            onClick={() => update({ autoSave: !settings.autoSave })}
            className="flex items-center gap-3 w-full"
          >
            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
              settings.autoSave ? 'bg-amber-700' : 'bg-amber-950 border border-amber-900/40'
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
                settings.autoSave
                  ? 'left-[26px] bg-amber-400'
                  : 'left-0.5 bg-amber-800'
              }`} />
            </div>
            <span className={`text-sm ${settings.autoSave ? 'text-amber-400' : 'text-amber-700/60'}`}
              style={{ fontFamily: "'Crimson Text', serif" }}>
              {settings.autoSave ? 'Aktif' : 'Nonaktif'}
            </span>
          </button>
        </SettingCard>

        {/* Backup & Restore */}
        <SettingCard title="Cadangan & Pemulihan" desc="Pindahkan petualanganmu ke perangkat lain. Backup menyimpan semua save beserta gambar dalam satu arsip.">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".zip"
            onChange={handleRestoreFile}
            style={{ display: 'none' }}
          />

          <div className="flex gap-2 mb-3">
            <button
              onClick={handleBackup}
              disabled={!!isWorking}
              className={`flex-1 py-2 rounded border transition-all duration-200 flex items-center justify-center gap-2 ${
                isWorking
                  ? 'border-amber-900/30 bg-amber-950/10 text-amber-800/40 cursor-not-allowed'
                  : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
              }`}
              style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}
            >
              <IconShield size={14} /> Backup
            </button>
            <button
              onClick={handleRestoreClick}
              disabled={!!isWorking}
              className={`flex-1 py-2 rounded border transition-all duration-200 flex items-center justify-center gap-2 ${
                isWorking
                  ? 'border-amber-900/30 bg-amber-950/10 text-amber-800/40 cursor-not-allowed'
                  : 'border-amber-900/40 text-amber-700/60 hover:border-amber-700/60 hover:text-amber-600'
              }`}
              style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem' }}
            >
              <IconScroll size={14} /> Restore
            </button>
          </div>

          {/* Backup progress */}
          {backupProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs italic" style={{ color: 'rgba(180,160,120,0.5)', fontFamily: "'Crimson Text', serif" }}>
                  {backupProgress.message}
                </span>
                <span className="text-xs" style={{ color: 'rgba(201,168,76,0.4)', fontFamily: "'Cinzel', serif" }}>
                  {Math.round(backupProgress.percent)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden border border-amber-900/30" style={{ background: 'rgba(10,7,3,0.6)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${backupProgress.percent}%`,
                    background: backupProgress.phase === 'done'
                      ? 'linear-gradient(90deg, rgba(100,160,80,0.7), rgba(100,160,80,0.4))'
                      : 'linear-gradient(90deg, rgba(201,168,76,0.6), rgba(201,168,76,0.25))',
                    boxShadow: backupProgress.phase === 'done'
                      ? '0 0 8px rgba(100,160,80,0.3)'
                      : '0 0 8px rgba(201,168,76,0.2)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Restore progress */}
          {restoreProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs italic" style={{ color: 'rgba(180,160,120,0.5)', fontFamily: "'Crimson Text', serif" }}>
                  {restoreProgress.message}
                </span>
                <span className="text-xs" style={{ color: 'rgba(201,168,76,0.4)', fontFamily: "'Cinzel', serif" }}>
                  {Math.round(restoreProgress.percent)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden border border-amber-900/30" style={{ background: 'rgba(10,7,3,0.6)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${restoreProgress.percent}%`,
                    background: restoreProgress.phase === 'done'
                      ? 'linear-gradient(90deg, rgba(100,160,80,0.7), rgba(100,160,80,0.4))'
                      : 'linear-gradient(90deg, rgba(201,168,76,0.6), rgba(201,168,76,0.25))',
                    boxShadow: restoreProgress.phase === 'done'
                      ? '0 0 8px rgba(100,160,80,0.3)'
                      : '0 0 8px rgba(201,168,76,0.2)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error messages */}
          {backupError && (
            <p className="mt-2 text-xs italic" style={{ color: 'rgba(180,80,80,0.7)', fontFamily: "'Crimson Text', serif" }}>
              {backupError}
            </p>
          )}
          {restoreError && (
            <p className="mt-2 text-xs italic" style={{ color: 'rgba(180,80,80,0.7)', fontFamily: "'Crimson Text', serif" }}>
              {restoreError}
            </p>
          )}

          {/* Success message */}
          {restoreSuccess && (
            <p className="mt-2 text-xs italic" style={{ color: 'rgba(100,160,80,0.7)', fontFamily: "'Crimson Text', serif" }}>
              {restoreSuccess}
            </p>
          )}
        </SettingCard>

        </div>
      </div>

    </div>
  );
};

// Reusable setting card wrapper
const SettingCard: React.FC<{ title: string; desc: string; children: React.ReactNode }> = ({ title, desc, children }) => (
  <div className="p-5 rounded-lg border border-amber-900/40"
    style={{ background: 'linear-gradient(180deg, rgba(25,18,8,0.8) 0%, rgba(15,10,5,0.9) 100%)' }}>
    <h3 className="text-amber-500 font-semibold mb-1" style={{ fontFamily: "'Cinzel', serif", fontSize: '0.9rem' }}>
      {title}
    </h3>
    <p className="text-amber-800/50 text-xs mb-3 italic" style={{ fontFamily: "'Crimson Text', serif" }}>
      {desc}
    </p>
    {children}
  </div>
);
