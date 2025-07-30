/**
 * NPCイベントデータ
 * 好感度に基づくNPCとの特別なイベント
 */

export const npcEventTemplates = {
  // 好感度32以上での基本イベント
  friendship_32: {
    title: 'との会話',
    content: 'と楽しい時間を過ごしました',
    rewards: { 
      statBonus: { social: 3 }, 
      stress: -5 
    },
    requiredAffection: 32
  },
  
  // 好感度64以上での協力イベント
  cooperation_64: {
    title: 'との協力',
    content: 'があなたの勉強を手伝ってくれました',
    rewards: { 
      statBonus: { theory: 5, submission: 3 } 
    },
    requiredAffection: 64
  },
  
  // 好感度100以上での特別イベント
  special_100: {
    title: 'との特別な時間',
    content: 'との絆が深まり、特別なスキルを習得しました！',
    rewards: { 
      statBonus: { social: 10 },
      skillUnlock: true 
    },
    requiredAffection: 100
  }
};

export const npcSpecificEvents = {
  '赤峰教授': {
    64: {
      title: '研究指導',
      content: '赤峰教授から個人的な研究指導を受けました',
      rewards: { 
        statBonus: { theory: 8, submission: 2 },
        items: ['高級参考書']
      }
    },
    100: {
      title: '推薦状',
      content: '教授があなたのために推薦状を書いてくれました',
      rewards: { 
        statBonus: { theory: 15, social: 5 },
        skillUnlock: '教授の機嫌を読む',
        specialFlag: 'professor_recommendation'
      }
    }
  },
  
  '真田翔': {
    64: {
      title: 'グループ学習',
      content: '真田翔と一緒にグループ学習をしました',
      rewards: { 
        statBonus: { submission: 6, social: 4 },
        stress: -8
      }
    },
    100: {
      title: '親友の絆',
      content: '真田翔との友情が深まりました',
      rewards: { 
        statBonus: { social: 12, submission: 8 },
        skillUnlock: '提出力サポート',
        specialFlag: 'best_friend_sanada'
      }
    }
  },
  
  '美濃玲': {
    64: {
      title: '技術解説',
      content: '美濃玲から高度な技術について教わりました',
      rewards: { 
        statBonus: { theory: 10, submission: 1 },
        items: ['万能ツール']
      }
    },
    100: {
      title: '先輩の信頼',
      content: '美濃玲から完全に信頼されるようになりました',
      rewards: { 
        statBonus: { theory: 18, social: 3 },
        skillUnlock: '回路解読',
        specialFlag: 'senior_trust_mino'
      }
    }
  },
  
  '佐伯美和': {
    64: {
      title: '勉強会',
      content: '佐伯美和と静かに勉強会をしました',
      rewards: { 
        statBonus: { theory: 4, social: 6 },
        stress: -10
      }
    },
    100: {
      title: '特別な関係',
      content: '佐伯美和との関係が特別なものになりました',
      rewards: { 
        statBonus: { social: 15, theory: 5 },
        skillUnlock: '後輩サポート要請',
        specialFlag: 'romantic_saeki',
        stress: -15
      }
    }
  },
  
  '七海美月': {
    64: {
      title: '応援練習',
      content: '七海美月と一緒に応援の練習をしました',
      rewards: { 
        statBonus: { social: 8, hp: 15 },
        stress: -12
      }
    },
    100: {
      title: '一番の理解者',
      content: '七海美月があなたの一番の理解者になりました',
      rewards: { 
        statBonus: { social: 20, maxHP: 25 },
        skillUnlock: '応援',
        specialFlag: 'romantic_nanami',
        stress: -20
      }
    }
  }
};

export const getAvailableNPCEvent = (npcName, affection) => {
  // NPC固有のイベントを優先
  const specificEvents = npcSpecificEvents[npcName];
  if (specificEvents) {
    // 高い好感度のイベントから優先的にチェック
    const thresholds = [100, 64].filter(threshold => affection >= threshold);
    for (const threshold of thresholds) {
      if (specificEvents[threshold]) {
        return {
          ...specificEvents[threshold],
          npcName: npcName,
          type: 'specific',
          threshold: threshold
        };
      }
    }
  }
  
  // 汎用イベントを使用
  if (affection >= 100) {
    return {
      ...npcEventTemplates.special_100,
      title: `${npcName}${npcEventTemplates.special_100.title}`,
      content: `${npcName}${npcEventTemplates.special_100.content}`,
      npcName: npcName,
      type: 'template',
      threshold: 100
    };
  } else if (affection >= 64) {
    return {
      ...npcEventTemplates.cooperation_64,
      title: `${npcName}${npcEventTemplates.cooperation_64.title}`,
      content: `${npcName}${npcEventTemplates.cooperation_64.content}`,
      npcName: npcName,
      type: 'template',
      threshold: 64
    };
  } else if (affection >= 32) {
    return {
      ...npcEventTemplates.friendship_32,
      title: `${npcName}${npcEventTemplates.friendship_32.title}`,
      content: `${npcName}${npcEventTemplates.friendship_32.content}`,
      npcName: npcName,
      type: 'template',
      threshold: 32
    };
  }
  
  return null;
};
