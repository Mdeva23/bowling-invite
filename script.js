/* ================= CONFIG ================= */
const CONFIG = {
  EMAILJS_PUBLIC_KEY: "DFLM2bR_upkVfeyQb",
  EMAILJS_SERVICE_ID: "service_3gg87ul",
  EMAILJS_TEMPLATE_ID: "template_m8k7jya",
  RECIPIENT_NAME: "SSD",
};

const isEmailJsConfigured =
  CONFIG.EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY" &&
  CONFIG.EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
  CONFIG.EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID";

if (isEmailJsConfigured && window.emailjs) {
  emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
}

/* ================= HELPERS ================= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function showScreen(id) {
  $$(".screen").forEach(el => el.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

/* ================= AMBIENT ================= */
function startAmbientLayer() {
  const layer = $("#ambient-layer");
  const symbols = ["💜", "✨", "💫", "🌟"];

  function spawn() {
    const el = document.createElement("span");
    el.className = "ambient-item";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.fontSize = `${12 + Math.random() * 16}px`;
    el.style.animationDuration = `${8 + Math.random() * 10}s`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 19000);
  }

  setInterval(spawn, 1400);
}

/* ================= ROTATING DATE-IDEA CAROUSEL ================= */
// Replaces the old bowling-only ball/pins scene now that the invite covers
// any kind of date. Icons fade in/out one at a time, staggered by CSS.
function startIdeaCarousel() {
  const scene = $("#idea-scene");
  const ideas = ["🍝", "🎬", "☕", "🎳", "🌅", "💐", "🥂", "🎡"];

  ideas.forEach((icon, i) => {
    const el = document.createElement("span");
    el.className = "idea-item";
    el.textContent = icon;
    el.style.animationDelay = `${i * (6 / ideas.length)}s`;
    scene.appendChild(el);
  });
}

/* ================= SCREEN 1: THE ASK ================= */
function initInviteScreen() {
  const noBtn = $("#no-btn");
  const yesBtn = $("#yes-btn");
  const taunt = $("#taunt-text");

  const taunts = [
    "wait... really? 🥺",
    "aowa bafana... is can't be!!!",
    "I'm emotionally unwell now",
    "I'll behave better I promise 😭",
    "hebanna this is personal now",
    "you can't reject me",
    "the universe says yes 💫",
    "try again, I dare you",
  ];

  let dodgeCount = 0;

  function moveNoButton() {
    if (!noBtn.classList.contains("dodging")) {
      noBtn.classList.add("dodging");
    }

    const rect = noBtn.getBoundingClientRect();

    const padding = 20;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    const x = padding + Math.random() * (maxX - padding);
    const y = padding + Math.random() * (maxY - padding);

    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;

    dodgeCount++;
    taunt.textContent = taunts[Math.floor(Math.random() * taunts.length)];

    const scale = Math.max(0.7, 1 - dodgeCount * 0.02);
    noBtn.style.transform = `scale(${scale})`;
  }

  ["mouseenter", "touchstart", "click"].forEach(evt => {
    noBtn.addEventListener(evt, (e) => {
      e.preventDefault();
      moveNoButton();
    });
  });

  yesBtn.addEventListener("click", () => {
    burstConfetti();
    setTimeout(() => showScreen("confirm-screen"), 400);
  });
}

/* ================= STATE ================= */
const dateState = {
  viewYear: null,
  viewMonth: null,
  selectedDate: null,
  selectedTime: null,
  selectedActivity: null,
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MAX_DAYS = 90;

/* ================= ACTIVITY PICKER ================= */
function initActivityPicker() {
  const chips = $$("#activity-chips .pill");
  const customInput = $("#custom-activity");

  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");

      if (chip.dataset.activity === "other") {
        customInput.classList.remove("hidden");
        customInput.focus();
        dateState.selectedActivity = customInput.value.trim() || null;
      } else {
        customInput.classList.add("hidden");
        dateState.selectedActivity = chip.dataset.activity;
      }
      updateSummary();
    };
  });

  customInput.addEventListener("input", () => {
    dateState.selectedActivity = customInput.value.trim() || null;
    updateSummary();
  });
}

/* ================= CALENDAR ================= */
function initCalendar() {
  const today = new Date();
  dateState.viewYear = today.getFullYear();
  dateState.viewMonth = today.getMonth();

  const weekdaysEl = $("#cal-weekdays");
  weekdaysEl.innerHTML = ["S", "M", "T", "W", "T", "F", "S"]
    .map(d => `<span>${d}</span>`).join("");

  $("#cal-prev").onclick = () => changeMonth(-1);
  $("#cal-next").onclick = () => changeMonth(1);

  renderCalendar();
}

function changeMonth(d) {
  dateState.viewMonth += d;
  if (dateState.viewMonth < 0) {
    dateState.viewMonth = 11;
    dateState.viewYear--;
  } else if (dateState.viewMonth > 11) {
    dateState.viewMonth = 0;
    dateState.viewYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const grid = $("#cal-grid");
  grid.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const max = new Date(today);
  max.setDate(max.getDate() + MAX_DAYS);

  const first = new Date(dateState.viewYear, dateState.viewMonth, 1);
  const start = first.getDay();
  const days = new Date(dateState.viewYear, dateState.viewMonth + 1, 0).getDate();

  $("#cal-month-label").textContent =
    `${MONTHS[dateState.viewMonth]} ${dateState.viewYear}`;

  for (let i = 0; i < start; i++) {
    const empty = document.createElement("span");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= days; d++) {
    const date = new Date(dateState.viewYear, dateState.viewMonth, d);

    const btn = document.createElement("button");
    btn.className = "cal-day";
    btn.textContent = d;

    const isPast = date < today;
    const isFuture = date > max;

    if (isPast || isFuture) {
      btn.disabled = true;
      btn.classList.add("disabled");
    } else {
      btn.onclick = () => {
        dateState.selectedDate = date;
        renderCalendar();
        updateSummary();
      };
    }

    if (
      dateState.selectedDate &&
      date.toDateString() === dateState.selectedDate.toDateString()
    ) {
      btn.classList.add("selected");
    }

    grid.appendChild(btn);
  }

  const isAtCurrentMonth =
    dateState.viewYear === today.getFullYear() && dateState.viewMonth === today.getMonth();
  $("#cal-prev").disabled = isAtCurrentMonth;
}

/* ================= TIME PICKER ================= */
function initTimePicker() {
  const pills = $$("#time-pills .pill");
  const custom = $("#custom-time");

  pills.forEach(p => {
    p.onclick = () => {
      pills.forEach(x => x.classList.remove("selected"));
      p.classList.add("selected");

      if (p.dataset.time === "other") {
        custom.classList.remove("hidden");
        dateState.selectedTime = null;
      } else {
        custom.classList.add("hidden");
        custom.value = "";
        dateState.selectedTime = p.dataset.time;
      }

      updateSummary();
    };
  });

  custom.addEventListener("input", () => {
    if (!custom.value) {
      dateState.selectedTime = null;
      updateSummary();
      return;
    }

    let [h, m] = custom.value.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = ((h + 11) % 12) + 1;

    dateState.selectedTime = `${h}:${String(m).padStart(2, "0")} ${ampm}`;
    updateSummary();
  });
}

/* ================= SUMMARY ================= */
function updateSummary() {
  const el = $("#selection-summary");
  const btn = $("#submit-btn");

  const ready = !!(dateState.selectedDate && dateState.selectedTime && dateState.selectedActivity);

  if (dateState.selectedDate && dateState.selectedTime) {
    const formatted = dateState.selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const activityPart = dateState.selectedActivity ? `${dateState.selectedActivity} — ` : "";
    el.textContent = `${activityPart}${formatted} at ${dateState.selectedTime} 💜`;
  } else {
    el.textContent = "";
  }

  btn.disabled = !ready;
}

/* ================= SUBMIT ================= */
function initSubmit() {
  $("#submit-btn").addEventListener("click", async () => {
    if (!dateState.selectedDate || !dateState.selectedTime || !dateState.selectedActivity) return;

    const btn = $("#submit-btn");
    const status = $("#send-status");

    btn.disabled = true;
    btn.textContent = "Sending...";

    const formattedDate = dateState.selectedDate.toDateString();
    const note = $("#note")?.value.trim() || "(none)";

    const payload = {
      to_name: CONFIG.RECIPIENT_NAME,
      activity: dateState.selectedActivity,
      chosen_date: formattedDate,
      chosen_time: dateState.selectedTime,
      note,
    };

    try {
      if (isEmailJsConfigured && window.emailjs) {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, payload);
      } else {
        console.info("[Date Invite] EmailJS not configured yet. Selection was:", payload);
        status.textContent = "(Demo mode: email not sent — see README to enable sending.)";
      }
      showThankYou(formattedDate);
    } catch (err) {
      console.error("EmailJS send failed:", err);
      status.textContent = "Hmm, that didn't send. Mind trying again?";
      btn.disabled = false;
      btn.textContent = "Confirm Our Date 💜";
    }
  });
}

/* ================= THANK YOU + COUNTDOWN ================= */
let countdownInterval = null;

function showThankYou(dateStr) {
  const activity = dateState.selectedActivity;
  $("#thankyou-details").textContent = `${activity} — ${dateStr} at ${dateState.selectedTime}`;

  showScreen("thankyou-screen");
  burstConfetti();
  startCountdown();
}

function startCountdown() {
  const el = $("#thankyou-countdown");
  if (countdownInterval) clearInterval(countdownInterval);

  const target = buildTargetDate();
  if (!target) return;

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      el.textContent = "It's today! 🎉";
      clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    el.textContent = `⏳ ${days}d ${hours}h ${mins}m to go`;
  }

  tick();
  countdownInterval = setInterval(tick, 60000);
}

// Parses dateState.selectedDate + selectedTime ("4:30 PM") into a real Date object.
function buildTargetDate() {
  if (!dateState.selectedDate || !dateState.selectedTime) return null;

  const match = dateState.selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let [, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  const target = new Date(dateState.selectedDate);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

/* ================= ADD TO CALENDAR (.ics) ================= */
function initIcsButton() {
  $("#ics-btn").addEventListener("click", () => {
    const start = buildTargetDate();
    if (!start) return;

    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2hr duration
    const toIcsDate = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const note = $("#note")?.value.trim() || "";
    const summary = `Date: ${dateState.selectedActivity || "Our Date"}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Date Invite//EN",
      "BEGIN:VEVENT",
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${note.replace(/\n/g, "\\n")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "our-date.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/* ================= CONFETTI ================= */
let confettiRunning = false;

function burstConfetti() {
  if (confettiRunning) return;
  confettiRunning = true;

  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const glyphs = ["💜", "✨", "💫", "🩷", "⭐"];

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -200,
    vx: -1 + Math.random() * 2,
    vy: 2 + Math.random() * 3,
    life: 0,
    max: 120 + Math.random() * 40,
    glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    size: 16 + Math.random() * 10,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      if (p.life > p.max) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      ctx.font = `${p.size}px sans-serif`;
      ctx.fillText(p.glyph, p.x, p.y);
    }

    if (alive) requestAnimationFrame(animate);
    else confettiRunning = false;
  }

  animate();
}

window.addEventListener("resize", () => {
  const canvas = $("#confetti-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  startAmbientLayer();
  startIdeaCarousel();
  initInviteScreen();
  initActivityPicker();
  initCalendar();
  initTimePicker();
  initSubmit();
  initIcsButton();
});