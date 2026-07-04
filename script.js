/* ========================================================================
   Daily Orbit — Premium interaction layer
   Pure DOM + SVG. No external libraries required.
   ======================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

const THEME_KEY = "daily-orbit-theme";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const PARTICLE_COLORS = ["#ff6b5f", "#2ac7a5", "#ffb844", "#7568ff", "#4f8cff"];

const QUOTES = [
  "Design the day like a system: remove noise, protect energy, execute the next useful step.",
  "A premium experience is not decoration. It is clarity, restraint, speed, and feedback.",
  "Small movements compound when the interface keeps attention instead of stealing it.",
  "Your next hour does not need more pressure. It needs a cleaner start.",
  "The best rhythm is visible enough to guide you and quiet enough to stay out of the way.",
  "A beautiful dashboard should make the right action feel obvious.",
  "Protect focus first. Everything else becomes easier to organize."
];

const SELECTORS = {
  root: document.documentElement,
  liveDate: document.getElementById("liveDate"),
  themeToggle: document.getElementById("themeToggle"),
  greeting: document.getElementById("greetingText"),
  dayProgress: document.getElementById("dayProgress"),
  dayProgressHint: document.getElementById("dayProgressHint"),
  focusModeLabel: document.getElementById("focusModeLabel"),
  wheelSvg: document.getElementById("wheelSvg"),
  hourHand: document.getElementById("hourHand"),
  minuteHand: document.getElementById("minuteHand"),
  secondHand: document.getElementById("secondHand"),
  digitalTime: document.getElementById("digitalTime"),
  centerClock: document.getElementById("centerClock"),
  particles: document.getElementById("particles"),
  weatherIcon: document.getElementById("weatherIcon"),
  weatherTemp: document.getElementById("weatherTemp"),
  weatherDesc: document.getElementById("weatherDesc"),
  stepsCount: document.getElementById("stepsCount"),
  stepsFill: document.getElementById("stepsFill"),
  quoteButton: document.getElementById("quoteButton"),
  quoteText: document.getElementById("quoteText"),
  focusNote: document.getElementById("focusNote")
};

let lastQuoteIndex = -1;
let clockTimer;
let progressTimer;

document.addEventListener("DOMContentLoaded", init);

function init() {
  applySavedTheme();
  setGreeting();
  updateLiveDate();
  buildWheel();
  startClock();
  startDayProgress();
  setupWeatherDemo();
  setupStepsDemo();
  setupQuotes();
  setupThemeToggle();
  setupFocusModes();
  setupParticles();
  setupPointerGlow();

  setInterval(updateLiveDate, 60 * 1000);
  window.addEventListener("beforeunload", () => {
    clearInterval(clockTimer);
    clearInterval(progressTimer);
  });
}

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  setTheme(theme);
}

function setupThemeToggle() {
  SELECTORS.themeToggle.addEventListener("click", () => {
    const next = SELECTORS.root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

function setTheme(theme) {
  SELECTORS.root.dataset.theme = theme;
  SELECTORS.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  const color = theme === "dark" ? "#101827" : "#eaf0fb";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
}

function setGreeting() {
  const hour = new Date().getHours();
  let text = "Hello";
  if (hour < 5) text = "Still awake";
  else if (hour < 12) text = "Good morning";
  else if (hour < 17) text = "Good afternoon";
  else if (hour < 21) text = "Good evening";
  else text = "Good night";
  SELECTORS.greeting.textContent = text;
}

function updateLiveDate() {
  const now = new Date();
  SELECTORS.liveDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function startDayProgress() {
  const update = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);

    const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    SELECTORS.dayProgress.textContent = `${Math.round(progress)}%`;
    SELECTORS.dayProgressHint.textContent = `${formatDuration(end - now)} left today`;
  };

  update();
  progressTimer = setInterval(update, 30 * 1000);
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function buildWheel() {
  const svg = SELECTORS.wheelSvg;
  svg.textContent = "";

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayIndex = now.getDate() - 1;
  const monthIndex = now.getMonth();
  const weekdayIndex = now.getDay();

  createRing(svg, {
    radius: 218,
    count: daysInMonth,
    currentIndex: dayIndex,
    color: "var(--coral)",
    showAllLabels: false,
    labelOffset: 25,
    labelForIndex: (i) => String(i + 1).padStart(2, "0"),
    startDelay: 420
  });

  createRing(svg, {
    radius: 171,
    count: 12,
    currentIndex: monthIndex,
    color: "var(--mint)",
    showAllLabels: true,
    labelOffset: 20,
    labelForIndex: (i) => MONTHS[i],
    startDelay: 210
  });

  createRing(svg, {
    radius: 124,
    count: 7,
    currentIndex: weekdayIndex,
    color: "var(--marigold)",
    showAllLabels: true,
    labelOffset: 19,
    labelForIndex: (i) => WEEKDAYS[i],
    startDelay: 0
  });
}

function createRing(svg, options) {
  const cx = 260;
  const cy = 260;
  const {
    radius,
    count,
    currentIndex,
    color,
    showAllLabels,
    labelOffset,
    labelForIndex,
    startDelay
  } = options;

  const group = createSvgElement("g", { class: "ring" });
  const circumference = 2 * Math.PI * radius;
  const progress = (currentIndex + 1) / count;

  const track = createSvgElement("circle", {
    cx,
    cy,
    r: radius,
    class: "ring-track"
  });

  const arc = createSvgElement("circle", {
    cx,
    cy,
    r: radius,
    class: "ring-progress",
    stroke: color,
    "stroke-dasharray": circumference.toFixed(2),
    "stroke-dashoffset": (circumference * (1 - progress)).toFixed(2)
  });
  arc.style.color = color;

  group.append(track, arc);

  for (let i = 0; i < count; i++) {
    const isCurrent = i === currentIndex;
    const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const delay = startDelay + i * 14;

    const dot = createSvgElement("circle", {
      cx: x,
      cy: y,
      r: isCurrent ? 7 : 3.2,
      fill: isCurrent ? color : "rgba(128, 145, 178, 0.35)",
      class: `tick${isCurrent ? " tick-active" : ""}`
    });
    dot.style.color = color;
    dot.style.animationDelay = `${delay}ms`;
    group.appendChild(dot);

    if (isCurrent || showAllLabels) {
      const offset = isCurrent ? labelOffset + 8 : labelOffset;
      const label = createSvgElement("text", {
        x: cx + (radius + offset) * Math.cos(angle),
        y: cy + (radius + offset) * Math.sin(angle),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        class: `tick-label${isCurrent ? " tick-label-active" : ""}`
      });
      label.style.fill = isCurrent ? color : "var(--text-faint)";
      label.style.animationDelay = `${delay}ms`;
      label.textContent = labelForIndex(i);
      group.appendChild(label);
    }
  }

  svg.appendChild(group);
}

function createSvgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function startClock() {
  const tick = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    const secondsDeg = (seconds + milliseconds / 1000) * 6;
    const minutesDeg = minutes * 6 + seconds * 0.1;
    const hoursDeg = (hours % 12) * 30 + minutes * 0.5;

    SELECTORS.secondHand.style.transform = `rotate(${secondsDeg}deg)`;
    SELECTORS.minuteHand.style.transform = `rotate(${minutesDeg}deg)`;
    SELECTORS.hourHand.style.transform = `rotate(${hoursDeg}deg)`;

    const h12 = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    SELECTORS.digitalTime.textContent = `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${ampm}`;
  };

  tick();
  clockTimer = setInterval(tick, 1000);
}

function setupWeatherDemo() {
  const hour = new Date().getHours();
  const scenarios = [
    { min: 5, max: 11, icon: "🌤️", temp: "21°C", desc: "Soft morning clarity" },
    { min: 11, max: 16, icon: "☀️", temp: "27°C", desc: "Bright and energetic" },
    { min: 16, max: 19, icon: "🌇", temp: "24°C", desc: "Golden hour focus" },
    { min: 19, max: 24, icon: "🌙", temp: "19°C", desc: "Calm evening mode" },
    { min: 0, max: 5, icon: "🌌", temp: "17°C", desc: "Quiet midnight glass" }
  ];

  const current = scenarios.find((item) => hour >= item.min && hour < item.max) || scenarios[1];
  SELECTORS.weatherIcon.textContent = current.icon;
  SELECTORS.weatherTemp.textContent = current.temp;
  SELECTORS.weatherDesc.textContent = current.desc;
}

function setupStepsDemo() {
  const goal = 10000;
  const now = new Date();
  const seed = now.getDate() * 431 + now.getMonth() * 97 + now.getHours() * 31;
  const targetSteps = 4200 + (seed % 4100);
  const duration = 1300;
  const start = performance.now();

  const animate = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(targetSteps * eased);
    SELECTORS.stepsCount.textContent = current.toLocaleString();
    SELECTORS.stepsFill.style.width = `${Math.min((current / goal) * 100, 100)}%`;

    if (progress < 1) requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function setupQuotes() {
  SELECTORS.quoteButton.addEventListener("click", showRandomQuote);
  showRandomQuote();
}

function showRandomQuote() {
  let index = Math.floor(Math.random() * QUOTES.length);
  if (index === lastQuoteIndex) index = (index + 1) % QUOTES.length;
  lastQuoteIndex = index;

  SELECTORS.quoteText.style.animation = "none";
  void SELECTORS.quoteText.offsetWidth;
  SELECTORS.quoteText.textContent = QUOTES[index];
  SELECTORS.quoteText.style.animation = "";
}

function setupFocusModes() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      SELECTORS.focusModeLabel.textContent = button.dataset.mode;
      SELECTORS.focusNote.textContent = button.dataset.tone;
    });
  });
}

function setupParticles() {
  const burst = () => {
    const count = 22;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = "particle";

      const angle = Math.random() * Math.PI * 2;
      const distance = 72 + Math.random() * 110;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = `${Math.random() * 360 - 180}deg`;
      const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];

      particle.style.setProperty("--tx", `${tx}px`);
      particle.style.setProperty("--ty", `${ty}px`);
      particle.style.setProperty("--rot", rot);
      particle.style.setProperty("--particle-color", color);
      particle.style.animationDelay = `${Math.random() * 90}ms`;

      SELECTORS.particles.appendChild(particle);
      window.setTimeout(() => particle.remove(), 1200);
    }
  };

  SELECTORS.centerClock.addEventListener("click", burst);
}

function setupPointerGlow() {
  const supportsFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (!supportsFinePointer) return;

  let frame = null;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 4;

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;

    if (frame) return;
    frame = requestAnimationFrame(() => {
      SELECTORS.root.style.setProperty("--cursor-x", `${x}px`);
      SELECTORS.root.style.setProperty("--cursor-y", `${y}px`);
      frame = null;
    });
  });
}
