import React, { useEffect } from 'react';
import './auth.css';

export interface SplashScreenProps {
  userName?: string;
  loadingMessage?: string;
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  userName = 'Demo',
  loadingMessage = 'We are signing you in',
  onComplete,
  durationMs = 2500,
}) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [onComplete, durationMs]);

  return (
    <div className="figma-splash-page">
      {/* Right-side Teal Curved Graphic - Exact Match for Figma design */}
      <svg
        className="splash-teal-curve"
        viewBox="0 0 500 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 200 0 C 170 250, 100 650, 0 1000 L 475 1000 Q 500 1000 500 975 L 500 0 Z"
          fill="#00D4BB"
        />
      </svg>

      {/* Center Content Area */}
      <div className="splash-content-wrapper">
        {/* Welcome Message formatted as "Hello, (Name)!" */}
        <h1 className="splash-welcome-heading">Hello, {userName}!</h1>

        {/* Brand Icon with Orbiting Dots */}
        <div className="splash-logo-container">
          {/* Main Cyan Chat Bubble Badge */}
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="44" cy="44" r="44" fill="#00C4FF" />
            <path
              d="M 44 26 C 33.5 26 25 33.6 25 43 C 25 46.8 26.4 50.3 28.8 53.1 C 28.1 56.4 26.5 59.2 26.3 59.6 C 26.1 60 26.3 60.5 26.7 60.7 C 26.9 60.8 27.1 60.8 27.3 60.8 C 31.2 60.8 34.6 59.1 37.1 57.8 C 39.3 58.6 41.6 59 44 59 C 54.5 59 63 51.4 63 42 C 63 32.6 54.5 26 44 26 Z"
              fill="#FFFFFF"
            />
          </svg>

          {/* Rotating Orbiting Dots */}
          <svg className="splash-loader-orbit" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="92" r="5" fill="#00D4BB" />
            <circle cx="45" cy="104" r="4" fill="#00D4BB" />
            <circle cx="64" cy="107" r="3.5" fill="#00D4BB" />
            <circle cx="82" cy="102" r="2.8" fill="#00D4BB" />
            <circle cx="97" cy="90" r="2.2" fill="#00D4BB" />
            <circle cx="106" cy="74" r="1.6" fill="#00D4BB" />
          </svg>
        </div>

        {/* Sign-in Subtext */}
        <p className="splash-subtext">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
