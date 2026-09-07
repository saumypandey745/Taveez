/**
 * Taveez — User Interface & Interaction Controller
 */

import { CHARM_CATALOG, createCustomCharm, getCharmById } from './charms.js';

export class UIController {
  constructor(persistence, audio, onRitualTrigger, onCharmSelect, onGarlandCountChange) {
    this.persistence = persistence;
    this.audio = audio;
    this.onRitualTrigger = onRitualTrigger;
    this.onCharmSelect = onCharmSelect;
    this.onGarlandCountChange = onGarlandCountChange;

    this.selectedGarlandIndex = 0; // Active charm targeted by keyboard/controls in multi mode
    this.initDOM();
    this.bindEvents();
    this.renderGallery();
    this.updateStreakUI();
    this.applyTheme(this.persistence.getTheme());
    this.updateAudioButtonState(this.persistence.getAudioMuted());
  }

  initDOM() {
    this.elements = {
      body: document.body,
      srAnnouncer: document.getElementById('sr-announcer'),
      streakCount: document.getElementById('streak-count'),
      btnTheme: document.getElementById('btn-theme'),
      btnAudio: document.getElementById('btn-audio'),
      audioIcon: document.getElementById('audio-icon'),
      btnShare: document.getElementById('btn-share'),
      btnExtension: document.getElementById('btn-extension'),
      
      ritualBanner: document.getElementById('ritual-banner'),
      ritualEmoji: document.getElementById('ritual-emoji'),
      ritualTitle: document.getElementById('ritual-title'),
      ritualCaption: document.getElementById('ritual-caption'),

      segmentBtns: document.querySelectorAll('.segment-btn'),
      
      activeCharmIcon: document.getElementById('active-charm-icon'),
      activeCharmName: document.getElementById('active-charm-name'),
      activeCharmOrigin: document.getElementById('active-charm-origin'),
      btnPerformRitual: document.getElementById('btn-perform-ritual'),

      charmsGrid: document.getElementById('charms-grid'),
      customForm: document.getElementById('custom-emoji-form'),
      customEmojiInput: document.getElementById('custom-emoji-input'),
      customNameInput: document.getElementById('custom-name-input'),

      shareModal: document.getElementById('share-modal'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      shareNoteInput: document.getElementById('share-note-input'),
      shareUrlOutput: document.getElementById('share-url-output'),
      btnCopyUrl: document.getElementById('btn-copy-url'),

      extensionModal: document.getElementById('extension-modal'),
      extModalCloseBtn: document.getElementById('ext-modal-close-btn'),

      canvas: document.getElementById('pendulum-canvas')
    };
  }

  bindEvents() {
    // Ritual Button
    this.elements.btnPerformRitual.addEventListener('click', () => {
      this.triggerRitual();
    });

    // Theme Switcher
    this.elements.btnTheme.addEventListener('click', () => {
      const current = this.persistence.getTheme();
      const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
      this.applyTheme(next);
      this.persistence.saveTheme(next);
      this.announce(`Theme changed to ${next}`);
    });

    // Audio Switcher
    this.elements.btnAudio.addEventListener('click', () => {
      const muted = !this.persistence.getAudioMuted();
      this.persistence.saveAudioMuted(muted);
      this.audio.setMuted(muted);
      this.updateAudioButtonState(muted);
      this.announce(muted ? 'Sound muted' : 'Sound enabled');
    });

    // Garland Count Segmented Control
    this.elements.segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const count = parseInt(btn.dataset.count, 10);
        this.elements.segmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.persistence.saveGarlandCount(count);
        if (this.onGarlandCountChange) this.onGarlandCountChange(count);
        this.announce(`Garland mode set to ${count} charm${count > 1 ? 's' : ''}`);
      });
    });

    // Custom Emoji Form
    this.elements.customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emoji = this.elements.customEmojiInput.value.trim();
      const name = this.elements.customNameInput.value.trim();

      if (!emoji) return;

      const customCharm = createCustomCharm(emoji, name);
      this.onCharmSelect(customCharm, this.selectedGarlandIndex);
      this.updateActiveCharmBar(customCharm);
      this.renderGallery();
      this.elements.customEmojiInput.value = '';
      this.elements.customNameInput.value = '';
      this.announce(`Hung custom talisman: ${customCharm.name}`);
    });

    // Modals
    this.elements.btnShare.addEventListener('click', () => this.openShareModal());
    this.elements.modalCloseBtn.addEventListener('click', () => this.closeModals());
    this.elements.btnExtension.addEventListener('click', () => this.openExtensionModal());
    this.elements.extModalCloseBtn.addEventListener('click', () => this.closeModals());

    this.elements.shareNoteInput.addEventListener('input', () => this.updateShareUrl());
    this.elements.btnCopyUrl.addEventListener('click', () => this.copyShareUrl());

    // Close modal on backdrop click
    [this.elements.shareModal, this.elements.extensionModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModals();
      });
    });

    // Keyboard Shortcuts & Accessibility
    window.addEventListener('keydown', (e) => {
      // Don't trigger hotkeys if user is typing in form inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.triggerRitual();
      } else if (e.key === '1') {
        this.selectedGarlandIndex = 0;
        this.announce('Targeted charm 1');
      } else if (e.key === '2') {
        this.selectedGarlandIndex = 1;
        this.announce('Targeted charm 2');
      } else if (e.key === '3') {
        this.selectedGarlandIndex = 2;
        this.announce('Targeted charm 3');
      }
    });
  }

  announce(text) {
    if (this.elements.srAnnouncer) {
      this.elements.srAnnouncer.textContent = text;
    }
  }

  applyTheme(theme) {
    this.elements.body.classList.remove('theme-dark', 'theme-light', 'theme-auto');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.elements.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      this.elements.body.classList.add(`theme-${theme}`);
    }
  }

  updateAudioButtonState(muted) {
    this.elements.audioIcon.textContent = muted ? '🔇' : '🔔';
  }

  renderGallery(selectedCharmId = this.persistence.getActiveCharm()) {
    this.elements.charmsGrid.innerHTML = '';

    CHARM_CATALOG.forEach(charm => {
      const card = document.createElement('div');
      card.className = `charm-card ${charm.id === selectedCharmId ? 'selected' : ''}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Select ${charm.name}`);

      card.innerHTML = `
        <span class="charm-card-icon">${charm.emoji}</span>
        <h3 class="charm-card-title">${charm.name}</h3>
        <p class="charm-card-origin">${charm.origin}</p>
      `;

      const handleSelect = () => {
        document.querySelectorAll('.charm-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.updateActiveCharmBar(charm);
        this.onCharmSelect(charm, this.selectedGarlandIndex);
        this.announce(`Selected charm ${charm.name}`);
      };

      card.addEventListener('click', handleSelect);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      this.elements.charmsGrid.appendChild(card);
    });
  }

  updateActiveCharmBar(charm) {
    this.elements.activeCharmIcon.textContent = charm.emoji;
    this.elements.activeCharmName.textContent = charm.name;
    this.elements.activeCharmOrigin.textContent = charm.origin;
  }

  setGarlandSegmentActive(count) {
    this.elements.segmentBtns.forEach(b => {
      if (parseInt(b.dataset.count, 10) === count) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  triggerRitual(charm = getCharmById(this.persistence.getActiveCharm()), customNote = '') {
    // Play sound
    this.audio.playRitualSound(charm.soundPreset || 'bell');

    // Update streak data
    const newStreak = this.persistence.recordBlessing();
    this.updateStreakUI(newStreak);

    // Show Banner
    this.elements.ritualEmoji.textContent = charm.emoji;
    this.elements.ritualTitle.textContent = charm.ritualTitle || 'Blessing Granted';
    this.elements.ritualCaption.textContent = customNote || charm.ritualCaption || 'May peace and protection follow you.';
    
    this.elements.ritualBanner.classList.remove('hidden');

    this.announce(`Ritual performed: ${charm.ritualTitle}`);

    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.elements.ritualBanner.classList.add('hidden');
    }, 4500);

    if (this.onRitualTrigger) {
      this.onRitualTrigger(charm, this.selectedGarlandIndex);
    }
  }

  updateStreakUI(streakData = this.persistence.getStreakData()) {
    this.elements.streakCount.textContent = streakData.count;
  }

  openShareModal() {
    this.updateShareUrl();
    this.elements.shareModal.classList.remove('hidden');
  }

  updateShareUrl() {
    const currentCharmId = this.persistence.getActiveCharm();
    const charmObj = getCharmById(currentCharmId);
    const note = encodeURIComponent(this.elements.shareNoteInput.value.trim());

    const baseUrl = window.location.origin + window.location.pathname;
    let url = `${baseUrl}?charm=${encodeURIComponent(charmObj.emoji)}`;
    if (note) url += `&note=${note}`;

    this.elements.shareUrlOutput.value = url;
  }

  copyShareUrl() {
    this.elements.shareUrlOutput.select();
    navigator.clipboard.writeText(this.elements.shareUrlOutput.value)
      .then(() => {
        const originalText = this.elements.btnCopyUrl.textContent;
        this.elements.btnCopyUrl.textContent = 'Copied! ✨';
        setTimeout(() => {
          this.elements.btnCopyUrl.textContent = originalText;
        }, 2000);
      })
      .catch(() => {
        document.execCommand('copy');
      });
  }

  openExtensionModal() {
    this.elements.extensionModal.classList.remove('hidden');
  }

  closeModals() {
    this.elements.shareModal.classList.add('hidden');
    this.elements.extensionModal.classList.add('hidden');
  }
}
