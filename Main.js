// Game flow: start, scoring, card clicks, end screen

let score = 0, gameActive = false, cardsLeft = 0, totalCards = 0;
let results = []; // { f, kind, success, liked }
const board = $("board");

function addScore(n) {
  score = Math.max(0, score + n);
  $("stars").textContent = score;
}

function updateProgress() {
  const cleared = totalCards - cardsLeft;
  $("cleared").textContent = `${cleared} / ${totalCards || 12}`;
  $("powerFill").style.width = (totalCards ? cleared / totalCards * 100 : 0) + "%";
  // They can stop whenever they want once they've cleared at least one chip
  $("finish").hidden = !(gameActive && cleared > 0 && cardsLeft > 0);
}

function renderIdleBoard() {
  board.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const c = new Card("special", null, i);
    c.element.disabled = true;
    board.appendChild(c.element);
  }
}

function startGame() {
  if ($("endDialog").open) $("endDialog").close();
  score = 0; results = []; gameActive = true;
  addScore(0);
  board.classList.remove("idle");
  $("start").textContent = "Restart";

  const labs = Object.keys(LABS).map(f => ({ type: "lab", data: { f } }));
  const quiz = arrShuffle(QUESTIONS).slice(0, QUESTIONS_PER_GAME).map(q => ({ type: "quiz", data: q }));
  const specials = SPECIALS.map(s => ({ type: "special", data: s }));
  const deck = arrShuffle(labs.concat(quiz, specials));
  cardsLeft = totalCards = deck.length;
  updateProgress();

  board.innerHTML = "";
  deck.forEach((item, i) => {
    const c = new Card(item.type, item.data, i);
    c.element.classList.add("deal");
    c.element.style.animationDelay = `${i * 45}ms`;
    board.appendChild(c.element);
  });
  sfx("good");
  toast("Pick any chip. Six hide hands-on labs 🧪 Stop whenever you like.");
}

function cardDone(card, icon, label, cls) {
  card.setBack(icon, label, cls);
  cardsLeft--;
  updateProgress();
}

function onCardClick(card) {
  if (!gameActive || card.isDone) return;
  card.isDone = true;
  card.flip();
  sfx("click");

  if (card.type === "special") {
    const s = card.data;
    if (s.kind === "save") {
      addScore(1); sfx("good");
      toast("You saved your work. +1 star.");
      cardDone(card, s.icon, s.label, "good");
    } else {
      sfx("bad");
      toast(score === 0 ? "A bug! No stars to lose yet. Every coder meets bugs." : "A bug got into your code. −1 star.");
      addScore(-1);
      cardDone(card, s.icon, s.label, "bad");
    }
    setTimeout(checkDone, 500);
    return;
  }

  let result = null;
  const react = (liked) => { if (result) result.liked = liked; };

  if (card.type === "quiz") {
    card.setBack("❓", "Answering…");
    setTimeout(() => card.showQuestion((correct) => {
      result = { f: card.data.f, kind: "quiz", success: correct, liked: false };
      results.push(result);
      if (correct) { addScore(1); sfx("good"); toast("Correct. +1 star."); }
      else { sfx("bad"); toast("Nope! But now you know something new."); }
      cardDone(card, correct ? "✓" : "✗", correct ? "Correct" : "Missed", correct ? "good" : "bad");
    }, react), 350);
    return;
  }

  card.setBack("🧪", "In the lab…");
  setTimeout(() => card.showLab((completed) => {
    result = { f: card.data.f, kind: "lab", success: completed, liked: false };
    results.push(result);
    if (completed) { addScore(2); toast("Lab complete! +2 stars."); }
    else toast("Lab skipped. Try it next game!");
    cardDone(card, "🧪", completed ? "Lab done" : "Skipped", completed ? "good" : "bad");
  }, react), 350);
}

function checkDone() {
  if (gameActive && cardsLeft === 0 && !$("qDialog").open) setTimeout(endGame, 400);
}

function endGame() {
  if (!gameActive) return;
  gameActive = false;
  $("finish").hidden = true;
  board.querySelectorAll(".chip").forEach(b => b.disabled = true);
  const cleared = totalCards - cardsLeft;

  // Recommend from what they said they'd want to build, not from right answers
  const tally = {};
  results.forEach(r => {
    const t = tally[r.f] = tally[r.f] || { liked: 0, labs: 0 };
    if (r.liked) t.liked++;
    if (r.kind === "lab" && r.success) t.labs++;
  });
  let best = null;
  Object.entries(tally).forEach(([f, t]) => {
    if (t.liked === 0) return;
    if (!best || t.liked > tally[best].liked || (t.liked === tally[best].liked && t.labs > tally[best].labs)) best = f;
  });

  $("endTitle").textContent = cardsLeft === 0
    ? "Board cleared! ⚡ CPU fully powered"
    : `Nice run! You cleared ${cleared} of ${totalCards} chips`;
  $("endStars").textContent = score > 0 ? "⭐".repeat(score) + `  ${score} star${score === 1 ? "" : "s"}` : "0 stars this round";

  const F = FIELDS[best || "logic"];
  $("endPick").innerHTML = `<div class="pick">
    <h3>${best ? "You got hyped about " + F.name : "Not sure yet? Start with " + F.name}</h3>
    <p>${F.what}</p><p>${F.next}</p></div>`;

  const did = results.filter(r => r.kind === "lab" && r.success).map(r => LABS[r.f].did);
  const liked = Object.entries(tally).filter(([, t]) => t.liked > 0);
  $("endExplored").innerHTML =
    (did.length ? `<p class="end-h">Things you actually did today</p>
      <ul class="did">${did.map(d => `<li>${d}</li>`).join("")}</ul>
      <p class="end-note">That’s real computer science, with no experience needed.</p>` : "") +
    (liked.length ? `<p class="end-h">What got you interested</p>
      <ul class="explored">${liked.map(([f, t]) => `<li>${FIELDS[f].name}: ${"🔥".repeat(t.liked)}</li>`).join("")}</ul>` : "");

  $("endDialog").showModal();
  sfx("win");
  confetti();
}

$("qDialog").addEventListener("cancel", (e) => e.preventDefault());
$("qDialog").addEventListener("close", () => {
  if (labCleanup) { labCleanup(); labCleanup = null; }
  checkDone();
});
$("endAgain").addEventListener("click", startGame);
$("endClose").addEventListener("click", () => $("endDialog").close());
$("start").addEventListener("click", startGame);
$("finish").addEventListener("click", endGame);
$("mute").addEventListener("click", () => {
  muted = !muted;
  $("mute").textContent = muted ? "🔇 Sound off" : "🔊 Sound on";
  $("mute").setAttribute("aria-pressed", String(muted));
});

renderIdleBoard();
updateProgress();
