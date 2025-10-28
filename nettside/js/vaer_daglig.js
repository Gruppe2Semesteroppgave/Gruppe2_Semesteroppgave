/* -----------------------------------------------------
   vaerdaglig.js – Regnbyen Bergen (Vær – daglig)

------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", initDailyWeather);

/* === starter === */
async function initDailyWeather() {
  const els = {
    now: document.getElementById("now-body"),
    today: document.getElementById("today-body"),
    tomorrow: document.getElementById("tomorrow-body"),
    hourly: document.querySelector("#tbl-hourly tbody"),
    daily: document.querySelector("#tbl-daily tbody"),
  };

  setLoading(els); // "Laster…" skrev

  try {
    const data = await fetchWeather(); // få falske dataal
    renderNow(els.now, data.now);
    renderToday(els.today, data.today);
    renderTomorrow(els.tomorrow, data.tomorrow);
    renderHourly(els.hourly, data.hourly);
    renderDaily(els.daily, data.daily);
  } catch (err) {
    showError(els, err);
  }
}

/* ===loading === */
function setLoading(els) {
  if (els.now) els.now.textContent = "Laster…";
  if (els.today) els.today.textContent = "Laster…";
  if (els.tomorrow) els.tomorrow.textContent = "Laster…";
  if (els.hourly) els.hourly.innerHTML = `<tr><td colspan="5">Laster…</td></tr>`;
  if (els.daily) els.daily.innerHTML = `<tr><td colspan="5">Laster…</td></tr>`;
}
function showError(els, err) {
  const msg = `Kunne ikke hente værdata. (${err?.message || err})`;
  if (els.now) els.now.textContent = msg;
  if (els.today) els.today.textContent = msg;
  if (els.tomorrow) els.tomorrow.textContent = msg;
  if (els.hourly) els.hourly.innerHTML = `<tr><td colspan="5">${msg}</td></tr>`;
  if (els.daily) els.daily.innerHTML = `<tr><td colspan="5">${msg}</td></tr>`;
}

/* === falske data === */
async function fetchWeather() {
  await delay(150);

  const now = {
    time: new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }),
    temp: 12,
    windMs: 4.3,
    precipMm: 0.5,
    code: 61,
    desc: "Lett regn",
  };

  const today = {
    tmin: 9, tmax: 13, windMs: 5.8, precipMm: 4.2, code: 61, desc: "Byger",
  };

  const tomorrow = {
    tmin: 8, tmax: 12, windMs: 4.7, precipMm: 6.8, code: 63, desc: "Regn",
  };

  // timelik (24 timer)
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: new Date(Date.now() + i * 3600e3).toLocaleTimeString("no-NO", { hour: "2-digit" }),
    temp: 10 + Math.round(Math.sin(i / 3) * 2),
    windMs: +(3 + Math.random() * 3).toFixed(1),
    precipMm: +(Math.max(0, Math.sin(i / 4)) * 1.1).toFixed(1),
    code: i % 5 === 0 ? 61 : 3,
  }));

  // dagerlik (7 dager)
  const daily = Array.from({ length: 7 }, (_, d) => ({
    day: new Date(Date.now() + d * 86400e3).toLocaleDateString("no-NO", { weekday: "short" }),
    tmin: 7 + (d % 3),
    tmax: 12 + (d % 4),
    windMs: +(3 + Math.random() * 4).toFixed(1),
    precipMm: +(Math.random() * 8).toFixed(1),
    code: [1, 2, 3, 61, 63, 80, 3][d],
  }));

  return { now, today, tomorrow, hourly, daily };
}

/* === Kort === */
function renderNow(el, d) {
  if (!el || !d) return;
  el.innerHTML = cardList([
    ["Tid", d.time],
    ["Temp", fmtTemp(d.temp)],
    ["Vind", fmtWind(d.windMs)],
    ["Nedbør", fmtPrecip(d.precipMm)],
    ["Vær", iconWithText(d.code, d.desc)],
  ]);
}
function renderToday(el, d) {
  if (!el || !d) return;
  el.innerHTML = cardList([
    ["Min/Max", `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`],
    ["Vind", fmtWind(d.windMs)],
    ["Nedbør", fmtPrecip(d.precipMm)],
    ["Vær", iconWithText(d.code, d.desc)],
  ]);
}
function renderTomorrow(el, d) { renderToday(el, d); }

/* === Tabell === */
function renderHourly(tbody, rows) {
  if (!tbody) return;
  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="5">Ingen data</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <th scope="row">${escapeHtml(r.hour)}</th>
      <td>${iconWithText(r.code)}</td>
      <td>${fmtTemp(r.temp)}</td>
      <td>${fmtWind(r.windMs)}</td>
      <td>${fmtPrecip(r.precipMm)}</td>
    </tr>`).join("");
}

function renderDaily(tbody, rows) {
  if (!tbody) return;
  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="5">Ingen data</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <th scope="row">${escapeHtml(r.day)}</th>
      <td>${iconWithText(r.code)}</td>
      <td>${fmtTemp(r.tmin)} / ${fmtTemp(r.tmax)}</td>
      <td>${fmtWind(r.windMs)}</td>
      <td>${fmtPrecip(r.precipMm)}</td>
    </tr>`).join("");
}

/* === assistenter === */
function cardList(pairs) {
  return `<dl class="wx-dl">` +
    pairs.map(([k, v]) => `
      <div class="wx-row">
        <dt>${escapeHtml(k)}</dt>
        <dd>${v ?? ""}</dd>
      </div>`).join("") +
    `</dl>`;
}
function iconWithText(code, text) {
  return iconFromCode(code) + (text ? " " + escapeHtml(text) : "");
}

/* === Formatering === */
const fmtTemp = t => `${Number(t).toFixed(0)}°C`;
const fmtWind = w => `${Number(w).toFixed(1)} m/s`;
const fmtPrecip = p => `${Number(p).toFixed(1)} mm`;

function iconFromCode(code) {
  if (code >= 80) return "🌧️";
  if (code >= 63) return "🌧️";
  if (code >= 60) return "🌦️";
  if (code === 3) return "☁️";
  if (code === 2) return "⛅";
  if (code === 1) return "🌤️";
  if (code === 0) return "☀️";
  return "🌥️";
}

/* === Generelle hjelpeenheter === */
const delay = ms => new Promise(r => setTimeout(r, ms));
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
