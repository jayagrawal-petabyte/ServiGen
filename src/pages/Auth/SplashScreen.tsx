import React, { useEffect } from 'react';
import './auth.css';
import brainmintLogo from '../../assets/brainmint-logo-transparent.png';

export interface SplashScreenProps {
  userName?: string;
  loadingMessage?: string;
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  userName = 'admin001',
  loadingMessage = 'We are signing you in',
  onComplete,
  durationMs = 1500,
}) => {
  const handleProceed = () => {
    if (onComplete) onComplete();
  };

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [onComplete, durationMs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleProceed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div
      className="figma-splash-page cursor-pointer"
      onClick={handleProceed}
      title="Click or press any key to enter immediately"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') handleProceed();
      }}
    >
      {/* Right-side Curved Graphic - Strict Figma Terracotta Color Template (#EFA087 -> #C4674E) */}
      <svg
        className="splash-teal-curve"
        viewBox="0 0 500 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="figmaCurveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EFA087" />
            <stop offset="100%" stopColor="#C4674E" />
          </linearGradient>
        </defs>
        <path
          d="M 230 0 C 190 280, 110 650, 0 1000 L 500 1000 L 500 0 Z"
          fill="url(#figmaCurveGrad)"
        />
      </svg>

      {/* Ambient Floating Dots matching Figma palette */}
      <div className="splash-decor-layer">
        <div className="splash-decor-dot-1" />
        <div className="splash-decor-dot-2" />
        <div className="splash-decor-dot-3" />
      </div>

      {/* Center Content Area */}
      <div className="splash-content-wrapper">
        {/* Welcome Message formatted as "Hello {userName}" */}
        <h1 className="splash-welcome-heading">Hello {userName}</h1>

        {/* Brand Icon with Orbiting Dots */}
        <div className="splash-logo-container">
          <img
            src={brainmintLogo}
            alt="BrainMint"
            className="splash-brainmint-logo"
          />

          {/* Rotating Orbiting Dots in Figma Color Template */}
          <svg
            className="splash-loader-orbit"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="84" r="5" fill="#C4674E" />
            <circle cx="34" cy="99" r="4.2" fill="#EFA087" />
            <circle cx="60" cy="107" r="3.4" fill="#A8543D" />
            <circle cx="86" cy="99" r="2.8" fill="#EAD1C6" />
            <circle cx="101" cy="84" r="2" fill="#C4674E" />
          </svg>
        </div>

        {/* Sign-in Subtext matching Figma styling */}
        <p className="splash-subtext">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
