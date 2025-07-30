/**
 * ガチャアイテムデータ
 * ガチャシステムで使用するアイテム定義
 */

export const gachaItemTables = {
  normal: [
    { name: 'エナジードリンク', rarity: 'common', effect: { sp: 20 }, probability: 50, icon: '⚡' },
    { name: '栄養食品', rarity: 'common', effect: { hp: 25 }, probability: 30, icon: '🥗' },
    { name: '参考書', rarity: 'rare', effect: { theory: 3 }, probability: 15, icon: '📚' },
    { name: 'プレゼンキット', rarity: 'rare', effect: { social: 3 }, probability: 5, icon: '🎤' }
  ],
  premium: [
    { name: '高級参考書', rarity: 'rare', effect: { theory: 8 }, probability: 40, icon: '📖' },
    { name: '万能ツール', rarity: 'rare', effect: { submission: 8 }, probability: 30, icon: '🔧' },
    { name: 'カリスマセット', rarity: 'epic', effect: { social: 12 }, probability: 20, icon: '✨' },
    { name: '超集中薬', rarity: 'epic', effect: { theory: 15, sp: 50 }, probability: 10, icon: '💊' }
  ],
  special: [
    { name: '伝説の教科書', rarity: 'legendary', effect: { theory: 25, submission: 15 }, probability: 30, icon: '📜' },
    { name: '最強のお守り', rarity: 'legendary', effect: { maxHP: 50, maxSP: 50 }, probability: 25, icon: '🍀' },
    { name: '天才の証明', rarity: 'legendary', effect: { theory: 50 }, probability: 20, icon: '🏆' },
    { name: '友情の絆', rarity: 'legendary', effect: { social: 30, stress: -20 }, probability: 15, icon: '💝' },
    { name: '時空の腕時計', rarity: 'mythic', effect: { theory: 100, submission: 100, social: 100 }, probability: 10, icon: '⌚' }
  ]
};

export const rarityConfig = {
  common: { color: '#6c757d', label: 'コモン' },
  rare: { color: '#007bff', label: 'レア' },
  epic: { color: '#6f42c1', label: 'エピック' },
  legendary: { color: '#fd7e14', label: 'レジェンダリー' },
  mythic: { color: '#dc3545', label: 'ミシック' }
};

export const getGachaItems = (gachaType) => {
  return gachaItemTables[gachaType] || gachaItemTables.normal;
};

export const getRarityConfig = (rarity) => {
  return rarityConfig[rarity] || rarityConfig.common;
};
