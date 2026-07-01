/* =========================================================================
   CONFIGURATION
   Fill these in with your own EmailJS values (see README.md for setup).
   Until you do, the site still works end-to-end — it just won't actually
   email you, and will log the selection to the browser console instead.
   ========================================================================= */
const CONFIG = {
  EMAILJS_PUBLIC_KEY: "YOUR_PUBLIC_KEY",   // EmailJS "Public Key" (Account > API Keys)
  EMAILJS_SERVICE_ID: "YOUR_SERVICE_ID",   // EmailJS Email Service ID
  EMAILJS_TEMPLATE_ID: "YOUR_TEMPLATE_ID", // EmailJS Email Template ID
  RECIPIENT_NAME: "David",                 // Shown in the confirmation email, if your template uses it
};

const isEmailJsConfigured =
  CONFIG.EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY" &&
  CONFIG.EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
  CONFIG.EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID";

if (isEmailJsConfigured && window.emailjs) {
  emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
}

/* =========================================================================
   SMALL HELPERS
   ========================================================================= */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function showScreen(id) {
  $$(".screen").forEach((el) => el.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

/* =========================================================================
   AMBIENT FLOATING HEARTS / SPARKLES (background decoration)
   ========================================================================= */
function startAmbientLayer() {
  const layer = $("#ambient-layer");
  const symbols = ["💜", "✨", "🎳", "💫"];

  function spawn() {
    const item = document.createElement("span");
    item.className = "ambient-item";
    item.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    item.style.left = `${Math.random() * 100}vw`;
    item.style.fontSize = `${12 + Math.random() * 16}px`;
    const duration = 8 + Math.random() * 10;
    item.style.animationDuration = `${duration}s`;
    layer.appendChild(item);
    setTimeout(() => item.remove(), duration * 1000);
  }

  // Seed a few immediately, then keep a steady trickle going.
  for (let i = 0; i < 6; i++) setTimeout(spawn, i * 700);
  setInterval(spawn, 1400);
}

/* =========================================================================
   SCREEN 1 — THE PLAYFUL "NO" BUTTON
   ========================================================================= */
function initInviteScreen() {
  const noBtn = $("#no-btn");
  const yesBtn = $("#yes-btn");
  const taunt = $("#taunt-text");
  const buttonRow = $(".button-row");

  const taunts = [
    "nice try 😏",
    "not happening, cutie",
    "the ball says yes 🔮",
    "you can't catch this button",
    "come on, you know you want to",
    "the pins are ready and waiting 🎳",
    "I'll just keep moving 💨",
  ];

  const subtexts = [
    "no pressure... but I already booked the lane in my heart 💜",
    "there's only one right answer here 👀",
    "psst, click yes, the pins are waiting",
    "I promise to let you win at least once 😉",
  ];

  let dodgeCount = 0;
  let subtextIndex = 0;

  function cycleSubtext() {
    subtextIndex = (subtextIndex + 1) % subtexts.length;
    $("#cute-subtext").textContent = subtexts[subtextIndex];
  }
  setInterval(cycleSubtext, 4200);

  function moveNoButton() {
    // Once "dodging", the button becomes fixed-position so it can roam
    // the whole viewport rather than being confined to the button row.
    if (!noBtn.classList.contains("dodging")) {
      noBtn.classList.add("dodging");
    }

    const btnWidth = noBtn.offsetWidth || 100;
    const btnHeight = noBtn.offsetHeight || 50;
    const padding = 24;

    const maxX = window.innerWidth - btnWidth - padding;
    const maxY = window.innerHeight - btnHeight - padding;

    const newX = Math.max(padding, Math.random() * maxX);
    const newY = Math.max(padding, Math.random() * maxY);

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;

    dodgeCount += 1;
    taunt.textContent = taunts[Math.floor(Math.random() * taunts.length)];

    // After enough teasing, let the "No" button shrink a little each time —
    // purely playful, it never actually disappears or breaks the layout.
    const scale = Math.max(0.72, 1 - dodgeCount * 0.02);
    noBtn.style.transform = `scale(${scale})`;
  }

  // Desktop: dodge on hover/mouse approach.
  noBtn.addEventListener("mouseenter", moveNoButton);

  // Mobile: there's no hover, so dodge on touchstart (fires before the
  // click), and prevent the click from ever registering as a real tap.
  noBtn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      moveNoButton();
    },
    { passive: false }
  );

  // Safety net: if a click ever does land, still don't let it "succeed" —
  // just dodge again with a cheeky message.
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    moveNoButton();
  });

  // If the window resizes while the button is off dodging, keep it on-screen.
  window.addEventListener("resize", () => {
    if (noBtn.classList.contains("dodging")) {
      const rect = noBtn.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 16;
      const maxY = window.innerHeight - rect.height - 16;
      noBtn.style.left = `${Math.min(rect.left, Math.max(16, maxX))}px`;
      noBtn.style.top = `${Math.min(rect.top, Math.max(16, maxY))}px`;
    }
  });

  yesBtn.addEventListener("click", () => {
    burstConfetti();
    setTimeout(() => {
      showScreen("confirm-screen");
    }, 500);
  });
}

/* =========================================================================
   SCREEN 2 — CALENDAR + TIME PICKER
   ========================================================================= */
const dateState = {
  viewYear: null,
  viewMonth: null, // 0-indexed
  selectedDate: null, // Date object
  selectedTime: null, // string label, e.g. "4:30 PM"
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// How far into the future she's allowed to pick a date.
const MAX_DAYS_AHEAD = 90;

function initCalendar() {
  const today = new Date();
  dateState.viewYear = today.getFullYear();
  dateState.viewMonth = today.getMonth();

  const weekdaysEl = $("#cal-weekdays");
  weekdaysEl.innerHTML = WEEKDAY_LABELS.map((d) => `<span>${d}</span>`).join("");

  $("#cal-prev").addEventListener("click", () => changeMonth(-1));
  $("#cal-next").addEventListener("click", () => changeMonth(1));

  renderCalendar();
}

function changeMonth(delta) {
  dateState.viewMonth += delta;
  if (dateState.viewMonth < 0) {
    dateState.viewMonth = 11;
    dateState.viewYear -= 1;
  } else if (dateState.viewMonth > 11) {
    dateState.viewMonth = 0;
    dateState.viewYear += 1;
  }
  renderCalendar();
}

function renderCalendar() {
  const { viewYear, viewMonth } = dateState;
  $("#cal-month-label").textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const grid = $("#cal-grid");
  grid.innerHTML = "";

  // Leading empty cells so day 1 lands on the correct weekday column.
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("span");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewYear, viewMonth, day);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-day";
    cell.textContent = day;

    const isPast = cellDate < today;
    const isTooFar = cellDate > maxDate;
    const isToday = cellDate.getTime() === today.getTime();
    const isSelected =
      dateState.selectedDate &&
      cellDate.getTime() === dateState.selectedDate.getTime();

    if (isToday) cell.classList.add("today");
    if (isSelected) cell.classList.add("selected");

    if (isPast || isTooFar) {
      cell.classList.add("disabled");
      cell.disabled = true;
    } else {
      cell.addEventListener("click", () => {
        dateState.selectedDate = cellDate;
        renderCalendar();
        updateSelectionSummary();
      });
    }

    grid.appendChild(cell);
  }

  // Disable "previous month" once we're back at the current month.
  const isAtCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  $("#cal-prev").disabled = isAtCurrentMonth;
}

function initTimePicker() {
  const pills = $$(".pill");
  const customInput = $("#custom-time");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");

      if (pill.dataset.time === "other") {
        customInput.classList.remove("hidden");
        customInput.focus();
        dateState.selectedTime = null; // wait for the custom input
      } else {
        customInput.classList.add("hidden");
        dateState.selectedTime = pill.dataset.time;
      }
      updateSelectionSummary();
    });
  });

  customInput.addEventListener("input", () => {
    if (customInput.value) {
      const [hours, minutes] = customInput.value.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = ((hours + 11) % 12) + 1;
      dateState.selectedTime = `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
    } else {
      dateState.selectedTime = null;
    }
    updateSelectionSummary();
  });
}

function updateSelectionSummary() {
  const summary = $("#selection-summary");
  const submitBtn = $("#submit-btn");

  if (dateState.selectedDate && dateState.selectedTime) {
    const formatted = dateState.selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    summary.textContent = `${formatted} at ${dateState.selectedTime} — perfect 💜`;
    submitBtn.disabled = false;
  } else if (dateState.selectedDate) {
    summary.textContent = "Now just pick a time...";
    submitBtn.disabled = true;
  } else {
    summary.textContent = "";
    submitBtn.disabled = true;
  }
}

/* =========================================================================
   SUBMIT — SEND THE SELECTION (EmailJS, no backend required)
   ========================================================================= */
function initSubmit() {
  $("#submit-btn").addEventListener("click", async () => {
    if (!dateState.selectedDate || !dateState.selectedTime) return;

    const submitBtn = $("#submit-btn");
    const statusEl = $("#send-status");
    const note = $("#note").value.trim();

    const formattedDate = dateState.selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending... 💌";
    statusEl.textContent = "";

    const payload = {
      to_name: CONFIG.RECIPIENT_NAME,
      chosen_date: formattedDate,
      chosen_time: dateState.selectedTime,
      note: note || "(no note left)",
    };

    try {
      if (isEmailJsConfigured && window.emailjs) {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, payload);
      } else {
        // EmailJS isn't configured yet — log so you can still see it worked
        // during local testing, and let the person know gently.
        console.info("[Bowling Invite] EmailJS is not configured yet. Selection was:", payload);
        statusEl.textContent = "(Demo mode: email not sent — see README to enable sending.)";
      }

      showThankYou(formattedDate);
    } catch (err) {
      console.error("EmailJS send failed:", err);
      statusEl.textContent = "Hmm, that didn't send. Mind trying again in a moment?";
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm Our Date 💜";
    }
  });
}

function showThankYou(formattedDate) {
  $("#thankyou-details").textContent = `${formattedDate} at ${dateState.selectedTime}. It's officially on the calendar.`;
  showScreen("thankyou-screen");
  burstConfetti();
  setTimeout(burstConfetti, 400);
}

/* =========================================================================
   CONFETTI (hearts + sparkles + tiny bowling pins)
   ========================================================================= */
function burstConfetti() {
  const canvas = $("#confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const glyphs = ["💜", "✨", "🎳", "💫", "🩷"];
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.3,
    vy: 2 + Math.random() * 3,
    vx: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
    size: 14 + Math.random() * 16,
    glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    life: 0,
    maxLife: 140 + Math.random() * 60,
  }));

  let frame = 0;
  function animate() {
    frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allDone = true;
    particles.forEach((p) => {
      if (p.life > p.maxLife) return;
      allDone = false;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life += 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.font = `${p.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    });

    if (!allDone && frame < 400) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  const canvas = $("#confetti-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* =========================================================================
   INIT
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  startAmbientLayer();
  initInviteScreen();
  initCalendar();
  initTimePicker();
  initSubmit();
});
