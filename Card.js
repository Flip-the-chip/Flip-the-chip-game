// One chip on the board, plus the dialog it opens (lab or quick question)

let labCleanup = null;

class Card {
  constructor(type, data, index) {
    this.type = type;      // "lab", "quiz" or "special"
    this.data = data;
    this.index = index;
    this.isDone = false;
    this.element = this.build();
  }

  build() {
    const b = document.createElement("button");
    b.className = "chip";
    b.setAttribute("aria-label", `Chip U${this.index + 1}, face down`);
    b.innerHTML = `<span class="inner">
      <span class="face front"><span class="ref">U${this.index + 1}</span><span class="q">?</span><span class="dot"></span></span>
      <span class="face back"></span></span>`;
    b.addEventListener("click", () => onCardClick(this));
    return b;
  }

  flip() {
    this.element.classList.add("flipped");
    this.element.disabled = true;
  }

  setBack(icon, label, cls) {
    this.element.querySelector(".back").innerHTML =
      `<span class="icon" aria-hidden="true">${icon}</span><span class="lbl">${label}</span>`;
    this.element.classList.remove("good", "bad");
    if (cls) this.element.classList.add(cls);
    this.element.setAttribute("aria-label", `Chip U${this.index + 1}: ${label}`);
  }

  static openDialog(tag, title) {
    stopSpeaking();
    resetListen($("qListen"));
    $("qField").textContent = tag;
    $("qTitle").textContent = title;
    $("qBody").innerHTML = "";
    $("qWhy").innerHTML = "";
    $("qDialog").showModal();
    $("qDialog").scrollTop = 0;
  }

  // Shared ending: the explanation, then "would you build this?"
  static showReaction(html, onReact) {
    $("qWhy").innerHTML = `${html}
      <p class="react-q">Would you want to build something like this?</p>
      <div class="react">
        <button class="opt" data-liked="1">🔥 Yes, that’s cool</button>
        <button class="opt" data-liked="0">😐 Not really</button>
      </div>`;
    const btns = $("qWhy").querySelectorAll(".react .opt");
    btns.forEach(r => r.addEventListener("click", () => {
      onReact(r.dataset.liked === "1");
      $("qDialog").close();
    }));
    btns[0].scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  showQuestion(onAnswer, onReact) {
    const q = this.data;
    Card.openDialog("❓ Quick question · " + FIELDS[q.f].name, q.q);
    const opts = document.createElement("div");
    opts.className = "opts";
    q.o.forEach((text, idx) => {
      const o = document.createElement("button");
      o.className = "opt";
      o.textContent = text;
      o.addEventListener("click", () => {
        const buttons = [...opts.children];
        buttons.forEach(btn => btn.disabled = true);
        buttons[q.a].classList.add("right");
        const correct = idx === q.a;
        if (!correct) buttons[idx].classList.add("wrong");
        onAnswer(correct);
        Card.showReaction(`<div class="why"><b>${correct ? "You got it! +1 star" : "Nope! It’s: " + q.o[q.a] + "."}</b>${q.why}</div>`, onReact);
      });
      opts.appendChild(o);
    });
    $("qBody").appendChild(opts);
    Card.speech = {
      text: sayable(q.q) + " " + q.o.map((o, i) => `Option ${i + 1}: ${sayable(o)}.`).join(" "),
      el: $("qTitle")
    };
  }

  showLab(onFinish, onReact) {
    const f = this.data.f, lab = LABS[f];
    Card.openDialog("🧪 Hands-on lab · " + FIELDS[f].name, lab.title);
    $("qBody").innerHTML = `
      <p class="lab-intro">${lab.intro}</p>
      <div class="lab" id="labArea"></div>
      <div class="row" id="labRow"><button class="btn ghost" id="labSkip">Skip this lab</button></div>`;
    let settled = false;
    const settle = (completed) => {
      if (settled) return;
      settled = true;
      $("labRow").remove();
      onFinish(completed);
      if (completed) { sfx("win"); confetti(); }
      Card.showReaction(completed
        ? `<div class="why success"><b>Lab complete! +2 stars</b>${lab.success}</div>`
        : `<div class="why"><b>Skipped. Here’s what it was about:</b>${lab.success}</div>`, onReact);
    };
    labCleanup = lab.mount($("labArea"), () => settle(true));
    Card.speech = {
      text: sayable(lab.title) + ". " + sayable(lab.intro),
      el: $("qBody").querySelector(".lab-intro")
    };
    $("labSkip").addEventListener("click", () => settle(false));
  }
}
