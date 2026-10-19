import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  className = '',
}) => {
  return (
    <img
      src="/src/assets/app-logo.png"
      alt="BrainMint"
      className={className}
      style={{
        width: '100%',
        maxWidth: '110px',
        height: '54px',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        margin: '0 auto',
        flexShrink: 0,
      }}
    />
  );
};

export default BrandLogo;
export { BrandLogo };