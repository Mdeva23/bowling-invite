const CONFIG = {
  EMAILJS_PUBLIC_KEY: "YOUR_PUBLIC_KEY",
  EMAILJS_SERVICE_ID: "YOUR_SERVICE_ID",
  EMAILJS_TEMPLATE_ID: "YOUR_TEMPLATE_ID",
  RECIPIENT_NAME: "David",
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
  $$(".screen").forEach((el) => el.classList.remove("active"));
  const target = $(`#${id}`);
  if (target) target.classList.add("active");
}

/* ================= AMBIENT ================= */
function startAmbientLayer() {
  const layer = $("#ambient-layer");
  const symbols = ["💜", "✨", "🎳", "💫"];

  function spawn() {
    const item = document.createElement("span");
    item.className = "ambient-item";
    item.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    item.style.left = `${Math.random() * 100}vw`;
    item.style.fontSize = `${12 + Math.random() * 16}px`;
    item.style.animationDuration = `${8 + Math.random() * 10}s`;
    layer.appendChild(item);
    setTimeout(() => item.remove(), 12000);
  }

  setInterval(spawn, 1400);
}

/* ================= SCREEN 1 ================= */
function initInviteScreen() {
  const noBtn = $("#no-btn");
  const yesBtn = $("#yes-btn");
  const taunt = $("#taunt-text");

  const taunts = [
    "nice try 😏",
    "not happening, cutie",
    "you can't escape this 🎳",
    "the pins demand YES",
    "I'll just keep moving 💨",
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

  ["mouseenter", "touchstart", "click"].forEach((evt) => {
    noBtn.addEventListener(evt, (e) => {
      e.preventDefault();
      moveNoButton();
    });
  });

  yesBtn.addEventListener("click", () => {
    burstConfetti();
    setTimeout(() => showScreen("confirm-screen"), 400);
  });

  window.addEventListener("resize", () => {
    if (!noBtn.classList.contains("dodging")) return;

    const rect = noBtn.getBoundingClientRect();
    noBtn.style.left = `${Math.min(rect.left, window.innerWidth - rect.width - 20)}px`;
    noBtn.style.top = `${Math.min(rect.top, window.innerHeight - rect.height - 20)}px`;
  });
}

/* ================= CALENDAR ================= */
const dateState = {
  viewYear: null,
  viewMonth: null,
  selectedDate: null,
  selectedTime: null,
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const MAX_DAYS = 90;

function initCalendar() {
  const today = new Date();
  dateState.viewYear = today.getFullYear();
  dateState.viewMonth = today.getMonth();

  $("#cal-prev").onclick = () => changeMonth(-1);
  $("#cal-next").onclick = () => changeMonth(1);

  renderCalendar();
}

function changeMonth(d) {
  dateState.viewMonth += d;
  if (dateState.viewMonth < 0) {
    dateState.viewMonth = 11;
    dateState.viewYear--;
  }
  if (dateState.viewMonth > 11) {
    dateState.viewMonth = 0;
    dateState.viewYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const grid = $("#cal-grid");
  grid.innerHTML = "";

  const today = new Date();
  today.setHours(0,0,0,0);

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
    const isFutureLimit = date > max;

    if (isPast || isFutureLimit) {
      btn.disabled = true;
      btn.classList.add("disabled");
    } else {
      btn.onclick = () => {
        dateState.selectedDate = date;
        renderCalendar();
        updateSummary();
      };
    }

    if (dateState.selectedDate &&
        date.toDateString() === dateState.selectedDate.toDateString()) {
      btn.classList.add("selected");
    }

    grid.appendChild(btn);
  }

  $("#cal-prev").disabled =
    dateState.viewYear === today.getFullYear() &&
    dateState.viewMonth === today.getMonth();
}

/* ================= TIME ================= */
function initTimePicker() {
  const pills = $$(".pill");
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
        dateState.selectedTime = p.dataset.time;
      }

      updateSummary();
    };
  });

  custom.oninput = () => {
    if (!custom.value) return;

    let [h,m] = custom.value.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = ((h + 11) % 12) + 1;

    dateState.selectedTime = `${h}:${String(m).padStart(2,"0")} ${ampm}`;
    updateSummary();
  };
}

function updateSummary() {
  const el = $("#selection-summary");
  const btn = $("#submit-btn");

  if (dateState.selectedDate && dateState.selectedTime) {
    el.textContent = "Perfect 💜 ready to lock it in";
    btn.disabled = false;
  } else {
    el.textContent = "";
    btn.disabled = true;
  }
}

/* ================= SUBMIT ================= */
function initSubmit() {
  $("#submit-btn").onclick = async () => {
    const status = $("#send-status");
    const btn = $("#submit-btn");

    btn.disabled = true;
    btn.textContent = "Sending...";

    const payload = {
      to_name: CONFIG.RECIPIENT_NAME,
      date: dateState.selectedDate.toDateString(),
      time: dateState.selectedTime,
      note: $("#note").value || "(none)",
    };

    try {
      if (isEmailJsConfigured && window.emailjs) {
        await emailjs.send(
          CONFIG.EMAILJS_SERVICE_ID,
          CONFIG.EMAILJS_TEMPLATE_ID,
          payload
        );
      } else {
        console.log("Demo payload:", payload);
      }

      showScreen("thankyou-screen");
      $("#thankyou-details").textContent =
        `${payload.date} at ${payload.time}`;
      burstConfetti();

    } catch (e) {
      status.textContent = "Try again 💜";
      btn.disabled = false;
      btn.textContent = "Confirm Our Date 💜";
    }
  };
}

/* ================= CONFETTI ================= */
let confettiRunning = false;

function burstConfetti() {
  if (confettiRunning) return;
  confettiRunning = true;

  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  const items = ["💜","✨","🎳","💫","🩷"];

  const particles = Array.from({length:50}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*-200,
    vx: -1 + Math.random()*2,
    vy: 2 + Math.random()*3,
    life: 0,
    max: 120 + Math.random()*40,
    glyph: items[Math.floor(Math.random()*items.length)],
    size: 16 + Math.random()*10
  }));

  function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

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

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  startAmbientLayer();
  initInviteScreen();
  initCalendar();
  initTimePicker();
  initSubmit();
});