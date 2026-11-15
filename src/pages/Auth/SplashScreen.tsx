import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './auth.css';
import brainmintLogo from '../../assets/brainmint-logo-transparent.png';

export interface SplashScreenProps {
  userName?: string;
  loadingMessage?: string;
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 2000,
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
    <AnimatePresence>
      <motion.div
        className="figma-splash-page cursor-pointer"
        onClick={handleProceed}
        title="Click or press any key to enter immediately"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') handleProceed();
        }}
        initial={{ opacity: 1 }}
        exit={{
          y: '-100%',
          transition: { duration: 0.7, ease: [0.85, 0, 0.15, 1] },
        }}
      >
        {/* Center Content Area - Clean Logo Only */}
        <div className="splash-content-wrapper">
          <motion.div
            className="splash-logo-container neon-glow-logo"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: 1,
              scale: [0.94, 1.02, 1],
            }}
            transition={{
              duration: 1.8,
              times: [0, 0.5, 1],
              ease: 'easeOut',
            }}
            style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
          >
            <img
              src={brainmintLogo}
              alt="BrainMint"
              className="splash-brainmint-logo"
            />
          </motion.div>
        </div>

        {/* Elegant Bottom Loading Progress Bar in Brand Palette */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '4px',
            background: 'linear-gradient(to right, #EB6A47 0%, #C96F55 50%, #131D2B 100%)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
