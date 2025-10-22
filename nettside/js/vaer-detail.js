/* weather-detail.js
 * Norwegian UI + MET Norway (Yr) data
 * Places cards (Nå / I dag / I morgen) right AFTER the intro section
 * and then renders 24h hourly + 7d daily summaries.
 */

(function () {
  'use strict';

  // ---------- Query params & defaults ----------
  const qs = new URLSearchParams(location.search);
  const hasLat = qs.has('lat') && qs.get('lat') !== '';
  const hasLon = qs.has('lon') && qs.get('lon') !== '';

  const LAT_DEFAULT = 60.39; // Bergen
  const LON_DEFAULT = 5.32;

  const lat = hasLat ? Number(qs.get('lat')) : LAT_DEFAULT;
  const lon = hasLon ? Number(qs.get('lon')) : LON_DEFAULT;
  const sted = (qs.get('sted') || (hasLat && hasLon ? 'Valgt sted' : 'Bergen')).trim();

  const tUnit = (qs.get('temp') || 'c').toLowerCase();   // 'c' | 'f'
  const wUnit = (qs.get('vind') || 'ms').toLowerCase();  // 'ms' | 'kmh'

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);

  const fmt = {
    temp(v) {
      if (v == null) return '–';
      if (tUnit === 'f') return `${Math.round(v * 9/5 + 32)}°F`;
      return `${Math.round(v)}°C`;
    },
    wind(v) {
      if (v == null) return '–';
      if (wUnit === 'kmh') return `${Math.round(v * 3.6)} km/t`;
      return `${Math.round(v)} m/s`;
    },
    precip(v) {
      if (v == null) return '–';
      return `${(Math.round(v * 10) / 10).toFixed(1)} mm`;
    },
    hum(v) { return v == null ? '–' : `${Math.round(v)}%`; },
    hour(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }); },
    dateShort(iso) { return new Date(iso).toLocaleDateString('no', { weekday:'short', day:'2-digit', month:'short' }); },
    dateOnly(iso) { return new Date(iso).toISOString().slice(0,10); } // YYYY-MM-DD
  };

  function prettySymbol(symbol) {
    if (!symbol) return ['Vær', '🌦️'];
    const map = {
      clearsky_day: ['Klarvær (dag)', '☀️'],
      clearsky_night: ['Klarvær (natt)', '🌙'],
      fair_day: ['Lettskyet (dag)', '🌤️'],
      fair_night: ['Lettskyet (natt)', '🌙'],
      partlycloudy_day: ['Delvis skyet', '⛅'],
      cloudy: ['Skyet', '☁️'],
      lightrain: ['Lett regn', '🌦️'],
      rain: ['Regn', '🌧️'],
      heavyrain: ['Kraftig regn', '🌧️💧'],
      lightrainshowers_day: ['Lette regnbyger', '🌦️'],
      rainshowers_day: ['Regnbyger', '🌦️'],
      snow: ['Snø', '❄️'],
      lightsnow: ['Lett snø', '🌨️'],
      heavysnow: ['Kraftig snø', '❄️'],
      fog: ['Tåke', '🌫️'],
      thunderstorm: ['Torden', '⛈️']
    };
    if (map[symbol]) return map[symbol];
    const txt = symbol.replaceAll('_',' ').replaceAll('-',' ');
    return [txt.charAt(0).toUpperCase() + txt.slice(1), '🌦️'];
  }

  // ---------- Mount points (cards just after intro) ----------
  function ensureMounts() {
    const main = $('#main') || document.body;
    const intro = document.querySelector('section[aria-labelledby="page-title"]');

    // Cards (Nå / I dag / I morgen)
    let secCards = $('#sec-cards');
    if (!secCards) {
      secCards = document.createElement('section');
      secCards.className = 'section';
      secCards.id = 'sec-cards';
      secCards.innerHTML = `
        <div class="container">
          <div class="cards grid-3">
            <article class="card feature card--blue" id="card-now" aria-labelledby="t-now">
              <h2 id="t-now">Nå</h2>
              <div id="now-body">Laster…</div>
            </article>
            <article class="card feature card--green" id="card-today" aria-labelledby="t-today">
              <h2 id="t-today">I dag</h2>
              <div id="today-body">Laster…</div>
            </article>
            <article class="card feature card--amber" id="card-tomorrow" aria-labelledby="t-tomorrow">
              <h2 id="t-tomorrow">I morgen</h2>
              <div id="tomorrow-body">Laster…</div>
            </article>
          </div>
        </div>`;
      if (intro) {
        intro.insertAdjacentElement('afterend', secCards); // <<< immediately after intro
      } else {
        main.prepend(secCards); // fallback
      }
    }

    // Hourly (24h)
    if (!$('#sec-hourly')) {
      const secHourly = document.createElement('section');
      secHourly.className = 'section';
      secHourly.id = 'sec-hourly';
      secHourly.innerHTML = `
        <div class="container">
          <div class="section-box section--purple">
            <h2>Neste 24 timer</h2>
            <div class="table-wrap">
              <table class="zebra" id="tbl-hourly">
                <thead>
                  <tr>
                    <th scope="col">Tid</th>
                    <th scope="col">Vær</th>
                    <th scope="col">Temp.</th>
                    <th scope="col">Luftfukt.</th>
                    <th scope="col">Vind</th>
                    <th scope="col">Nedbør</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>`;
      secCards.insertAdjacentElement('afterend', secHourly);
    }

    // Daily (7d)
    if (!$('#sec-daily')) {
      const secDaily = document.createElement('section');
      secDaily.className = 'section';
      secDaily.id = 'sec-daily';
      secDaily.innerHTML = `
        <div class="container">
          <div class="section-box section--indigo">
            <h2>Neste 7 dager</h2>
            <div class="table-wrap">
              <table class="zebra" id="tbl-daily">
                <thead>
                  <tr>
                    <th scope="col">Dato</th>
                    <th scope="col">Vær</th>
                    <th scope="col">Maks</th>
                    <th scope="col">Min</th>
                    <th scope="col">Nedbør (sum)</th>
                    <th scope="col">Vind maks</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>`;
      $('#sec-hourly').insertAdjacentElement('afterend', secDaily);
    }
  }

  // ---------- Fetch MET Norway (Yr) ----------
  async function load() {
    ensureMounts();

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderAll(data);
      // Optional: hide any static demo block
      const demo = document.getElementById('demo-example');
      if (demo) demo.remove();
    } catch (e) {
      showError(String(e));
    }
  }

  // ---------- Render pipeline ----------
  function renderAll(data) {
    const ts = data?.properties?.timeseries || [];
    if (ts.length === 0) { showError('Ingen data fra MET.'); return; }
    renderNow(ts[0]);
    renderTodayTomorrow(ts);
    renderHourly(ts);
    renderDaily(ts);
  }

  function renderNow(point) {
    const n = point.data?.instant?.details || {};
    const symbol = point.data?.next_1_hours?.summary?.symbol_code
                || point.data?.next_6_hours?.summary?.symbol_code;
    const [label, emo] = prettySymbol(symbol);

    $('#now-body').innerHTML = `
      <p class="lead" style="margin:.25rem 0 .75rem 0">
        <span style="font-size:2rem">${emo}</span> ${label}
      </p>
      <ul class="tags" aria-label="Akkurat nå">
        <li><span class="tag">Temp: ${fmt.temp(n.air_temperature)}</span></li>
        <li><span class="tag">Vind: ${fmt.wind(n.wind_speed)}</span></li>
        <li><span class="tag">Fukt: ${fmt.hum(n.relative_humidity)}</span></li>
      </ul>
      <p class="muted" style="margin-top:.5rem">${sted}</p>
    `;
  }

  function renderTodayTomorrow(ts) {
    const byDay = groupByDay(ts);
    const keys = Object.keys(byDay);
    if (keys.length === 0) return;

    const today = summarizeDay(byDay[keys[0]]);
    const tomorrow = keys[1] ? summarizeDay(byDay[keys[1]]) : null;

    $('#today-body').innerHTML = dayCardHTML(today);
    $('#tomorrow-body').innerHTML = tomorrow ? dayCardHTML(tomorrow) : '–';
  }

  function dayCardHTML(d) {
    const [label, emo] = prettySymbol(d.topSymbol);
    return `
      <p style="margin:.25rem 0 .75rem 0">
        <strong>${fmt.dateShort(d.date)}</strong> • <span style="font-size:1.2rem">${emo}</span> ${label}
      </p>
      <ul class="tags">
        <li><span class="tag">Maks: ${fmt.temp(d.tmax)}</span></li>
        <li><span class="tag">Min: ${fmt.temp(d.tmin)}</span></li>
        <li><span class="tag">Nedbør: ${fmt.precip(d.precSum)}</span></li>
        <li><span class="tag">Vind maks: ${fmt.wind(d.windMax)}</span></li>
      </ul>
    `;
  }

  function renderHourly(ts) {
    const tbody = $('#tbl-hourly tbody');
    tbody.innerHTML = '';
    const now = Date.now();
    const startIdx = nearestIndex(ts.map(t => t.time), now);
    const end = Math.min(startIdx + 24, ts.length);

    for (let i = startIdx; i < end; i++) {
      const p = ts[i];
      const det = p.data.instant?.details || {};
      const symbol = p.data?.next_1_hours?.summary?.symbol_code
                  || p.data?.next_6_hours?.summary?.symbol_code;
      const [label, emo] = prettySymbol(symbol);
      const precip = p.data?.next_1_hours?.details?.precipitation_amount
                  ?? p.data?.next_6_hours?.details?.precipitation_amount;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmt.hour(p.time)}</td>
        <td>${emo} ${label}</td>
        <td>${fmt.temp(det.air_temperature)}</td>
        <td>${fmt.hum(det.relative_humidity)}</td>
        <td>${fmt.wind(det.wind_speed)}</td>
        <td>${fmt.precip(precip)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderDaily(ts) {
    const tbody = $('#tbl-daily tbody');
    tbody.innerHTML = '';

    const byDay = groupByDay(ts);
    const days = Object.keys(byDay).slice(0, 7);

    for (const d of days) {
      const sum = summarizeDay(byDay[d]);
      const [label, emo] = prettySymbol(sum.topSymbol);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmt.dateShort(sum.date)}</td>
        <td>${emo} ${label}</td>
        <td>${fmt.temp(sum.tmax)}</td>
        <td>${fmt.temp(sum.tmin)}</td>
        <td>${fmt.precip(sum.precSum)}</td>
        <td>${fmt.wind(sum.windMax)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ---------- Aggregation helpers ----------
  function groupByDay(ts) {
    const map = {};
    for (const p of ts) {
      const key = fmt.dateOnly(p.time);
      (map[key] ||= []).push(p);
    }
    return map;
  }

  function summarizeDay(points) {
    let tmax = -Infinity, tmin = Infinity, precSum = 0, windMax = 0;
    const symbolCount = {};

    for (const p of points) {
      const det = p.data.instant?.details || {};
      const t = det.air_temperature;
      if (t != null) { if (t > tmax) tmax = t; if (t < tmin) tmin = t; }
      const ws = det.wind_speed;
      if (ws != null && ws > windMax) windMax = ws;

      const pr1 = p.data?.next_1_hours?.details?.precipitation_amount;
      const pr6 = p.data?.next_6_hours?.details?.precipitation_amount;
      if (pr1 != null) precSum += pr1;
      else if (pr6 != null) precSum += pr6;

      const sym = p.data?.next_1_hours?.summary?.symbol_code
               || p.data?.next_6_hours?.summary?.symbol_code;
      if (sym) symbolCount[sym] = (symbolCount[sym] || 0) + 1;
    }

    const topSymbol = Object.entries(symbolCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    return {
      date: points[0]?.time,
      tmax: Number.isFinite(tmax) ? tmax : null,
      tmin: Number.isFinite(tmin) ? tmin : null,
      precSum,
      windMax,
      topSymbol
    };
  }

  function nearestIndex(list, nowMs) {
    let best = 0, diff = Infinity;
    for (let i = 0; i < list.length; i++) {
      const d = new Date(list[i]).getTime();
      const cur = Math.abs(d - nowMs);
      if (cur < diff) { best = i; diff = cur; }
    }
    return best;
  }

  function showError(msg) {
    const main = $('#main') || document.body;
    const box = document.createElement('div');
    box.className = 'section';
    box.innerHTML = `
      <div class="container">
        <div class="section-box section--rose" role="alert" aria-live="assertive">
          <h2>Klarte ikke å laste værdata</h2>
          <p>${msg}</p>
          <p>Sjekk URL-parametre, f.eks. <code>?lat=60.39&lon=5.32&sted=Bergen</code>.</p>
        </div>
      </div>`;
    main.append(box);
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
