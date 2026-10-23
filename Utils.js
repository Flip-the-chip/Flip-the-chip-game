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
function sfx(kind) {
  const seqs = {
    click: [[880, 0.03]],
    good: [[523, 0.07], [784, 0.12]],
    bad: [[196, 0.18]],
    win: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.2]]
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
