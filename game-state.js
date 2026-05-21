const missionTime = 10;

const challenges = [
  {
    from: "From: support@uni-alert.com",
    subject: "Subject: Account Deletion Warning",
    headline: "URGENT: Your university account will be deleted. Verify now!",
    clue: "Is this message real or a scam?",
    question: "What will you do?",
    correct: "report",
    feedback: "This is a phishing scam. Never click suspicious links.",
    wrong: "That was a scam. Always verify suspicious emails first.",
  },
  {
    from: "From: finance-office@unl-payments.com",
    subject: "Subject: Refund Waiting",
    headline: "Your tuition refund is ready. Click the link and enter bank details.",
    clue: "ByteBot spots pressure plus a strange payment domain.",
    question: "What is the safest response?",
    correct: "report",
    feedback: "Correct. Real finance teams do not ask for bank details through surprise links.",
    wrong: "Careful. Fake refund messages are designed to steal bank information.",
  },
  {
    from: "From: library@youruniversity.edu",
    subject: "Subject: Book Return Reminder",
    headline: "Your reserved book is ready. Sign in through the official library portal.",
    clue: "This sender and instruction look more trustworthy.",
    question: "How should you classify it?",
    correct: "real",
    feedback: "Correct. It uses an official university domain and points to the normal portal.",
    wrong: "This one was likely real. The official domain and normal portal are good signs.",
  },
  {
    from: "From: it-helpdesk@youruniversity-security.com",
    subject: "Subject: Password Expiry",
    headline: "Your password expires today. Click Link to keep your account active.",
    clue: "Look closely at the domain before trusting the message.",
    question: "What will you do?",
    correct: "ignore",
    feedback: "Correct. Ignoring the trap and using the real IT portal keeps you safe.",
    wrong: "That domain is not the real university domain. Do not trust the link.",
  },
  {
    from: "From: lecturer.name@youruniversity.edu",
    subject: "Subject: Urgent Favor",
    headline: "Buy gift cards for an event and send the codes. I will repay you later.",
    clue: "Even real accounts can be compromised. Verify unusual requests.",
    question: "What is the safest action?",
    correct: "report",
    feedback: "Correct. Gift-card requests are a classic impersonation scam.",
    wrong: "This is risky. Verify unusual money requests through another channel.",
  },
];

const decisions = [
  { id: "scam", label: "Scam", className: "scam" },
  { id: "real", label: "Real", className: "real" },
  { id: "link", label: "Click Link", className: "link" },
  { id: "ignore", label: "Ignore", className: "ignore" },
  { id: "report", label: "Report", className: "report" },
];

function defaultGameState() {
  return {
    score: 0,
    lives: 3,
    current: 0,
    timer: missionTime,
    lastCorrect: true,
    lastAnswer: "",
    pickupsByChallenge: {},
    askedScoreCheckpoints: {},
  };
}

function loadGameState() {
  const saved = window.sessionStorage.getItem("cyberRunState");
  if (!saved) return defaultGameState();
  try {
    return normalizeGameState(JSON.parse(saved));
  } catch {
    return resetGameState();
  }
}

function normalizeGameState(saved) {
  const state = { ...defaultGameState(), ...(saved || {}) };
  const maxChallenge = challenges.length - 1;
  state.score = clampNumber(state.score, 0, 9999);
  state.lives = clampNumber(state.lives, 0, 3);
  state.current = clampNumber(state.current, 0, maxChallenge);
  state.timer = clampNumber(state.timer, 0, missionTime);
  state.lastCorrect = Boolean(state.lastCorrect);
  state.lastAnswer = typeof state.lastAnswer === "string" ? state.lastAnswer : "";
  state.pickupsByChallenge =
    state.pickupsByChallenge && typeof state.pickupsByChallenge === "object" ? state.pickupsByChallenge : {};
  state.askedScoreCheckpoints =
    state.askedScoreCheckpoints && typeof state.askedScoreCheckpoints === "object" ? state.askedScoreCheckpoints : {};

  Object.keys(state.pickupsByChallenge).forEach((key) => {
    state.pickupsByChallenge[key] = clampNumber(state.pickupsByChallenge[key], 0, 99);
  });
  Object.keys(state.askedScoreCheckpoints).forEach((key) => {
    state.askedScoreCheckpoints[key] = Boolean(state.askedScoreCheckpoints[key]);
  });

  return state;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function saveGameState(state) {
  window.sessionStorage.setItem("cyberRunState", JSON.stringify(state));
}

function resetGameState() {
  const state = defaultGameState();
  saveGameState(state);
  return state;
}

function currentChallenge(state = loadGameState()) {
  return challenges[state.current] || challenges[0];
}

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderHud(state = loadGameState()) {
  const score = document.getElementById("score");
  const timer = document.getElementById("timer");
  const lives = document.getElementById("lives");
  if (score) score.textContent = state.score;
  if (timer) timer.textContent = formatTime(state.timer);
  if (lives) {
    const fullHearts = "♥".repeat(state.lives);
    const emptyHearts = "♡".repeat(3 - state.lives);
    lives.textContent = `${fullHearts}${emptyHearts}`;
    lives.setAttribute("aria-label", `${state.lives} lives remaining out of 3`);
  }
}
