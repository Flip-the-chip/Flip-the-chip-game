// Hands-on mini labs, one per field.
// mount(el, done) builds the lab inside el, calls done() once the goal is reached,
// and returns a cleanup function that runs when the dialog closes.

const LABS = {};

// ---------------- AI: nearest-neighbour classifier ----------------
LABS.ai = {
  title: "Teach an AI to tell bees from flies",
  intro: "Pick 🐝 or 🪰, then tap the chart to add examples. Bees tend to be stripier and fuzzier. Add at least 3 of each and watch the AI draw its own rule.",
  success: "You just trained a nearest-neighbour classifier, a real machine learning method. Each coloured square is the AI’s guess based on the examples closest to it. Researchers do the same thing with thousands of bee photos.",
  did: "Trained an AI to classify insects",
  mount(el, done) {
    el.innerHTML = `
      <div class="lab-tools">
        <button class="tool on" data-c="0">🐝 Bee</button>
        <button class="tool" data-c="1">🪰 Fly</button>
        <span class="lab-stat" data-stat>0 bees · 0 flies</span>
      </div>
      <canvas class="lab-canvas" aria-label="Chart: stripes go right, fuzz goes up. Tap to add examples."></canvas>
      <p class="axis-note">More stripes → &nbsp;·&nbsp; ↑ Fuzzier</p>`;
    const W = 360, H = 240;
    const cv = el.querySelector("canvas"), ctx = setupCanvas(cv, W, H);
    const stat = el.querySelector("[data-stat]"), tools = el.querySelectorAll(".tool");
    const pts = [];
    let cls = 0, finished = false;

    tools.forEach(t => t.addEventListener("click", () => {
      cls = +t.dataset.c;
      tools.forEach(x => x.classList.toggle("on", x === t));
    }));

    function predict(x, y) {
      const k = pts.length >= 3 ? 3 : 1;
      const near = pts.map(p => ({ c: p.c, d: (p.x - x) ** 2 + (p.y - y) ** 2 }))
        .sort((a, b) => a.d - b.d).slice(0, k);
      return near.filter(n => n.c === 0).length * 2 > k ? 0 : 1;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const both = pts.some(p => p.c === 0) && pts.some(p => p.c === 1);
      if (both) {
        const s = 10;
        for (let x = 0; x < W; x += s) for (let y = 0; y < H; y += s) {
          ctx.fillStyle = predict(x + s / 2, y + s / 2) === 0 ? "rgba(232,165,40,0.32)" : "rgba(70,140,230,0.28)";
          ctx.fillRect(x, y, s, s);
        }
      }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (!pts.length) {
        ctx.fillStyle = cssVar("--ink-soft");
        ctx.font = "15px 'Atkinson Hyperlegible', sans-serif";
        ctx.fillText("Tap anywhere to add an example", W / 2, H / 2);
      }
      ctx.font = "20px sans-serif";
      pts.forEach(p => ctx.fillText(p.c === 0 ? "🐝" : "🪰", p.x, p.y));
    }

    cv.addEventListener("pointerdown", e => {
      const p = toLocal(e, cv, W, H);
      pts.push({ x: p.x, y: p.y, c: cls });
      sfx("click");
      draw();
      const nb = pts.filter(q => q.c === 0).length, nf = pts.length - nb;
      stat.textContent = `${nb} bee${nb === 1 ? "" : "s"} · ${nf} fl${nf === 1 ? "y" : "ies"}`;
      if (!finished && nb >= 3 && nf >= 3) { finished = true; done(); }
    });

    draw();
    return () => {};
  }
};

// ---------------- Games: tune the physics ----------------
LABS.games = {
  title: "Code the jump",
  intro: "The cube can’t reach the flag yet. Change the numbers in the code with the sliders, then press Jump. Land on the right platform to win.",
  success: "You just tuned a physics engine. Platformers like Mario and Celeste run code like this 60 times a second, and game developers spend hours tweaking these exact numbers until a jump feels right.",
  did: "Coded the physics for a game jump",
  mount(el, done) {
    el.innerHTML = `
      <canvas class="lab-canvas"></canvas>
      <div class="sliders">
        <label>gravity <input type="range" data-g min="300" max="1500" step="50" value="900"></label>
        <label>jumpPower <input type="range" data-p min="200" max="650" step="10" value="300"></label>
      </div>
      <pre class="code" data-code></pre>
      <div class="lab-tools"><button class="btn" data-jump>Jump!</button><span class="lab-stat" data-stat>Land on the flag platform.</span></div>`;
    const W = 360, H = 220, GROUND = 170, LEFT_END = 120, RIGHT_START = 230, START_X = 50, SIZE = 16, SPEED = 160;
    const cv = el.querySelector("canvas"), ctx = setupCanvas(cv, W, H);
    const gIn = el.querySelector("[data-g]"), pIn = el.querySelector("[data-p]");
    const code = el.querySelector("[data-code]"), stat = el.querySelector("[data-stat]"), jumpBtn = el.querySelector("[data-jump]");
    let x = START_X, y = GROUND, vy = 0, running = false, raf = 0, last = 0, trail = [], finished = false;

    function showCode() {
      code.textContent =
`// player.js
const gravity = ${gIn.value};
const jumpPower = ${pIn.value};

// runs every frame
speedY = speedY + gravity * dt;
y = y + speedY * dt;`;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = cssVar("--chip");
      ctx.fillRect(0, GROUND, LEFT_END, H - GROUND);
      ctx.fillRect(RIGHT_START, GROUND, W - RIGHT_START, H - GROUND);
      ctx.strokeStyle = cssVar("--ink"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(325, GROUND); ctx.lineTo(325, GROUND - 50); ctx.stroke();
      ctx.fillStyle = cssVar("--led-good");
      ctx.beginPath(); ctx.moveTo(325, GROUND - 50); ctx.lineTo(350, GROUND - 42); ctx.lineTo(325, GROUND - 34); ctx.fill();
      ctx.fillStyle = cssVar("--copper");
      trail.forEach((t, i) => {
        ctx.globalAlpha = (i / trail.length) * 0.45;
        ctx.fillRect(t.x - 3, t.y - SIZE / 2 - 3, 6, 6);
      });
      ctx.globalAlpha = 1;
      ctx.fillRect(x - SIZE / 2, y - SIZE, SIZE, SIZE);
    }

    function fail(msg) {
      running = false; jumpBtn.disabled = false; stat.textContent = msg; sfx("bad");
      setTimeout(() => { if (!running) { x = START_X; y = GROUND; trail = []; draw(); } }, 700);
    }

    function step(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const prevY = y;
      vy += +gIn.value * dt;
      x = Math.min(W - SIZE / 2, x + SPEED * dt);
      y += vy * dt;
      trail.push({ x, y }); if (trail.length > 30) trail.shift();
      if (vy > 0 && prevY <= GROUND && y >= GROUND) {
        if (x <= LEFT_END) { y = GROUND; draw(); return fail("Landed too early. Try more jump power or less gravity."); }
        if (x >= RIGHT_START) {
          y = GROUND; draw(); running = false; jumpBtn.disabled = false; sfx("good");
          stat.textContent = finished ? "Nailed it again!" : "Nailed it! 🎉";
          if (!finished) { finished = true; done(); }
          return;
        }
      }
      if (y > H + SIZE) { draw(); return fail("Fell in the gap! Try more jump power or less gravity."); }
      draw();
      raf = requestAnimationFrame(step);
    }

    jumpBtn.addEventListener("click", () => {
      if (running) return;
      x = START_X; y = GROUND; vy = -(+pIn.value); trail = [];
      running = true; jumpBtn.disabled = true; stat.textContent = "Jumping…"; sfx("click");
      last = performance.now();
      raf = requestAnimationFrame(step);
    });
    [gIn, pIn].forEach(i => i.addEventListener("input", showCode));
    showCode(); draw();
    return () => cancelAnimationFrame(raf);
  }
};

// ---------------- Security: password crack time ----------------
LABS.security = {
  title: "Crack-proof password challenge",
  intro: "Type a made-up password (never a real one). See how long a hacker’s computer, guessing 10 billion passwords a second, would need to crack it.",
  success: "You just thought like a security analyst. Length beats everything: each extra character multiplies the attacker’s work. That’s why experts recommend a few random words joined together.",
  did: "Made a password that would beat a hacker",
  mount(el, done) {
    el.innerHTML = `
      <input class="lab-input" type="text" autocomplete="off" spellcheck="false" placeholder="Try typing: dog" aria-label="Test password">
      <div class="meter"><div class="meter-fill" data-fill></div></div>
      <p class="big-readout" data-time>Start typing…</p>
      <p class="lab-stat" data-stat>Goal: make it take more than 1,000 years.</p>`;
    const input = el.querySelector("input"), fill = el.querySelector("[data-fill]");
    const out = el.querySelector("[data-time]"), stat = el.querySelector("[data-stat]");
    const COMMON = ["password", "123456", "12345678", "qwerty", "abc123", "password123", "iloveyou",
      "111111", "letmein", "admin", "welcome", "monkey", "dragon", "football", "password1"];
    const GOAL = Math.log10(1000 * 3.15e7);
    let finished = false;

    function human(l) { // l = log10(seconds)
      if (l < 0) return "instantly ⚡";
      const s = Math.pow(10, l);
      if (s < 60) return Math.round(s) + " seconds";
      if (s < 3600) return Math.round(s / 60) + " minutes";
      if (s < 86400) return Math.round(s / 3600) + " hours";
      if (s < 3.15e7) return Math.round(s / 86400) + " days";
      const y = s / 3.15e7;
      if (y < 1e6) return Math.round(y).toLocaleString() + " years";
      if (y < 1e9) return Math.round(y / 1e6).toLocaleString() + " million years";
      if (y < 1.38e10) return (y / 1e9).toFixed(1) + " billion years";
      return "longer than the universe has existed 🤯";
    }

    input.addEventListener("input", () => {
      const pw = input.value;
      if (!pw) { out.textContent = "Start typing…"; fill.style.width = "0%"; return; }
      let pool = 0;
      if (/[a-z]/.test(pw)) pool += 26;
      if (/[A-Z]/.test(pw)) pool += 26;
      if (/[0-9]/.test(pw)) pool += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
      let len = pw.length;
      if (new Set(pw).size <= 2) len = Math.min(len, 3); // "aaaaaaaa" isn't strong
      const common = COMMON.includes(pw.toLowerCase());
      const l = common ? -1 : len * Math.log10(pool) - Math.log10(2e10);
      const strong = l >= GOAL;
      out.textContent = "Cracked in: " + human(l);
      fill.style.width = Math.max(4, Math.min(100, (l + 1) / 16 * 100)) + "%";
      fill.classList.toggle("strong", strong);
      if (common) stat.textContent = "That’s one of the most common passwords ever. Hackers try it first.";
      else if (strong) stat.textContent = "That would outlast every hacker alive. 💪";
      else if (len < 10) stat.textContent = "Tip: longer beats clever. Keep adding characters.";
      else stat.textContent = "Getting there. Try a few random words joined with dashes.";
      if (strong && !finished) { finished = true; done(); }
    });
    setTimeout(() => input.focus(), 60);
    return () => {};
  }
};

// ---------------- Logic: program a robot ----------------
LABS.logic = {
  title: "Program the robot",
  intro: "Build a list of commands, then press Run. The robot follows them one at a time, exactly like a computer runs code. Get 🤖 to the ⭐ without hitting a wall.",
  success: "You just wrote and debugged a program. Computers do exactly what you say, not what you mean, so programmers plan their steps and fix them when something crashes. You did both.",
  did: "Wrote and debugged a program for a robot",
  mount(el, done) {
    el.innerHTML = `
      <div class="robot-wrap">
        <div class="robot-grid" data-grid></div>
        <div class="robot-side">
          <div class="lab-tools">
            <button class="tool" data-cmd="F">⬆ Forward</button>
            <button class="tool" data-cmd="L">↺ Turn left</button>
            <button class="tool" data-cmd="R">↻ Turn right</button>
          </div>
          <ol class="queue" data-queue aria-label="Your program"></ol>
          <div class="lab-tools">
            <button class="btn" data-run>▶ Run</button>
            <button class="btn ghost" data-undo>Undo</button>
            <button class="btn ghost" data-clear>Clear</button>
          </div>
          <p class="lab-stat" data-stat>The robot faces up. Add some commands.</p>
        </div>
      </div>`;
    const N = 6, START = { x: 0, y: 5, d: 0 }, GOAL = { x: 3, y: 0 };
    const WALLS = new Set(["0,2", "1,2", "2,2", "4,3", "5,1", "1,4"]);
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], ICON = { F: "⬆", L: "↺", R: "↻" };
    const grid = el.querySelector("[data-grid]"), queueEl = el.querySelector("[data-queue]"), stat = el.querySelector("[data-stat]");
    let bot = { ...START }, prog = [], running = false, runId = 0, timers = [], finished = false, active = -1;

    function render() {
      grid.innerHTML = "";
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const c = document.createElement("div");
        c.className = "cell" + (WALLS.has(x + "," + y) ? " wall" : "");
        if (x === GOAL.x && y === GOAL.y) c.textContent = "⭐";
        if (x === bot.x && y === bot.y) c.innerHTML = `<span class="bot" style="transform: rotate(${bot.d * 90}deg)">▲</span>`;
        grid.appendChild(c);
      }
      queueEl.innerHTML = prog.map((p, i) => `<li class="${i === active ? "now" : ""}">${ICON[p]}</li>`).join("");
    }

    el.querySelectorAll("[data-cmd]").forEach(b => b.addEventListener("click", () => {
      if (running || prog.length >= 16) return;
      prog.push(b.dataset.cmd); sfx("click");
      stat.textContent = `${prog.length} command${prog.length === 1 ? "" : "s"}. Press Run when ready.`;
      render();
    }));
    el.querySelector("[data-undo]").addEventListener("click", () => { if (!running) { prog.pop(); render(); } });
    el.querySelector("[data-clear]").addEventListener("click", () => { if (!running) { prog = []; render(); } });

    function finish(msg, ok) {
      running = false; runId++; active = -1;
      stat.textContent = msg; sfx(ok ? "good" : "bad");
      render();
      if (ok) { if (!finished) { finished = true; done(); } return; }
      timers.push(setTimeout(() => { if (!running) { bot = { ...START }; render(); } }, 900));
    }

    el.querySelector("[data-run]").addEventListener("click", () => {
      if (running || !prog.length) return;
      running = true;
      const id = ++runId;
      bot = { ...START }; render();
      stat.textContent = "Running…";
      prog.forEach((cmd, i) => timers.push(setTimeout(() => {
        if (id !== runId) return;
        active = i;
        if (cmd === "L") bot.d = (bot.d + 3) % 4;
        else if (cmd === "R") bot.d = (bot.d + 1) % 4;
        else {
          const nx = bot.x + DX[bot.d], ny = bot.y + DY[bot.d];
          if (nx < 0 || ny < 0 || nx >= N || ny >= N || WALLS.has(nx + "," + ny)) {
            return finish(`Bonk! 💥 Step ${i + 1} hit a wall. That’s a bug. Fix it and run again.`, false);
          }
          bot.x = nx; bot.y = ny;
        }
        sfx("click"); render();
        if (bot.x === GOAL.x && bot.y === GOAL.y) return finish(`You reached the star in ${i + 1} steps! 🎉`, true);
        if (i === prog.length - 1) finish("The program ended, but the robot isn’t at the star yet. Add more steps.", false);
      }, 420 * (i + 1))));
    });

    render();
    return () => timers.forEach(clearTimeout);
  }
};

// ---------------- Web: live CSS ----------------
LABS.web = {
  title: "Style a web page",
  intro: "This page is plain. Change at least 3 things with the controls and watch the real code update as you go.",
  success: "You just wrote CSS, the language that styles every website. Web developers combine it with HTML and JavaScript to build everything from Instagram to this game.",
  did: "Styled a web page with real CSS",
  mount(el, done) {
    el.innerHTML = `
      <div class="web-wrap">
        <div class="wp" data-wp>
          <div class="wp-avatar" data-av>🎸</div>
          <h4 data-name>Your Name</h4>
          <p>Hi! This is my page. I’m into music, games and pizza.</p>
          <span class="wp-btn" data-btn>Follow</span>
        </div>
        <div class="web-controls">
          <label>Background <input type="color" data-k="bg" value="#ffffff"></label>
          <label>Button colour <input type="color" data-k="accent" value="#999999"></label>
          <label>Font
            <select data-k="font">
              <option value="Arial, sans-serif">Plain</option>
              <option value="'Chakra Petch', sans-serif">Techy</option>
              <option value="Georgia, serif">Classic</option>
              <option value="'Comic Sans MS', 'Comic Neue', cursive">Fun</option>
              <option value="ui-monospace, Consolas, monospace">Hacker</option>
            </select>
          </label>
          <label>Rounded corners <input type="range" data-k="radius" min="0" max="36" value="0"></label>
          <label>Emoji
            <select data-k="emoji"><option>🎸</option><option>🏀</option><option>🎮</option><option>🐝</option><option>🎨</option><option>🚀</option><option>🍕</option></select>
          </label>
          <label>Your name <input type="text" data-k="name" maxlength="18" placeholder="Your Name"></label>
        </div>
      </div>
      <pre class="code" data-code></pre>
      <p class="lab-stat" data-stat>Change 3 things to finish: 0 / 3</p>`;
    const wp = el.querySelector("[data-wp]"), av = el.querySelector("[data-av]"), nameEl = el.querySelector("[data-name]");
    const btn = el.querySelector("[data-btn]"), code = el.querySelector("[data-code]"), stat = el.querySelector("[data-stat]");
    const changed = new Set();
    let finished = false;
    const get = k => el.querySelector(`[data-k="${k}"]`).value;
    function textOn(hex) {
      const n = parseInt(hex.slice(1), 16);
      return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150 ? "#1a1a1a" : "#ffffff";
    }
    function apply() {
      const bg = get("bg"), ac = get("accent"), font = get("font"), r = get("radius"), name = get("name") || "Your Name";
      wp.style.background = bg; wp.style.color = textOn(bg); wp.style.fontFamily = font; wp.style.borderRadius = r + "px";
      btn.style.background = ac; btn.style.color = textOn(ac); btn.style.borderRadius = Math.min(r, 20) + "px";
      av.textContent = get("emoji"); nameEl.textContent = name;
      code.textContent =
`<h1>${name}</h1>

.page {
  background: ${bg};
  color: ${textOn(bg)};
  font-family: ${font};
  border-radius: ${r}px;
}
.follow-button {
  background: ${ac};
}`;
    }
    el.querySelectorAll("[data-k]").forEach(c => c.addEventListener("input", () => {
      changed.add(c.dataset.k);
      apply();
      stat.textContent = changed.size >= 3 ? "Looking good! Keep playing if you like." : `Change 3 things to finish: ${changed.size} / 3`;
      if (changed.size >= 3 && !finished) { finished = true; done(); }
    }));
    apply();
    return () => {};
  }
};

// ---------------- Data: fit a trend line ----------------
LABS.data = {
  title: "Predict the bees",
  intro: "Each dot is one day: how sunny it was and how many bees visited a flower patch. Drag the two round handles to draw the line that best fits the dots.",
  success: "You just did linear regression, one of the most used tools in data science. With your line you can predict the future: more sun, more bees. Scientists, sports analysts and apps like Spotify use this idea every day.",
  did: "Found a trend in data and made a prediction",
  mount(el, done) {
    el.innerHTML = `
      <canvas class="lab-canvas" aria-label="Scatter chart with a line you can drag"></canvas>
      <div class="meter"><div class="meter-fill" data-fill></div></div>
      <p class="lab-stat" data-stat></p>`;
    const W = 360, H = 250, L = 40, R = 345, T = 15, B = 215, XMAX = 12, YMAX = 50;
    const cv = el.querySelector("canvas"), ctx = setupCanvas(cv, W, H);
    const fill = el.querySelector("[data-fill]"), stat = el.querySelector("[data-stat]");
    const px = x => L + (x / XMAX) * (R - L);
    const py = y => B - (y / YMAX) * (B - T);
    const toY = p => Math.max(0, Math.min(YMAX, (B - p) / (B - T) * YMAX));

    const pts = Array.from({ length: 18 }, () => {
      const x = 0.5 + Math.random() * 11;
      return { x, y: Math.max(1, Math.min(48, 3 * x + 6 + (Math.random() - 0.5) * 12)) };
    });
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sxx = 0;
    pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
    const slope = sxy / sxx, icpt = my - slope * mx;
    const mse = (a, b) => pts.reduce((s, p) => s + (p.y - (a + (b - a) * p.x / XMAX)) ** 2, 0) / n;
    const best = mse(icpt, icpt + slope * XMAX);

    let h = [25, 25], drag = -1, finished = false;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const ink = cssVar("--ink"), soft = cssVar("--ink-soft"), cop = cssVar("--copper"), panel = cssVar("--panel");
      ctx.strokeStyle = soft; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.fillStyle = soft; ctx.font = "12px 'Atkinson Hyperlegible', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let x = 0; x <= XMAX; x += 3) ctx.fillText(x, px(x), B + 13);
      for (let y = 0; y <= YMAX; y += 10) { ctx.textAlign = "right"; ctx.fillText(y, L - 6, py(y)); }
      ctx.textAlign = "center";
      ctx.fillText("Hours of sunshine →", (L + R) / 2, B + 29);
      ctx.save(); ctx.translate(10, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Bee visits →", 0, 0); ctx.restore();
      ctx.fillStyle = ink;
      pts.forEach(p => { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 4, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = cop; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px(0), py(h[0])); ctx.lineTo(px(XMAX), py(h[1])); ctx.stroke();
      [[px(0), py(h[0])], [px(XMAX), py(h[1])]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = cop; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = panel; ctx.stroke();
      });
    }

    function score() {
      const pct = Math.round(Math.max(0, Math.min(1, best / mse(h[0], h[1]))) * 100);
      fill.style.width = pct + "%";
      fill.classList.toggle("strong", pct >= 85);
      const pred = Math.round(h[0] + (h[1] - h[0]) * 10 / XMAX);
      stat.textContent = pct >= 85
        ? `Fit: ${pct}%. Great line! It predicts about ${pred} bee visits on a 10-hour sunny day.`
        : `Fit: ${pct}%. Drag the handles to get above 85%.`;
      return pct;
    }

    function move(e) {
      const p = toLocal(e, cv, W, H);
      h[drag] = toY(p.y);
      draw(); score();
    }
    cv.addEventListener("pointerdown", e => {
      const p = toLocal(e, cv, W, H);
      drag = p.x < W / 2 ? 0 : 1;   // grab the handle on the side you touched
      cv.setPointerCapture(e.pointerId);
      move(e);
    });
    cv.addEventListener("pointermove", e => { if (drag >= 0) move(e); });
    // Only count it once they let go, so the line they see is the line that won
    ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, () => {
      if (drag < 0) return;
      drag = -1;
      if (score() >= 85 && !finished) { finished = true; done(); }
    }));

    draw(); score();
    return () => {};
  }
};
