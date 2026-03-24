const LETTERS = "ABCDEFGHIJKLMNOPRSTW";
const TIMES = [30, 60, 120],
  ROUNDS = [1, 3, 5, 10];
let players = ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"];
let caseSens = true,
  timeLimit = 60,
  totalRounds = 3;
let scores = {},
  curRound = 0,
  curPIdx = 0,
  curLetter = "",
  curWords = [],
  tid = null,
  timeLeft = 0;

function tog(key, idx, btn) {
  btn.parentElement
    .querySelectorAll(".tg-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  if (key === "case") caseSens = idx === 0;
  if (key === "time") timeLimit = TIMES[idx];
  if (key === "rounds") totalRounds = ROUNDS[idx];
}

function renderPlayers() {
  const l = document.getElementById("plist");
  l.innerHTML = "";
  players.forEach((n, i) => {
    const r = document.createElement("div");
    r.className = "player-entry";
    r.innerHTML = `<input type="text" value="${esc(n)}" placeholder="Name…" oninput="players[${i}]=this.value">${players.length > 2 ? `<button class="rm-btn" onclick="removePlayer(${i})">✕</button>` : ""}`;
    l.appendChild(r);
  });
}
function addPlayer() {
  if (players.length >= 8) return;
  players.push("Spieler " + (players.length + 1));
  renderPlayers();
}
function removePlayer(i) {
  players.splice(i, 1);
  renderPlayers();
}

function startGame() {
  document.querySelectorAll(".player-entry input").forEach((inp, i) => {
    if (players[i] !== undefined)
      players[i] = inp.value.trim() || "Spieler " + (i + 1);
  });
  players = players.filter((p) => p.length > 0);
  if (!players.length) return;
  scores = {};
  players.forEach((p) => (scores[p] = 0));
  curRound = 1;
  curPIdx = 0;
  beginTurn();
  showScreen("game");
}

function beginTurn() {
  curLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  curWords = [];
  timeLeft = timeLimit;
  document.getElementById("bl").textContent = curLetter;
  document.getElementById("cpn").textContent = players[curPIdx];
  document.getElementById("ri").textContent =
    `Runde ${curRound}/${totalRounds}`;
  document.getElementById("wi").value = "";
  document.getElementById("wi").className = "wi";
  document.getElementById("em").textContent = "";
  renderWords();
  updateTimer();
  clearInterval(tid);
  tid = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(tid);
      endTurn();
    }
  }, 1000);
  setTimeout(() => document.getElementById("wi").focus(), 100);
}

function updateTimer() {
  const el = document.getElementById("timer");
  el.textContent = timeLeft;
  el.classList.toggle("urgent", timeLeft <= 10);
}

function renderWords() {
  const el = document.getElementById("wd");
  if (!curWords.length) {
    el.innerHTML = '<span style="color:var(--border)">–</span>';
    return;
  }
  el.innerHTML = curWords
    .map(
      (w, i) =>
        `<span class="w">${esc(w)}</span>${i < curWords.length - 1 ? ' <span class="d">·</span> ' : ""}`,
    )
    .join("");
}

function submitWord() {
  const inp = document.getElementById("wi");
  const word = inp.value.trim();
  if (!word) return;

  if (word[0].toLowerCase() !== curLetter.toLowerCase()) {
    flashErr(`Muss mit „${curLetter}“ beginnen!`, inp);
    return;
  }

  const isDuplicate = curWords.some(existingWord => {
    if (caseSens) {
      return existingWord === word; 
    } else {
      return existingWord.toLowerCase() === word.toLowerCase();
    }
  });

  if (isDuplicate) {
    flashErr("Wort bereits genannt!", inp);
    return;
  }

  // 3. Wort hinzufügen
  curWords.push(word);
  inp.value = "";
  document.getElementById("em").textContent = "";
  renderWords();
}

function flashErr(msg, inp) {
  document.getElementById("em").textContent = msg;
  inp.classList.add("err");
  setTimeout(() => {
    inp.classList.remove("err");
    if (document.getElementById("em").textContent === msg)
      document.getElementById("em").textContent = "";
  }, 2000);
}

function endTurn() {
  scores[players[curPIdx]] += curWords.length;
  curPIdx++;
  if (curPIdx >= players.length) showRoundResults();
  else beginTurn();
}

function showRoundResults() {
  const sorted = [...players].sort((a, b) => scores[b] - scores[a]);
  document.getElementById("rt").textContent = `Runde ${curRound} beendet`;
  document.getElementById("rs").innerHTML = sorted
    .map(
      (p) =>
        `<div class="sr"><span>${esc(p)}</span><span class="pts">${scores[p]} P.</span></div>`,
    )
    .join("");
  document.getElementById("rnb").textContent =
    curRound >= totalRounds ? "Ergebnis 🏆" : "Weiter →";
  showScreen("round");
}

function nextRound() {
  if (curRound >= totalRounds) {
    showFinal();
    return;
  }
  curRound++;
  curPIdx = 0;
  beginTurn();
  showScreen("game");
}

function showFinal() {
  const sorted = [...players].sort((a, b) => scores[b] - scores[a]);
  const medals = ["🥇", "🥈", "🥉"],
    cls = ["first", "second", "third"];
  let dOrder, dCls, dMed;
  if (sorted.length >= 3) {
    dOrder = [sorted[1], sorted[0], sorted[2]];
    dCls = ["second", "first", "third"];
    dMed = [medals[1], medals[0], medals[2]];
  } else {
    dOrder = sorted;
    dCls = cls;
    dMed = medals;
  }
  document.getElementById("podium").innerHTML = dOrder
    .map(
      (p, i) =>
        `<div class="ps ${dCls[i]}"><div class="pm">${dMed[i]}</div><div class="pn">${esc(p)}</div><div class="pp">${scores[p]} P.</div></div>`,
    )
    .join("");
  showScreen("final");
}

function playAgain() {
  scores = {};
  players.forEach((p) => (scores[p] = 0));
  curRound = 1;
  curPIdx = 0;
  beginTurn();
  showScreen("game");
}

function goLobby() {
  clearInterval(tid);
  showScreen("lobby");
}

function showScreen(n) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("s-" + n).classList.add("active");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

renderPlayers();
