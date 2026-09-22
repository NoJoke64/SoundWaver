import { AudioEngine } from "./audio.js";
import { STYLES, getStyle } from "./styles/index.js";
import { Averager } from "./averager.js";
import { CanvasRecorder } from "./recorder.js";

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const startError = document.getElementById("startError");
const statusEl = document.getElementById("status");
const controlsEl = document.getElementById("controls");
const toggleControlsBtn = document.getElementById("toggleControlsBtn");
const stopBtn = document.getElementById("stopBtn");

const styleSelect = document.getElementById("styleSelect");
const colorMode = document.getElementById("colorMode");
const color1 = document.getElementById("color1");
const color2 = document.getElementById("color2");
const color1Row = document.getElementById("color1Row");
const color2Row = document.getElementById("color2Row");
const bgColor = document.getElementById("bgColor");
const bgTransparent = document.getElementById("bgTransparent");
const glow = document.getElementById("glow");
const sensitivity = document.getElementById("sensitivity");

const snapshotAvgBtn = document.getElementById("snapshotAvgBtn");
const recordBtn = document.getElementById("recordBtn");

const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultMedia = document.getElementById("resultMedia");
const downloadLink = document.getElementById("downloadLink");
const closeResultBtn = document.getElementById("closeResultBtn");

let canvas = document.getElementById("visualizer");
let currentEngine = null;
let currentStyleInstance = null;
let currentStyleId = STYLES[0].id;

const audioEngine = new AudioEngine();
const averager = new Averager();
let recorder = null;

let isSessionActive = false;
let sessionStartTime = 0;
let rafId = null;
let lastObjectUrl = null;

const colors = {
  mode: "gradient",
  c1: "#5ef1c7",
  c2: "#7b6cff",
  bg: "#0a0a12",
  transparent: false,
  glow: 12,
  sensitivity: 1.2,
};

function populateStyleSelect() {
  styleSelect.innerHTML = "";
  for (const s of STYLES) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    styleSelect.appendChild(opt);
  }
  styleSelect.value = currentStyleId;
}

function getLogicalSize() {
  return { w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight };
}

function doResize() {
  const { w, h } = getLogicalSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (currentEngine === "2d") {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (currentStyleInstance) currentStyleInstance.resize(w, h);
}

async function switchStyle(id) {
  const styleDef = getStyle(id);

  if (currentStyleInstance && currentStyleInstance.destroy) {
    currentStyleInstance.destroy();
  }

  if (styleDef.engine !== currentEngine) {
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "visualizer";
    newCanvas.setAttribute("aria-label", "Audio Visualisierung");
    canvas.replaceWith(newCanvas);
    canvas = newCanvas;
    currentEngine = styleDef.engine;
  }

  currentStyleInstance = await styleDef.create(canvas);
  currentStyleId = id;
  doResize();
}

function loop() {
  if (!isSessionActive) return;
  const waveform = audioEngine.getWaveform();
  const freq = audioEngine.getFrequency();
  const volume = audioEngine.getVolume(waveform);
  const timeSec = (performance.now() - sessionStartTime) / 1000;
  const { w, h } = getLogicalSize();

  const frame = { waveform, freq, volume, time: timeSec, colors, width: w, height: h };
  if (currentStyleInstance) currentStyleInstance.render(frame);
  averager.addFrame(waveform, freq);

  rafId = requestAnimationFrame(loop);
}

async function startSession() {
  startError.textContent = "";
  startBtn.disabled = true;
  try {
    await audioEngine.start();
    isSessionActive = true;
    sessionStartTime = performance.now();
    averager.reset();

    startScreen.classList.add("hidden");
    controlsEl.classList.remove("hidden");
    toggleControlsBtn.classList.remove("hidden");
    statusEl.textContent = "live";
    statusEl.classList.add("live");

    await switchStyle(currentStyleId);
    loop();
  } catch (err) {
    startError.textContent = "Mikrofonzugriff fehlgeschlagen: " + (err && err.message ? err.message : err);
  } finally {
    startBtn.disabled = false;
  }
}

async function stopSession() {
  isSessionActive = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (recorder && recorder.isRecording) {
    await recorder.stop();
    recordBtn.textContent = "⏺️ Video-Aufnahme starten";
  }
  audioEngine.stop();
  statusEl.textContent = "bereit";
  statusEl.classList.remove("live");
  controlsEl.classList.add("hidden");
  controlsEl.classList.remove("collapsed");
  toggleControlsBtn.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

function updateColorUI() {
  color2Row.style.display = colorMode.value === "solid" ? "none" : "flex";
  color1Row.style.display = colorMode.value === "rainbow" ? "none" : "flex";
}

function wireColorControls() {
  colorMode.addEventListener("change", () => {
    colors.mode = colorMode.value;
    updateColorUI();
  });
  color1.addEventListener("input", () => (colors.c1 = color1.value));
  color2.addEventListener("input", () => (colors.c2 = color2.value));
  bgColor.addEventListener("input", () => (colors.bg = bgColor.value));
  bgTransparent.addEventListener("change", () => {
    colors.transparent = bgTransparent.checked;
    bgColor.disabled = colors.transparent;
  });
  glow.addEventListener("input", () => (colors.glow = Number(glow.value)));
  sensitivity.addEventListener("input", () => (colors.sensitivity = Number(sensitivity.value)));
  updateColorUI();
}

function showResult(title, type, url, filename) {
  if (lastObjectUrl) {
    URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = null;
  }
  resultTitle.textContent = title;
  resultMedia.innerHTML = "";
  if (type === "image") {
    const img = document.createElement("img");
    img.src = url;
    resultMedia.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    resultMedia.appendChild(video);
    lastObjectUrl = url;
  }
  downloadLink.href = url;
  downloadLink.download = filename;
  resultOverlay.classList.remove("hidden");
}

function closeResult() {
  resultOverlay.classList.add("hidden");
  resultMedia.innerHTML = "";
}

function snapshotAverage() {
  if (!currentStyleInstance) return;
  const avg = averager.hasData()
    ? averager.getAverage()
    : { waveform: new Float32Array(256), freq: new Float32Array(128) };
  const { w, h } = getLogicalSize();
  const frame = { waveform: avg.waveform, freq: avg.freq, volume: 0.5, time: 0, colors, width: w, height: h };
  currentStyleInstance.renderAverage(frame);
  const dataUrl = canvas.toDataURL("image/png");
  showResult("Durchschnittsbild", "image", dataUrl, "soundwaver-durchschnitt.png");
}

async function toggleRecording() {
  if (!recorder || !recorder.isRecording) {
    recorder = new CanvasRecorder(canvas, audioEngine.stream);
    try {
      await recorder.start(30);
      recordBtn.textContent = "⏹️ Aufnahme stoppen";
    } catch (err) {
      startError.textContent = "Aufnahme fehlgeschlagen: " + (err && err.message ? err.message : err);
    }
  } else {
    const blob = await recorder.stop();
    recordBtn.textContent = "⏺️ Video-Aufnahme starten";
    if (blob) {
      const url = URL.createObjectURL(blob);
      showResult("Video-Aufnahme", "video", url, "soundwaver-video.webm");
    }
  }
}

function wireEvents() {
  startBtn.addEventListener("click", startSession);
  stopBtn.addEventListener("click", stopSession);
  toggleControlsBtn.addEventListener("click", () => controlsEl.classList.toggle("collapsed"));
  styleSelect.addEventListener("change", () => switchStyle(styleSelect.value));
  snapshotAvgBtn.addEventListener("click", snapshotAverage);
  recordBtn.addEventListener("click", toggleRecording);
  closeResultBtn.addEventListener("click", closeResult);
  window.addEventListener("resize", doResize);
}

populateStyleSelect();
wireColorControls();
wireEvents();
