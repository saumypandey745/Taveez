/**
 * Taveez — Chrome Extension Content Script
 * Injects physical lucky charm overlay on every webpage visited.
 * Uses taveez_ext_ storage namespace.
 */

(function () {
  if (document.getElementById('taveez-ext-host')) return; // Avoid duplicate injection

  // Storage Keys Namespace
  const STORAGE_CHARM_KEY = 'taveez_ext_charm';
  const STORAGE_STREAK_KEY = 'taveez_ext_streak';

  // Catalog
  const CHARMS = ['🧿', '🪬', '⛩️', '🐈‍⬛', '🕸️', '🧲', '🍀', '🔔', '🪙', '🌼'];
  
  let currentCharmIndex = 0;
  try {
    const saved = localStorage.getItem(STORAGE_CHARM_KEY);
    if (saved && CHARMS.includes(saved)) {
      currentCharmIndex = CHARMS.indexOf(saved);
    }
  } catch (e) {}

  // Host Container
  const host = document.createElement('div');
  host.id = 'taveez-ext-host';

  host.innerHTML = `
    <div class="taveez-ext-container">
      <div class="taveez-ext-brass-mount" title="Taveez Extension Charm — Click to perform ritual, double-click to cycle charm"></div>
      <canvas class="taveez-ext-canvas" width="140" height="200"></canvas>
      <div class="taveez-ext-tooltip" id="taveez-ext-tooltip">Taveez Overlay • Tap to Bless</div>
    </div>
  `;

  document.body.appendChild(host);

  const canvas = host.querySelector('.taveez-ext-canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = host.querySelector('#taveez-ext-tooltip');

  // Physics Pendulum
  let theta = 0;
  let omega = 0;
  let alpha = 0;
  const g = 9.81 * 70;
  const L = 110;
  const damping = 1.1;

  let isDragging = false;
  let lastX = 0;

  function updatePhysics(dt) {
    if (isDragging) return;
    alpha = -(g / L) * Math.sin(theta) - damping * omega;
    omega += alpha * dt;
    theta += omega * dt;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const originX = 70;
    const originY = 10;
    const bobX = originX + L * Math.sin(theta);
    const bobY = originY + L * Math.cos(theta);

    // String
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji Bob
    ctx.save();
    ctx.translate(bobX, bobY);
    ctx.rotate(theta * 0.4);
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CHARMS[currentCharmIndex], 0, 0);
    ctx.restore();
  }

  // Pointer interactions
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

  // Tap ritual sound synthesizer (simple Web Audio chime)
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

  // Single click = ritual, Double click = cycle charm
  let clickTimer = null;
  canvas.addEventListener('click', () => {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      // Double Click -> Cycle Charm
      currentCharmIndex = (currentCharmIndex + 1) % CHARMS.length;
      try {
        localStorage.setItem(STORAGE_CHARM_KEY, CHARMS[currentCharmIndex]);
      } catch (e) {}
      tooltip.textContent = `Charm Changed: ${CHARMS[currentCharmIndex]}`;
      setTimeout(() => tooltip.textContent = 'Taveez Overlay • Tap to Bless', 2000);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        // Single Click -> Perform Ritual
        playSimpleChime();
        omega += (Math.random() > 0.5 ? 1 : -1) * 2.5;
        tooltip.textContent = `✨ Blessed! ${CHARMS[currentCharmIndex]}`;
        setTimeout(() => tooltip.textContent = 'Taveez Overlay • Tap to Bless', 2500);
      }, 250);
    }
  });

  // Loop
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
