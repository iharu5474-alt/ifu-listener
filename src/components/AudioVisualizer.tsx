import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Activity, Disc, Waves } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  playbackRate?: number;
  className?: string;
  variant?: 'bars' | 'wave' | 'particles' | 'circle';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  playbackRate = 1,
  className = '',
  variant: initialVariant = 'wave'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [variant, setVariant] = useState<'bars' | 'wave' | 'particles' | 'circle'>(initialVariant);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Buffers for real-time Web Audio API frequency and waveform
    const binCount = audioEngine.getFrequencyBinCount();
    const freqData = new Uint8Array(binCount);
    const timeData = new Uint8Array(256);

    // Particles setup
    const numParticles = 65;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Extract real audio frequency and time domain data from Web Audio AnalyserNode
      audioEngine.getByteFrequencyData(freqData);
      audioEngine.getByteTimeDomainData(timeData);

      // Compute instant audio energy from frequency spectrum
      let totalEnergy = 0;
      for (let i = 0; i < freqData.length; i++) {
        totalEnergy += freqData[i];
      }
      const avgEnergy = freqData.length > 0 ? totalEnergy / freqData.length : 0;
      const normalizedEnergy = avgEnergy / 255; // 0.0 to 1.0

      // Bass energy (first 15% of bins)
      let bassEnergy = 0;
      const bassBinEnd = Math.max(1, Math.floor(freqData.length * 0.15));
      for (let i = 0; i < bassBinEnd; i++) {
        bassEnergy += freqData[i];
      }
      const avgBass = bassBinEnd > 0 ? (bassEnergy / bassBinEnd) / 255 : 0;

      if (variant === 'wave') {
        // Real-Time Time Domain Oscilloscope Waveform
        const sliceWidth = width / (timeData.length - 1);
        const centerY = height / 2;

        // Draw background harmonic aura if playing with high energy
        if (normalizedEnergy > 0.05) {
          ctx.beginPath();
          ctx.lineWidth = 6;
          ctx.strokeStyle = `rgba(226, 255, 102, ${normalizedEnergy * 0.25})`;
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128.0;
            const y = centerY + v * (height * 0.35);
            const x = i * sliceWidth;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Main high-precision waveform line
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = normalizedEnergy > 0.02 ? '#E2FF66' : 'rgba(255, 255, 255, 0.4)';

        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128.0; // -1.0 to 1.0
          const y = centerY + v * (height * 0.38);
          const x = i * sliceWidth;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Secondary subtle mirror wave
        if (normalizedEnergy > 0.01) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          for (let i = 0; i < timeData.length; i += 2) {
            const v = (timeData[i] - 128) / 128.0;
            const y = centerY - v * (height * 0.22);
            const x = i * sliceWidth;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

      } else if (variant === 'bars') {
        // Real-Time Multi-Band FFT Equalizer Bars
        const numBars = 48;
        const barWidth = Math.max(3, (width - numBars * 4) / numBars);
        const startX = (width - (numBars * (barWidth + 4))) / 2;
        const maxHeight = height * 0.78;

        for (let i = 0; i < numBars; i++) {
          // Logarithmic bin mapping from frequency bins
          const binIndex = Math.min(
            freqData.length - 1,
            Math.floor(Math.pow(i / numBars, 1.35) * freqData.length)
          );
          const rawValue = freqData[binIndex] || 0;
          const ratio = rawValue / 255;
          const barHeight = isPlaying ? Math.max(2, ratio * maxHeight) : 2;

          const x = startX + i * (barWidth + 4);
          const y = height / 2 - barHeight / 2;

          // Color gradient: bass and center bands get vibrant yellow-green accent
          if (i < 12 && ratio > 0.4) {
            ctx.fillStyle = '#E2FF66';
          } else if (ratio > 0.65) {
            ctx.fillStyle = '#E2FF66';
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, ratio * 0.85 + 0.15)})`;
          }

          ctx.fillRect(x, y, barWidth, barHeight);
        }

      } else if (variant === 'circle') {
        // Real-Time Circular Polar Frequency Ring
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;
        const points = 64;

        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = normalizedEnergy > 0.05 ? '#E2FF66' : 'rgba(255, 255, 255, 0.4)';

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const bin = Math.floor((i % points) / points * (freqData.length * 0.75));
          const freqVal = freqData[bin] || 0;
          const displacement = (freqVal / 255) * (height * 0.22);
          const r = baseRadius + (isPlaying ? displacement : 0);

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Inner Bass Pulse Circle
        ctx.beginPath();
        const innerRadius = baseRadius * 0.55 + (isPlaying ? avgBass * 28 : 0);
        ctx.arc(centerX, centerY, Math.max(10, innerRadius), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(226, 255, 102, ${Math.max(0.15, avgBass * 0.8)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

      } else if (variant === 'particles') {
        // Real-Time Acoustic Reactive Particle Field
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const speedMultiplier = isPlaying ? 1 + avgBass * 3.5 : 0.2;

          p.x += p.speedX * speedMultiplier;
          p.y += p.speedY * speedMultiplier;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const currentRadius = p.baseRadius * (1 + avgBass * 1.5);
          ctx.fillStyle = i % 5 === 0 && avgBass > 0.3 ? '#E2FF66' : `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Connect nearby particles
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 80) * 0.15 * (1 + normalizedEnergy)})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, variant, playbackRate]);

  return (
    <div className={`relative w-full h-full min-h-[160px] flex flex-col items-center justify-center overflow-hidden bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Visualizer Mode Switcher (White Glass) */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 bg-white/10 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/20 shadow-md">
        <button
          id="btn-viz-wave"
          onClick={() => setVariant('wave')}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            variant === 'wave' ? 'bg-white text-black font-bold shadow-md' : 'text-neutral-300 hover:text-white'
          }`}
          title="Oscilloscope Waveform Mode"
        >
          <Waves className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-bars"
          onClick={() => setVariant('bars')}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            variant === 'bars' ? 'bg-white text-black font-bold shadow-md' : 'text-neutral-300 hover:text-white'
          }`}
          title="FFT Equalizer Bars"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-circle"
          onClick={() => setVariant('circle')}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            variant === 'circle' ? 'bg-white text-black font-bold shadow-md' : 'text-neutral-300 hover:text-white'
          }`}
          title="Pulse Ring Mode"
        >
          <Disc className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-particles"
          onClick={() => setVariant('particles')}
          className={`p-2 rounded-full transition-all cursor-pointer ${
            variant === 'particles' ? 'bg-white text-black font-bold shadow-md' : 'text-neutral-300 hover:text-white'
          }`}
          title="Particle Field Mode"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center status badge */}
      <div className="z-10 flex flex-col items-center pointer-events-none select-none text-center px-4">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-300 mb-1 font-semibold">
          {isPlaying ? 'ACTIVE // REAL-TIME AUDIO FREQUENCY' : 'AUDIO ENGINE // STANDBY'}
        </span>
        <span className="font-display text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-sm">
          ifu listener // KINETIC SYNTH
        </span>
      </div>
    </div>
  );
};
