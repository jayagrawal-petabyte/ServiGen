import React from 'react';
import appLogo from '../../assets/app-logo.png';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = React.memo(({
  className = '',
}) => {
  return (
    <img
      src={appLogo}
      alt="BrainMint Logo"
      width={110}
      height={54}
      decoding="async"
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
});

export default BrandLogo;
export { BrandLogo };