let appData = { entries: [], quiz: [], chapters: [], pins: [] };
let backpack = JSON.parse(localStorage.getItem('kecso_backpack')) || [];

// ===================== INIT & FETCH =====================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Valós adatletöltés a data.json fájlból!
    const response = await fetch('data.json');
    appData = await response.json();
    
    initApp();
  } catch (err) {
    console.error("Hiba az adatok betöltésekor. Lehet, hogy nem webszerveren futtatod?", err);
    document.getElementById('encEntries').innerHTML = '<p style="color:red">Hiba az adatok betöltésekor.</p>';
  }
});

function initApp() {
  buildABC();
  filterEntries();
  renderBackpack();
  startQuiz();
  buildReader();
  buildMap();
  initMapPanZoom();
  initDarkMode();
  startSurvival();
}

// ===================== DARK MODE & SCROLL =====================
function initDarkMode() {
  const btn = document.getElementById('darkModeToggle');
  const isDark = localStorage.getItem('kecso_dark') === 'true';
  if(isDark) document.body.classList.add('dark-mode');
  
  btn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('kecso_dark', document.body.classList.contains('dark-mode'));
  };
}

window.addEventListener('scroll', () => {
  const scrollPct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  document.getElementById('scrollProgress').style.width = scrollPct + '%';

  const navbar = document.getElementById('navbar');
  const backBtn = document.getElementById('backToTop');
  if (window.scrollY > 300) {
    navbar.classList.add('visible');
    backBtn.classList.add('visible');
  } else {
    navbar.classList.remove('visible');
    backBtn.classList.remove('visible');
  }
});

function scrollToId(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ===================== ENCIKLOPÉDIA & HÁTIZSÁK =====================
let currentFilter = 'mind';

function buildABC() { /* Egyszerűsítve helyhiány miatt */ }
function setFilter(tag, btn) { currentFilter = tag; filterEntries(); }
function randomEntry() { /* Random logika */ }

function filterEntries() {
  const q = document.getElementById('encSearch').value.toLowerCase();
  const container = document.getElementById('encEntries');
  container.innerHTML = '';
  
  appData.entries.forEach(e => {
    if(currentFilter !== 'mind' && e.tag !== currentFilter) return;
    if(q && !e.title.toLowerCase().includes(q) && !e.body.toLowerCase().includes(q)) return;

    const isSaved = backpack.includes(e.id);
    const div = document.createElement('div');
    div.className = 'enc-entry';
    div.innerHTML = `
      <div class="entry-head">
        <span onclick="this.parentElement.nextElementSibling.classList.toggle('open')">${e.title}</span>
        <div class="entry-actions">
          ${e.audio ? `<button class="action-btn" onclick="playAudio('${e.audio}')">🔊</button>` : ''}
          <button class="action-btn" onclick="shareEntry('${e.title}')">🔗</button>
          <button class="action-btn" onclick="toggleBookmark('${e.id}')">${isSaved ? '🎒' : '🔖'}</button>
        </div>
      </div>
      <div class="entry-body">${e.body}</div>
    `;
    container.appendChild(div);
  });
}

function toggleBookmark(id) {
  if(backpack.includes(id)) {
    backpack = backpack.filter(i => i !== id);
  } else {
    backpack.push(id);
  }
  localStorage.setItem('kecso_backpack', JSON.stringify(backpack));
  filterEntries();
  renderBackpack();
}

function renderBackpack() {
  const container = document.getElementById('backpackEntries');
  container.innerHTML = '';
  if(backpack.length === 0) {
    container.innerHTML = '<p>Üres a hátizsákod.</p>';
    return;
  }
  backpack.forEach(id => {
    const e = appData.entries.find(x => x.id === id);
    if(e) {
      const div = document.createElement('div');
      div.className = 'enc-entry';
      div.innerHTML = `<div class="entry-head"><span onclick="this.parentElement.nextElementSibling.classList.toggle('open')">${e.title}</span> <button class="action-btn" onclick="toggleBookmark('${e.id}')">❌</button></div><div class="entry-body">${e.body}</div>`;
      container.appendChild(div);
    }
  });
}

function shareEntry(title) {
  if (navigator.share) {
    navigator.share({ title: 'Kecsó Kalauz', text: `Nézd meg ezt a szócikket: ${title}`, url: window.location.href });
  } else {
    alert(`Másold vágólapra: ${title}`);
  }
}

function playAudio(url) {
  new Audio(url).play();
}

// ===================== SZLENG GENERÁTOR =====================
const slangs = [
  "Egy igazi hírös gyüttment sosem csúszik le a nullkőn a sárga macskakőre!",
  "A Lordok alatt ittam egy barackot, oszt' el is tévedtem a Don-kanyarban.",
  "Kész útvesztő ez a Cifrapalota, fú vazze, fúj a hírös cúg!",
  "Ha a Muszájban laksz, ne panaszkodj a homokra, te gyíkország-lakó!"
];
function generateSlang() {
  const random = slangs[Math.floor(Math.random() * slangs.length)];
  document.getElementById('slangOutput').textContent = `„${random}”`;
}

// ===================== TÚLÉLŐ SZIMULÁTOR =====================
const GAME = {
  start: { text: "Éjjel 2 van. Leszállsz a vonatról a Nagyállomáson. A célod eljutni a Széchenyivárosba.", choices: [{t: "Kisaluljáró felé", n: "aluljaro"}, {t: "Rákóczi úton befelé", n: "rakoczi"}] },
  aluljaro: { text: "Bokáig ér a víz. A sötétben gyanús alakok közelednek.", choices: [{t: "Szaladás át a vízen!", n: "vizes"}, {t: "Visszafordulok", n: "start"}] },
  rakoczi: { text: "A Cifrapalota elé érsz. Fúj a 'hírös cúg'. Fázol.", choices: [{t: "Bebújok a Lordok alá", n: "lordok"}, {t: "Irany a Nullkő", n: "nullko"}] },
  vizes: { text: "Sikeresen átértél, de tüdőgyulladást kaptál. Vége a játéknak. 💀", choices: [{t: "Újra", n: "start"}] },
  lordok: { text: "Találsz egy nyitva felejtett kocsmát. Túlélő vagy! 🍻", choices: [{t: "Újra", n: "start"}] },
  nullko: { text: "Lecsúsztál a kövön, igazi kecskeméti lettél! Nyertél! 🐐", choices: [{t: "Újra", n: "start"}] }
};

function startSurvival(node = 'start') {
  const data = GAME[node];
  document.getElementById('survivalText').textContent = data.text;
  const btnContainer = document.getElementById('survivalChoices');
  btnContainer.innerHTML = '';
  data.choices.forEach(c => {
    const b = document.createElement('button');
    b.className = 'hero-btn';
    b.textContent = c.t;
    b.onclick = () => startSurvival(c.n);
    btnContainer.appendChild(b);
  });
}

// ===================== TÉRKÉP PAN & ZOOM =====================
function initMapPanZoom() {
  const viewport = document.getElementById('mapViewport');
  const content = document.getElementById('mapContent');
  let scale = 1, panning = false, pointX = 0, pointY = 0, startX = 0, startY = 0;

  viewport.addEventListener('mousedown', e => {
    panning = true; startX = e.clientX - pointX; startY = e.clientY - pointY;
  });
  viewport.addEventListener('mouseup', () => panning = false);
  viewport.addEventListener('mouseleave', () => panning = false);
  viewport.addEventListener('mousemove', e => {
    if(!panning) return;
    pointX = e.clientX - startX; pointY = e.clientY - startY;
    content.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
  });

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    scale = Math.min(Math.max(1, scale * zoom), 4); // Max 4x zoom
    content.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
  });
}
  };
}

function submitForm(e) {
  e.preventDefault();
  alert("Köszi! Az urban dictionary szerkesztői megkapták az infót! 🐐");
  e.target.reset();
}

/* A KVÍZ ÉS OLVASÓ FÜGGVÉNYEIT (startQuiz, buildReader stb.) hagyd meg az előző válaszból! */