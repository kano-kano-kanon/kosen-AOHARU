/**
 * ゲーム状態管理クラス
 * 設計資料に基づくステータス・好感度システムの実装
 */

class GameState {
  constructor() {
    // プレイヤーステータス
    this.playerStats = {
      hp: 100,           // 体力
      sp: 100,           // 精神的リソース
      submission: 30,    // 提出力
      theory: 25,        // 理論力
      social: 20,        // 社交性
      stress: 0,         // ストレス
      money: 1000,       // 所持金
      level: 1,          // レベル
      experience: 0,     // 経験値
      maxHP: 100,        // 最大HP
      maxSP: 100         // 最大SP
    };

    // NPCデータ（設計資料に基づく）
    this.npcs = {
      '赤峰教授': {
        name: '赤峰教授',
        affection: 8,      // 好感度 (0-128)
        maxAffection: 128,
        category: 'professor',
        skills: ['教授の機嫌を読む'],
        description: '温厚だが期限には厳しい教授'
      },
      '真田翔': {
        name: '真田翔',
        affection: 10,
        maxAffection: 128,
        category: 'classmate',
        skills: ['提出力サポート'],
        description: '陽気でムードメーカーなクラスメイト'
      },
      '美濃玲': {
        name: '美濃玲',
        affection: 6,
        maxAffection: 128,
        category: 'senior',
        skills: ['回路解読'],
        description: 'クールな工学系先輩'
      },
      '佐伯美和': {
        name: '佐伯美和',
        affection: 4,
        maxAffection: 128,
        category: 'romantic',
        skills: ['後輩サポート要請'],
        description: '穏やかで努力家'
      },
      '七海美月': {
        name: '七海美月',
        affection: 12,
        maxAffection: 128,
        category: 'romantic',
        skills: ['応援'],
        description: '活発で明るい性格'
      }
    };

    // ゲーム進行状態
    this.gamePhase = 'daily';  // daily, action, battle, evaluation
    this.currentChapter = 1;
    this.currentWeek = 1;
    this.totalWeeks = 12;      // 1学期 = 12週間

    // プレイヤーが習得したスキル
    this.playerSkills = [];

    // フラグ管理
    this.flags = new Set();

    // 選択履歴
    this.choiceHistory = [];

    // 撃破した敵のリスト（再戦用）
    this.defeatedEnemies = [];

    // 管理者機能
    this.isAdmin = false;
    this.adminPasswordHash = 'mnsd2025x'; 
    
    // ショップシステム
    this.shopItems = [
      {
        id: 'energy_drink',
        name: 'エナジードリンク',
        description: 'SP+20回復',
        price: 150,
        effect: { sp: 20 },
        category: 'consumable',
        icon: '⚡'
      },
      {
        id: 'health_food',
        name: '栄養食品',
        description: 'HP+25回復',
        price: 200,
        effect: { hp: 25 },
        category: 'consumable',
        icon: '🥗'
      },
      {
        id: 'stress_relief',
        name: 'リラックスグッズ',
        description: 'ストレス-15軽減',
        price: 300,
        effect: { stress: -15 },
        category: 'consumable',
        icon: '🧘'
      },
      {
        id: 'study_guide',
        name: '参考書',
        description: '理論力+2永続強化',
        price: 500,
        effect: { theory: 2 },
        category: 'upgrade',
        icon: '📚'
      },
      {
        id: 'presentation_kit',
        name: 'プレゼンキット',
        description: '社交性+2永続強化',
        price: 450,
        effect: { social: 2 },
        category: 'upgrade',
        icon: '🎤'
      },
      {
        id: 'time_planner',
        name: 'スケジュール帳',
        description: '提出力+3永続強化',
        price: 400,
        effect: { submission: 3 },
        category: 'upgrade',
        icon: '📅'
      },
      {
        id: 'lucky_charm',
        name: 'お守り',
        description: '最大HP+10、最大SP+10',
        price: 1000,
        effect: { maxHP: 10, maxSP: 10, hp: 10, sp: 10 },
        category: 'rare',
        icon: '🍀'
      }
    ];
    this.purchasedItems = []; // 購入履歴
    
    // オートセーブの設定
    this.autoSaveEnabled = true;
    this.lastAutoSave = 0;
    this.autoSaveInterval = 30000; // 30秒間隔
    
    // 初期化時にオートセーブからロードを試行
    this.attemptAutoLoad();
    
    // 定期オートセーブを開始
    this.startAutoSave();
  }

  // オートロード機能：初期化時にオートセーブがあれば読み込み
  attemptAutoLoad() {
    try {
      const autoSaveData = localStorage.getItem('kosenRPG_save_autosave');
      if (autoSaveData) {
        const saveData = JSON.parse(autoSaveData);
        // 保存から1時間以内なら自動復元
        if (Date.now() - saveData.savedAt < 3600000) {
          console.log('オートセーブから進行状況を復元しました');
          return true;
        }
      }
    } catch (error) {
      console.log('オートロード実行中にエラー:', error);
    }
    return false;
  }

  // 定期オートセーブを開始
  startAutoSave() {
    if (this.autoSaveEnabled && typeof window !== 'undefined') {
      setInterval(() => {
        this.performAutoSave();
      }, this.autoSaveInterval);
    }
  }

  // 好感度変更メソッド
  changeAffection(npcName, amount) {
    if (this.npcs[npcName]) {
      const oldAffection = this.npcs[npcName].affection;
      this.npcs[npcName].affection = Math.max(0, 
        Math.min(this.npcs[npcName].maxAffection, oldAffection + amount)
      );
      
      // 閾値チェック
      this.checkAffectionThresholds(npcName, oldAffection);
      
      return this.npcs[npcName].affection;
    }
    return 0;
  }

  // 好感度閾値チェック
  checkAffectionThresholds(npcName, oldAffection) {
    const npc = this.npcs[npcName];
    const currentAffection = npc.affection;

    // 設計資料に基づく閾値
    const thresholds = [16, 32, 64, 100, 128];
    
    thresholds.forEach(threshold => {
      if (oldAffection < threshold && currentAffection >= threshold) {
        this.triggerAffectionEvent(npcName, threshold);
      }
    });
  }

  // 好感度イベント発生
  triggerAffectionEvent(npcName, threshold) {
    const eventKey = `${npcName}_affection_${threshold}`;
    this.flags.add(eventKey);
    
    console.log(`${npcName}との好感度が${threshold}に到達しました！`);
    
    // 特定のスキルやボーナス解放
    switch (threshold) {
      case 16:
        // 提出成功率+3%、会話パターン増加
        break;
      case 32:
        // 特殊会話イベント解放
        break;
      case 64:
        // 固有スキル解放
        this.unlockNPCSkill(npcName);
        break;
      case 100:
        // ルート確定・特別エンド条件
        this.flags.add(`${npcName}_route_unlocked`);
        break;
      case 128:
        // 隠しイベント
        this.flags.add(`${npcName}_secret_event`);
        break;
    }
  }

  // NPCスキル解放
  unlockNPCSkill(npcName) {
    const npc = this.npcs[npcName];
    if (npc && npc.skills.length > 0) {
      const skill = npc.skills[0]; // 最初のスキルを解放
      if (!this.playerSkills.includes(skill)) {
        this.playerSkills.push(skill);
        console.log(`スキル「${skill}」を習得しました！`);
      }
    }
  }

  // 経験値獲得システム
  gainExperience(exp) {
    if (!this.playerStats.experience) {
      this.playerStats.experience = 0;
    }
    if (!this.playerStats.level) {
      this.playerStats.level = 1;
    }

    this.playerStats.experience += exp;
    console.log(`${exp} EXPを獲得しました！`);

    // レベルアップ判定
    const requiredExp = this.getRequiredExpForNextLevel();
    if (this.playerStats.experience >= requiredExp) {
      this.levelUp();
    }
  }

  // 次のレベルに必要な経験値を計算
  getRequiredExpForNextLevel() {
    const currentLevel = this.playerStats.level || 1;
    return currentLevel * 100; // レベル × 100 EXP
  }

  // レベルアップ処理
  levelUp() {
    this.playerStats.level = (this.playerStats.level || 1) + 1;
    
    // レベルアップボーナス
    const levelUpBonus = {
      hp: 5,
      sp: 16,
      theory: 2,
      submission: 1,
      money: 100
    };

    // 最大HPとSPを上昇
    this.playerStats.maxHP = (this.playerStats.maxHP || 100) + levelUpBonus.hp;
    this.playerStats.maxSP = (this.playerStats.maxSP || 100) + levelUpBonus.sp;
    
    // 現在のHPとSPを回復
    this.playerStats.hp = Math.min(this.playerStats.hp + levelUpBonus.hp, this.playerStats.maxHP);
    this.playerStats.sp = Math.min(this.playerStats.sp + levelUpBonus.sp, this.playerStats.maxSP);
    
    // ステータス上昇
    this.changeStats(levelUpBonus);

    console.log(`レベルアップ！ Lv.${this.playerStats.level} になりました！`);
    
    // 経験値をリセット
    this.playerStats.experience = 0;
  }

  // ステータス変更
  changeStats(statChanges) {
    Object.keys(statChanges).forEach(stat => {
      if (this.playerStats.hasOwnProperty(stat)) {
        this.playerStats[stat] = Math.max(0, this.playerStats[stat] + statChanges[stat]);
        
        // HP/SPの上限チェック（動的最大値対応）
        if (stat === 'hp') {
          this.playerStats[stat] = Math.min(this.playerStats.maxHP || 100, this.playerStats[stat]);
        } else if (stat === 'sp') {
          this.playerStats[stat] = Math.min(this.playerStats.maxSP || 100, this.playerStats[stat]);
        }
      }
    });
  }

  // 行動選択処理
  performAction(actionType) {
    // HP/SP不足チェック
    if (this.playerStats.hp <= 0) {
      return 'HP不足のため行動できません。休息を取ってください。';
    }
    
    // 行動別のSP必要量をチェック
    const spRequirements = {
      lecture: 5,
      assignment: 10,
      research: 8,
      parttime: 5,
      social: 5,
      rest: 0  // 休息はSP消費なし
    };
    
    const requiredSP = spRequirements[actionType] || 0;
    if (this.playerStats.sp < requiredSP) {
      return `SP不足のため${actionType}を実行できません。(必要SP: ${requiredSP}, 現在SP: ${this.playerStats.sp})`;
    }

    const actions = {
      lecture: () => {
        this.changeStats({ submission: 3, theory: 2, sp: -5 });
        return '講義に参加しました。提出力と理論力が向上しました。';
      },
      assignment: () => {
        this.changeStats({ submission: 5, stress: 2, sp: -10 });
        return '課題に取り組みました。提出力が向上しましたが、少し疲れました。';
      },
      research: () => {
        this.changeStats({ theory: 4, social: 1, sp: -8 });
        return '研究活動を行いました。理論力が大幅に向上しました。';
      },
      parttime: () => {
        this.changeStats({ money: 200, stress: 3, hp: -5 });
        return 'アルバイトをしました。お金を稼ぎましたが、疲労とストレスが溜まりました。';
      },
      social: () => {
        this.changeStats({ social: 3, stress: -2, sp: -5 });
        return '友人と交流しました。社交性が向上し、ストレスが軽減されました。';
      },
      rest: () => {
        this.changeStats({ hp: 15, sp: 20, stress: -5 });
        this.currentWeek += 1;
        return '休息を取りました。体力と精神力が回復しました。';
      }
    };

    const result = actions[actionType] ? actions[actionType]() : '無効な行動です。';
    
    // ランダムイベント発生判定（20%の確率）
    let randomEventMessage = '';
    if (Math.random() < 0.2) {
      const randomEvent = this.triggerRandomEvent();
      if (randomEvent.occurred) {
        randomEventMessage = '\n\n✨ ' + randomEvent.event.message;
      }
    }
    
    // 選択履歴に追加
    this.choiceHistory.push({
      week: this.currentWeek,
      action: actionType,
      timestamp: Date.now()
    });

    // 行動後にオートセーブを実行
    this.performAutoSave();

    return result + randomEventMessage;
  }

  // オートセーブ実行
  performAutoSave() {
    try {
      const now = Date.now();
      // 最後のオートセーブから一定時間経過している場合のみ実行
      if (now - this.lastAutoSave > this.autoSaveInterval) {
        this.saveToLocalStorage('autosave');
        this.lastAutoSave = now;
      }
    } catch (error) {
      // オートセーブ失敗してもゲームは続行
      console.log('オートセーブでエラーが発生しましたが、ゲームは続行します');
    }
  }

  // ゲーム状態の保存用データ生成
  saveData() {
    return {
      playerStats: this.playerStats,
      npcs: this.npcs,
      gamePhase: this.gamePhase,
      currentChapter: this.currentChapter,
      currentWeek: this.currentWeek,
      playerSkills: this.playerSkills,
      flags: Array.from(this.flags),
      choiceHistory: this.choiceHistory,
      defeatedEnemies: this.defeatedEnemies,
      isAdmin: this.isAdmin,
      purchasedItems: this.purchasedItems,
      chapterProgress: this.chapterProgress,
      chapterEvents: this.chapterEvents
    };
  }

  // セーブデータからゲーム状態を復元
  loadData(saveData) {
    this.playerStats = { ...this.playerStats, ...saveData.playerStats };
    this.npcs = { ...this.npcs, ...saveData.npcs };
    this.gamePhase = saveData.gamePhase || 'daily';
    this.currentChapter = saveData.currentChapter || 1;
    this.currentWeek = saveData.currentWeek || 1;
    this.playerSkills = saveData.playerSkills || [];
    this.flags = new Set(saveData.flags || []);
    this.choiceHistory = saveData.choiceHistory || [];
    this.defeatedEnemies = saveData.defeatedEnemies || [];
    this.isAdmin = saveData.isAdmin || false;
    this.purchasedItems = saveData.purchasedItems || [];
    this.chapterProgress = saveData.chapterProgress || 0;
    this.chapterEvents = saveData.chapterEvents || null;
  }

  // 章システム
  initializeChapter(chapterNumber) {
    this.currentChapter = chapterNumber;
    this.chapterProgress = 0;
    
    // 章ごとの初期設定
    switch(chapterNumber) {
      case 1:
        this.chapterGoals = {
          requiredCredits: 3,
          maxStress: 50,
          targetNPCs: ['田中教授', '佐藤さん']
        };
        this.chapterEvents = [
          { id: 'orientation', name: 'オリエンテーション', completed: false, type: 'intro' },
          { id: 'firstAssignment', name: '初課題くん', completed: false, type: 'battle', 
            enemy: { name: '初課題くん', hp: 32, maxHP: 32, expReward: 24, submissionBonus: 1, description: '序盤の簡単な課題' } },
          { id: 'freeAction1', name: '自由行動1', completed: false, type: 'free' },
          { id: 'freeAction2', name: '自由行動2', completed: false, type: 'free' },
          { id: 'freeAction3', name: '自由行動3', completed: false, type: 'free' },
          { id: 'freeAction4', name: '自由行動4', completed: false, type: 'free' },
          { id: 'freeAction5', name: '自由行動5', completed: false, type: 'free' },
          { id: 'midtermExam', name: '中間試験', completed: false, type: 'boss', 
            enemy: { name: '教授の中間テスト', hp: 64, maxHP: 64, expReward: 128, submissionBonus: 3, description: 'プレッシャーで攻撃してくる強敵' } },
          { id: 'finalExam', name: '期末試験', completed: false, type: 'final-boss',
            requirements: { submission: 80, theory: 70, social: 40, maxStress: 60 },
            enemy: { name: '期末試験：総合評価', hp: 128, maxHP: 128, expReward: 200, submissionBonus: 5, description: '第1章最強の敵。高い提出力と理論力が必要' } },
          { id: 'finalEvaluation', name: '期末評価', completed: false, type: 'evaluation' }
        ];
        break;
      case 2:
        this.chapterGoals = {
          requiredCredits: 5,
          maxStress: 70,
          targetNPCs: ['美濃玲', '真田翔'],
          specialRequirement: 'NPC好感度64以上を2人'
        };
        this.chapterEvents = [
          { id: 'secondYearStart', name: '2年生開始', completed: false, type: 'intro' },
          { id: 'specialization', name: '専門分野選択', completed: false, type: 'choice',
            choices: [
              { id: 'engineering', name: '工学系', effect: { theory: 5, submission: 3 } },
              { id: 'science', name: '理学系', effect: { theory: 7, social: 1 } },
              { id: 'business', name: '経営系', effect: { social: 5, money: 500 } }
            ]
          },
          { id: 'groupProject1', name: 'グループプロジェクト開始', completed: false, type: 'battle',
            enemy: { name: 'チーム課題の壁', hp: 80, maxHP: 80, expReward: 150, submissionBonus: 3, description: 'チームワークが試される課題' } },
          { id: 'npcEvent1', name: '先輩との交流', completed: false, type: 'social' },
          { id: 'freeAction6', name: '自由行動6', completed: false, type: 'free' },
          { id: 'freeAction7', name: '自由行動7', completed: false, type: 'free' },
          { id: 'technicalChallenge', name: '技術コンテスト', completed: false, type: 'boss',
            requirements: { theory: 100, submission: 90 },
            enemy: { name: '技術力の試練', hp: 120, maxHP: 120, expReward: 300, submissionBonus: 8, description: '高度な技術知識が必要な難敵' } },
          { id: 'freeAction8', name: '自由行動8', completed: false, type: 'free' },
          { id: 'chapter2Final', name: '学年末総合評価', completed: false, type: 'final-boss',
            requirements: { submission: 120, theory: 110, social: 80, maxStress: 70 },
            enemy: { name: '総合評価：専門課程', hp: 180, maxHP: 180, expReward: 400, submissionBonus: 10, description: '2年生最終試験。すべてのスキルが試される' } },
          { id: 'chapter2End', name: '第2章完了', completed: false, type: 'evaluation' }
        ];
        break;
      default:
        this.chapterGoals = {};
        this.chapterEvents = [];
        break;
    }
  }

  // 章イベント進行
  getCurrentChapterEvent() {
    if (!this.chapterEvents) return null;
    return this.chapterEvents.find(event => !event.completed);
  }

  // イベント要件チェック
  checkEventRequirements(eventId) {
    const event = this.chapterEvents.find(e => e.id === eventId);
    if (!event || !event.requirements) return { canAccess: true, message: '' };
    
    const req = event.requirements;
    const missing = [];
    
    if (req.submission && this.playerStats.submission < req.submission) {
      missing.push(`提出力 ${req.submission}以上 (現在: ${this.playerStats.submission})`);
    }
    if (req.theory && this.playerStats.theory < req.theory) {
      missing.push(`理論力 ${req.theory}以上 (現在: ${this.playerStats.theory})`);
    }
    if (req.social && this.playerStats.social < req.social) {
      missing.push(`社交力 ${req.social}以上 (現在: ${this.playerStats.social})`);
    }
    if (req.maxStress && this.playerStats.stress > req.maxStress) {
      missing.push(`ストレス ${req.maxStress}以下 (現在: ${this.playerStats.stress})`);
    }
    
    if (missing.length > 0) {
      return {
        canAccess: false,
        message: `期末試験の受験要件を満たしていません:\n${missing.join('\n')}`
      };
    }
    
    return { canAccess: true, message: '期末試験に挑戦する準備が整いました！' };
  }

  // 章イベント完了
  completeChapterEvent(eventId) {
    if (!this.chapterEvents) return;
    const event = this.chapterEvents.find(e => e.id === eventId);
    if (event) {
      event.completed = true;
      this.chapterProgress++;
    }
  }

  // バトル開始
  startBattle(enemy) {
    this.gamePhase = 'battle';
    this.currentBattle = {
      enemy: enemy,
      playerHP: this.playerStats.hp,
      playerSP: this.playerStats.sp
    };
  }

  // バトル終了処理
  endBattle(result, rewards = {}) {
    this.gamePhase = 'daily';
    
    if (result === 'victory') {
      // 勝利報酬
      if (rewards.exp) {
        this.gainExperience(rewards.exp);
      }
      if (rewards.submissionBonus) {
        this.changeStats({ submission: rewards.submissionBonus });
      }
      
      // 撃破した敵を再戦リストに追加
      if (this.currentBattle && this.currentBattle.enemy) {
        const enemy = this.currentBattle.enemy;
        const existingEnemy = this.defeatedEnemies.find(e => e.name === enemy.name);
        if (!existingEnemy) {
          this.defeatedEnemies.push({
            ...enemy,
            defeatedCount: 1,
            firstDefeatedAt: Date.now()
          });
        } else {
          existingEnemy.defeatedCount++;
        }
      }
    } else if (result === 'defeat') {
      // 敗北ペナルティ
      if (rewards.stressPenalty) {
        this.changeStats({ stress: rewards.stressPenalty });
      }
    } else if (result === 'escape') {
      // 逃走ペナルティ
      if (rewards.stressPenalty) {
        this.changeStats({ stress: rewards.stressPenalty });
      }
    }
    
    this.currentBattle = null;
  }

  // 進級判定
  canAdvanceToNextSemester() {
    const requiredSubmission = 50;
    const maxStress = 80;
    const requiredAffection = 32; // 最低1人のNPCとの関係が必要

    const hasRequiredSubmission = this.playerStats.submission >= requiredSubmission;
    const stressOK = this.playerStats.stress <= maxStress;
    const hasGoodRelationship = Object.values(this.npcs).some(npc => npc.affection >= requiredAffection);

    return {
      canAdvance: hasRequiredSubmission && stressOK && hasGoodRelationship,
      reasons: {
        submission: hasRequiredSubmission,
        stress: stressOK,
        relationships: hasGoodRelationship
      }
    };
  }

  // 再戦可能な敵のリストを取得
  getAvailableRematches() {
    return this.defeatedEnemies.map(enemy => ({
      ...enemy,
      // 再戦時は報酬を少し減らす
      expReward: Math.floor(enemy.expReward * 0.7),
      submissionBonus: Math.max(1, Math.floor(enemy.submissionBonus * 0.5))
    }));
  }

  // 再戦開始
  startRematch(enemyName) {
    const enemy = this.defeatedEnemies.find(e => e.name === enemyName);
    if (enemy) {
      // 再戦用の敵データを作成（報酬減少）
      const rematchEnemy = {
        ...enemy,
        expReward: Math.floor(enemy.expReward * 0.7),
        submissionBonus: Math.max(1, Math.floor(enemy.submissionBonus * 0.5)),
        description: enemy.description + "（再戦）"
      };
      this.startBattle(rematchEnemy);
      return true;
    }
    return false;
  }

  // ローカルストレージにセーブ
  saveToLocalStorage(slotName = 'default') {
    try {
      const saveData = this.saveData();
      saveData.savedAt = Date.now();
      saveData.playerName = '高専生'; // 将来的にプレイヤー名設定機能追加予定
      saveData.chapterTitle = `第${this.currentChapter}章`;
      
      localStorage.setItem(`kosenRPG_save_${slotName}`, JSON.stringify(saveData));
      console.log(`ゲームデータをスロット "${slotName}" に保存しました`);
      return true;
    } catch (error) {
      console.error('セーブに失敗しました:', error);
      return false;
    }
  }

  // ローカルストレージからロード
  loadFromLocalStorage(slotName = 'default') {
    try {
      const savedData = localStorage.getItem(`kosenRPG_save_${slotName}`);
      if (!savedData) {
        console.log(`スロット "${slotName}" にセーブデータが見つかりません`);
        return false;
      }
      
      const saveData = JSON.parse(savedData);
      this.loadData(saveData);
      
      // 章データが存在しない場合は初期化
      if (!this.chapterEvents) {
        this.initializeChapter(this.currentChapter);
      }
      
      console.log(`スロット "${slotName}" からゲームデータを読み込みました`);
      return true;
    } catch (error) {
      console.error('ロードに失敗しました:', error);
      return false;
    }
  }

  // セーブデータ一覧を取得
  static getSaveDataList() {
    const saves = [];
    const prefix = 'kosenRPG_save_';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const slotName = key.replace(prefix, '');
          const data = JSON.parse(localStorage.getItem(key));
          saves.push({
            slotName: slotName,
            savedAt: data.savedAt,
            playerName: data.playerName || '高専生',
            chapterTitle: data.chapterTitle || `第${data.currentChapter || 1}章`,
            level: data.playerStats?.level || 1,
            progress: `進行度: ${data.chapterProgress || 0}/${data.chapterEvents?.length || 10}`
          });
        } catch (error) {
          console.error(`セーブデータ "${key}" の読み込みでエラー:`, error);
        }
      }
    }
    
    // 保存日時でソート（新しい順）
    saves.sort((a, b) => b.savedAt - a.savedAt);
    return saves;
  }

  // セーブデータを削除
  static deleteSaveData(slotName) {
    try {
      localStorage.removeItem(`kosenRPG_save_${slotName}`);
      console.log(`スロット "${slotName}" のセーブデータを削除しました`);
      return true;
    } catch (error) {
      console.error('セーブデータ削除に失敗しました:', error);
      return false;
    }
  }

  // 管理者認証
  authenticateAdmin(password) {
    // 簡単なハッシュ化（セキュリティ向上のため）
    const hash = password === 'minusead' ? 'mnsd2025x' : password + 'x';
    if (hash === this.adminPasswordHash) {
      this.isAdmin = true;
      return true;
    } else {
      return false;
    }
  }

  // 管理者権限を無効化
  disableAdmin() {
    this.isAdmin = false;
  }

  // チート機能: ステータス最大化
  cheatMaxStats() {
    if (!this.isAdmin) return false;
    
    this.playerStats = {
      ...this.playerStats,
      hp: 999,
      sp: 999,
      submission: 999,
      theory: 999,
      social: 999,
      stress: 0,
      money: 999999,
      level: 99,
      maxHP: 999,
      maxSP: 999
    };
    return true;
  }

  // チート機能: 全章イベント完了
  cheatCompleteAllEvents() {
    if (!this.isAdmin) return false;
    
    if (this.chapterEvents) {
      this.chapterEvents.forEach(event => {
        event.completed = true;
      });
      this.chapterProgress = this.chapterEvents.length;
    }
    return true;
  }

  // チート機能: 全NPC好感度最大
  cheatMaxAffection() {
    if (!this.isAdmin) return false;
    
    Object.keys(this.npcs).forEach(npcName => {
      this.npcs[npcName].affection = 128;
    });
    return true;
  }

  // チート機能: イベント進行リセット
  cheatResetChapter() {
    if (!this.isAdmin) return false;
    
    this.chapterProgress = 0;
    if (this.chapterEvents) {
      this.chapterEvents.forEach(event => {
        event.completed = false;
      });
    }
    return true;
  }

  // チート機能: レベル設定
  cheatSetLevel(level) {
    if (!this.isAdmin) return false;
    
    this.playerStats.level = Math.max(1, Math.min(99, level));
    this.playerStats.experience = 0;
    return true;
  }

  // チート機能: 敵を再戦リストに追加
  cheatAddEnemyToRematch(enemyData) {
    if (!this.isAdmin) return false;
    
    const enemy = {
      name: enemyData.name || 'デバッグ敵',
      hp: enemyData.hp || 50,
      maxHP: enemyData.hp || 50,
      expReward: enemyData.expReward || 100,
      submissionBonus: enemyData.submissionBonus || 2,
      description: enemyData.description || 'デバッグ用の敵',
      defeatedCount: 1,
      firstDefeatedAt: Date.now()
    };
    
    this.defeatedEnemies.push(enemy);
    return true;
  }

  // === ショップシステム ===

  // ショップアイテム購入
  purchaseItem(itemId) {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'アイテムが見つかりません' };
    }

    // お金チェック
    if (this.playerStats.money < item.price) {
      return { 
        success: false, 
        message: `所持金が不足しています（必要: ¥${item.price.toLocaleString()}, 現在: ¥${this.playerStats.money.toLocaleString()}）` 
      };
    }

    // 購入済みアイテムのチェック（アップグレード系のみ）
    if (item.category === 'upgrade' || item.category === 'rare') {
      const alreadyPurchased = this.purchasedItems.some(p => p.itemId === itemId);
      if (alreadyPurchased) {
        return { success: false, message: 'このアイテムは既に購入済みです' };
      }
    }

    // 購入処理
    this.playerStats.money -= item.price;
    
    // アイテム効果適用
    this.changeStats(item.effect);
    
    // 購入履歴に追加
    this.purchasedItems.push({
      itemId: itemId,
      itemName: item.name,
      purchaseDate: Date.now(),
      price: item.price
    });

    // オートセーブ
    this.performAutoSave();

    return { 
      success: true, 
      message: `${item.name}を購入しました！${item.description}` 
    };
  }

  // ショップアイテム一覧取得（購入状態込み）
  getShopItems() {
    return this.shopItems.map(item => ({
      ...item,
      isPurchased: this.purchasedItems.some(p => p.itemId === item.id),
      canPurchase: this.playerStats.money >= item.price && 
                  !(item.category === 'upgrade' || item.category === 'rare') || 
                  !this.purchasedItems.some(p => p.itemId === item.id)
    }));
  }

  // 購入履歴取得
  getPurchaseHistory() {
    return this.purchasedItems.sort((a, b) => b.purchaseDate - a.purchaseDate);
  }

  // === 章進行システム拡張 ===

  // 章完了チェック
  canAdvanceToNextChapter() {
    if (!this.chapterEvents) return { canAdvance: false, message: '章データが見つかりません' };
    
    const completedEvents = this.chapterEvents.filter(e => e.completed).length;
    const totalEvents = this.chapterEvents.length;
    
    if (completedEvents < totalEvents) {
      return { 
        canAdvance: false, 
        message: `章の進行が不完全です (${completedEvents}/${totalEvents})` 
      };
    }

    // 章固有の要件チェック
    const goals = this.chapterGoals;
    const missing = [];

    if (goals.requiredCredits && this.playerStats.submission < goals.requiredCredits * 30) {
      missing.push(`提出力不足（目安: ${goals.requiredCredits * 30}）`);
    }

    if (goals.maxStress && this.playerStats.stress > goals.maxStress) {
      missing.push(`ストレス過多（${goals.maxStress}以下必要）`);
    }

    if (goals.specialRequirement === 'NPC好感度64以上を2人') {
      const highAffectionNPCs = Object.values(this.npcs).filter(npc => npc.affection >= 64);
      if (highAffectionNPCs.length < 2) {
        missing.push(`NPC好感度64以上が${highAffectionNPCs.length}/2人`);
      }
    }

    if (missing.length > 0) {
      return {
        canAdvance: false,
        message: `次章への進級要件未達成:\n${missing.join('\n')}`
      };
    }

    return { canAdvance: true, message: '次章に進むことができます！' };
  }

  // 次章へ進む
  advanceToNextChapter() {
    const advanceCheck = this.canAdvanceToNextChapter();
    if (!advanceCheck.canAdvance) {
      return { success: false, message: advanceCheck.message };
    }

    // レベルアップボーナス（章クリア報酬）
    const chapterBonus = {
      1: { exp: 500, money: 2000, maxHP: 20, maxSP: 30 },
      2: { exp: 800, money: 3500, maxHP: 30, maxSP: 40 }
    };

    const bonus = chapterBonus[this.currentChapter];
    if (bonus) {
      this.gainExperience(bonus.exp);
      this.changeStats(bonus);
      this.playerStats.money += bonus.money;
    }

    // 次章初期化
    this.currentChapter += 1;
    this.currentWeek = 1;
    this.initializeChapter(this.currentChapter);

    // オートセーブ
    this.performAutoSave();

    return { 
      success: true, 
      message: `第${this.currentChapter}章開始！章クリア報酬を獲得しました。` 
    };
  }

  // 選択イベント処理
  processChoiceEvent(eventId, choiceId) {
    const event = this.chapterEvents.find(e => e.id === eventId);
    if (!event || event.type !== 'choice') {
      return { success: false, message: '選択イベントが見つかりません' };
    }

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { success: false, message: '選択肢が見つかりません' };
    }

    // 選択効果を適用
    if (choice.effect) {
      this.changeStats(choice.effect);
    }

    // 選択を記録
    event.selectedChoice = choiceId;
    this.completeChapterEvent(eventId);

    // フラグ追加
    this.flags.add(`choice_${eventId}_${choiceId}`);

    return { 
      success: true, 
      message: `${choice.name}を選択しました！`,
  effect: choice.effect
    };
  }

  // === ランダムイベントシステム ===

  // ランダムイベント一覧
  getRandomEvents() {
    return [
      {
        id: 'lucky_money',
        name: '幸運の小銭',
        description: '道端で小銭を拾いました',
        probability: 0.15,
        effect: { money: 100 },
        message: '道端で100円を拾いました！ラッキー！'
      },
      {
        id: 'helpful_senior',
        name: '親切な先輩',
        description: '先輩からアドバイスをもらえました',
        probability: 0.12,
        effect: { theory: 1, social: 1 },
        message: '先輩から勉強のコツを教えてもらいました！'
      },
      {
        id: 'bad_weather',
        name: '悪天候',
        description: '雨で疲れが溜まりました',
        probability: 0.08,
        effect: { stress: 3, sp: -5 },
        message: '雨でびしょ濡れに...少し疲れました'
      },
      {
        id: 'vending_machine',
        name: '当たり自販機',
        description: '自販機でもう一本！',
        probability: 0.05,
        effect: { sp: 10 },
        message: '自販機で当たりが出ました！もう一本でSP回復！'
      },
      {
        id: 'library_discovery',
        name: '図書館での発見',
        description: '図書館で良い資料を見つけました',
        probability: 0.10,
        effect: { theory: 2 },
        message: '図書館で素晴らしい参考書を発見しました！'
      },
      {
        id: 'club_invitation',
        name: 'サークルの誘い',
        description: '先輩からサークルに誘われました',
        probability: 0.07,
        effect: { social: 2, stress: -2 },
        message: 'サークルの先輩と楽しく話しました！'
      },
      {
        id: 'equipment_malfunction',
        name: '機材トラブル',
        description: '実験機材が故障しました',
        probability: 0.06,
        effect: { stress: 5, theory: -1 },
        message: '実験機材が故障...時間をロスしてしまいました'
      },
      {
        id: 'cafeteria_discount',
        name: '学食割引',
        description: '学食で割引サービスを受けました',
        probability: 0.08,
        effect: { money: 50, stress: -1 },
        message: '学食で割引サービス！お得に食事できました'
      }
    ];
  }

  // ランダムイベント発生判定
  triggerRandomEvent() {
    const events = this.getRandomEvents();
    const totalProbability = Math.random();
    let cumulativeProbability = 0;

    for (const event of events) {
      cumulativeProbability += event.probability;
      if (totalProbability <= cumulativeProbability) {
        // イベント発生
        this.changeStats(event.effect);
        
        // イベントログに記録
        this.flags.add(`random_event_${event.id}_${Date.now()}`);
        
        return {
          occurred: true,
          event: event
        };
      }
    }

    return { occurred: false };
  }

  // ランダムイベント発生判定
  triggerRandomEvent() {
    const events = this.getRandomEvents();
    const totalProbability = Math.random();
    let cumulativeProbability = 0;

    for (const event of events) {
      cumulativeProbability += event.probability;
      if (totalProbability <= cumulativeProbability) {
        // イベント発生
        this.changeStats(event.effect);
        
        // イベントログに記録
        this.flags.add(`random_event_${event.id}_${Date.now()}`);
        
        return {
          occurred: true,
          event: event
        };
      }
    }

    return { occurred: false };
  }
}

export default GameState;
