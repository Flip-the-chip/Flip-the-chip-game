// Helpers: DOM, shuffling, toasts, sound, confetti, canvas setup

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function arrShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let toastTimer;
function toast(text) {
  $("toast").textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").textContent = ""; }, 3200);
}

// ---- Sound (tiny retro beeps made with the Web Audio API) ----
let muted = false, audioCtx = null;
function beep(freq, dur, type = "square", vol = 0.04) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sound is optional */ }
}
// A tone that slides from one pitch to another (used for the card flip "whoosh")
function sweep(from, to, dur, type = "triangle", vol = 0.07) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + dur);
  } catch (e) { /* sound is optional */ }
}

function sfx(kind) {
  if (kind === "flip") {               // every card click
    sweep(320, 960, 0.13);
    setTimeout(() => beep(1320, 0.05, "triangle", 0.05), 110);
    return;
  }
  const seqs = {
    click: [[880, 0.03]],
    good: [[523, 0.07], [784, 0.12]],
    bad: [[196, 0.18]],
    win: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.2]],
    // opening jingle when the game starts
    start: [[392, 0.1], [523, 0.1], [659, 0.1], [784, 0.12], [659, 0.08], [784, 0.08], [1047, 0.28]]
  };
  let t = 0;
  (seqs[kind] || []).forEach(([f, d]) => { setTimeout(() => beep(f, d), t * 1000); t += d; });
}

// ---- Confetti (drawn inside the open dialog so it shows on top) ----
function confetti() {
  if (reduceMotion) return;
  const host = document.querySelector("dialog[open]") || document.body;
  const c = document.createElement("canvas");
  c.className = "confetti";
  host.appendChild(c);
  const w = c.width = window.innerWidth, h = c.height = window.innerHeight;
  const ctx = c.getContext("2d");
  const colors = ["#e0a55e", "#49d17f", "#f2c94c", "#5aa9e6", "#ff6b5c"];
  const ps = Array.from({ length: 140 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3, y: h * 0.35,
    vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 12 - 4,
    r: 5 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6
  }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, w, h);
    ps.forEach(p => {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += 0.2;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.globalAlpha = Math.max(0, 1 - t / 1800);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    });
    if (t < 1800) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

// ---- Canvas helpers ----
function setupCanvas(cv, w, h) {
  const dpr = window.devicePixelRatio || 1;
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.aspectRatio = `${w} / ${h}`;
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}
function toLocal(e, cv, w, h) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height };
}
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---- Read-aloud (Web Speech API) so players don't have to read ----
// Each Listen press speaks ONE utterance. Queuing many short ones made the voice
// stop and start between sentences, which sounded broken.
const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
let voices = [], speakToken = 0;

function loadVoices() { voices = window.speechSynthesis.getVoices(); }
if (canSpeak) {
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

// Best-sounding English voice first: natural/neural voices (Edge, Windows 11),
// then Google’s, then good Apple voices, then any English voice.
function pickVoice() {
  const en = voices.filter(v => /^en/i.test(v.lang));
  return en.find(v => /natural|neural|online/i.test(v.name))
    || en.find(v => /Google US English|Google UK English Female/i.test(v.name))
    || en.find(v => /Samantha|Karen|Daniel|Moira|Serena/i.test(v.name))
    || en.find(v => /en-US/i.test(v.lang))
    || en[0];
}

function clearSpeaking() {
  document.querySelectorAll(".speaking").forEach(e => e.classList.remove("speaking"));
}

function stopSpeaking() {
  speakToken++;
  if (canSpeak) window.speechSynthesis.cancel();
  clearSpeaking();
}

// Speak text; el is highlighted while it plays.
// Some voices (Chrome’s Google voices) cut off after about 15 seconds,
// so longer text is split at sentence ends into a few chunks queued together.
function chunkText(text, max = 180) {
  const sentences = text.match(/[^.!?]+[.!?]+["’”]?\s*/g) || [text];
  const chunks = [];
  let cur = "";
  sentences.forEach(s => {
    if ((cur + s).length > max && cur) { chunks.push(cur.trim()); cur = ""; }
    cur += s;
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

function speakText(text, el, onEnd) {
  stopSpeaking();
  if (!canSpeak || !text) return;
  const token = speakToken;
  // A short pause after cancel() stops some browsers from clipping the start
  setTimeout(() => {
    if (token !== speakToken) return;
    const voice = pickVoice();
    const chunks = chunkText(text);
    const finish = () => { if (token === speakToken) { clearSpeaking(); if (onEnd) onEnd(); } };
    if (el) el.classList.add("speaking");
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
      u.rate = 0.95;
      u.pitch = 1;
      if (i === chunks.length - 1) u.onend = finish;
      u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") finish(); };
      window.speechSynthesis.speak(u);
    });
  }, 120);
}

// Emoji are read out loud as words ("fire", "test tube"), so strip them first
function sayable(text) {
  return text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
}

// Wire a Listen button: tap to hear, tap again to stop.
// getSpeech() returns { text, el }.
function setupListen(btn, getSpeech) {
  // Always show the button, even if this browser can't speak, so players know it exists
  btn.hidden = false;
  btn.dataset.idle = btn.textContent;
  btn.addEventListener("click", () => {
    if (!canSpeak) {
      btn.textContent = "Try Chrome or Edge";
      setTimeout(() => resetListen(btn), 2500);
      return;
    }
    if (btn.classList.contains("on")) { stopSpeaking(); resetListen(btn); return; }
    const s = getSpeech();
    if (!s || !s.text) return;
    btn.classList.add("on");
    btn.textContent = "⏹ Stop";
    speakText(s.text, s.el, () => resetListen(btn));
  });
}
function resetListen(btn) {
  btn.classList.remove("on");
  if (btn.dataset.idle) btn.textContent = btn.dataset.idle;
}
