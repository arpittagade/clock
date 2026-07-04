/* ========================================================================
   Daily Orbit Mobile — lightweight interaction layer
   Pure DOM + SVG. Optimized for Android: no pointer tracking, no heavy blur,
   no continuous background animation, and minimal layout work per tick.
   ======================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const THEME_KEY = "daily-orbit-mobile-theme";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const PARTICLE_COLORS = ["#ff6b5f", "#29c5a4", "#f8b73f", "#7568ff", "#4f8cff"];

const QUOTES = [
  "Clarity feels premium because it removes work from the user.",
  "A calm interface should guide attention without asking for attention.",
  "The best dashboard is fast first, beautiful second, and distracting never.",
  "Small progress is easier to repeat when the system stays simple.",
  "Good design protects focus by removing unnecessary motion.",
  "Today needs one clean next step, not more visual noise."
];

let els;
let clockTimer = 0;
let lastDateKey = "";
let lastQuoteIndex = -1;
let prefersReducedMotion = false;

window.addEventListener("DOMContentLoaded", init, { once: true });

function init() {
  cacheElements();
  prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;

  setupTheme();
  setGreeting();
  updateDateAndProgress();
  buildWheel();
  tickClock();
  setupWeatherDemo();
  setupStepsDemo();
  setupFocusModes();
  setupQuotes();
  setupParticles();

  clockTimer = window.setInterval(() => {
    if (document.hidden) return;
    tickClock();
    updateDateAndProgress();
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      setGreeting();
      updateDateAndProgress(true);
      buildWheelIfDateChanged();
      tickClock();
    }
  });
}

function cacheElements() {
  els = {
    root: document.documentElement,
    metaTheme: document.querySelector('meta[name="theme-color"]'),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.querySelector(".theme-icon"),
    greetingText: document.getElementById("greetingText"),
    liveDate: document.getElementById("liveDate"),
    dayProgress: document.getElementById("dayProgress"),
    dayProgressHint: document.getElementById("dayProgressHint"),
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
    focusModeLabel: document.getElementById("focusModeLabel"),
    focusNote: document.getElementById("focusNote"),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    quoteButton: document.getElementById("quoteButton"),
    quoteText: document.getElementById("quoteText")
  };
}

function setupTheme() {
  const saved = safeStorageGet(THEME_KEY);
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (systemDark ? "dark" : "light"));

  els.themeToggle.addEventListener("click", () => {
    const nextTheme = els.root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    safeStorageSet(THEME_KEY, nextTheme);
  });
}

function setTheme(theme) {
  els.root.dataset.theme = theme;
  els.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  els.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  els.metaTheme?.setAttribute("content", theme === "dark" ? "#101827" : "#eef3fb");
}

function setGreeting() {
  const hour = new Date().getHours();
  let greeting = "Hello";

  if (hour < 5) greeting = "Still awake";
  else if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  else if (hour < 21) greeting = "Good evening";
  else greeting = "Good night";

  els.greetingText.textContent = greeting;
}

function updateDateAndProgress(force = false) {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

  if (force || dateKey !== lastDateKey) {
    lastDateKey = dateKey;

    els.liveDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);

    const percent = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    const rounded = Math.round(percent);
    const minutesLeft = Math.max(0, Math.floor((end - now) / 60000));
    const hoursLeft = Math.floor(minutesLeft / 60);
    const minsLeft = minutesLeft % 60;

    els.dayProgress.textContent = `${rounded}%`;
    els.dayProgress.parentElement.style.setProperty("--progress", `${rounded}%`);
    els.dayProgressHint.textContent = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`;
  }
}

function buildWheelIfDateChanged() {
  const stored = els.wheelSvg.dataset.date;
  const now = new Date();
  const current = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  if (stored !== current) buildWheel();
}

function buildWheel() {
  const svg = els.wheelSvg;
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  svg.textContent = "";
  svg.dataset.date = dateKey;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const fragment = document.createDocumentFragment();
  fragment.appendChild(createRing({
    radius: 145,
    count: daysInMonth,
    activeIndex: now.getDate() - 1,
    color: "var(--day)",
    labels: "active",
    labelForIndex: (i) => String(i + 1).padStart(2, "0")
  }));

  fragment.appendChild(createRing({
    radius: 112,
    count: 12,
    activeIndex: now.getMonth(),
    color: "var(--month)",
    labels: "all",
    labelForIndex: (i) => MONTHS[i]
  }));

  fragment.appendChild(createRing({
    radius: 80,
    count: 7,
    activeIndex: now.getDay(),
    color: "var(--week)",
    labels: "all",
    labelForIndex: (i) => WEEKDAYS[i]
  }));

  svg.appendChild(fragment);
}

function createRing({ radius, count, activeIndex, color, labels, labelForIndex }) {
  const cx = 180;
  const cy = 180;
  const group = svgEl("g", { class: "ring" });
  const circumference = 2 * Math.PI * radius;
  const progress = (activeIndex + 1) / count;

  group.appendChild(svgEl("circle", {
    class: "ring-track",
    cx,
    cy,
    r: radius
  }));

  group.appendChild(svgEl("circle", {
    class: "ring-progress",
    cx,
    cy,
    r: radius,
    stroke: color,
    "stroke-dasharray": round(circumference),
    "stroke-dashoffset": round(circumference * (1 - progress))
  }));

  for (let i = 0; i < count; i++) {
    const active = i === activeIndex;
    const angle = (-90 + (360 / count) * i) * Math.PI / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    group.appendChild(svgEl("circle", {
      class: active ? "tick tick-active" : "tick",
      cx: round(x),
      cy: round(y),
      r: active ? 5.5 : 2.4,
      fill: active ? color : undefined
    }));

    if (labels === "all" || active) {
      const labelRadius = radius + (active ? 18 : 14);
      const label = svgEl("text", {
        class: active ? "tick-label tick-label-active" : "tick-label",
        x: round(cx + labelRadius * Math.cos(angle)),
        y: round(cy + labelRadius * Math.sin(angle)),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        fill: active ? color : undefined
      });
      label.textContent = labelForIndex(i);
      group.appendChild(label);
    }
  }

  return group;
}

function tickClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  els.secondHand.style.transform = `rotate(${secondDeg}deg)`;
  els.minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
  els.hourHand.style.transform = `rotate(${hourDeg}deg)`;

  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  els.digitalTime.textContent = `${pad(h12)}:${pad(minutes)} ${ampm}`;
}

function setupWeatherDemo() {
  const hour = new Date().getHours();
  const night = hour < 5 || hour >= 20;
  const morning = hour >= 5 && hour < 12;
  const evening = hour >= 17 && hour < 20;

  const mood = night
    ? { icon: "🌙", temp: "19°C", desc: "Calm night" }
    : morning
      ? { icon: "🌤️", temp: "23°C", desc: "Soft start" }
      : evening
        ? { icon: "🌇", temp: "24°C", desc: "Golden hour" }
        : { icon: "☀️", temp: "27°C", desc: "Bright day" };

  els.weatherIcon.textContent = mood.icon;
  els.weatherTemp.textContent = mood.temp;
  els.weatherDesc.textContent = mood.desc;
}

function setupStepsDemo() {
  const goal = 10000;
  const target = 3900 + Math.floor(Math.random() * 3600);
  const percent = Math.min(100, Math.round((target / goal) * 100));

  if (prefersReducedMotion) {
    els.stepsCount.textContent = target.toLocaleString();
    els.stepsFill.style.width = `${percent}%`;
    return;
  }

  const start = performance.now();
  const duration = 520;

  const animate = (time) => {
    const raw = Math.min(1, (time - start) / duration);
    const eased = 1 - Math.pow(1 - raw, 3);
    const value = Math.round(target * eased);

    els.stepsCount.textContent = value.toLocaleString();
    els.stepsFill.style.width = `${Math.min(100, (value / goal) * 100)}%`;

    if (raw < 1) requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

function setupFocusModes() {
  document.querySelector(".mode-row")?.addEventListener("click", (event) => {
    const button = event.target.closest(".mode-button");
    if (!button) return;

    for (const item of els.modeButtons) item.classList.toggle("active", item === button);
    els.focusModeLabel.textContent = button.dataset.mode;
    els.focusNote.textContent = button.dataset.note;
  });
}

function setupQuotes() {
  const showQuote = () => {
    let index = Math.floor(Math.random() * QUOTES.length);
    if (index === lastQuoteIndex) index = (index + 1) % QUOTES.length;
    lastQuoteIndex = index;
    els.quoteText.textContent = QUOTES[index];
  };

  showQuote();
  els.quoteButton.addEventListener("click", showQuote);
}

function setupParticles() {
  els.centerClock.addEventListener("click", () => {
    if (prefersReducedMotion) return;

    const count = 8;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 34;
      particle.className = "particle";
      particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--particle-color", PARTICLE_COLORS[i % PARTICLE_COLORS.length]);
      fragment.appendChild(particle);
    }

    els.particles.appendChild(fragment);
    window.setTimeout(() => {
      els.particles.textContent = "";
    }, 720);
  });
}

function svgEl(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    node.setAttribute(key, String(value));
  }

  return node;
}

function round(value) {
  return Number(value).toFixed(2);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_) {
    // Storage can be blocked in strict browser modes. The UI still works.
  }
}
