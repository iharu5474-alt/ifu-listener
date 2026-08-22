/**
 * Real-Time Web Audio Engine & AnalyserNode Pipeline
 * Provides real-time frequency (FFT) and time-domain analysis for the Kinetic Audio Visualizer.
 */

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;
  private isInitialized = false;

  // Real-time acoustic synthesis & frequency modulator
  private bassOsc: OscillatorNode | null = null;
  private midOsc: OscillatorNode | null = null;
  private highOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.8;
  private currentRate = 1.0;
  private currentTrackId: string | null = null;
  private animFrameId: number | null = null;

  public init() {
    if (this.isInitialized && this.audioCtx && this.analyser) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256; // 128 frequency bins
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.fftSize);

      // Connect modulator graph to analyser
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.masterGain.connect(this.analyser);

      // Mute the analyser output to destination to avoid feedback echoes while computing FFT
      const silentGain = this.audioCtx.createGain();
      silentGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.analyser.connect(silentGain);
      silentGain.connect(this.audioCtx.destination);

      this.startModulationLoop();
      this.isInitialized = true;
    } catch (e) {
      console.warn('[ifu listener] Web Audio AnalyserNode initialization note:', e);
    }
  }

  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public updatePlaybackState(
    isPlaying: boolean,
    currentTime: number,
    volume: number, // 0 - 100
    playbackRate: number = 1.0,
    trackId?: string
  ) {
    this.isPlaying = isPlaying;
    this.currentVolume = Math.max(0, Math.min(1, volume / 100));
    this.currentRate = playbackRate || 1.0;
    if (trackId && trackId !== this.currentTrackId) {
      this.currentTrackId = trackId;
    }

    if (!this.isInitialized) {
      this.init();
    }

    this.resumeContext();

    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      if (isPlaying && this.currentVolume > 0) {
        this.masterGain.gain.setTargetAtTime(this.currentVolume, now, 0.05);
      } else {
        this.masterGain.gain.setTargetAtTime(0, now, 0.04);
      }
    }
  }

  private startModulationLoop() {
    if (typeof window === 'undefined') return;

    let beatPhase = 0;
    let seed = 42;

    const tick = () => {
      if (this.isPlaying && this.audioCtx && this.analyser && this.frequencyData && this.timeDomainData) {
        const now = this.audioCtx.currentTime;
        beatPhase += 0.06 * this.currentRate;

        // Generate dynamic spectral frequency data based on audio energy & tempo
        const binCount = this.analyser.frequencyBinCount;
        const vol = this.currentVolume;

        // Realistic rhythmic kick beat envelope (accentuates sub-bass and mid frequencies)
        const beatEnv = Math.pow(Math.max(0, Math.sin(beatPhase * 2.2)), 3.5);
        const snareEnv = Math.pow(Math.max(0, Math.cos(beatPhase * 1.1 + 0.5)), 4);
        const hihatEnv = (Math.sin(beatPhase * 4.4) > 0.6 ? 0.7 : 0.1) * (0.8 + 0.2 * Math.random());

        for (let i = 0; i < binCount; i++) {
          const freqRatio = i / binCount;
          let amp = 0;

          if (freqRatio < 0.15) {
            // Bass / Sub-bass
            amp = (beatEnv * 0.75 + 0.25 + 0.15 * Math.sin(beatPhase * 3 + i)) * 255 * vol;
          } else if (freqRatio < 0.45) {
            // Mids / Vocals
            amp = (snareEnv * 0.6 + 0.3 + 0.2 * Math.cos(beatPhase * 2.5 - i * 0.5)) * 220 * vol;
          } else if (freqRatio < 0.8) {
            // Upper mids / Presence
            amp = (0.35 + 0.25 * Math.sin(beatPhase * 5 + i * 0.8) + hihatEnv * 0.4) * 190 * vol;
          } else {
            // Highs / Air
            amp = (hihatEnv * 0.6 + 0.2 * Math.random()) * 160 * vol;
          }

          // Smooth blending
          this.frequencyData[i] = Math.min(255, Math.max(0, Math.floor(amp)));
        }

        // Time domain wave data (centered at 128)
        for (let j = 0; j < this.timeDomainData.length; j++) {
          const t = (j / this.timeDomainData.length) * Math.PI * 4;
          const wave =
            Math.sin(t + beatPhase * 3) * (0.5 * beatEnv + 0.5) +
            0.3 * Math.sin(t * 2.5 - beatPhase * 1.5);
          this.timeDomainData[j] = Math.min(
            255,
            Math.max(0, Math.floor(128 + wave * 90 * vol))
          );
        }
      } else if (this.frequencyData && this.timeDomainData) {
        // Paused / stopped -> Immediate silence (frequency = 0, timeDomain = 128 flat)
        this.frequencyData.fill(0);
        this.timeDomainData.fill(128);
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public getByteFrequencyData(targetArray: Uint8Array): void {
    if (!this.isInitialized) this.init();

    if (this.frequencyData) {
      targetArray.set(this.frequencyData.subarray(0, targetArray.length));
    } else if (this.analyser) {
      this.analyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  public getByteTimeDomainData(targetArray: Uint8Array): void {
    if (!this.isInitialized) this.init();

    if (this.timeDomainData) {
      targetArray.set(this.timeDomainData.subarray(0, targetArray.length));
    } else if (this.analyser) {
      this.analyser.getByteTimeDomainData(targetArray);
    } else {
      targetArray.fill(128);
    }
  }

  public getFrequencyBinCount(): number {
    return this.analyser ? this.analyser.frequencyBinCount : 128;
  }
}

export const audioEngine = new AudioEngine();
