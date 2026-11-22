class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume = 0.25
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 1 + (Math.random() - 0.5) * 0.14;
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd * jitter), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  public playPulseShot(): void {
    this.playTone(760, 190, 0.09, 'sawtooth', 0.18);
  }

  public playShieldBreak(): void {
    this.playTone(1240, 320, 0.22, 'triangle', 0.32);
    this.playTone(540, 110, 0.26, 'square', 0.16);
  }

  public playStasisCast(): void {
    this.playTone(340, 680, 0.25, 'sine', 0.22);
    this.playTone(680, 420, 0.28, 'triangle', 0.14);
  }

  public playKineticShield(): void {
    this.playTone(160, 260, 0.18, 'sine', 0.2);
  }

  public playPickup(): void {
    this.playTone(520, 880, 0.13, 'triangle', 0.22);
  }

  public playRescue(): void {
    this.playTone(440, 660, 0.16, 'sine', 0.24);
    setTimeout(() => this.playTone(660, 880, 0.18, 'sine', 0.22), 70);
  }

  public playHeavyHit(): void {
    this.playTone(150, 42, 0.24, 'sawtooth', 0.36);
  }

  public playPlayerHurt(): void {
    this.playTone(210, 65, 0.22, 'square', 0.28);
  }

  public playVoteChord(ratified: boolean): void {
    if (ratified) {
      this.playTone(261.6, 261.6, 0.45, 'triangle', 0.22);
      setTimeout(() => this.playTone(329.6, 329.6, 0.45, 'triangle', 0.2), 60);
      setTimeout(() => this.playTone(392.0, 392.0, 0.55, 'sine', 0.24), 120);
    } else {
      this.playTone(220, 185, 0.4, 'sawtooth', 0.22);
    }
  }
}

export const soundEngine = new SoundEngine();
