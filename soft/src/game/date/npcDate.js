// npcData.js - 設計資料に基づくNPCデータ
const npcData = [
  {
    icon : '/akamine.jpeg',
    name: "赤峰教授",
    affection: 8,
    maxAffection: 128,
    category: 'professor',
    skills: ['教授の機嫌を読む'],
    description: '温厚だが期限には厳しい教授。研究ルートの要となる人物。'
  },
  {
    icon : 'syou.png',
    name: "真田翔",
    affection: 10,
    maxAffection: 128,
    category: 'classmate',
    skills: ['提出力サポート'],
    description: '陽気でムードメーカーなクラスメイト。困ったときに頼りになる。'
  },
  {
    icon : 'rei.png',
    name: "美濃玲",
    affection: 6,
    maxAffection: 128,
    category: 'senior',
    skills: ['回路解読'],
    description: 'クールな工学系先輩。技術的な指導を受けられる。'
  },
  {
    icon : 'miwa.png',
    name: "佐伯美和",
    affection: 4,
    maxAffection: 128,
    category: 'romantic',
    skills: ['後輩サポート要請'],
    description: '穏やかで努力家。一緒にいると心が落ち着く。'
  },
  {
    icon : 'nanami.png',
    name: "七海美月",
    affection: 12,
    maxAffection: 128,
    category: 'romantic',
    skills: ['応援'],
    description: '活発で明るい性格。いつもエネルギーに満ちている。'
  }
];

module.exports = npcData;
