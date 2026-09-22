export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.fftSize = 2048;
    this._waveform = null;
    this._freq = null;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.75;
    this.source.connect(this.analyser);

    this._waveform = new Uint8Array(this.analyser.fftSize);
    this._freq = new Uint8Array(this.analyser.frequencyBinCount);

    return this.stream;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.source = null;
  }

  /** Waveform samples normalized to -1..1 */
  getWaveform() {
    this.analyser.getByteTimeDomainData(this._waveform);
    const out = new Float32Array(this._waveform.length);
    for (let i = 0; i < this._waveform.length; i++) {
      out[i] = (this._waveform[i] - 128) / 128;
    }
    return out;
  }

  /** Frequency magnitudes 0..1 */
  getFrequency() {
    this.analyser.getByteFrequencyData(this._freq);
    const out = new Float32Array(this._freq.length);
    for (let i = 0; i < this._freq.length; i++) {
      out[i] = this._freq[i] / 255;
    }
    return out;
  }

  getVolume(waveform) {
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) sum += waveform[i] * waveform[i];
    return Math.sqrt(sum / waveform.length);
  }
}
