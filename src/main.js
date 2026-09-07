/**
 * Taveez — Application Bootstrap & Main Loop Orchestrator
 */

import { Pendulum, AmbientWind, checkCollisions, renderPendulum } from './physics.js';
import { getCharmById, CHARM_CATALOG, createCustomCharm } from './charms.js';
import * as AudioEngine from './audio.js';
import { PersistenceManager } from './persistence.js';
import { UIController } from './ui.js';

class TaveezApp {
  constructor() {
    this.persistence = new PersistenceManager(false); // Website mode
    this.wind = new AmbientWind();
    this.pendulums = [];
    this.activeGarlandCount = this.persistence.getGarlandCount();
    
    this.canvas = document.getElementById('pendulum-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.isTabVisible = true;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initPendulums();
    this.initCanvas();
    this.initUI();
    this.initPointerEvents();
    this.initSyncListeners();
    this.handleUrlParams();
    this.startAnimationLoop();

    // Listen for window resize & tab visibility
    window.addEventListener('resize', () => this.initCanvas());
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
    });
  }

  initCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);

    // Update pendulum origin points relative to canvas width
    this.repositionPendulums();
  }

  initPendulums() {
    const activeCharmId = this.persistence.getActiveCharm();
    const garlandCharms = this.persistence.getGarlandCharms();
    
    // Ensure active charm is first element
    if (garlandCharms.length === 0 || garlandCharms[0] !== activeCharmId) {
      garlandCharms[0] = activeCharmId;
    }

    this.pendulums = [];
    for (let i = 0; i < 3; i++) {
      const charmId = garlandCharms[i] || CHARM_CATALOG[i % CHARM_CATALOG.length].id;
      const charmObj = getCharmById(charmId);
      const pendulum = new Pendulum(`p_${i}`, charmObj.emoji, 0, 18, 170, 1.0);
      this.pendulums.push(pendulum);
    }
    this.repositionPendulums();
  }

  repositionPendulums() {
    const count = this.activeGarlandCount;
    const centerX = this.width / 2;

    if (count === 1) {
      this.pendulums[0].originX = centerX;
    } else if (count === 2) {
      const gap = 110;
      this.pendulums[0].originX = centerX - gap / 2;
      this.pendulums[1].originX = centerX + gap / 2;
    } else if (count === 3) {
      const gap = 100;
      this.pendulums[0].originX = centerX - gap;
      this.pendulums[1].originX = centerX;
      this.pendulums[2].originX = centerX + gap;
    }
  }

  initUI() {
    this.ui = new UIController(
      this.persistence,
      AudioEngine,
      // Ritual Trigger Callback
      (charmObj, garlandIndex) => {
        const targetIndex = Math.min(garlandIndex, this.activeGarlandCount - 1);
        if (this.pendulums[targetIndex]) {
          this.pendulums[targetIndex].triggerRitualPulse();
        }
      },
      // Charm Selection Callback
      (charmObj, garlandIndex) => {
        const targetIndex = Math.min(garlandIndex, this.activeGarlandCount - 1);
        if (this.pendulums[targetIndex]) {
          this.pendulums[targetIndex].emoji = charmObj.emoji;
          this.pendulums[targetIndex].triggerRitualPulse();

          // Save active charm
          if (targetIndex === 0) {
            this.persistence.saveActiveCharm(charmObj.id);
          }

          // Save garland set
          const currentGarland = this.persistence.getGarlandCharms();
          currentGarland[targetIndex] = charmObj.id;
          this.persistence.saveGarlandCharms(currentGarland);
        }
      },
      // Garland Mode Count Change Callback
      (count) => {
        this.activeGarlandCount = count;
        this.repositionPendulums();
      }
    );

    this.ui.setGarlandSegmentActive(this.activeGarlandCount);
  }

  initPointerEvents() {
    let activeDragPendulum = null;

    const getCanvasCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      const coords = getCanvasCoords(e);
      
      // Find closest pendulum bob within drag hit area
      let closest = null;
      let minDist = 60; // hit area radius

      for (let i = 0; i < this.activeGarlandCount; i++) {
        const p = this.pendulums[i];
        const bob = p.getBobPosition();
        const dist = Math.hypot(coords.x - bob.x, coords.y - bob.y);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }

      if (closest) {
        activeDragPendulum = closest;
        closest.startDrag(coords.x, coords.y);
        AudioEngine.playSwingTick();
      }
    };

    const handlePointerMove = (e) => {
      if (!activeDragPendulum) return;
      const coords = getCanvasCoords(e);
      activeDragPendulum.dragMove(coords.x, coords.y);
    };

    const handlePointerUp = () => {
      if (activeDragPendulum) {
        activeDragPendulum.endDrag();
        activeDragPendulum = null;
      }
    };

    // Pointer Events
    this.canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Touch Events
    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Arrow Key Nudges
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const targetIndex = Math.min(this.ui.selectedGarlandIndex, this.activeGarlandCount - 1);
      const pendulum = this.pendulums[targetIndex];

      if (pendulum) {
        if (e.key === 'ArrowLeft') {
          pendulum.nudge(-1.8);
          AudioEngine.playSwingTick();
        } else if (e.key === 'ArrowRight') {
          pendulum.nudge(1.8);
          AudioEngine.playSwingTick();
        }
      }
    });
  }

  initSyncListeners() {
    this.persistence.subscribe((data) => {
      if (data.type === 'CHARM_CHANGED') {
        const charmObj = getCharmById(data.charmId);
        if (this.pendulums[0]) {
          this.pendulums[0].emoji = charmObj.emoji;
          this.pendulums[0].triggerRitualPulse();
        }
        this.ui.renderGallery(data.charmId);
        this.ui.updateActiveCharmBar(charmObj);
      } else if (data.type === 'GARLAND_COUNT_CHANGED') {
        this.activeGarlandCount = data.count;
        this.repositionPendulums();
        this.ui.setGarlandSegmentActive(data.count);
      } else if (data.type === 'STREAK_UPDATED') {
        this.ui.updateStreakUI(data.streak);
      } else if (data.type === 'EXTERNAL_BLESS') {
        this.ui.triggerRitual(getCharmById(this.persistence.getActiveCharm()), data.note);
      }
    });
  }

  handleUrlParams() {
    const params = this.persistence.parseUrlParams();
    
    // If custom emoji charm passed in URL
    if (params.charm) {
      let charmObj = CHARM_CATALOG.find(c => c.emoji === params.charm);
      if (!charmObj) {
        charmObj = createCustomCharm(params.charm);
      }
      this.persistence.saveActiveCharm(charmObj.id);
      this.pendulums[0].emoji = charmObj.emoji;
      this.ui.renderGallery(charmObj.id);
      this.ui.updateActiveCharmBar(charmObj);
    }

    // If ?bless=1 trigger present in URL
    if (params.bless) {
      setTimeout(() => {
        const charmObj = getCharmById(this.persistence.getActiveCharm());
        this.ui.triggerRitual(charmObj, params.note || 'Blessing triggered via developer URL link.');
      }, 500);
    }
  }

  startAnimationLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      requestAnimationFrame(loop);

      // Battery awareness: pause updates when tab hidden
      if (!this.isTabVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.033); // Cap dt to prevent huge leaps
      lastTime = now;

      // Clear Canvas
      this.ctx.clearRect(0, 0, this.width, this.height);

      const isDark = document.body.classList.contains('theme-dark') || 
        (document.body.classList.contains('theme-auto') && window.matchMedia('(prefers-color-scheme: dark)').matches);

      const windForce = this.prefersReducedMotion ? 0 : this.wind.getForce(dt);

      // Update & Render active pendulums
      for (let i = 0; i < this.activeGarlandCount; i++) {
        const pendulum = this.pendulums[i];
        
        if (!this.prefersReducedMotion) {
          pendulum.update(dt, windForce);
        }

        const isFocused = (document.activeElement === this.canvas) && (this.ui.selectedGarlandIndex === i);
        renderPendulum(this.ctx, pendulum, { isDark, isFocused });
      }

      // Check multi-charm collisions
      if (this.activeGarlandCount > 1 && !this.prefersReducedMotion) {
        const activeSet = this.pendulums.slice(0, this.activeGarlandCount);
        checkCollisions(activeSet, () => {
          AudioEngine.playSwingTick();
        });
      }
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap Taveez App when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TaveezApp());
} else {
  new TaveezApp();
}
