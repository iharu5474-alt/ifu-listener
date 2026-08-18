import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Activity, Disc, Waves } from 'lucide-react';

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
  const phaseRef = useRef<number>(0);

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

    // Initialize particles for particles mode
    const numParticles = 75;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      baseSpeedY: (Math.random() - 0.5) * 0.8,
      baseSpeedX: (Math.random() - 0.5) * 0.8,
      speedMultiplier: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const speed = (isPlaying ? 0.045 : 0.008) * playbackRate;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      if (variant === 'wave') {
        // Multi-layered sine wave ribbon
        const numWaves = 4;
        for (let w = 0; w < numWaves; w++) {
          ctx.beginPath();
          ctx.lineWidth = w === 0 ? 2.5 : 1.2;
          ctx.strokeStyle =
            w === 0
              ? '#E2FF66'
              : w === 1
              ? 'rgba(255, 255, 255, 0.65)'
              : 'rgba(255, 255, 255, 0.2)';

          const waveHeight = isPlaying ? (height * 0.22) / (w + 1) : 6;
          const frequency = 0.008 * (w + 1);

          for (let x = 0; x <= width; x += 4) {
            const envelope = Math.sin((x / width) * Math.PI); // Pinches ends
            const y =
              height / 2 +
              Math.sin(x * frequency + phase * (w + 1)) *
                Math.cos(x * 0.003 - phase * 0.5) *
                waveHeight *
                envelope;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else if (variant === 'bars') {
        // Kinetic Equalizer Bars
        const numBars = 48;
        const barWidth = Math.max(3, (width - numBars * 4) / numBars);
        const maxHeight = isPlaying ? height * 0.75 : height * 0.08;

        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + 4) + (width - (numBars * (barWidth + 4))) / 2;
          const noise1 = Math.sin(i * 0.35 + phase * 2);
          const noise2 = Math.cos(i * 0.18 - phase * 3);
          const noise3 = Math.sin(i * 0.5 + phase * 4);
          const barRatio = Math.abs(noise1 * 0.4 + noise2 * 0.35 + noise3 * 0.25);
          const barHeight = Math.max(4, barRatio * maxHeight);

          const isCenter = Math.abs(i - numBars / 2) < 6;
          ctx.fillStyle = isCenter && isPlaying ? '#E2FF66' : 'rgba(255, 255, 255, 0.85)';

          const y = height / 2 - barHeight / 2;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else if (variant === 'particles') {
        // Starfield particle mesh
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const currentSpeed = isPlaying ? 2.5 * playbackRate : 0.4;
          p.x += p.baseSpeedX * currentSpeed * p.speedMultiplier;
          p.y += p.baseSpeedY * currentSpeed * p.speedMultiplier;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.fillStyle = i % 7 === 0 && isPlaying ? '#E2FF66' : `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isPlaying ? p.radius * 1.2 : p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Connect adjacent particles
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 85) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 85)})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      } else if (variant === 'circle') {
        // Circular Audio Pulse Ring
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.25;
        const points = 72;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isPlaying ? '#E2FF66' : 'rgba(255, 255, 255, 0.7)';

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freq1 = Math.sin(angle * 6 + phase * 2);
          const freq2 = Math.cos(angle * 12 - phase * 3);
          const pulse = isPlaying ? (freq1 * 0.6 + freq2 * 0.4) * 28 : 2;
          const r = baseRadius + pulse;
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

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
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
    <div className={`relative w-full h-full min-h-[160px] flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] rounded-xl border border-neutral-800/80 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Visualizer Mode Switcher */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-neutral-800">
        <button
          id="btn-viz-wave"
          onClick={() => setVariant('wave')}
          className={`p-1.5 rounded-full transition-colors ${
            variant === 'wave' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
          title="Waveform Mode"
        >
          <Waves className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-bars"
          onClick={() => setVariant('bars')}
          className={`p-1.5 rounded-full transition-colors ${
            variant === 'bars' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
          title="Equalizer Bars"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-circle"
          onClick={() => setVariant('circle')}
          className={`p-1.5 rounded-full transition-colors ${
            variant === 'circle' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
          title="Pulse Ring"
        >
          <Disc className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-viz-particles"
          onClick={() => setVariant('particles')}
          className={`p-1.5 rounded-full transition-colors ${
            variant === 'particles' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
          }`}
          title="Particle Field"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center status badge */}
      <div className="z-10 flex flex-col items-center pointer-events-none select-none">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-1">
          {isPlaying ? 'ACTIVE AUDIO FREQUENCY' : 'AUDIO ENGINE STANDBY'}
        </span>
        <span className="font-display text-xl font-bold tracking-wider text-white">
          ifu listener // SYNTH
        </span>
      </div>
    </div>
  );
};
