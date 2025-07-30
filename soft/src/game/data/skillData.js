/**
 * スキルシステムデータ
 * バトルで使用可能なスキル定義
 */

export const battleSkills = {
  'power_attack': {
    id: 'power_attack',
    name: '強力な一撃',
    description: '提出力を1.5倍にして攻撃',
    spCost: 10,
    icon: '💥',
    type: 'attack',
    effect: (playerStats, enemy) => ({
      damage: Math.floor(playerStats.submission * 1.5),
      message: '強力な一撃で敵にダメージを与えた！'
    })
  },
  'focus': {
    id: 'focus',
    name: '集中',
    description: '理論力を一時的に向上させる',
    spCost: 8,
    icon: '🧠',
    type: 'buff',
    effect: (playerStats) => ({
      statBoost: { theory: 5 },
      message: '集中力が高まり理論力が向上した！'
    })
  },
  'teamwork': {
    id: 'teamwork',
    name: 'チームワーク',
    description: '社交性と提出力を向上させる',
    spCost: 12,
    icon: '🤝',
    type: 'buff',
    effect: (playerStats) => ({
      statBoost: { social: 8, submission: 3 },
      message: 'チームワークで能力が向上した！'
    })
  },
  'critical_thinking': {
    id: 'critical_thinking',
    name: '批判的思考',
    description: '理論力を大幅に向上、敵の防御を無視',
    spCost: 15,
    icon: '🔍',
    type: 'special',
    effect: (playerStats, enemy) => ({
      damage: Math.floor(playerStats.theory * 2),
      ignoreDefense: true,
      message: '批判的思考で敵の弱点を突いた！'
    })
  },
  'stress_relief': {
    id: 'stress_relief',
    name: 'ストレス解消',
    description: 'ストレスを軽減し、HPとSPを回復',
    spCost: 5,
    icon: '😌',
    type: 'heal',
    effect: (playerStats) => ({
      heal: { hp: 20, sp: 10 },
      statChange: { stress: -10 },
      message: 'リラックスして体力と精神力が回復した！'
    })
  }
};

export const npcSkills = {
  '教授の機嫌を読む': {
    id: 'professor_mood',
    name: '教授の機嫌を読む',
    description: '教授系の敵に対してダメージボーナス',
    passive: true,
    effect: '教授系敵への攻撃力+20%'
  },
  '提出力サポート': {
    id: 'submission_support',
    name: '提出力サポート',
    description: '提出力関連のスキル効果+50%',
    passive: true,
    effect: '提出力スキルの効果向上'
  },
  '回路解読': {
    id: 'circuit_analysis',
    name: '回路解読',
    description: '技術系の課題で有利',
    passive: true,
    effect: '工学系バトルでダメージ+30%'
  },
  '後輩サポート要請': {
    id: 'junior_support',
    name: '後輩サポート要請',
    description: '社交性を使ったスキルの効果向上',
    passive: true,
    effect: '社交性スキルのSPコスト-2'
  },
  '応援': {
    id: 'encouragement',
    name: '応援',
    description: 'バトル開始時にステータス小幅上昇',
    passive: true,
    effect: 'バトル開始時: 全ステータス+5'
  }
};

export const getSkillById = (skillId) => {
  return battleSkills[skillId] || npcSkills[skillId] || null;
};

export const getPlayerAvailableSkills = (playerSkills, playerLevel) => {
  const available = [];
  
  // 基本スキル（レベルに応じて解放）
  if (playerLevel >= 1) available.push(battleSkills.power_attack);
  if (playerLevel >= 3) available.push(battleSkills.focus);
  if (playerLevel >= 5) available.push(battleSkills.teamwork);
  if (playerLevel >= 8) available.push(battleSkills.critical_thinking);
  if (playerLevel >= 2) available.push(battleSkills.stress_relief);
  
  // NPCから習得したスキル
  playerSkills.forEach(skillName => {
    const skill = npcSkills[skillName];
    if (skill) available.push(skill);
  });
  
  return available;
};
