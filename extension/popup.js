// ---- Charm catalog ----
const CHARMS = [
  { emoji: '🧿', name: 'Nazar' },
  { emoji: '🪬', name: 'Hamsa' },
  { emoji: '⛩️', name: 'Torii' },
  { emoji: '🐈‍⬛', name: 'Black Cat' },
  { emoji: '🕸️', name: 'Web' },
  { emoji: '🧲', name: 'Magnet' },
  { emoji: '🍀', name: 'Clover' },
  { emoji: '🔔', name: 'Bell' },
  { emoji: '🪙', name: 'Coin' },
  { emoji: '🌼', name: 'Flower' },
];

const STORAGE_KEY = 'taveez_ext_charm';

// ---- State ----
let currentIdx = 0;

function syncToTabs(emoji) {
  // Save to extension storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ taveez_charm: emoji });
  }
  try { localStorage.setItem(STORAGE_KEY, emoji); } catch(e) {}

  // Broadcast to all active tabs
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'TAVEEZ_UPDATE_CHARM', charm: emoji }).catch(() => {});
      });
    });
  }
}

// Load saved charm
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['taveez_charm'], (res) => {
    if (res && res.taveez_charm) {
      const idx = CHARMS.findIndex(c => c.emoji === res.taveez_charm);
      if (idx !== -1) {
        currentIdx = idx;
        updateActiveGridButton();
      }
    }
  });
} else {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const idx = CHARMS.findIndex(c => c.emoji === saved);
      if (idx !== -1) currentIdx = idx;
    }
  } catch(e) {}
}

function updateActiveGridButton() {
  document.querySelectorAll('.charm-btn').forEach((b, j) =>
    b.classList.toggle('active', j === currentIdx)
  );
}

// ---- Build charm grid ----
const grid = document.getElementById('charm-grid');
if (grid) {
  CHARMS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'charm-btn' + (i === currentIdx ? ' active' : '');
    btn.textContent = c.emoji;
    btn.title = c.name;
    btn.addEventListener('click', () => {
      currentIdx = i;
      updateActiveGridButton();
      syncToTabs(CHARMS[i].emoji);
      showStatus(`${CHARMS[i].emoji} ${CHARMS[i].name} active on screen`);
    });
    grid.appendChild(btn);
  });
}

// ---- Physics Pendulum ----
const canvas = document.getElementById('charm-canvas');
const ctx = canvas.getContext('2d');

let theta = 0.3;
let omega = 0;
const G = 9.81 * 60;
const L = 150;
const DAMP = 0.9;
const OX = 170, OY = 12;

let isDragging = false;
let lastMouseX = 0;
let lastMouseDX = 0;

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  isDragging = true;
  lastMouseX = e.clientX - rect.left;
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  lastMouseDX = mx - lastMouseX;
  omega += (lastMouseDX / L) * 0.4;
  lastMouseX = mx;
});
window.addEventListener('mouseup', () => { isDragging = false; });

// Touch support
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  isDragging = true;
  lastMouseX = e.touches[0].clientX;
}, { passive: false });
window.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const mx = e.touches[0].clientX;
  omega += ((mx - lastMouseX) / L) * 0.4;
  lastMouseX = mx;
});
window.addEventListener('touchend', () => { isDragging = false; });

function drawBrassMount() {
  const grad = ctx.createLinearGradient(0, 0, 0, 12);
  grad.addColorStop(0, '#f0d060');
  grad.addColorStop(0.5, '#d4af37');
  grad.addColorStop(1, '#8b6914');
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(20, 2, 300, 10, 5);
  } else {
    ctx.rect(20, 2, 300, 10);
  }
  ctx.fill();

  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.arc(OX, OY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f0d060';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBrassMount();

  const bobX = OX + L * Math.sin(theta);
  const bobY = OY + L * Math.cos(theta);

  // Thread with glow
  ctx.save();
  ctx.shadowColor = 'rgba(212,175,55,0.3)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(OX, OY);
  ctx.lineTo(bobX, bobY);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Bead accent
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bobX - Math.sin(theta)*16, bobY - Math.cos(theta)*16, 4, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Charm glow disc
  const grd = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, 28);
  grd.addColorStop(0, 'rgba(212,175,55,0.15)');
  grd.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(bobX, bobY, 28, 0, Math.PI * 2);
  ctx.fill();

  // Emoji
  ctx.save();
  ctx.translate(bobX, bobY);
  ctx.rotate(theta * 0.3);
  ctx.font = '38px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(CHARMS[currentIdx].emoji, 0, 0);
  ctx.restore();
}

function physicsLoop() {
  requestAnimationFrame(physicsLoop);
  const dt = 0.016;
  if (!isDragging) {
    const alpha = -(G / L) * Math.sin(theta) - DAMP * omega;
    omega += alpha * dt;
    theta += omega * dt;
    if (Math.abs(theta) < 0.001 && Math.abs(omega) < 0.001) {
      theta = 0; omega = 0;
    }
  }
  render();
}
requestAnimationFrame(physicsLoop);

// ---- Audio ----
function chime(freq = 587.33) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const c = new AudioCtx();
    [freq, freq * 1.5, freq * 2].forEach((f, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime + i * 0.07);
      g.gain.setValueAtTime(0.15, c.currentTime + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.07 + 1.4);
      osc.connect(g); g.connect(c.destination);
      osc.start(c.currentTime + i * 0.07);
      osc.stop(c.currentTime + i * 0.07 + 1.4);
    });
  } catch(e) {}
}

// ---- Status message ----
const statusEl = document.getElementById('status-msg');
let statusTimer = null;
function showStatus(msg, duration = 2500) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.classList.add('highlight');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = 'Drag to swing • Click to bless';
    statusEl.classList.remove('highlight');
  }, duration);
}

// ---- Action buttons ----
const btnRitual = document.getElementById('btn-ritual');
if (btnRitual) {
  btnRitual.addEventListener('click', () => {
    chime();
    omega += (Math.random() > 0.5 ? 1 : -1) * 3;
    showStatus('✨ Blessed! May fortune find you.');
  });
}

const btnFlick = document.getElementById('btn-flick');
if (btnFlick) {
  btnFlick.addEventListener('click', () => {
    omega += (Math.random() > 0.5 ? 1 : -1) * 5;
    showStatus('〰 Flicked!');
  });
}

// Click on canvas = ritual
canvas.addEventListener('click', () => {
  if (Math.abs(lastMouseDX) < 3) {
    chime();
    omega += (Math.random() > 0.5 ? 1 : -1) * 2.5;
    showStatus(`✨ ${CHARMS[currentIdx].name} blesses you!`);
  }
});
