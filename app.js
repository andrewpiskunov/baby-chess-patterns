// Baby Chess Patterns — переключение сцен, скорость, озвучка, таймер,
// выбор фигуры, инверсия, сохранение настроек, авто-скрытие панели

const SCENES = ['board', 'piece', 'classic', 'spiral', 'diag', 'dots'];
const SETTINGS_KEY = 'bcp-settings';

const stage = document.getElementById('stage');
const parentBar = document.getElementById('parentBar');
const sessionOver = document.getElementById('sessionOver');
const timerLeft = document.getElementById('timerLeft');
const infoDialog = document.getElementById('infoDialog');
const pieceWrap = document.getElementById('pieceWrap');
const pieceSelect = document.getElementById('pieceSelect');
const scenePiece = document.querySelector('.scene-piece');

let sceneIndex = 0;
let pieceIndex = 0;
let autoCycle = true;
let soundOn = true;
let timerId = null;
let hideBarId = null;
let paused = false;

// ---------- Настройки ----------

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSetting(patch) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...patch }));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

// ---------- Сцены ----------

function showScene(index) {
  sceneIndex = (index + SCENES.length) % SCENES.length;
  const name = SCENES[sceneIndex];
  document.querySelectorAll('.scene').forEach(s => {
    s.classList.toggle('is-active', s.dataset.scene === name);
  });
  document.querySelectorAll('.tab').forEach(t => {
    const active = t.dataset.target === name;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', active);
  });
  pieceSelect.hidden = name !== 'piece';
  if (name === 'piece') announcePiece();
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
  saveSetting({ scene: name });
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => showScene(SCENES.indexOf(tab.dataset.target)));
});

// Клик по сцене — следующая; стрелки и пробел — с клавиатуры
stage.addEventListener('click', () => {
  if (sessionOver.classList.contains('is-on')) {
    endSessionDismiss();
    return;
  }
  showScene(sceneIndex + 1);
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') showScene(sceneIndex + 1);
  if (e.key === 'ArrowLeft') showScene(sceneIndex - 1);
  if (e.key === ' ') {
    e.preventDefault();
    paused = !paused;
    document.querySelectorAll('.scene *').forEach(el => {
      el.style.animationPlayState = paused ? 'paused' : '';
    });
  }
});

// ---------- Фигуры: озвучка, смена, выбор ----------

const pieces = pieceWrap.querySelectorAll('.piece');

function announcePiece() {
  if (!soundOn || !('speechSynthesis' in window)) return;
  if (SCENES[sceneIndex] !== 'piece') return;
  const utterance = new SpeechSynthesisUtterance(pieces[pieceIndex].dataset.name);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function showPiece(index) {
  pieceIndex = index % pieces.length;
  pieces.forEach((p, i) => p.classList.toggle('is-active', i === pieceIndex));
  announcePiece();
}

pieceWrap.addEventListener('animationiteration', () => {
  if (autoCycle) showPiece(pieceIndex + 1);
});

// Пока открыта сцена «Фигура», название повторяется каждые несколько секунд
// (announcePiece сам молчит на других сценах и при выключенном звуке)
const ANNOUNCE_EVERY_MS = 5000;
setInterval(announcePiece, ANNOUNCE_EVERY_MS);

function selectPiece(value) {
  document.querySelectorAll('[data-piece]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.piece === value));
  if (value === 'auto') {
    autoCycle = true;
  } else {
    autoCycle = false;
    showPiece(Number(value));
  }
  saveSetting({ piece: value });
}

document.querySelectorAll('[data-piece]').forEach(btn => {
  btn.addEventListener('click', () => selectPiece(btn.dataset.piece));
});

// Инверсия: белая фигура на чёрном фоне
const invertBtn = document.getElementById('invertBtn');

function setInverted(on) {
  scenePiece.classList.toggle('inverted', on);
  invertBtn.classList.toggle('is-active', on);
  invertBtn.setAttribute('aria-pressed', on);
  saveSetting({ inverted: on });
}

invertBtn.addEventListener('click', () =>
  setInverted(!scenePiece.classList.contains('inverted')));

// ---------- Скорость ----------

function setSpeed(speed, save = true) {
  document.body.className = 'speed-' + speed;
  document.querySelectorAll('[data-speed]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.speed === speed));
  if (save) saveSetting({ speed });
}

document.querySelectorAll('[data-speed]').forEach(btn => {
  btn.addEventListener('click', () => setSpeed(btn.dataset.speed));
});

// ---------- Звук ----------

const soundBtn = document.getElementById('soundBtn');

function setSound(on) {
  soundOn = on;
  soundBtn.classList.toggle('is-active', on);
  soundBtn.setAttribute('aria-pressed', on);
  if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
  saveSetting({ sound: on });
}

soundBtn.addEventListener('click', () => {
  setSound(!soundOn);
  if (soundOn) announcePiece();
});

// ---------- Таймер сессии ----------

function startTimer(minutes) {
  clearInterval(timerId);
  let seconds = minutes * 60;
  timerLeft.hidden = false;
  sessionOver.classList.remove('is-on');

  const tick = () => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    timerLeft.textContent = `${m}:${s}`;
    if (seconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      sessionOver.classList.add('is-on');
    }
    seconds--;
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function endSessionDismiss() {
  sessionOver.classList.remove('is-on');
  timerLeft.hidden = true;
  document.querySelectorAll('[data-timer]').forEach(b => b.classList.remove('is-active'));
}

document.querySelectorAll('[data-timer]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-timer]').forEach(b =>
      b.classList.toggle('is-active', b === btn));
    startTimer(Number(btn.dataset.timer));
  });
});

// ---------- Полный экран, печать, инфо ----------

document.getElementById('fullscreenBtn').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

document.getElementById('infoBtn').addEventListener('click', () => infoDialog.showModal());

// ---------- Авто-скрытие панели ----------

function pokeBar() {
  parentBar.classList.remove('is-hidden');
  clearTimeout(hideBarId);
  hideBarId = setTimeout(() => parentBar.classList.add('is-hidden'), 5000);
}

['pointermove', 'pointerdown', 'keydown'].forEach(ev =>
  document.addEventListener(ev, pokeBar));

// ---------- Спираль (архимедова, общий path для экрана и печати) ----------

(function buildSpiral() {
  const TURNS = 4.5;
  const K = 45 / (TURNS * 2 * Math.PI); // радиус растёт до 45 единиц viewBox
  let d = 'M 0 0';
  for (let a = 0.15; a <= TURNS * 2 * Math.PI; a += 0.15) {
    const r = K * a;
    d += ` L ${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  }
  document.querySelectorAll('.spiral-path').forEach(p => p.setAttribute('d', d));
})();

// ---------- Офлайн (PWA) ----------

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js');
}

// ---------- Старт: восстановление настроек ----------

const saved = loadSettings();

setSpeed(saved.speed || 'slow', false);
setSound(saved.sound !== false);
setInverted(saved.inverted === true);
selectPiece(typeof saved.piece === 'string' ? saved.piece : 'auto');
if (autoCycle) showPiece(0);
showScene(Math.max(0, SCENES.indexOf(saved.scene)));

// Системная настройка «меньше движения» важнее сохранённой скорости
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setSpeed('static', false);
}

pokeBar();
