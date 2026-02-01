import { createLogger } from '@/core/Logger';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export type AudioMood = 'nature' | 'urban' | 'indoor' | 'space';

export interface AudioConfig {
  mood: AudioMood;
  weather?: 'sunny' | 'rainy' | 'foggy';
  volume: number;
}

interface LayeredSound {
  frequency: number;
  type: OscillatorType;
  gain: number;
  lfoFreq?: number;
  lfoDepth?: number;
  detune?: number;
}

interface NoiseLayer {
  type: 'white' | 'pink' | 'brown';
  gain: number;
  filterFreq: number;
  filterType: BiquadFilterType;
  filterQ?: number;
  lfoFreq?: number;
  lfoDepth?: number;
}

interface MoodConfig {
  layers: LayeredSound[];
  noise: NoiseLayer[];
  masterVolume: number;
}

const MOOD_CONFIGS: Record<AudioMood, MoodConfig> = {
  nature: {
    layers: [
      { frequency: 220, type: 'sine', gain: 0.03, lfoFreq: 0.1, lfoDepth: 10 },
      { frequency: 330, type: 'sine', gain: 0.02, lfoFreq: 0.15, lfoDepth: 8 },
      { frequency: 440, type: 'sine', gain: 0.015, lfoFreq: 0.08, lfoDepth: 12 },
    ],
    noise: [
      {
        type: 'pink',
        gain: 0.08,
        filterFreq: 1200,
        filterType: 'lowpass',
        lfoFreq: 0.05,
        lfoDepth: 200,
      },
      { type: 'brown', gain: 0.05, filterFreq: 400, filterType: 'lowpass' },
    ],
    masterVolume: 1.2,
  },
  urban: {
    layers: [
      { frequency: 60, type: 'sawtooth', gain: 0.02 },
      { frequency: 120, type: 'square', gain: 0.01, lfoFreq: 0.3, lfoDepth: 5 },
    ],
    noise: [
      { type: 'brown', gain: 0.1, filterFreq: 250, filterType: 'lowpass' },
      { type: 'pink', gain: 0.04, filterFreq: 800, filterType: 'bandpass', filterQ: 2 },
    ],
    masterVolume: 1.0,
  },
  indoor: {
    layers: [
      { frequency: 60, type: 'sine', gain: 0.015 },
      { frequency: 120, type: 'sine', gain: 0.008 },
    ],
    noise: [{ type: 'brown', gain: 0.03, filterFreq: 150, filterType: 'lowpass' }],
    masterVolume: 0.8,
  },
  space: {
    layers: [
      { frequency: 55, type: 'sine', gain: 0.04, lfoFreq: 0.02, lfoDepth: 3 },
      { frequency: 82.5, type: 'sine', gain: 0.03, lfoFreq: 0.03, lfoDepth: 5, detune: -5 },
      { frequency: 110, type: 'sine', gain: 0.025, lfoFreq: 0.025, lfoDepth: 4, detune: 7 },
      { frequency: 165, type: 'sine', gain: 0.02, lfoFreq: 0.015, lfoDepth: 6 },
    ],
    noise: [
      {
        type: 'pink',
        gain: 0.03,
        filterFreq: 600,
        filterType: 'lowpass',
        lfoFreq: 0.01,
        lfoDepth: 100,
      },
    ],
    masterVolume: 1.3,
  },
};

const logger = createLogger({ module: 'ImmersiveAudioManager' });

export class ImmersiveAudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private noiseNodes: AudioBufferSourceNode[] = [];
  private lfoNodes: OscillatorNode[] = [];
  private currentConfig: AudioConfig | null = null;

  async play(config: AudioConfig): Promise<void> {
    this.stop();
    this.currentConfig = config;

    try {
      await this.ensureContext();

      if (!this.audioContext || !this.masterGain) return;

      const moodConfig = MOOD_CONFIGS[config.mood];

      moodConfig.layers.forEach((layer) => {
        this.createLayeredOscillator(layer);
      });

      moodConfig.noise.forEach((noiseConfig) => {
        this.createModulatedNoise(noiseConfig);
      });

      if (config.weather === 'rainy') {
        this.createModulatedNoise({
          type: 'white',
          gain: 0.15,
          filterFreq: 3000,
          filterType: 'bandpass',
          filterQ: 0.5,
          lfoFreq: 0.1,
          lfoDepth: 500,
        });
        this.createModulatedNoise({
          type: 'pink',
          gain: 0.08,
          filterFreq: 1500,
          filterType: 'highpass',
        });
      } else if (config.weather === 'foggy') {
        this.createModulatedNoise({
          type: 'brown',
          gain: 0.06,
          filterFreq: 200,
          filterType: 'lowpass',
          lfoFreq: 0.05,
          lfoDepth: 50,
        });
      }

      this.masterGain.gain.value = config.volume * moodConfig.masterVolume;

      logger.info('[Immersive Audio] Playing', { mood: config.mood, volume: config.volume });
    } catch (error) {
      logger.warn('Procedural audio playback failed', { error: String(error) });
    }
  }

  private async ensureContext(): Promise<void> {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.masterGain) {
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  private createLayeredOscillator(config: LayeredSound): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;

    if (config.detune) {
      oscillator.detune.value = config.detune;
    }

    gainNode.gain.value = config.gain;

    if (config.lfoFreq && config.lfoDepth) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();

      lfo.frequency.value = config.lfoFreq;
      lfoGain.gain.value = config.lfoDepth;

      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      lfo.start();

      this.lfoNodes.push(lfo);
    }

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start();

    this.oscillators.push(oscillator);
    this.gainNodes.push(gainNode);
  }

  private createModulatedNoise(config: NoiseLayer): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    this.generateNoise(output, config.type, bufferSize);

    const source = this.audioContext.createBufferSource();

    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.audioContext.createBiquadFilter();

    filter.type = config.filterType;
    filter.frequency.value = config.filterFreq;

    if (config.filterQ) {
      filter.Q.value = config.filterQ;
    }

    if (config.lfoFreq && config.lfoDepth) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();

      lfo.frequency.value = config.lfoFreq;
      lfoGain.gain.value = config.lfoDepth;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      this.lfoNodes.push(lfo);
    }

    const gainNode = this.audioContext.createGain();

    gainNode.gain.value = config.gain;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();

    this.noiseNodes.push(source);
    this.gainNodes.push(gainNode);
  }

  private generateNoise(
    output: Float32Array,
    type: 'white' | 'pink' | 'brown',
    bufferSize: number
  ): void {
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      let lastOut = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain && this.currentConfig) {
      const moodConfig = MOOD_CONFIGS[this.currentConfig.mood];

      this.masterGain.gain.value = Math.max(0, Math.min(1, volume)) * moodConfig.masterVolume;
    }
  }

  stop(): void {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });

    this.noiseNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // ignore
      }
    });

    this.lfoNodes.forEach((lfo) => {
      try {
        lfo.stop();
        lfo.disconnect();
      } catch {
        // ignore
      }
    });

    this.gainNodes.forEach((gain) => {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
    });

    this.oscillators = [];
    this.noiseNodes = [];
    this.lfoNodes = [];
    this.gainNodes = [];
    this.currentConfig = null;
  }

  isPlaying(): boolean {
    return this.oscillators.length > 0 || this.noiseNodes.length > 0;
  }

  getCurrentConfig(): AudioConfig | null {
    return this.currentConfig;
  }
}

export const immersiveAudioManager = new ImmersiveAudioManager();
