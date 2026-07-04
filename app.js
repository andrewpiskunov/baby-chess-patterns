// Baby Chess Patterns — переключение сцен, скорость, таймер, авто-скрытие панели

const SCENES = ['board', 'piece', 'classic'];

const stage = document.getElementById('stage');
const parentBar = document.getElementById('parentBar');
const sessionOver = document.getElementById('sessionOver');
const timerLeft = document.getElementById('timerLeft');
const infoDialog = document.getElementById('infoDialog');
const pieceWrap = document.getElementById('pieceWrap');

let sceneIndex = 0;
let pieceIndex = 0;
let timerId = null;
let hideBarId = null;
let paused = false;

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
  if (name === 'piece') announcePiece();
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
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

// ---------- Смена фигуры в конце каждого прохода ----------

const pieces = pieceWrap.querySelectorAll('.piece');
let soundOn = true;

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

pieceWrap.addEventListener('animationiteration', () => showPiece(pieceIndex + 1));

// ---------- Скорость ----------

document.querySelectorAll('[data-speed]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.body.className = 'speed-' + btn.dataset.speed;
    document.querySelectorAll('[data-speed]').forEach(b =>
      b.classList.toggle('is-active', b === btn));
  });
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

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.classList.toggle('is-active', soundOn);
  soundBtn.setAttribute('aria-pressed', soundOn);
  if (!soundOn && 'speechSynthesis' in window) speechSynthesis.cancel();
  if (soundOn) announcePiece();
});

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

// ---------- Старт ----------

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.className = 'speed-static';
  document.querySelectorAll('[data-speed]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.speed === 'static'));
}

showScene(0);
showPiece(0);
pokeBar();
