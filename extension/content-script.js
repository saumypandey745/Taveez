/**
 * Taveez — Chrome Extension Content Script
 * Injects physical lucky charm overlay on every webpage visited.
 * Uses chrome.storage.local for cross-tab state syncing.
 */

(function () {
  if (document.getElementById('taveez-ext-host')) return; // Avoid duplicate injection

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

  let currentCharmIndex = 0;

  // Sync state from chrome.storage.local
  function loadSavedCharm() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['taveez_charm'], (res) => {
        if (res && res.taveez_charm) {
          const idx = CHARMS.findIndex(c => c.emoji === res.taveez_charm);
          if (idx !== -1) currentCharmIndex = idx;
        }
      });
    }
  }
  loadSavedCharm();

  // Listen for live charm updates from popup or other tabs
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'TAVEEZ_UPDATE_CHARM') {
        const idx = CHARMS.findIndex(c => c.emoji === message.charm);
        if (idx !== -1) {
          currentCharmIndex = idx;
          showTooltip(`Charm Changed: ${CHARMS[currentCharmIndex].emoji} ${CHARMS[currentCharmIndex].name}`);
        }
      }
    });
  }

  // Host Container
  const host = document.createElement('div');
  host.id = 'taveez-ext-host';

  host.innerHTML = `
    <div class="taveez-ext-container">
      <div class="taveez-ext-brass-mount" title="Taveez Charm — Click to bless, double-click to cycle charm"></div>
      <canvas class="taveez-ext-canvas" width="160" height="230"></canvas>
      <div class="taveez-ext-tooltip" id="taveez-ext-tooltip">Taveez Overlay • Tap to Bless</div>
    </div>
  `;

  document.body.appendChild(host);

  const canvas = host.querySelector('.taveez-ext-canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = host.querySelector('#taveez-ext-tooltip');

  let tooltipTimer = null;
  function showTooltip(text, duration = 2500) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => {
      tooltip.style.opacity = '';
      tooltip.style.transform = '';
      tooltip.textContent = 'Taveez Overlay • Tap to Bless';
    }, duration);
  }

  // Physics Pendulum
  let theta = 0.2;
  let omega = 0;
  let alpha = 0;
  const g = 9.81 * 75;
  const L = 135;
  const damping = 0.95;

  let isDragging = false;
  let lastX = 0;

  function updatePhysics(dt) {
    if (isDragging) return;
    alpha = -(g / L) * Math.sin(theta) - damping * omega;
    omega += alpha * dt;
    theta += omega * dt;
    if (Math.abs(theta) < 0.001 && Math.abs(omega) < 0.001) {
      theta = 0;
      omega = 0;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const originX = 80;
    const originY = 8;
    const bobX = originX + L * Math.sin(theta);
    const bobY = originY + L * Math.cos(theta);

    // String with glow
    ctx.save();
    ctx.shadowColor = 'rgba(212,175,55,0.4)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // Metallic ring / bead above charm
    const beadX = bobX - Math.sin(theta) * 16;
    const beadY = bobY - Math.cos(theta) * 16;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(beadX, beadY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glow disc behind charm
    const grd = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, 26);
    grd.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
    grd.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Emoji Charm Bob
    ctx.save();
    ctx.translate(bobX, bobY);
    ctx.rotate(theta * 0.35);
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CHARMS[currentCharmIndex].emoji, 0, 0);
    ctx.restore();
  }

  // Drag Interactions
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    omega += (dx / L) * 0.5;
    lastX = e.clientX;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support for mobile / touchscreens
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    lastX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastX;
    omega += (dx / L) * 0.5;
    lastX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Sound Synthesizer
  function playSimpleChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const c = new AudioCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, c.currentTime);
      gain.gain.setValueAtTime(0.2, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 1.2);
    } catch (e) {}
  }

  // Click & Double click handler
  let clickTimer = null;
  canvas.addEventListener('click', () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      // Double Click -> Cycle Charm directly on webpage!
      currentCharmIndex = (currentCharmIndex + 1) % CHARMS.length;
      const newEmoji = CHARMS[currentCharmIndex].emoji;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ taveez_charm: newEmoji });
      }
      showTooltip(`Charm Changed: ${newEmoji} ${CHARMS[currentCharmIndex].name}`);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        // Single Click -> Bless / Flick
        playSimpleChime();
        omega += (Math.random() > 0.5 ? 1 : -1) * 3;
        showTooltip(`✨ Blessed! ${CHARMS[currentCharmIndex].emoji} ${CHARMS[currentCharmIndex].name}`);
      }, 250);
    }
  });

  // Physics animation loop
  let lastTime = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    updatePhysics(dt);
    render();
  }
  requestAnimationFrame(loop);
})();
