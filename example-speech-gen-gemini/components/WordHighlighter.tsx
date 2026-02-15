
import React from 'react';

interface WordHighlighterProps {
  text: string;
  highlightedIndex: number;
}

export const WordHighlighter: React.FC<WordHighlighterProps> = ({ text, highlightedIndex }) => {
  // Split the text by any whitespace but keep the whitespace characters in the array.
  // This preserves the original formatting, including multiple spaces or newlines.
  const wordsAndSpaces = text.split(/(\s+)/);

  return (
    <p className="text-lg md:text-xl leading-relaxed text-gray-700 select-none">
      {wordsAndSpaces.map((segment, index) => {
        // A non-space segment will have an even index after this split method.
        // We use this to map the span index back to the original word index.
        const wordIndex = Math.floor(index / 2);
        const isWord = segment.trim() !== '';
        const isHighlighted = isWord && wordIndex === highlightedIndex;

        return (
          <span
            key={index}
            className={`transition-all duration-200 ease-in-out ${
              isHighlighted 
                ? 'bg-yellow-300/80 rounded-md px-1 py-0.5' 
                : 'bg-transparent'
            }`}
          >
            {segment}
          </span>
        );
      })}
    </p>
  );
};
