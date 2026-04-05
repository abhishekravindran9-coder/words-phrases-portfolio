import React, { createContext, useContext, useEffect, useState } from 'react';

// Available sizes: class applied to <html>, root px, label
const SIZES = [
  { key: 'sm', label: 'Small',   px: '14px' },
  { key: 'md', label: 'Default', px: '16px' },
  { key: 'lg', label: 'Large',   px: '18px' },
];

const FontSizeContext = createContext();

export function FontSizeProvider({ children }) {
  const [fontSize, setFontSizeState] = useState(
    () => localStorage.getItem('wp_font_size') || 'md'
  );

  useEffect(() => {
    SIZES.forEach(({ key }) => document.documentElement.classList.remove(`font-${key}`));
    document.documentElement.classList.add(`font-${fontSize}`);
    localStorage.setItem('wp_font_size', fontSize);
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize: setFontSizeState, sizes: SIZES }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
