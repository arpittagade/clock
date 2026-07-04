/* ==========================================================================
   Daily Orbit — script.js
   No external libraries required. Pure DOM + SVG.
   ========================================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";

const COLORS = {
  coral: "#ff6b5b",
  mint: "#2fc9ae",
  marigold: "#ffb648",
  track: "#c7d0e0",
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

document.addEventListener("DOMContentLoaded", () => {
  setGreeting();
  buildWheel();
  startClock();
  setupWeatherDemo();
  setupStepsDemo();
  setupQuotes();
  setupConfetti();
  updateLiveDateChip();
  setInterval(updateLiveDateChip, 60 * 1000);
});

/* ---------------------------------------------------------------------- */
/* Greeting + date chip                                                    */
/* ---------------------------------------------------------------------- */

function setGreeting() {
  const el = document.getElementById("greetingText");
  const hour = new Date().getHours();
  let text;
  if (hour < 5) text = "Still up? Good night 🌙";
  else if (hour < 12) text = "Good morning ☀️";
  else if (hour < 17) text = "Good afternoon 🌤️";
  else if (hour < 21) text = "Good evening 🌆";
  else text = "Good night 🌙";
  el.textContent = text;
}

function updateLiveDateChip() {
  const el = document.getElementById("liveDate");
  const now = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

/* ---------------------------------------------------------------------- */
/* Circular calendar wheel (SVG)                                           */
/* ---------------------------------------------------------------------- */

function buildWheel() {
  const svg = document.getElementById("wheelSvg");
  const cx = 240;
  const cy = 240;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayIndex = now.getDate() - 1; // 0-based
  const monthIndex = now.getMonth(); // 0-11
  const weekdayIndex = now.getDay(); // 0-6, 0 = Sunday

  // Outer ring: day of month
  createRing(svg, {
    cx, cy,
    radius: 205,
    count: daysInMonth,
    currentIndex: dayIndex,
    color: COLORS.coral,
    showAllLabels: false,
    labelOffset: 24,
    labelForIndex: (i) => String(i + 1).padStart(2, "0"),
    startDelay: 500,
  });

  // Middle ring: month
  createRing(svg, {
    cx, cy,
    radius: 158,
    count: 12,
    currentIndex: monthIndex,
    color: COLORS.mint,
    showAllLabels: true,
    labelOffset: 18,
    labelForIndex: (i) => MONTHS[i],
    startDelay: 250,
  });

  // Inner ring: weekday
  createRing(svg, {
    cx, cy,
    radius: 112,
    count: 7,
    currentIndex: weekdayIndex,
    color: COLORS.marigold,
    showAllLabels: true,
    labelOffset: 16,
    labelForIndex: (i) => WEEKDAYS[i],
    startDelay: 0,
  });
}

function createRing(svg, opts) {
  const {
    cx, cy, radius, count, currentIndex, color,
    showAllLabels, labelOffset, labelForIndex, startDelay,
  } = opts;

  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "ring");

  // guide track
  const track = document.createElementNS(SVG_NS, "circle");
  track.setAttribute("cx", cx);
  track.setAttribute("cy", cy);
  track.setAttribute("r", radius);
  track.setAttribute("class", "ring-track");
  group.appendChild(track);

  for (let i = 0; i < count; i++) {
    const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const isCurrent = i === currentIndex;
    const delay = startDelay + i * 16;

    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", isCurrent ? 7 : 3);
    dot.setAttribute("fill", isCurrent ? color : "rgba(124,138,166,0.35)");
    dot.setAttribute("class", "tick" + (isCurrent ? " tick-active" : ""));
    dot.style.color = color;
    dot.style.animationDelay = delay + "ms";
    group.appendChild(dot);

    if (isCurrent || showAllLabels) {
      const off = isCurrent ? labelOffset + 6 : labelOffset;
      const lx = cx + (radius + off) * Math.cos(angle);
      const ly = cy + (radius + off) * Math.sin(angle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", lx);
      label.setAttribute("y", ly);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("class", "tick-label" + (isCurrent ? " tick-label-active" : ""));
      label.style.fill = isCurrent ? color : "#9aa6bf";
      label.style.animationDelay = delay + "ms";
      label.textContent = labelForIndex(i);
      group.appendChild(label);
    }
  }

  svg.appendChild(group);
}

/* ---------------------------------------------------------------------- */
/* Clock hands + digital readout                                           */
/* ---------------------------------------------------------------------- */

function startClock() {
  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const digital = document.getElementById("digitalTime");

  function tick() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    const secondsDeg = s * 6;
    const minutesDeg = m * 6 + s * 0.1;
    const hoursDeg = (h % 12) * 30 + m * 0.5;

    secondHand.style.transform = `rotate(${secondsDeg}deg)`;
    minuteHand.style.transform = `rotate(${minutesDeg}deg)`;
    hourHand.style.transform = `rotate(${hoursDeg}deg)`;

    const h12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    digital.textContent =
      String(h12).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0") + " " + ampm;
  }

  tick();
  setInterval(tick, 1000);
}

/* ---------------------------------------------------------------------- */
/* Weather demo widget                                                     */
/* NOTE: This is illustrative demo data (no API key wired up). Swap the    */
/* body of setupWeatherDemo() for a real fetch() call to a weather API     */
/* (e.g. Open-Meteo, OpenWeatherMap) whenever you're ready to go live.     */
/* ---------------------------------------------------------------------- */

function setupWeatherDemo() {
  const hour = new Date().getHours();
  const scenarios = [
    { range: [5, 11], icon: "🌤️", temp: "21°C", desc: "Bright & breezy" },
    { range: [11, 16], icon: "☀️", temp: "27°C", desc: "Clear & bright" },
    { range: [16, 19], icon: "🌇", temp: "24°C", desc: "Golden hour glow" },
    { range: [19, 24], icon: "🌙", temp: "19°C", desc: "Cool & calm" },
    { range: [0, 5], icon: "🌌", temp: "17°C", desc: "Quiet starry sky" },
  ];

  const match = scenarios.find((s) => hour >= s.range[0] && hour < s.range[1]) || scenarios[1];

  document.getElementById("weatherIcon").textContent = match.icon;
  document.getElementById("weatherTemp").textContent = match.temp;
  document.getElementById("weatherDesc").textContent = match.desc;
}

/* ---------------------------------------------------------------------- */
/* Steps demo widget                                                       */
/* NOTE: Mock counter for demo purposes — wire this up to a real step      */
/* tracker / fitness API when available. Replace `targetSteps` logic.      */
/* ---------------------------------------------------------------------- */

function setupStepsDemo() {
  const countEl = document.getElementById("stepsCount");
  const fillEl = document.getElementById("stepsFill");
  const goal = 10000;
  const targetSteps = 4200 + Math.floor(Math.random() * 3600); // demo value

  const duration = 1400;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(eased * targetSteps);

    countEl.textContent = current.toLocaleString();
    fillEl.style.width = Math.min((current / goal) * 100, 100) + "%";

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/* ---------------------------------------------------------------------- */
/* Rotating optimistic quotes                                              */
/* ---------------------------------------------------------------------- */

const QUOTES = [
  "Small steps still move the wheel forward.",
  "Today has room for one good surprise.",
  "You're allowed to be proud of quiet progress.",
  "Every hour on this dial is a fresh one.",
  "Momentum starts the moment you begin.",
  "Good things are often already in motion.",
  "Rest is part of the orbit too.",
  "Your pace is valid. Keep circling forward.",
  "Something ordinary today might become a favorite memory.",
  "The day resets the moment you decide it does.",
];

function setupQuotes() {
  const quoteEl = document.getElementById("quoteText");
  const card = document.getElementById("quoteCard");
  let lastIndex = -1;

  function showRandomQuote() {
    let idx = Math.floor(Math.random() * QUOTES.length);
    if (idx === lastIndex) idx = (idx + 1) % QUOTES.length;
    lastIndex = idx;

    quoteEl.style.animation = "none";
    // Force reflow so the animation can restart
    void quoteEl.offsetWidth;
    quoteEl.style.animation = "";
    quoteEl.textContent = QUOTES[idx];
  }

  showRandomQuote();

  card.addEventListener("click", showRandomQuote);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showRandomQuote();
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Confetti burst on clock tap                                             */
/* ---------------------------------------------------------------------- */

function setupConfetti() {
  const clock = document.getElementById("centerClock");
  const container = document.getElementById("particles");
  const emojis = ["✨", "🌟", "💫", "🎉", "🌈"];

  function burst() {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "particle";
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = Math.random() * Math.PI * 2;
      const distance = 70 + Math.random() * 70;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() * 360 - 180) + "deg";

      span.style.setProperty("--tx", tx + "px");
      span.style.setProperty("--ty", ty + "px");
      span.style.setProperty("--rot", rot);
      span.style.animationDelay = Math.random() * 80 + "ms";

      container.appendChild(span);
      setTimeout(() => span.remove(), 1100);
    }
  }

  clock.addEventListener("click", burst);
  clock.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      burst();
    }
  });
}
