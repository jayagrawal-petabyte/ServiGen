import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * ServiGen official Brand Logo (matching the Splash Screen badge):
 * A vibrant cyan (#00C4FF) circular disc with the clean white chat-bubble vector glyph.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
      aria-label="ServiGen Logo"
    >
      <circle cx="44" cy="44" r="44" fill="#00C4FF" />
      <path
        d="M 44 26 C 33.5 26 25 33.6 25 43 C 25 46.8 26.4 50.3 28.8 53.1 C 28.1 56.4 26.5 59.2 26.3 59.6 C 26.1 60 26.3 60.5 26.7 60.7 C 26.9 60.8 27.1 60.8 27.3 60.8 C 31.2 60.8 34.6 59.1 37.1 57.8 C 39.3 58.6 41.6 59 44 59 C 54.5 59 63 51.4 63 42 C 63 32.6 54.5 26 44 26 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

export default BrandLogo;
