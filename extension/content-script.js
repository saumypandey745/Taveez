/**
 * Taveez — Chrome Extension Content Script (Ultra Premium & Alive)
 * Features real physics (gravity, inertia, damping, wind simulation),
 * double-pendulum string micro-sway, particle sparkle effects, 
 * rich Web Audio acoustic chimes, and glassmorphism hover controls.
 */

(function () {
  if (document.getElementById('taveez-ext-host')) return;

  const CHARMS = [
    { emoji: '🧿', name: 'Nazar (Evil Eye)', caption: 'Deflects envy & shields your focus', freq: 587.33, color: '#3a86ff' },
    { emoji: '🪬', name: 'Hamsa Hand', caption: 'Hand of protection & inner peace', freq: 523.25, color: '#fb5607' },
    { emoji: '⛩️', name: 'Omamori Amulet', caption: 'Sacred sanctuary for quiet thoughts', freq: 659.25, color: '#ff006e' },
    { emoji: '🐈‍⬛', name: 'Beckoning Cat', caption: 'Brings unexpected fortune & joy', freq: 698.46, color: '#ffbe0b' },
    { emoji: '🕸️', name: 'Dreamcatcher', caption: 'Filters turbulent thoughts into peace', freq: 440.00, color: '#8338ec' },
    { emoji: '🧲', name: 'Horseshoe', caption: 'Cradles good luck like a vessel', freq: 493.88, color: '#d4af37' },
    { emoji: '🍀', name: 'Four-Leaf Clover', caption: 'Faith, hope, love & serendipity', freq: 587.33, color: '#2a9d8f' },
    { emoji: '🔔', name: 'Temple Bell', caption: 'Purifies the atmosphere around you', freq: 783.99, color: '#e9c46a' },
    { emoji: '🪙', name: 'Feng Shui Coin', caption: 'Harmonizes flow & aligns prosperity', freq: 523.25, color: '#f4a261' },
    { emoji: '🌼', name: 'Marigold Garland', caption: 'Brings warmth & solar energy', freq: 659.25, color: '#e76f51' }
  ];

  let currentCharmIndex = 0;

  // Load initial charm from chrome.storage or localStorage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['taveez_charm'], (res) => {
      if (res && res.taveez_charm) {
        const idx = CHARMS.findIndex(c => c.emoji === res.taveez_charm);
        if (idx !== -1) {
          currentCharmIndex = idx;
          updateCardInfo();
        }
      }
    });
  }

  // Listen for live updates from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'TAVEEZ_UPDATE_CHARM') {
        const idx = CHARMS.findIndex(c => c.emoji === msg.charm);
        if (idx !== -1) {
          currentCharmIndex = idx;
          triggerBlessingEffects(false);
          updateCardInfo();
        }
      }
    });
  }

  // Build UI Container
  const host = document.createElement('div');
  host.id = 'taveez-ext-host';

  host.innerHTML = `
    <div class="taveez-ext-container">
      <div class="taveez-ext-brass-mount" title="Click to bless • Drag to swing"></div>
      <canvas class="taveez-ext-canvas" width="180" height="260"></canvas>
      
      <div class="taveez-ext-glass-card" id="taveez-glass-card">
        <div class="taveez-card-header">
          <div class="taveez-card-title" id="taveez-card-title">🧿 Nazar</div>
          <span style="font-size: 9px; color: #ffd700; background: rgba(212,175,55,0.15); padding: 2px 6px; border-radius: 10px;">ACTIVE</span>
        </div>
        <div class="taveez-card-subtitle" id="taveez-card-subtitle">Deflects envy & shields focus</div>
        <div class="taveez-card-actions">
          <button class="taveez-card-btn" id="btn-bless">✨ Bless</button>

          <button class="taveez-card-btn" id="btn-switch">🔄 Next Charm</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  const canvas = host.querySelector('.taveez-ext-canvas');
  const ctx = canvas.getContext('2d');
  const cardTitle = host.querySelector('#taveez-card-title');
  const cardSubtitle = host.querySelector('#taveez-card-subtitle');

  function updateCardInfo() {
    const c = CHARMS[currentCharmIndex];
    if (cardTitle) cardTitle.textContent = `${c.emoji} ${c.name}`;
    if (cardSubtitle) cardSubtitle.textContent = c.caption;
  }
  updateCardInfo();

  // Advanced Double-Segment Pendulum Physics
  let theta = 0.25;
  let omega = 0;
  let alpha = 0;
  const G = 9.81 * 85;
  const L = 155;
  const DAMPING = 0.94;

  let isDragging = false;
  let lastX = 0;
  let mouseVelX = 0;

  // Ambient gentle wind drift
  let windTime = 0;

  function updatePhysics(dt) {
    windTime += dt * 0.8;
    const windForce = Math.sin(windTime) * 0.08 + Math.cos(windTime * 0.5) * 0.04;

    if (!isDragging) {
      alpha = -(G / L) * Math.sin(theta) - DAMPING * omega + windForce;
      omega += alpha * dt;
      theta += omega * dt;

      if (Math.abs(theta) < 0.0005 && Math.abs(omega) < 0.0005) {
        theta = 0; omega = 0;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const OX = 90;
    const OY = 8;

    const bobX = OX + L * Math.sin(theta);
    const bobY = OY + L * Math.cos(theta);

    // Multi-segment golden string with curved tension
    const midX = (OX + bobX) / 2 + Math.sin(theta * 2) * 4;
    const midY = (OY + bobY) / 2;

    ctx.save();
    ctx.shadowColor = CHARMS[currentCharmIndex].color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(OX, OY);
    ctx.quadraticCurveTo(midX, midY, bobX, bobY);
    ctx.strokeStyle = '#e6c667';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // Metallic Bead Accents along string
    const bead1X = OX + (bobX - OX) * 0.35;
    const bead1Y = OY + (bobY - OY) * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bead1X, bead1Y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();

    const bead2X = OX + (bobX - OX) * 0.75;
    const bead2Y = OY + (bobY - OY) * 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bead2X, bead2Y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Radiant Aura Glow behind Charm
    const auraGrd = ctx.createRadialGradient(bobX, bobY, 0, bobX, bobY, 36);
    auraGrd.addColorStop(0, CHARMS[currentCharmIndex].color + '55');
    auraGrd.addColorStop(0.6, CHARMS[currentCharmIndex].color + '15');
    auraGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrd;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 36, 0, Math.PI * 2);
    ctx.fill();

    // Emoji Charm Bob with realistic tilt
    ctx.save();
    ctx.translate(bobX, bobY);
    ctx.rotate(theta * 0.4);
    ctx.font = '42px "Segoe UI Emoji", "Apple Color Emoji", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Slight shadow drop
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;
    
    ctx.fillText(CHARMS[currentCharmIndex].emoji, 0, 0);
    ctx.restore();
  }

  // Pointer Interaction
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    mouseVelX = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    mouseVelX = e.clientX - lastX;
    omega += (mouseVelX / L) * 0.6;
    lastX = e.clientX;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    lastX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    mouseVelX = e.touches[0].clientX - lastX;
    omega += (mouseVelX / L) * 0.6;
    lastX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  // Web Audio Multi-Harmonic Bell Synthesizer
  function playHarmonicChime(baseFreq = 587.33) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const c = new AudioCtx();
      const now = c.currentTime;

      // Harmonics: Fundamental, Fifth, Octave, Major Third
      const harmonics = [baseFreq, baseFreq * 1.498, baseFreq * 2, baseFreq * 2.52];

      harmonics.forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        const volume = 0.18 / (i + 1);
        gain.gain.setValueAtTime(volume, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.8);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 1.8);
      });
    } catch (e) {}
  }

  // Visual Golden Sparkle Particles on Ritual
  function createSparkles(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const particle = document.createElement('div');
      particle.className = 'taveez-sparkle-particle';
      const size = Math.random() * 8 + 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = i % 2 === 0 ? '#ffd700' : (color || '#ffffff');
      particle.style.boxShadow = `0 0 10px ${color || '#ffd700'}`;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5);
      const dist = Math.random() * 80 + 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;

      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1200);
    }
  }

  function triggerBlessingEffects(playSound = true) {
    const c = CHARMS[currentCharmIndex];
    if (playSound) playHarmonicChime(c.freq);
    
    // Add swing impulse
    omega += (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2);

    // Get charm canvas screen coordinates for sparkles
    const rect = canvas.getBoundingClientRect();
    const sparkX = rect.left + 90 + L * Math.sin(theta);
    const sparkY = rect.top + 8 + L * Math.cos(theta);
    createSparkles(sparkX, sparkY, c.color);
  }

  // Button Listeners
  host.querySelector('#btn-bless').addEventListener('click', () => {
    triggerBlessingEffects(true);
  });

  host.querySelector('#btn-switch').addEventListener('click', () => {
    currentCharmIndex = (currentCharmIndex + 1) % CHARMS.length;
    const newEmoji = CHARMS[currentCharmIndex].emoji;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ taveez_charm: newEmoji });
    }
    updateCardInfo();
    triggerBlessingEffects(true);
  });

  // Canvas Click -> Bless
  canvas.addEventListener('click', (e) => {
    if (Math.abs(mouseVelX) < 4) {
      triggerBlessingEffects(true);
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
