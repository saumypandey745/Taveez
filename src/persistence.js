/**
 * Taveez — Persistence & Cross-Tab Synchronization Engine
 * 
 * Features:
 * - LocalStorage state management
 * - Namespaced storage keys for Website (taveez_) vs Browser Extension (taveez_ext_)
 * - Cross-tab real-time synchronization using BroadcastChannel with window 'storage' fallback
 * - Daily Streak tracking
 * - URL Query Parser (?charm=🪬&note=... and ?bless=1)
 * - postMessage API listener for developer triggers
 */

export class PersistenceManager {
  constructor(isExtension = false) {
    this.prefix = isExtension ? 'taveez_ext_' : 'taveez_';
    this.channelName = isExtension ? 'taveez_ext_channel' : 'taveez_channel';
    this.subscribers = [];

    // Initialize Cross-Tab Sync (BroadcastChannel with window storage event fallback)
    this.hasBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window;
    
    if (this.hasBroadcastChannel) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          this.notifySubscribers(event.data);
        };
      } catch (e) {
        this.hasBroadcastChannel = false;
      }
    }

    if (!this.hasBroadcastChannel && typeof window !== 'undefined') {
      // Fallback for browsers lacking BroadcastChannel (e.g., older Safari)
      window.addEventListener('storage', (event) => {
        if (event.key === this.getKey('sync_ping') && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.notifySubscribers(data.payload);
          } catch (err) {
            // Ignore parse errors
          }
        }
      });
    }

    // Set up postMessage listener for Git hooks / CI / bookmarklets
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TAVEEZ_BLESS') {
          this.notifySubscribers({ type: 'EXTERNAL_BLESS', note: event.data.note || '' });
        } else if (event.data && event.data.type === 'TAVEEZ_SET_CHARM') {
          if (event.data.charmId) {
            this.saveActiveCharm(event.data.charmId);
            this.notifySubscribers({ type: 'CHARM_CHANGED', charmId: event.data.charmId });
          }
        }
      });
    }
  }

  getKey(key) {
    return `${this.prefix}${key}`;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(cb => cb(data));
  }

  broadcast(data) {
    if (this.hasBroadcastChannel && this.channel) {
      this.channel.postMessage(data);
    } else if (typeof window !== 'undefined') {
      // Safari fallback: write payload + timestamp to localStorage to emit 'storage' event across tabs
      const pingKey = this.getKey('sync_ping');
      const payloadString = JSON.stringify({ payload: data, timestamp: Date.now() });
      try {
        localStorage.setItem(pingKey, payloadString);
      } catch (e) {
        // Storage access error handling
      }
    }
  }

  // --- Active Charm Persistence ---
  getActiveCharm() {
    try {
      return localStorage.getItem(this.getKey('charm')) || 'nazar';
    } catch (e) {
      return 'nazar';
    }
  }

  saveActiveCharm(charmId) {
    try {
      localStorage.setItem(this.getKey('charm'), charmId);
      this.broadcast({ type: 'CHARM_CHANGED', charmId });
    } catch (e) {}
  }

  // --- Garland Mode Persistence ---
  getGarlandCount() {
    try {
      const count = parseInt(localStorage.getItem(this.getKey('garland_count')), 10);
      return (count >= 1 && count <= 3) ? count : 1;
    } catch (e) {
      return 1;
    }
  }

  saveGarlandCount(count) {
    try {
      localStorage.setItem(this.getKey('garland_count'), count.toString());
      this.broadcast({ type: 'GARLAND_COUNT_CHANGED', count });
    } catch (e) {}
  }

  getGarlandCharms() {
    try {
      const saved = localStorage.getItem(this.getKey('garland_charms'));
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return ['nazar', 'hamsa', 'omamori'];
  }

  saveGarlandCharms(charmIdArray) {
    try {
      localStorage.setItem(this.getKey('garland_charms'), JSON.stringify(charmIdArray));
      this.broadcast({ type: 'GARLAND_CHARMS_CHANGED', charmIdArray });
    } catch (e) {}
  }

  // --- Theme Persistence ---
  getTheme() {
    try {
      return localStorage.getItem(this.getKey('theme')) || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(this.getKey('theme'), theme);
    } catch (e) {}
  }

  // --- Audio Persistence ---
  getAudioMuted() {
    try {
      return localStorage.getItem(this.getKey('audio_muted')) === 'true';
    } catch (e) {
      return false;
    }
  }

  saveAudioMuted(muted) {
    try {
      localStorage.setItem(this.getKey('audio_muted'), muted ? 'true' : 'false');
    } catch (e) {}
  }

  // --- Ritual Streak Tracker ---
  getStreakData() {
    const defaultData = { count: 0, lastBlessDate: '' };
    try {
      const saved = localStorage.getItem(this.getKey('streak_data'));
      if (!saved) return defaultData;
      
      const parsed = JSON.parse(saved);
      const todayStr = this.getTodayDateString();
      const yesterdayStr = this.getYesterdayDateString();

      // Reset streak if more than 1 day missed
      if (parsed.lastBlessDate && parsed.lastBlessDate !== todayStr && parsed.lastBlessDate !== yesterdayStr) {
        parsed.count = 0;
        localStorage.setItem(this.getKey('streak_data'), JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return defaultData;
    }
  }

  recordBlessing() {
    const todayStr = this.getTodayDateString();
    const streak = this.getStreakData();

    if (streak.lastBlessDate !== todayStr) {
      streak.count += 1;
      streak.lastBlessDate = todayStr;
      try {
        localStorage.setItem(this.getKey('streak_data'), JSON.stringify(streak));
        this.broadcast({ type: 'STREAK_UPDATED', streak });
      } catch (e) {}
    }
    return streak;
  }

  getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }

  // --- URL Query Params Parser ---
  parseUrlParams() {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const charmParam = params.get('charm');
    const noteParam = params.get('note');
    const blessParam = params.get('bless') === '1';

    return {
      charm: charmParam ? decodeURIComponent(charmParam) : null,
      note: noteParam ? decodeURIComponent(noteParam) : null,
      bless: blessParam
    };
  }
}
