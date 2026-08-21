import React, { useEffect, useRef, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export const INTRO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4';

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    console.log('[ifu listener] Splash video finishing / transitioning to app...');
    try {
      sessionStorage.setItem('ifulistener_intro_played_v4', 'true');
    } catch {
      // ignore
    }
    setTimeout(() => {
      onCompleteRef.current();
    }, 700);
  };

  useEffect(() => {
    console.log('[ifu listener] Splash Video mounting with source:', INTRO_VIDEO_URL);
    const video = videoRef.current;
    if (video) {
      // Set essential attributes directly on the DOM element for strict mobile browser compatibility
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('muted', '');

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[ifu listener] Splash video autoplay started successfully');
          })
          .catch((err) => {
            console.warn('[ifu listener] Splash video autoplay prevented by browser policy, tap anywhere to proceed:', err);
          });
      }
    }

    // Safety fallback: if video stalls or takes longer than 10s, smoothly finish
    const timer = setTimeout(() => {
      console.log('[ifu listener] Splash video safety timer triggered');
      handleFinish();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      id="app-video-intro-preloader"
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Fullscreen Video Element */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => {
          console.log('[ifu listener] Splash video loaded data successfully');
          setVideoLoaded(true);
        }}
        onPlay={() => console.log('[ifu listener] Splash video event: onPlay')}
        onEnded={() => {
          console.log('[ifu listener] Splash video event: onEnded');
          handleFinish();
        }}
        onError={(e) => {
          console.error('[ifu listener] Splash video error loading source:', e);
          handleFinish();
        }}
        className="w-full h-full object-cover"
        style={{
          filter: 'brightness(1.08) contrast(1.05)'
        }}
      />

      {/* Dark Ambient Vignette to make overlay text pop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/70 pointer-events-none" />

      {/* Website Name Overlay Text (Not baked into the video) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-6 text-center">
        <div className="space-y-3.5 drop-shadow-[0_12px_40px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-1000">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-ping" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-neutral-200">
              AUDIO ARCHIVE // INITIALIZING
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-white drop-shadow-2xl">
            ifu listener
          </h1>

          <p className="font-mono text-xs sm:text-sm md:text-base text-neutral-300 tracking-[0.35em] uppercase font-light max-w-xl mx-auto drop-shadow-md">
            high fidelity music & playlist engine
          </p>
        </div>
      </div>

      {/* Tap anywhere to skip pill in Bottom Right */}
      <div className="absolute bottom-6 right-6 z-20 px-4 py-2.5 min-h-[44px] rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white/90 hover:text-white text-xs font-mono tracking-wider uppercase transition-all hover:bg-black/90 hover:scale-105 flex items-center justify-center shadow-lg">
        <span>TAP ANYWHERE TO SKIP ✕</span>
      </div>
    </div>
  );
};



