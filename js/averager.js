const WAVE_BINS = 256;
const FREQ_BINS = 128;

export class Averager {
  constructor() {
    this.reset();
  }

  reset() {
    this.waveSum = new Float64Array(WAVE_BINS);
    this.freqSum = new Float64Array(FREQ_BINS);
    this.count = 0;
  }

  addFrame(waveform, freq) {
    const wStep = waveform.length / WAVE_BINS;
    for (let i = 0; i < WAVE_BINS; i++) {
      const idx = Math.min(waveform.length - 1, Math.floor(i * wStep));
      this.waveSum[i] += Math.abs(waveform[idx]);
    }
    const fStep = freq.length / FREQ_BINS;
    for (let i = 0; i < FREQ_BINS; i++) {
      const idx = Math.min(freq.length - 1, Math.floor(i * fStep));
      this.freqSum[i] += freq[idx];
    }
    this.count++;
  }

  hasData() {
    return this.count > 0;
  }

  /** Returns average envelope shaped like a real waveform + averaged spectrum */
  getAverage() {
    const n = Math.max(1, this.count);
    const waveform = new Float32Array(WAVE_BINS);
    const freq = new Float32Array(FREQ_BINS);

    for (let i = 0; i < WAVE_BINS; i++) {
      const amp = this.waveSum[i] / n;
      // shape the averaged amplitude envelope into an oscillating waveform
      waveform[i] = amp * Math.sin((i / WAVE_BINS) * Math.PI * 10);
    }
    for (let i = 0; i < FREQ_BINS; i++) {
      freq[i] = this.freqSum[i] / n;
    }

    return { waveform, freq };
  }
}
