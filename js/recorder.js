export class CanvasRecorder {
  constructor(canvas, audioStream) {
    this.canvas = canvas;
    this.audioStream = audioStream;
    this.recorder = null;
    this.chunks = [];
  }

  start(fps = 30) {
    const canvasStream = this.canvas.captureStream(fps);
    const combined = new MediaStream();
    canvasStream.getVideoTracks().forEach((t) => combined.addTrack(t));
    if (this.audioStream) {
      this.audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));
    }

    const mimeType = pickMimeType();
    this.chunks = [];
    this.recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      this.recorder.onerror = (e) => reject(e.error || e);
      this.recorder.start(200);
      resolve();
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === "inactive") {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType || "video/webm" });
        resolve(blob);
      };
      this.recorder.stop();
    });
  }

  get isRecording() {
    return !!this.recorder && this.recorder.state === "recording";
  }
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}
