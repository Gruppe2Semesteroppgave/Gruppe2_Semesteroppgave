const MET_URL =
  'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.39299&lon=5.32415';

function fmt(v, unit){ return (v==null || Number.isNaN(v)) ? '—' : `${Math.round(v)}${unit}`; }
function iconForSymbol(code){
  if(!code) return '❓';
  const c = String(code).toLowerCase();
  if (c.includes('snow')||c.includes('sleet')) return '🌨️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('rain')||c.includes('showers')) return '🌧️';
  if (c.includes('fog')) return '🌫️';
  if (c.includes('cloudy')) return '☁️';
  if (c.includes('partly')) return '⛅';
  if (c.includes('clear')||c.includes('fair')) return '☀️';
  return '🌡️';
}

function setMini(temp, icon){
  const t = document.getElementById('wx-mini-temp');
  const i = document.getElementById('wx-mini-icon');
  if (t) t.textContent = temp;
  if (i) i.textContent = icon;
}

function setupPopoverToggle(){
  const btn = document.getElementById('wx-mini');
  const pop = document.getElementById('wx-popover');
  if (!btn || !pop) return;
  function close(){ pop.hidden = true; btn.setAttribute('aria-expanded','false'); document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onEsc); }
  function onDoc(e){ if (!pop.contains(e.target) && e.target !== btn) close(); }
  function onEsc(e){ if (e.key === 'Escape') close(); }
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const willOpen = pop.hidden;
    pop.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
    if (willOpen){ setTimeout(()=>document.addEventListener('click', onDoc),0); document.addEventListener('keydown', onEsc); }
    else { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onEsc); }
  });
}

async function loadNowcast(){
  setupPopoverToggle();

  const statusEl = document.getElementById('nowcast-status');
  const listEl   = document.getElementById('nowcast-list');
  const sourceEl = document.getElementById('nowcast-source');

  if (statusEl) statusEl.textContent = 'Laster…';

  try{
    const resp = await fetch(MET_URL, { cache:'no-store', mode:'cors' });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    const rows = data?.properties?.timeseries || [];
    if (!rows.length) throw new Error('Ingen data');

    const now  = rows[0];
    const inst = now.data.instant?.details || {};
    const next1h = now.data.next_1_hours || null;

    const temp = fmt(inst.air_temperature, '°C');
    const wind = fmt(inst.wind_speed, ' m/s');
    const rh   = fmt(inst.relative_humidity, '%');
    const p    = fmt(inst.air_pressure_at_sea_level, ' hPa');
    const rain1h = next1h?.details?.precipitation_amount;
    const rain   = (rain1h == null) ? '—' : `${rain1h} mm/t`;
    const symbol = next1h?.summary?.symbol_code || '';
    const icon   = iconForSymbol(symbol);
    const symbolLabel = (symbol || 'ukjent').replaceAll('_',' ');

    // Mini hap (header)
    setMini(temp, icon);

    // Popover varsa doldur
    const descEl = document.getElementById('wx-desc');
    const iconEl = document.getElementById('wx-icon');
    if (statusEl) statusEl.textContent = `Akkurat nå: ${temp} • Vind: ${wind} • Nedbør (1t): ${rain}`;
    if (descEl) descEl.textContent = symbolLabel;
    if (iconEl) iconEl.textContent = icon;
    if (listEl){
      listEl.innerHTML = '';
      [
        { txt:`Fuktighet: ${rh}`, ico:'💧', aria:'Fuktighet' },
        { txt:`Trykk: ${p}`,      ico:'📉', aria:'Lufttrykk' },
        { txt:`Værsymbol: ${symbolLabel}`, ico:icon, aria:'Værsymbol' }
      ].forEach(({txt, ico, aria})=>{
        const li = document.createElement('li');
        li.className='tag';
        li.innerHTML = `<span class="icon" aria-hidden="true">${ico}</span><span>${txt}</span>`;
        li.setAttribute('aria-label', aria + ' ' + txt);
        listEl.appendChild(li);
      });
    }
    if (sourceEl){
      const updated = new Date(now.time).toLocaleString('no-NO');
      sourceEl.textContent = `Kilde: MET Norway (api.met.no) • Sist oppdatert: ${updated}`;
    }
  }catch(err){
    console.error('Weather error:', err);
    setMini('--°C','❓');
    if (statusEl) statusEl.textContent = 'Klarte ikke å hente værdata.';
  }
}

document.addEventListener('DOMContentLoaded', loadNowcast);
