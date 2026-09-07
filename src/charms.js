/**
 * Taveez — Charm Registry & Ritual Data Definitions
 */

export const CHARM_CATALOG = [
  {
    id: 'nazar',
    emoji: '🧿',
    name: 'Nazar (Evil Eye)',
    origin: 'Mediterranean / Anatolian Tradition',
    ritualTitle: 'Ward Off Negativity',
    ritualCaption: 'The protective eye reflects envy and deflects harm, surrounding you with clarity.',
    soundPreset: 'bell',
    accentColor: '#3a86ff'
  },
  {
    id: 'hamsa',
    emoji: '🪬',
    name: 'Hamsa Hand',
    origin: 'Middle Eastern & North African Blessing',
    ritualTitle: 'Hand of Protection & Grace',
    ritualCaption: 'Five fingers extend peace, health, and spiritual defense across your journey.',
    soundPreset: 'chime',
    accentColor: '#fb5607'
  },
  {
    id: 'omamori',
    emoji: '⛩️',
    name: 'Omamori Amulet',
    origin: 'Japanese Shinto & Buddhist Sanctuary',
    ritualTitle: 'Sacred Temple Renewal',
    ritualCaption: 'Consecrated brocade holds quiet strength, shielding your mind from turbulence.',
    soundPreset: 'bowl',
    accentColor: '#ff006e'
  },
  {
    id: 'maneki_neko',
    emoji: '🐈‍⬛',
    name: 'Beckoning Cat',
    origin: 'East Asian Fortune & Welcome',
    ritualTitle: 'Beckon Prosperity',
    ritualCaption: 'The raised paw gathers fortunate encounters, unexpected joy, and abundance.',
    soundPreset: 'gong',
    accentColor: '#ffbe0b'
  },
  {
    id: 'dreamcatcher',
    emoji: '🕸️',
    name: 'Sacred Dreamcatcher',
    origin: 'Native Sacred Hoop Tradition',
    ritualTitle: 'Filter the Ether',
    ritualCaption: 'Intricate threads filter turbulent thoughts, allowing only peaceful dreams to pass.',
    soundPreset: 'wood',
    accentColor: '#8338ec'
  },
  {
    id: 'horseshoe',
    emoji: '🧲',
    name: 'Iron Horseshoe',
    origin: 'Western Folklore & Ironcraft',
    ritualTitle: 'Store Good Fortune',
    ritualCaption: 'Forged iron cradles luck like a vessel, keeping mischance far away.',
    soundPreset: 'bell',
    accentColor: '#d4af37'
  },
  {
    id: 'clover',
    emoji: '🍀',
    name: 'Four-Leaf Clover',
    origin: 'Celtic Legend & Nature Blessing',
    ritualTitle: 'Whisper of Serendipity',
    ritualCaption: 'Faith, hope, love, and luck bloom together in harmony.',
    soundPreset: 'chime',
    accentColor: '#2a9d8f'
  },
  {
    id: 'temple_bell',
    emoji: '🔔',
    name: 'Brass Temple Bell',
    origin: 'South Asian & Vedic Reverence',
    ritualTitle: 'Purify the Atmosphere',
    ritualCaption: 'Resonant brass resonance dissolves stagnation and restores spatial harmony.',
    soundPreset: 'bell',
    accentColor: '#e9c46a'
  },
  {
    id: 'fengshui_coin',
    emoji: '🪙',
    name: 'Feng Shui Prosperity Coin',
    origin: 'Traditional Chinese Geometry',
    ritualTitle: 'Harmonize Flow',
    ritualCaption: 'Square center meets round rim, aligning heaven, earth, and personal effort.',
    soundPreset: 'gong',
    accentColor: '#f4a261'
  },
  {
    id: 'garland',
    emoji: '🌼',
    name: 'Marigold Garland',
    origin: 'Festival & Devotional Blessing',
    ritualTitle: 'Refresh Sacred Garland',
    ritualCaption: 'Vibrant marigold petals bring warmth, solar energy, and welcoming grace.',
    soundPreset: 'chime',
    accentColor: '#e76f51'
  }
];

export function getCharmById(id) {
  const found = CHARM_CATALOG.find(c => c.id === id);
  if (found) return found;

  // Check if it's a custom emoji charm
  if (id.startsWith('custom_')) {
    const rawEmoji = decodeURIComponent(id.replace('custom_', ''));
    return createCustomCharm(rawEmoji);
  }

  return CHARM_CATALOG[0]; // fallback
}

export function createCustomCharm(emoji, customName = '') {
  const name = customName.trim() || `Custom Talisman (${emoji})`;
  const safeId = `custom_${encodeURIComponent(emoji)}`;
  return {
    id: safeId,
    emoji: emoji,
    name: name,
    origin: 'Personal Intent & Choice',
    ritualTitle: 'Infuse Personal Intention',
    ritualCaption: `Your custom talisman (${emoji}) radiates unique personal luck and protection.`,
    soundPreset: 'bell',
    accentColor: '#d4af37'
  };
}
