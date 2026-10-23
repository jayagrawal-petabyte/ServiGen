import React, { useEffect } from 'react';
import './auth.css';
import brainmintDark from '../../assets/brainmint-dark.png';

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
  durationMs = 750,
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
      {/* Right-side Teal Curved Graphic - Exact Match for Figma design */}
      <svg
        className="splash-teal-curve"
        viewBox="0 0 500 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 230 0 C 190 280, 110 650, 0 1000 L 500 1000 L 500 0 Z"
          fill="#00D4BB"
        />
      </svg>

      {/* Center Content Area */}
      <div className="splash-content-wrapper">
        {/* Welcome Message formatted as "Hello Demo" without comma or exclamation */}
        <h1 className="splash-welcome-heading">Hello {userName}</h1>

        {/* Brand Icon with Orbiting Dots */}
        <div className="splash-logo-container">
          {/* Main Cyan Chat Bubble Badge */}
          <img
          src={brainmintDark}
          alt="BrainMint"
          className="splash-brainmint-logo"
          />

          {/* Rotating Orbiting Dots */}
          <svg className="splash-loader-orbit" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="84" r="5" fill="#00D4BB" />
            <circle cx="34" cy="99" r="4.2" fill="#00D4BB" />
            <circle cx="60" cy="107" r="3.4" fill="#00D4BB" />
            <circle cx="86" cy="99" r="2.5" fill="#00D4BB" />
            <circle cx="101" cy="84" r="1.7" fill="#00D4BB" />
          </svg>
        </div>

        {/* Sign-in Subtext */}
        <p className="splash-subtext">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
