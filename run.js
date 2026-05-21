const state = loadGameState();
saveGameState(state);
renderHud(state);

const challenge = currentChallenge(state);
const runnerRow = document.getElementById("runnerRow");
const runnerPlayer = document.getElementById("runnerPlayer");
const emailCard = document.getElementById("emailCard");
const runnerPickup = document.getElementById("runnerPickup");
const runPrompt = document.getElementById("runPrompt");
const jumpButton = document.getElementById("jumpButton");

const gravity = 1850;
const jumpVelocity = 900;
const maxSpeedPickupBonus = 5;
const scoreQuestionInterval = 30;

document.getElementById("emailFrom").textContent = challenge.from;
document.getElementById("emailSubject").textContent = challenge.subject;
document.getElementById("emailHeadline").textContent = challenge.headline;
document.getElementById("bytebotClue").textContent = challenge.clue;

let paused = false;
let transitioning = false;
let frameId = null;
let timerId = null;
let lastTime = performance.now();
let jump = 0;
let velocity = 0;
let pickups = getChallengePickups();
let threatX = Math.min(1040, Math.max(860, runnerRow.clientWidth + 120));
let pickupX = 420;
let pickupY = 92;
let speed = 240;

runnerRow.style.setProperty("--runner-jump", "0px");
runnerRow.style.setProperty("--threat-x", `${threatX}px`);
runnerRow.style.setProperty("--pickup-x", `${pickupX}px`);
runnerRow.style.setProperty("--pickup-y", `${pickupY}px`);

function tickTimer() {
  if (paused) return;
  state.timer = Math.max(0, state.timer - 1);
  saveGameState(state);
  renderHud(state);
}

function getChallengePickups() {
  return Number(state.pickupsByChallenge[state.current] || 0);
}

function saveChallengePickups() {
  state.pickupsByChallenge[state.current] = pickups;
}

function updateRunner(now) {
  if (paused) {
    lastTime = now;
    frameId = requestAnimationFrame(updateRunner);
    return;
  }

  const dt = Math.min(0.024, (now - lastTime) / 1000 || 0);
  lastTime = now;
  const currentSpeed = speed + Math.min(pickups, maxSpeedPickupBonus) * 14 + state.current * 12;
  threatX -= currentSpeed * dt;
  pickupX -= currentSpeed * dt;
  jump += velocity * dt;
  velocity -= gravity * dt;

  if (jump < 0) {
    jump = 0;
    velocity = 0;
    runnerPlayer.classList.remove("jumping");
  }

  runnerRow.style.setProperty("--runner-jump", `${jump}px`);
  runnerRow.style.setProperty("--threat-x", `${threatX}px`);
  runnerRow.style.setProperty("--pickup-x", `${pickupX}px`);
  runnerRow.style.setProperty("--pickup-y", `${pickupY}px`);

  if (isCollectingPickup()) collectPickup();
  if (isHitByThreat()) {
    goToQuestion();
    return;
  }
  if (shouldAskAtScoreCheckpoint()) {
    goToQuestion();
    return;
  }

  if (threatX < -170) {
    threatX = Math.min(900, Math.max(650, runnerRow.clientWidth + 120));
  }

  if (pickupX < -90) {
    pickupX = Math.min(960, Math.max(700, runnerRow.clientWidth + 260));
    pickupY = pickPickupHeight();
  }

  frameId = requestAnimationFrame(updateRunner);
}

function runnerJump() {
  if (paused || jump > 10) return;
  velocity = jumpVelocity;
  runnerPlayer.classList.add("jumping");
}

function collectPickup() {
  if (runnerPickup.classList.contains("collected")) return;
  pickups += 1;
  saveChallengePickups();
  state.score += 5;
  saveGameState(state);
  renderHud(state);
  runnerPickup.classList.add("collected");
  runPrompt.textContent = "+5 points collected. Questions appear after every 30 points, or if you touch phishing.";
  pickupX = Math.min(780, Math.max(520, runnerRow.clientWidth * 0.52));
  pickupY = pickPickupHeight();
  threatX = Math.max(threatX, runnerRow.clientWidth + 260);
  window.setTimeout(() => runnerPickup.classList.remove("collected"), 260);
}

function pickPickupHeight() {
  return [136, 166, 196][Math.floor(Math.random() * 3)];
}

function isCollectingPickup() {
  return rectsOverlap(getRunnerCollectBox(), shrinkRect(runnerPickup.getBoundingClientRect(), 4), {
    minX: 12,
    minY: 12,
  });
}

function isHitByThreat() {
  return rectsOverlap(getRunnerHitbox(), shrinkRect(emailCard.getBoundingClientRect(), 12), {
    minX: 14,
    minY: 14,
  });
}

function shouldAskAtScoreCheckpoint() {
  const checkpoint = nextScoreCheckpoint();
  if (!checkpoint) return false;
  state.askedScoreCheckpoints[checkpoint] = true;
  saveGameState(state);
  return true;
}

function nextScoreCheckpoint() {
  const highestReached = Math.floor(state.score / scoreQuestionInterval) * scoreQuestionInterval;
  for (let checkpoint = scoreQuestionInterval; checkpoint <= highestReached; checkpoint += scoreQuestionInterval) {
    if (!state.askedScoreCheckpoints[checkpoint]) return checkpoint;
  }
  return 0;
}

function rectsOverlap(first, second, options = {}) {
  const minX = options.minX || 1;
  const minY = options.minY || 1;
  const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlapX >= minX && overlapY >= minY;
}

function getRunnerHitbox() {
  return shrinkRect(runnerPlayer.getBoundingClientRect(), {
    left: 54,
    right: 46,
    top: 118,
    bottom: 18,
  });
}

function getRunnerCollectBox() {
  return shrinkRect(runnerPlayer.getBoundingClientRect(), {
    left: 46,
    right: 42,
    top: 72,
    bottom: 28,
  });
}

function shrinkRect(rect, amount) {
  const inset =
    typeof amount === "number" ? { left: amount, right: amount, top: amount, bottom: amount } : amount;
  return {
    left: rect.left + inset.left,
    right: rect.right - inset.right,
    top: rect.top + inset.top,
    bottom: rect.bottom - inset.bottom,
  };
}

function goToQuestion() {
  if (transitioning) return;
  transitioning = true;
  window.clearInterval(timerId);
  window.cancelAnimationFrame(frameId);
  saveGameState(state);
  window.location.href = "question.html";
}

document.getElementById("pauseButton").addEventListener("click", (event) => {
  paused = !paused;
  event.currentTarget.textContent = paused ? "Resume" : "Pause";
  runPrompt.textContent = paused
    ? "Paused. Press Resume to keep running."
    : "Space or tap = jump. Questions appear after every 30 points, or if you touch phishing.";
});

document.getElementById("restartButton").addEventListener("click", () => {
  resetGameState();
  window.location.href = "tutorial.html";
});

jumpButton.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  runnerJump();
});

runnerRow.addEventListener("pointerdown", () => {
  runnerJump();
});

window.addEventListener(
  "keydown",
  (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      event.stopPropagation();
      runnerJump();
    }
  },
  true,
);

timerId = window.setInterval(tickTimer, 1000);
frameId = requestAnimationFrame(updateRunner);
