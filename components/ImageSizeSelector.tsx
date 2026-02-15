
import React from 'react';

export type ImageSize = '1K' | '2K' | '4K';

interface ImageSizeSelectorProps {
  value: ImageSize;
  onChange: (size: ImageSize) => void;
  disabled: boolean;
}

export const ImageSizeSelector: React.FC<ImageSizeSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="my-3 flex items-center justify-end">
      <label htmlFor="image-size" className="mr-3" style={{
        fontFamily: "'Cinzel', serif",
        color: 'rgba(201,168,76,0.5)',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Kualitas Gambar
      </label>
      <select
        id="image-size"
        value={value}
        onChange={(e) => onChange(e.target.value as ImageSize)}
        disabled={disabled}
        className="rounded px-3 py-1.5 text-sm disabled:opacity-40"
        style={{
          background: 'rgba(20, 14, 8, 0.8)',
          border: '1px solid rgba(201, 168, 76, 0.25)',
          color: '#b8a882',
          fontFamily: "'Crimson Text', serif",
          outline: 'none',
        }}
      >
        <option value="1K">Standar (1K)</option>
        <option value="2K">Tinggi (2K)</option>
        <option value="4K">Ultra (4K)</option>
      </select>
    </div>
  );
};
