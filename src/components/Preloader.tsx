import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Radio } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // 1.8 second smooth progression
    const startTime = Date.now();
    const duration = 1750;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFinished(true);
          setTimeout(onComplete, 450);
        }, 150);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFinished(true);
    setTimeout(onComplete, 80);
  };

  return (
    <div
      id="app-preloader"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#070707] text-white cursor-pointer select-none overflow-hidden transition-all duration-500 ease-out ${
        isFinished ? 'opacity-0 scale-105 pointer-events-none blur-sm' : 'opacity-100 scale-100'
      }`}
      onClick={handleSkip}
    >
      {/* Ambient glowing backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#E2FF66]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top header line */}
      <div className="flex justify-between items-center font-mono text-[11px] text-neutral-400 tracking-widest uppercase z-10">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-[#E2FF66] animate-pulse" />
          <span>ifu listener // SOUND MATRIX</span>
        </div>
        <span className="hidden sm:inline">STUDIO ARCHITECTURE</span>
      </div>

      {/* Center Brand Identity with 3D assembling wordmark */}
      <div className="flex flex-col items-start justify-center max-w-4xl z-10">
        {/* Kinetic Wordmark */}
        <div className="overflow-hidden flex flex-wrap items-baseline gap-x-4">
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none text-white drop-shadow-2xl">
            ifu listener
          </h1>
        </div>

        {/* Subtitle with Frequency Bars */}
        <div className="mt-5 flex items-center space-x-3.5">
          <div className="flex items-center space-x-1">
            {[40, 70, 90, 60, 100, 50, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-[#E2FF66] rounded-full animate-pulse"
                style={{
                  height: `${h * 0.25}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.7s'
                }}
              />
            ))}
          </div>
          <p className="font-mono text-xs sm:text-sm tracking-[0.25em] text-neutral-300 uppercase">
            CALIBRATING AUDIO PIPELINE & STREAM ENGINE
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Instant Skip Note */}
      <div className="space-y-4 max-w-2xl z-10">
        <div className="flex justify-between items-end font-mono text-xs">
          <span className="text-neutral-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E2FF66]" />
            <span>INITIALIZING ENGINE</span>
          </span>
          <span className="text-[#E2FF66] font-bold font-mono text-base">{progress}%</span>
        </div>
        
        <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-white via-[#E2FF66] to-[#E2FF66] transition-all duration-75 ease-out shadow-[0_0_12px_#E2FF66]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 uppercase">
          <span>TRIONN-INSPIRED MINIMAL MONOCHROME</span>
          <span className="text-neutral-400 hover:text-white transition-colors">
            [ CLICK ANYWHERE TO ENTER ]
          </span>
        </div>
      </div>
    </div>
  );
};
