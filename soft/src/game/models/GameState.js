/**ゲーム状態管理クラス
 * 設計資料に基づくステータス・好感度システムの実装*/

// NPCデータのインポート
const npcData = require('../date/npcDate.js');

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

    // NPCデータの初期化（npcDate.jsから読み込み）
    this.npcs = {};
    npcData.forEach(npc => {
      this.npcs[npc.name] = {
        name: npc.name,
        affection: npc.affection,
        maxAffection: npc.maxAffection,
        category: npc.category,
        skills: [...npc.skills], // 配列のコピー
        description: npc.description,
        icon: npc.icon // アイコン情報を追加
      };
    });

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
    
    // 機能フラグシステム（大規模アップデート用）
    this.featureFlags = {
      // 基本機能（常に有効）
      chapter1: true,// １章
      chapter2: true,// ２章
      basicBattle: true,// 戦闘NPC
      basicShop: true,// ショップ
      basicNPCInteraction: true, //NPC 
      chapter3: true,           // 第3章：進路選択
      chapter4: true,           // 第4章：進路実現・恋愛クライマックス
      chapter5: true,           // 第5章：卒業年・人生選択の実現
      chapter6: true,           // 第6章：アフターストーリー・新たな人生
      chapter7: true,           // 第7章：社会人中堅・専門性確立
      chapter8: true,           // 第8章：真の大人・人生の完成
      skillSystem: true,        // スキル戦闘使用
      gachaSystem: true,        // ガチャショップ
      npcEvents: true,          // NPC好感度イベント
      extendedItems: true,      // 追加アイテム
      extendedEnemies: true,    // 追加敵種類
      playerChat: true,         // プレイヤー間チャット
      tutorialLogs: true,       // 操作説明ログ
      advancedBattle: true,     // 高度な戦闘システム
      randomEvents: true,       // ランダムイベント
      achievementSystem: true,  // 実績システム
      superRareItems: true,     // 超激レアアイテム（ガチャ機能）
      
      // チート・デバッグ系（無効のまま）
      debugMode: false,         // デバッグモード
      devTools: false,          // 開発者ツール
      infiniteMoney: false,     // 無限お金
      maxStats: false          // 最大ステータス
    };
    
    // バージョン管理
    this.gameVersion = '3.0.0';
    this.dataVersion = '3.0.0';

    // 新機能のデータ構造（まだコメントアウト状態）
    this.skills = [];              // プレイヤースキル詳細
    this.inventory = [];           // アイテムインベントリ
    this.gachaItems = [];          // ガチャ専用アイテム
    this.chatMessages = [];        // チャットメッセージ
    this.npcEventHistory = [];     // NPCイベント履歴
    this.playerPath = null;        // 進路選択結果
    
    // チャットシステム（LocalStorage使用でプレイヤー間共有）
    this.chatSystem = {
      messages: [],           // 全チャットメッセージ
      maxMessages: 100,       // 最大保存メッセージ数
      blockedUsers: new Set(), // ブロックされたユーザー
      reportedMessages: new Set(), // 報告されたメッセージ
      chatRooms: new Map(),   // チャットルーム（将来の拡張用）
      messageIdCounter: 1,    // メッセージID管理
      playerNames: new Map(), // playerId -> カスタム名前のマッピング
      lastSyncTime: 0,        // 最後の同期時刻
      syncInterval: 3000,     // 同期間隔（3秒）
      simulateOtherPlayers: true // 他プレイヤーのシミュレート
    };
    
    // チャットデータの初期化と読み込み
    this.initializeChatSystem();
    
    // ワークスペース監視システム
    this.workspaceMonitoring = {
      sessions: new Map(), // sessionId -> { playerId, startTime, lastActivity, currentView, suspiciousActivity }
      playerCount: 0,
      adminSessions: new Set(),
      securityLogs: [],
      //maxSessions: 100, // 最大同時接続数
      //sessionTimeout: 30 * 60 * 1000, // 30分でタイムアウト
      suspiciousThreshold: 5 // 不正行為の閾値
    };
    
    // セッション初期化
    this.initializePlayerSession();
    
    // ショップシステム
    this.shopItems = [
      {
        id: 'energy_drink',
        name: 'エナジードリンク',
        description: 'SP+20回復',
        price: 150,
        effect: { sp: 20 },
        category: 'consumable',
        icon: '/0203020016.png'
      },
      {
        id: 'health_food',
        name: '栄養食品',
        description: 'HP+25回復',
        price: 200,
        effect: { hp: 25 },
        category: 'consumable',
        icon: '/food_i.png'
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
        icon: '/as_lv0.png'
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
      },
      {
        id: 'super_pen',
        name: '万年筆',
        description: '論理力+10、提出力+10',
        price: 1500,
        effect: { theory: 10, submission: 10 },
        category: 'rare',
        icon: '/mannnenn.png'
      }
    ];
    this.purchasedItems = []; // 購入履歴
    
    // オートセーブの設定
    this.autoSaveEnabled = true;
    this.lastAutoSave = 0;
    this.autoSaveInterval = 30000; // 30秒間隔
    
    // 章の初期化（chapterGoalsを確実に設定）
    this.initializeChapter(this.currentChapter);
    
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
          this.loadData(saveData); // 実際にデータをロード
          //console.log('オートセーブから進行状況を復元しました');
          return true;
        }
      }
    } catch (error) {
      //console.log('オートロード実行中にエラー:', error);
    }
    return false;
  }

  // 機能フラグ管理メソッド
  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] === true;
  }

  // 管理者による機能フラグ切り替え
  toggleFeatureFlag(featureName, enabled = null) {
    if (!this.isAdmin) {
      console.warn('機能フラグの変更には管理者権限が必要です');
      return false;
    }
    
    if (featureName in this.featureFlags) {
      this.featureFlags[featureName] = enabled !== null ? enabled : !this.featureFlags[featureName];
      //console.log(`機能フラグ ${featureName} を ${this.featureFlags[featureName] ? '有効' : '無効'} にしました`);
      return true;
    }
    
    console.warn(`未知の機能フラグ: ${featureName}`);
    return false;
  }

  // 全機能フラグの状態を取得
  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  // バージョン互換性チェック
  checkVersionCompatibility(saveData) {
    if (!saveData.gameVersion || !saveData.dataVersion) {
      return { compatible: true, needsUpgrade: true };
    }
    
    const [currentMajor, currentMinor] = this.gameVersion.split('.').map(Number);
    const [saveMajor, saveMinor] = saveData.gameVersion.split('.').map(Number);
    
    if (saveMajor > currentMajor || (saveMajor === currentMajor && saveMinor > currentMinor)) {
      return { compatible: false, needsUpgrade: false, reason: 'セーブデータのバージョンが新しすぎます' };
    }
    
    return { compatible: true, needsUpgrade: saveMajor < currentMajor };
  }

  // 安全な機能有効化（段階的ロールアウト用）
  enableFeatureSafely(featureName, force = false) {
    if (!this.isAdmin && !force) {
      console.warn('機能の有効化には管理者権限が必要です');
      return false;
    }

    // 依存関係チェック
    const dependencies = {
      chapter3: ['chapter1', 'chapter2'],
      chapter4: ['chapter3'],
      chapter5: ['chapter4'],
      chapter6: ['chapter5'],
      chapter7: ['chapter6'],
      chapter8: ['chapter7'],
      skillSystem: ['basicBattle'],
      gachaSystem: ['basicShop'],
      npcEvents: ['basicNPCInteraction'],
      superRareItems: ['gachaSystem', 'extendedItems']
    };

    if (dependencies[featureName]) {
      for (const dep of dependencies[featureName]) {
        if (!this.featureFlags[dep]) {
          //console.warn(`機能 ${featureName} には ${dep} が必要です`);
          return false;
        }
      }
    }

    this.featureFlags[featureName] = true;
    //console.log(`機能 ${featureName} を安全に有効化しました`);
    return true;
  }

  // 全プレイヤー向け機能ロールアウト計画（完了済み）
  planFeatureRollout() {
    return {
      cheat_phase: {
        name: 'チート機能（管理者のみ）',
        features: ['debugMode', 'devTools', 'infiniteMoney', 'maxStats'],
        estimatedTime: '手動有効化',
        riskLevel: 'critical',
        status: 'manual_only'
      }
    };
  }

  // 定期オートセーブを開始
  startAutoSave() {
    if (this.autoSaveEnabled && typeof window !== 'undefined') {
      // 既存のオートセーブタイマーがあればクリア
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }
      
      this.autoSaveTimer = setInterval(() => {
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
    
    //console.log(`${npcName}との好感度が${threshold}に到達しました！`);
    
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

    //const message = `レベルアップ！ Lv.${this.playerStats.level} になりました！`;

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
      rest: 0   // 休息はSP消費なし
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
    
    // 通常のランダムイベント発生判定（20%の確率）
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
      //console.log('オートセーブでエラーが発生しましたが、ゲームは続行します');
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
      chapterEvents: this.chapterEvents,
      chapterGoals: this.chapterGoals,
      gameVersion: this.gameVersion,
      dataVersion: this.dataVersion,
      featureFlags: this.featureFlags,
      playerPath: this.playerPath || null
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
    this.purchasedItems = (saveData.purchasedItems || []).map(item => ({
      itemId: item.itemId || `item_${item.timestamp || Date.now()}`,
      itemName: item.itemName || item.name || '不明なアイテム',
      price: item.price || item.cost || 0,
      purchaseDate: item.purchaseDate || item.timestamp || Date.now(),
      type: item.type || 'item',
      rarity: item.rarity || null
    }));
    this.chapterProgress = saveData.chapterProgress || 0;
    this.chapterEvents = saveData.chapterEvents || null;
    this.chapterGoals = saveData.chapterGoals || {};
    
    // 新機能データの復元（バージョン互換性考慮）
    if (saveData.gameVersion) {
      this.gameVersion = saveData.gameVersion;
    }
    if (saveData.dataVersion) {
      this.dataVersion = saveData.dataVersion;
    }
    if (saveData.featureFlags) {
      // 新しいデフォルト設定を保持し、セーブデータで明示的に無効化されたもののみ上書き
      // ただし、チート系機能は常にセーブデータの設定を尊重
      const newFlags = { ...this.featureFlags };
      
      // チート系機能のみセーブデータの設定を適用
      const cheatFeatures = ['debugMode', 'devTools', 'infiniteMoney', 'maxStats'];
      cheatFeatures.forEach(feature => {
        if (saveData.featureFlags.hasOwnProperty(feature)) {
          newFlags[feature] = saveData.featureFlags[feature];
        }
      });
      
      // 通常機能は新しいデフォルト設定を維持
      this.featureFlags = newFlags;
    }
    if (saveData.playerPath) {
      this.playerPath = saveData.playerPath;
    }
    
    // バージョン互換性チェック
    const compatibility = this.checkVersionCompatibility(saveData);
    if (!compatibility.compatible) {
      console.warn('セーブデータのバージョンが互換性がありません:', compatibility.reason);
    } else if (compatibility.needsUpgrade) {
      console.log('セーブデータをアップグレードしました');
      // アップグレード時に通常機能フラグを最新のデフォルトに更新
      this.upgradeFeatureFlags();
    }
    
    // chapterEventsまたはchapterGoalsが存在しない場合、現在の章で再初期化
    if (!this.chapterEvents || !this.chapterGoals || Object.keys(this.chapterGoals).length === 0) {
      //console.log('章データが不完全なため再初期化します');
      this.initializeChapter(this.currentChapter);
    }
  }

  // 機能フラグのアップグレード処理
  upgradeFeatureFlags() {
    //console.log('機能フラグを最新のデフォルト設定に更新中...');
    
    // 通常機能を有効化（チート系は除く）
    const normalFeatures = [
      'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter8',
      'basicBattle', 'basicShop', 'basicNPCInteraction',
      'skillSystem', 'gachaSystem', 'npcEvents', 
      'extendedItems', 'extendedEnemies', //'playerChat', 
      'tutorialLogs', 'advancedBattle', 'randomEvents', 
      'achievementSystem', 'superRareItems'
    ];
    
    normalFeatures.forEach(feature => {
      if (this.featureFlags.hasOwnProperty(feature)) {
        this.featureFlags[feature] = true;
      }
    });
    
    //console.log('機能フラグのアップグレード完了');
    
    // アップグレード後すぐにセーブ
    this.performAutoSave();
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
          targetNPCs: ['赤峰教授', '真田翔']
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
          specialRequirement: '真田翔と美濃玲の好感度64以上'
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
      case 3:
        // 第3章：進路選択（機能フラグで制御）
        if (this.isFeatureEnabled('chapter3')) {
          this.chapterGoals = {
            requiredCredits: 8,
            maxStress: 80,
            specialRequirement: '進路選択決定'
          };
          this.chapterEvents = [
            { id: 'thirdYearStart', name: '3年生開始', completed: false, type: 'intro' },
            { id: 'careerGuidance', name: '進路指導', completed: false, type: 'choice',
              choices: [
                { id: 'university', name: '大学進学', effect: { theory: 10, money: -2000 }, path: 'university' },
                { id: 'continue_kosen', name: '高専継続', effect: { submission: 8, social: 5 }, path: 'kosen' }
              ]
            },
            { id: 'pathPreparation', name: '進路準備', completed: false, type: 'free' },
            { id: 'finalDecision', name: '最終進路決定', completed: false, type: 'evaluation' }
          ];
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      case 4:
        // 第4章：進路実現・恋愛クライマックス・卒業研究開始
        if (this.isFeatureEnabled('chapter4')) {
          this.chapterGoals = {
            requiredCredits: 14,
            specialRequirement: '進路実現と恋愛決着',
            careerRealized: false,
            relationshipResolved: false,
            researchStarted: false
          };
          
          // 共通イベント（全ルート）
          const commonEvents = [
            { id: 'researchThemeSelection', name: '卒業研究テーマ決定', completed: false, type: 'choice',
              choices: [
                { id: 'theoretical_research', name: '理論研究', requirements: { theory: 180 }, effect: { theory: 25 } },
                { id: 'practical_research', name: '実践研究', requirements: { submission: 180 }, effect: { submission: 25 } },
                { id: 'interdisciplinary_research', name: '学際研究', requirements: { social: 150 }, effect: { social: 20, theory: 15 } }
              ]
            },
            { id: 'loveConfession', name: '恋愛関係の決着', completed: false, type: 'battle',
              enemy: { name: '告白の勇気', hp: 150, maxHP: 150, expReward: 800, submissionBonus: 20, description: '恋愛関係における最終決断' } },
            { id: 'multitaskingChallenge', name: 'マルチタスク管理', completed: false, type: 'battle',
              enemy: { name: 'マルチタスク地獄', hp: 300, maxHP: 300, expReward: 1200, submissionBonus: 30, description: '進路・恋愛・研究の同時管理' } }
          ];
          
          // 進路別専用イベント
          if (this.playerPath === 'advanced_course' || this.finalPath === 'advanced_course') {
            // 専攻科ルート
            this.chapterEvents = [
              ...commonEvents,
              { id: 'advancedCourseApplication', name: '専攻科受験申込', completed: false, type: 'choice',
                choices: [
                  { id: 'theory_major', name: '理論専攻', requirements: { theory: 200 }, effect: { theory: 30 } },
                  { id: 'applied_major', name: '応用専攻', requirements: { submission: 200 }, effect: { submission: 30 } },
                  { id: 'interdisciplinary_major', name: '学際専攻', requirements: { theory: 160, submission: 160 }, effect: { theory: 20, submission: 20 } }
                ]
              },
              { id: 'researchProposal', name: '研究計画書作成', completed: false, type: 'battle',
                enemy: { name: '研究計画書', hp: 250, maxHP: 250, expReward: 1000, submissionBonus: 25, description: '独創的な研究計画の立案' } },
              { id: 'advancedCourseExam', name: '専攻科入学試験', completed: false, type: 'boss',
                enemy: { name: '専攻科入学試験官パネル', hp: 400, maxHP: 400, expReward: 2000, submissionBonus: 50, description: '筆記・面接・研究発表の総合勝負' } }
            ];
          } else if (this.playerPath === 'university' || this.finalPath === 'university_transfer') {
            // 大学編入ルート
            this.chapterEvents = [
              ...commonEvents,
              { id: 'universitySelection', name: '志望大学選択', completed: false, type: 'choice',
                choices: [
                  { id: 'top_national', name: '最難関国立大学', requirements: { theory: 220, submission: 180 }, effect: { theory: 35, social: 10 } },
                  { id: 'engineering_focused', name: '工科系名門大学', requirements: { theory: 200, submission: 200 }, effect: { submission: 35, theory: 15 } },
                  { id: 'balanced_university', name: '中堅大学', requirements: { theory: 180, submission: 180, social: 150 }, effect: { theory: 20, submission: 20, social: 20 } }
                ]
              },
              { id: 'transferExamPrep', name: '編入試験集中対策', completed: false, type: 'battle',
                enemy: { name: '編入試験プレッシャー', hp: 350, maxHP: 350, expReward: 1500, submissionBonus: 35, description: '時間制限と高難易度のプレッシャー' } },
              { id: 'transferExam', name: '大学編入試験本番', completed: false, type: 'boss',
                enemy: { name: '志望大学入学試験', hp: 450, maxHP: 450, expReward: 2500, submissionBonus: 60, description: '人生を左右する一発勝負' } }
            ];
          } else {
            // 就職ルート
            this.chapterEvents = [
              ...commonEvents,
              { id: 'companyResearch', name: '企業研究・面接', completed: false, type: 'battle',
                enemy: { name: '面接官', hp: 200, maxHP: 200, expReward: 800, submissionBonus: 20, description: '10社分のES作成マラソン' } },
              { id: 'internshipParticipation', name: 'インターンシップ参加', completed: false, type: 'battle',
                enemy: { name: 'インターン課題', hp: 280, maxHP: 280, expReward: 1200, submissionBonus: 30, description: '実際の業務体験での成果発揮' } },
              { id: 'jobInterviews', name: '就職活動本格化', completed: false, type: 'boss',
                enemy: { name: '志望企業最終面接', hp: 350, maxHP: 350, expReward: 1800, submissionBonus: 45, description: '内定獲得をかけた最終決戦' } }
            ];
          }
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      case 5:
        // 第5章：卒業年・人生選択の実現・真の最終章
        if (this.isFeatureEnabled('chapter5')) {
          this.chapterGoals = {
            requiredCredits: 18,
            specialRequirement: '卒業研究完成・最終進路確定',
            researchCompleted: false,
            finalPathConfirmed: false,
            relationshipFinal: false
          };
          
          // 全ルート共通：卒業研究関連イベント
          const researchEvents = [
            { id: 'researchPlanFinalization', name: '研究計画ブラッシュアップ', completed: false, type: 'battle',
              enemy: { name: '研究計画の洗練', hp: 300, maxHP: 300, expReward: 1200, submissionBonus: 30, description: '指導教員との綿密な計画練り直し' } },
            { id: 'preliminaryExperiment', name: '予備実験・調査', completed: false, type: 'battle',
              enemy: { name: '予備実験の壁', hp: 250, maxHP: 250, expReward: 1000, submissionBonus: 25, description: '手法確立とデータ収集の困難' } },
            { id: 'mainResearch', name: '本実験・メイン調査', completed: false, type: 'boss',
              enemy: { name: '研究の核心', hp: 500, maxHP: 500, expReward: 2500, submissionBonus: 60, description: '最高難易度の研究実施' } },
            { id: 'dataAnalysis', name: 'データ解析・考察', completed: false, type: 'battle',
              enemy: { name: '論理的思考の試練', hp: 350, maxHP: 350, expReward: 1500, submissionBonus: 35, description: '客観的な分析と深い考察' } },
            { id: 'thesisWriting', name: '論文執筆', completed: false, type: 'battle',
              enemy: { name: '論文執筆の煉獄', hp: 400, maxHP: 400, expReward: 1800, submissionBonus: 40, description: '文章力・構成力・専門知識の総合戦' } },
            { id: 'graduationPresentation', name: '卒業研究発表会', completed: false, type: 'final_boss',
              enemy: { name: '卒研発表プレッシャー', hp: 600, maxHP: 600, expReward: 3000, submissionBonus: 75, description: '5年間の学習成果の集大成発表' } }
          ];
          
          // 進路確定イベント
          const careerEvents = [
            { id: 'finalCareerDecision', name: '最終進路確定', completed: false, type: 'choice',
              choices: [
                { id: 'advanced_course_final', name: '専攻科進学確定', requirements: { theory: 250, submission: 220 }, effect: { theory: 40 } },
                { id: 'university_transfer_final', name: '大学編入確定', requirements: { theory: 270, submission: 200 }, effect: { theory: 35, submission: 25 } },
                { id: 'employment_final', name: '就職確定', requirements: { submission: 250, social: 200 }, effect: { submission: 35, social: 30 } }
              ]
            },
            { id: 'careerPreparation', name: '新生活準備', completed: false, type: 'battle',
              enemy: { name: '人生の転換点', hp: 300, maxHP: 300, expReward: 1200, submissionBonus: 30, description: '新しい環境への準備と心構え' } }
          ];
          
          // 人間関係最終イベント
          const relationshipEvents = [
            { id: 'friendshipConsolidation', name: '友情の総仕上げ', completed: false, type: 'battle',
              enemy: { name: '別れの予感', hp: 280, maxHP: 280, expReward: 800, submissionBonus: 20, description: '卒業を前にした友情の確認' } },
            { id: 'mentorGratitude', name: '恩師への感謝', completed: false, type: 'battle',
              enemy: { name: '感謝の表現', hp: 280, maxHP: 280, expReward: 600, submissionBonus: 15, description: '5年間の指導への感謝の気持ち' } },
            { id: 'loveRelationshipFinal', name: '恋愛関係の最終決着', completed: false, type: 'battle',
              enemy: { name: '将来への約束', hp: 300, maxHP: 300, expReward: 1000, submissionBonus: 25, description: '卒業後の関係についての最終決断' } }
          ];
          
          // 卒業式・最終イベント
          const graduationEvents = [
            { id: 'graduationCeremony', name: '卒業式典', completed: false, type: 'ceremony',
              description: '5年間の高専生活の集大成' },
            { id: 'newLifeDeclaration', name: '新生活への決意表明', completed: false, type: 'declaration',
              description: '選択した道への最終意思確認' },
            { id: 'socialDoorway', name: '社会人への扉', completed: false, type: 'final_boss',
              enemy: { name: '大人への階段', hp: 800, maxHP: 800, expReward: 4000, submissionBonus: 100, description: '真の大人として社会に出る準備の完成' } }
          ];
          
          this.chapterEvents = [...researchEvents, ...careerEvents, ...relationshipEvents, ...graduationEvents];
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      case 6:
        // 第6章：アフターストーリー・新たな人生の始まり
        if (this.isFeatureEnabled('chapter6')) {
          this.chapterGoals = {
            requiredCredits: 20,
            specialRequirement: '新環境での確立',
            careerPath: this.finalPath || 'unknown',
            relationshipStatus: null
          };
          
          // 進路に応じた異なるイベント構成
          if (this.finalPath === 'advanced_course' || this.finalPath === 'graduate_school') {
            // 専攻科・大学院ルート
            this.chapterEvents = [
              { id: 'graduateOrientation', name: '大学院生活開始', completed: false, type: 'intro' },
              { id: 'advancedResearch', name: '高度研究プロジェクト', completed: false, type: 'battle',
                enemy: { name: '修士研究課題', hp: 400, maxHP: 400, expReward: 1500, submissionBonus: 35, description: '国際レベルの研究に挑戦' } },
              { id: 'internationalConference', name: '国際学会発表', completed: false, type: 'battle',
                enemy: { name: '国際学会発表', hp: 350, maxHP: 350, expReward: 1200, submissionBonus: 30, description: '英語力とプレゼン力の集大成' } },
              { id: 'careerDecision', name: '博士課程 vs 就職選択', completed: false, type: 'choice',
                choices: [
                  { id: 'phd_course', name: '博士課程進学', requirements: { theory: 280, submission: 250 } },
                  { id: 'research_job', name: '企業研究職', requirements: { submission: 280, social: 200 } },
                  { id: 'academic_job', name: '大学教員・研究者', requirements: { theory: 300, submission: 260 } }
                ]
              }
            ];
          } else if (this.finalPath === 'employment' || this.finalPath === 'corporate_job') {
            // 就職ルート
            this.chapterEvents = [
              { id: 'corporateOrientation', name: '新入社員研修', completed: false, type: 'intro' },
              { id: 'firstProject', name: '初の担当プロジェクト', completed: false, type: 'battle',
                enemy: { name: '新人プロジェクト', hp: 300, maxHP: 300, expReward: 1000, submissionBonus: 25, description: '社会人としての責任ある仕事' } },
              { id: 'teamLeadership', name: 'チームリーダー挑戦', completed: false, type: 'battle',
                enemy: { name: 'プロジェクト管理', hp: 450, maxHP: 450, expReward: 1800, submissionBonus: 40, description: 'リーダーシップと管理能力が試される' } },
              { id: 'promotionPath', name: '昇進・キャリアパス選択', completed: false, type: 'choice',
                choices: [
                  { id: 'technical_specialist', name: '技術スペシャリスト', requirements: { submission: 300, theory: 250 } },
                  { id: 'management_track', name: '管理職トラック', requirements: { social: 280, submission: 240 } },
                  { id: 'entrepreneur', name: '起業・独立', requirements: { submission: 260, social: 260, theory: 200 } }
                ]
              }
            ];
          } else {
            // 汎用ルート
            this.chapterEvents = [
              { id: 'newLifeStart', name: '新生活スタート', completed: false, type: 'intro' },
              { id: 'lifeChallenge', name: '人生の挑戦', completed: false, type: 'battle',
                enemy: { name: '大人の責任', hp: 350, maxHP: 350, expReward: 1200, submissionBonus: 30, description: '真の大人としての試練' } }
            ];
          }
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      case 7:
        // 第7章：社会人中堅・専門性確立
        if (this.isFeatureEnabled('chapter7')) {
          this.chapterGoals = {
            requiredCredits: 25,
            specialRequirement: '専門分野での確立',
            expertiseLevel: 0,
            mentoringCount: 0
          };
          this.chapterEvents = [
            { id: 'expertiseDevelopment', name: '専門性の深化', completed: false, type: 'battle',
              enemy: { name: '専門技術の壁', hp: 500, maxHP: 500, expReward: 2000, submissionBonus: 50, description: '真の専門家になるための試練' } },
            { id: 'mentoringJuniors', name: '後輩指導・メンタリング', completed: false, type: 'battle',
              enemy: { name: '指導責任', hp: 400, maxHP: 400, expReward: 1500, submissionBonus: 35, description: '次世代を育てる責任' } },
            { id: 'industryRecognition', name: '業界での認知獲得', completed: false, type: 'battle',
              enemy: { name: '業界での評価', hp: 600, maxHP: 600, expReward: 2500, submissionBonus: 60, description: '業界のエキスパートとしての認知' } },
            { id: 'lifeBalance', name: '仕事と人生のバランス', completed: false, type: 'battle',
              enemy: { name: 'ワークライフバランス', hp: 450, maxHP: 450, expReward: 1800, submissionBonus: 40, description: '充実した人生の実現' } }
          ];
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      case 8:
        // 第8章：真の大人・人生の完成
        if (this.isFeatureEnabled('chapter8')) {
          this.chapterGoals = {
            requiredCredits: 30,
            specialRequirement: '人生の完成形',
            lifeAchievement: 0,
            socialContribution: 0
          };
          this.chapterEvents = [
            { id: 'lifePhilosophy', name: '人生哲学の確立', completed: false, type: 'battle',
              enemy: { name: '人生の意味', hp: 700, maxHP: 700, expReward: 3000, submissionBonus: 75, description: '自分なりの人生観の確立' } },
            { id: 'socialContribution', name: '社会への貢献', completed: false, type: 'battle',
              enemy: { name: '社会貢献の責任', hp: 900, maxHP: 900, expReward: 2500, submissionBonus: 60, description: '社会に価値を提供する責任' } },
            { id: 'legacyCreation', name: '次世代への遺産', completed: false, type: 'battle',
              enemy: { name: '未来への責任', hp: 1000, maxHP: 1000, expReward: 4000, submissionBonus: 100, description: '次世代に何を残すかの選択' } },
            { id: 'trueAdulthood', name: '真の大人への到達', completed: false, type: 'final_boss',
              enemy: { name: '人生の完成', hp: 1200, maxHP: 1200, expReward: 5000, submissionBonus: 150, description: '真の大人として完成した人格' } }
          ];
        } else {
          this.chapterGoals = {};
          this.chapterEvents = [];
        }
        break;
      default:
        this.chapterGoals = {};
        this.chapterEvents = [];
        break;
    }
  }

  // 章イベント進行
  getCurrentChapterEvent() {
    if (!this.chapterEvents) {
      // console.log('getCurrentChapterEvent: chapterEventsが存在しません');
      return null;
    }
    
    const uncompletedEvent = this.chapterEvents.find(event => !event.completed);
//    console.log('getCurrentChapterEvent: 未完了イベント検索結果:', uncompletedEvent?.id || 'なし');
//    console.log('全イベント状態:', this.chapterEvents.map(e => ({ id: e.id, completed: e.completed })));
    
    return uncompletedEvent;
  }

  // イベント要件チェック
  checkEventRequirements(eventId) {
    const event = this.chapterEvents.find(e => e.id === eventId);
    if (!event || !event.requirements) return { canAccess: true, message: '' };
    
    const requirements = event.requirements;
    const missing = [];
    
    if (requirements.submission && this.playerStats.submission < requirements.submission) {
      missing.push(`提出力 ${requirements.submission}以上 (現在: ${this.playerStats.submission})`);
    }
    if (requirements.theory && this.playerStats.theory < requirements.theory) {
      missing.push(`理論力 ${requirements.theory}以上 (現在: ${this.playerStats.theory})`);
    }
    if (requirements.social && this.playerStats.social < requirements.social) {
      missing.push(`社交力 ${requirements.social}以上 (現在: ${this.playerStats.social})`);
    }
    if (requirements.maxStress && this.playerStats.stress > requirements.maxStress) {
      missing.push(`ストレス ${requirements.maxStress}以下 (現在: ${this.playerStats.stress})`);
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
    if (!this.chapterEvents) {
//      console.log('警告: chapterEventsが存在しません');
      return;
    }
    const event = this.chapterEvents.find(e => e.id === eventId);
    if (event) {
//      console.log(`イベント完了処理: ${eventId}, 前の状態: completed=${event.completed}`);
      event.completed = true;
      this.chapterProgress++;
//      console.log(`イベント完了後: completed=${event.completed}, chapterProgress=${this.chapterProgress}`);
    } else {
//      console.log(`警告: イベント ${eventId} が見つかりません`);
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
    
    // バトル終了時のHP/SP更新
    if (rewards.finalPlayerHP !== undefined) {
      this.playerStats.hp = Math.max(0, rewards.finalPlayerHP);
    }
    if (rewards.finalPlayerSP !== undefined) {
      this.playerStats.sp = Math.max(0, rewards.finalPlayerSP);
    }
    
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
//        console.log(`スロット "${slotName}" にセーブデータが見つかりません`);
        return false;
      }
      
      const saveData = JSON.parse(savedData);
      this.loadData(saveData);
      
      // 章データが存在しない場合は初期化
      if (!this.chapterEvents) {
        this.initializeChapter(this.currentChapter);
      }
      
//      console.log(`スロット "${slotName}" からゲームデータを読み込みました`);
      return true;
    } catch (error) {
      console.error('road faild:', error);
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
//      console.log(`スロット "${slotName}" のセーブデータを削除しました`);
      return true;
    } catch (error) {
//      console.error('セーブデータ削除に失敗しました:', error);
      return false;
    }
  }

  // 管理者認証
  authenticateAdmin(password) {
    // 簡単なハッシュ化（セキュリティ向上のため）
    const hash = password === 'minusead' ? 'mnsd2025x' : password + 'x';
    if (hash === this.adminPasswordHash) {
      this.isAdmin = true;
      
      // セッションを管理者として記録
      this.markAsAdminSession();
      
      return true;
    } else {
      // 認証失敗を記録
      this.detectSuspiciousActivity('failed_admin_auth', { password: '***' });
      return false;
    }
  }

  // 管理者権限を無効化
  disableAdmin() {
    this.isAdmin = false;
    // 管理者セッションから削除
    this.workspaceMonitoring.adminSessions.delete(this.currentSessionId);
    this.logSecurityEvent('admin_logout', {
      sessionId: this.currentSessionId
    });
  }

  // チート機能: ステータス最大化
  cheatMaxStats() {
    if (!this.isAdmin) return false;
    
    this.playerStats = {
      ...this.playerStats,
      hp: 1024,
      sp: 1024,
      submission: 1024,
      theory: 1024,
      social: 1024,
      stress: 0,
      money: 999999,
      level: 1024,
      maxHP: 1024,
      maxSP: 1024
    };
    return true;
  }

  // チート機能: 章イベント完了
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
    return this.purchasedItems
      .map(item => ({
        itemId: item.itemId || `item_${item.timestamp || Date.now()}`,
        itemName: item.itemName || item.name || '不明なアイテム',
        price: item.price || item.cost || 0,
        purchaseDate: item.purchaseDate || item.timestamp || Date.now(),
        type: item.type || 'item',
        rarity: item.rarity || null
      }))
      .sort((a, b) => b.purchaseDate - a.purchaseDate);
  }

  // === 章進行システム拡張 ===

  // デバッグ用：章の状態確認
  getChapterDebugInfo() {
    return {
      currentChapter: this.currentChapter,
      playerPath: this.playerPath,
      chapterEvents: this.chapterEvents,
      chapterGoals: this.chapterGoals,
      featureFlags: {
        chapter3: this.isFeatureEnabled('chapter3'),
        chapter4: this.isFeatureEnabled('chapter4'),
        chapter5: this.isFeatureEnabled('chapter5'),
        chapter6: this.isFeatureEnabled('chapter6'),
        chapter7: this.isFeatureEnabled('chapter7'),
        chapter8: this.isFeatureEnabled('chapter8')
      },
      pathAvailability: {
        chapter3: this.isFeatureEnabled('chapter3'),
        chapter4_kosen: this.isFeatureEnabled('chapter4') && this.playerPath === 'kosen',
        chapter4_university: this.isFeatureEnabled('chapter4') && this.playerPath === 'university',
        chapter5_kosen: this.isFeatureEnabled('chapter5') && this.playerPath === 'kosen',
        chapter5_university: this.isFeatureEnabled('chapter5') && this.playerPath === 'university'
      },
      completedEvents: this.chapterEvents ? this.chapterEvents.filter(e => e.completed).length : 0,
      totalEvents: this.chapterEvents ? this.chapterEvents.length : 0
    };
  }

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
    const goals = this.chapterGoals || {};
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

    // 次章が存在するかチェック
    const nextChapter = this.currentChapter + 1;
    const availableChapters = [1, 2, 3, 4, 5, 6, 7, 8]; // 基本的に利用可能な章
      // 第4章は進路選択が必要
      if (this.playerPath === 'kosen' || this.playerPath === 'university') {
        availableChapters.push(4);
      }
      // 第5章も進路選択が必要
      if (this.playerPath === 'kosen' || this.playerPath === 'university') {
        availableChapters.push(5);
      }
     
    if (!availableChapters.includes(nextChapter)) {
      const pathRequirement = nextChapter >= 4 ? `\n\n進路分岐の状態:\n現在の進路: ${this.playerPath || '未選択'}\n第${nextChapter}章には進路選択（高専継続 or 大学進学）が必要です。` : '';
      
      const featureStatus = {
        3: this.isFeatureEnabled('chapter3') ? '有効' : '無効',
        4: this.isFeatureEnabled('chapter4') ? '有効' : '無効', 
        5: this.isFeatureEnabled('chapter5') ? '有効' : '無効',
        6: this.isFeatureEnabled('chapter6') ? '有効' : '無効',
        7: this.isFeatureEnabled('chapter7') ? '有効' : '無効',
        8: this.isFeatureEnabled('chapter8') ? '有効' : '無効'
      };
      
      return { 
        success: false, 
        message: `第${nextChapter}章は未実装です。` 
      };
    }

    // レベルアップボーナス（章クリア報酬）
    const chapterBonus = {
      1: { exp: 500, money: 2000, maxHP: 20, maxSP: 30 },
      2: { exp: 800, money: 3500, maxHP: 30, maxSP: 40 },
      3: { exp: 900, money: 4000, maxHP: 60, maxSP: 48 },
      4: { exp: 1200, money: 5000, maxHP: 80, maxSP: 64 },
      5: { exp: 1500, money: 6000, maxHP: 100, maxSP: 80 },
      6: { exp: 2000, money: 8000, maxHP: 120, maxSP: 100 },
      7: { exp: 2500, money: 10000, maxHP: 150, maxSP: 120 },
      8: { exp: 3000, money: 15000, maxHP: 200, maxSP: 150 }
    };

    const bonus = chapterBonus[this.currentChapter];
    if (bonus) {
      this.gainExperience(bonus.exp);
      this.changeStats(bonus);
      this.playerStats.money += bonus.money;
    }

    // 最大章数チェック
    if (nextChapter > 8) {
      return { 
        success: false, 
        message: `ゲームクリアおめでとうございます！第8章で物語は完結しました。` 
      };
    }

    // 次章初期化
    this.currentChapter = nextChapter;
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

    // 進路選択の場合、playerPathを設定
    if (choice.path && eventId === 'careerGuidance') {
      this.playerPath = choice.path;
      console.log(`進路選択完了: ${choice.path}`);
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
        effect: { theory: 4, social: 1 },
        message: '先輩から勉強のコツを教えてもらいました！'
      },
      {
        id: 'bad_weather',
        name: '悪天候',
        description: '雨で疲れが溜まりました',
        probability: 0.08,
        effect: { stress: 3, sp: -5, social: 2 },
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

  // === 自由行動ランダムイベントシステム ===

  // 自由行動時の選択イベント一覧
  getFreeActionChoiceEvents() {
    return [
      {
        id: 'campus_exploration',
        name: 'キャンパス探索',
        description: '校内を散策していると...',
        choices: [
          { 
            id: 'library_visit', 
            name: '図書館に向かう', 
            effect: { theory: 3, sp: -2 },
            message: '静かな図書館で集中して勉強できました'
          },
          { 
            id: 'lab_visit', 
            name: '研究室を覗く', 
            effect: { theory: 2, social: 2, sp: -3 },
            message: '先輩と研究について語り合いました'
          },
          { 
            id: 'cafeteria_break', 
            name: '学食で休憩', 
            effect: { stress: -3, money: -100, hp: 5 },
            message: '美味しい食事でリフレッシュできました'
          }
        ]
      },
      {
        id: 'study_group_encounter',
        name: '勉強グループとの出会い',
        description: '廊下で同級生が勉強について話している...',
        choices: [
          { 
            id: 'join_discussion', 
            name: '議論に参加する', 
            effect: { theory: 4, social: 3, sp: -5 },
            message: '活発な議論で理解が深まりました'
          },
          { 
            id: 'listen_quietly', 
            name: 'そっと聞く', 
            effect: { theory: 2, stress: 1 },
            message: '有益な情報を得ることができました'
          },
          { 
            id: 'offer_help', 
            name: '手助けを申し出る', 
            effect: { social: 4, submission: 2, sp: -3 },
            message: '皆に感謝され、充実感を得ました'
          }
        ]
      },
      {
        id: 'equipment_problem',
        name: '機材トラブル発生',
        description: '実習で使う機材に問題が...',
        choices: [
          { 
            id: 'fix_yourself', 
            name: '自分で修理する', 
            effect: { theory: 5, submission: 3, stress: 2 },
            message: '修理成功！技術力が向上しました'
          },
          { 
            id: 'ask_teacher', 
            name: '先生に相談', 
            effect: { social: 2, theory: 1 },
            message: '先生から丁寧に教わりました'
          },
          { 
            id: 'team_solution', 
            name: 'チームで解決', 
            effect: { social: 4, theory: 2, submission: 1 },
            message: 'チームワークで問題を解決しました'
          }
        ]
      },
      {
        id: 'senior_advice',
        name: '先輩からのアドバイス',
        description: '先輩が何かアドバイスをくれそう...',
        choices: [
          { 
            id: 'career_advice', 
            name: '進路について聞く', 
            effect: { theory: 3, social: 2, stress: -2 },
            message: '将来への道筋が見えてきました'
          },
          { 
            id: 'study_tips', 
            name: '勉強法を教わる', 
            effect: { submission: 4, theory: 2 },
            message: '効率的な勉強方法を学びました'
          },
          { 
            id: 'life_balance', 
            name: '学生生活について', 
            effect: { stress: -4, social: 3, sp: 5 },
            message: '心の支えになる言葉をもらいました'
          }
        ]
      },
      {
        id: 'club_activity',
        name: 'サークル活動参加',
        description: 'サークルから誘いが来ました...',
        choices: [
          { 
            id: 'technical_club', 
            name: '技術系サークル', 
            effect: { theory: 6, social: 2, sp: -4 },
            message: '技術的な知識を深めることができました'
          },
          { 
            id: 'sports_club', 
            name: '運動系サークル', 
            effect: { hp: 10, stress: -5, social: 4, sp: -6 },
            message: '身体を動かしてリフレッシュしました'
          },
          { 
            id: 'cultural_club', 
            name: '文化系サークル', 
            effect: { social: 5, stress: -3, theory: 1 },
            message: '新しい趣味を見つけることができました'
          }
        ]
      },
      {
        id: 'mysterious_encounter',
        name: '謎めいた出会い',
        description: '校内で不思議な人物に出会いました...',
        isBattle: true,
        battleProbability: 0.3, // 30%の確率で戦闘
        choices: [
          { 
            id: 'approach_cautiously', 
            name: '慎重に近づく', 
            effect: { theory: 2, social: 1 },
            message: '興味深い話を聞くことができました',
            battleEnemy: { 
              name: '謎の挑戦者', 
              hp: 45, 
              maxHP: 45, 
              expReward: 80, 
              submissionBonus: 2,
              description: '正体不明だが強力な相手'
            }
          },
          { 
            id: 'ignore_and_leave', 
            name: '無視して立ち去る', 
            effect: { stress: 1 },
            message: '何事もなく過ぎ去りました'
          },
          { 
            id: 'confront_directly', 
            name: '直接話しかける', 
            effect: { social: 3, stress: 2 },
            message: '勇気を出して良かったです',
            battleEnemy: { 
              name: '実力テスト', 
              hp: 60, 
              maxHP: 60, 
              expReward: 120, 
              submissionBonus: 3,
              description: '実力を試すための戦い'
            }
          }
        ]
      }
    ];
  }

  // 自由行動時のランダム選択イベント発生
  triggerFreeActionChoiceEvent() {
    const events = this.getFreeActionChoiceEvents();
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    return {
      occurred: true,
      event: randomEvent
    };
  }

  // 自由行動選択イベント処理
  processFreeActionChoice(eventId, choiceId) {
    const events = this.getFreeActionChoiceEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      return { success: false, message: '選択イベントが見つかりません' };
    }

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { success: false, message: '選択肢が見つかりません' };
    }

    // 戦闘発生判定
    let battleTriggered = false;
    let battleEnemy = null;

    if (event.isBattle && choice.battleEnemy) {
      const battleChance = Math.random();
      if (battleChance < (event.battleProbability || 0.2)) {
        battleTriggered = true;
        battleEnemy = choice.battleEnemy;
      }
    }

    // 選択効果を適用（戦闘が発生しない場合）
    if (!battleTriggered && choice.effect) {
      this.changeStats(choice.effect);
    }

    // フラグ追加
    this.flags.add(`free_action_choice_${eventId}_${choiceId}_${Date.now()}`);

    return { 
      success: true, 
      message: choice.message,
      effect: choice.effect,
      battleTriggered: battleTriggered,
      battleEnemy: battleEnemy
    };
  }

  // ======================================
  // ワークスペース監視システム
  // ======================================

  /**
   * プレイヤーセッションを初期化
   */
  initializePlayerSession() {
    // ユニークなセッションIDを生成
    this.currentSessionId = this.generateSessionId();
    
    // プレイヤーIDを生成（ブラウザフィンガープリント + ランダム要素）
    this.currentPlayerId = this.generatePlayerId();
    
    // ブラウザ環境チェック
    const isClient = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    
    // セッション情報を登録
    this.workspaceMonitoring.sessions.set(this.currentSessionId, {
      playerId: this.currentPlayerId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      currentView: 'status',
      suspiciousActivity: 0,
      userAgent: isClient ? navigator.userAgent : 'server',
      screenInfo: isClient && typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0',
      ipFingerprint: this.getIPFingerprint()
    });
    
    this.workspaceMonitoring.playerCount++;
    
    // セッション開始ログ
    this.logSecurityEvent('session_start', {
      sessionId: this.currentSessionId,
      playerId: this.currentPlayerId
    });
    
    // 定期的なセッションクリーンアップを開始
    this.startSessionCleanup();
  }

  /**
   * セッションIDを生成
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * プレイヤーIDを生成（ブラウザフィンガープリンティング）
   */
  generatePlayerId() {
    // ブラウザ環境チェック
    const isClient = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    
    const fingerprint = [
      isClient ? navigator.userAgent : 'server',
      isClient ? navigator.language : 'unknown',
      isClient && typeof screen !== 'undefined' ? screen.width + 'x' + screen.height : '0x0',
      new Date().getTimezoneOffset(),
      isClient ? navigator.platform : 'server',
      isClient ? (navigator.cookieEnabled ? '1' : '0') : '0'
    ].join('|');
    
    // 簡単なハッシュ生成
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer
    }
    
    return 'player_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36).substr(-4);
  }

  /**
   * IPフィンガープリントを取得（近似）
   */
  getIPFingerprint() {
    // WebRTCを利用したローカルIP取得（簡易版）
    return 'ip_' + Math.random().toString(36).substr(2, 8);
  }

  /**
   * セキュリティイベントをログに記録
   */
  logSecurityEvent(eventType, data) {
    const logEntry = {
      timestamp: Date.now(),
      type: eventType,
      sessionId: this.currentSessionId,
      playerId: this.currentPlayerId,
      data: data
    };
    
    this.workspaceMonitoring.securityLogs.push(logEntry);
    
    // ログサイズ制限（最新1000件まで）
    if (this.workspaceMonitoring.securityLogs.length > 1000) {
      this.workspaceMonitoring.securityLogs = this.workspaceMonitoring.securityLogs.slice(-1000);
    }
  }

  /**
   * 現在のビューを更新
   */
  updateCurrentView(viewName) {
    if (this.workspaceMonitoring.sessions.has(this.currentSessionId)) {
      const session = this.workspaceMonitoring.sessions.get(this.currentSessionId);
      const oldView = session.currentView;
      session.currentView = viewName;
      session.lastActivity = Date.now();
      
      this.logSecurityEvent('view_change', { 
        from: oldView, 
        to: viewName 
      });
    }
  }

  /**
   * 不正行為を検知・記録
   */
  detectSuspiciousActivity(activityType, details) {
    if (!this.workspaceMonitoring.sessions.has(this.currentSessionId)) return;
    
    const session = this.workspaceMonitoring.sessions.get(this.currentSessionId);
    session.suspiciousActivity++;
    
    this.logSecurityEvent('suspicious_activity', {
      type: activityType,
      details: details,
      totalSuspicious: session.suspiciousActivity
    });
    
    // 不正行為が閾値を超えた場合
    if (session.suspiciousActivity >= this.workspaceMonitoring.suspiciousThreshold) {
      this.logSecurityEvent('security_alert', {
        reason: 'excessive_suspicious_activity',
        count: session.suspiciousActivity
      });
    }
  }

  /**
   * 管理者セッションとして記録
   */
  markAsAdminSession() {
    this.workspaceMonitoring.adminSessions.add(this.currentSessionId);
    this.logSecurityEvent('admin_access', {
      sessionId: this.currentSessionId
    });
  }

  /**
   * セッションクリーンアップを開始
   */
  startSessionCleanup() {
    // 既存のタイマーがあればクリア
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 5分ごとにクリーンアップ
  }

  /**
   * 期限切れセッションをクリーンアップ
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.workspaceMonitoring.sessions) {
      if (now - session.lastActivity > this.workspaceMonitoring.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.workspaceMonitoring.sessions.delete(sessionId);
      this.workspaceMonitoring.adminSessions.delete(sessionId);
      this.workspaceMonitoring.playerCount--;
      
      this.logSecurityEvent('session_timeout', { sessionId });
    });
  }

  /**
   * ワークスペース監視統計を取得（管理者専用）
   */
  getWorkspaceStats() {
    if (!this.isAdmin) {
      return { error: 'Unauthorized access' };
    }
    
    this.cleanupExpiredSessions(); // 最新の状態に更新
    
    const activeSessions = Array.from(this.workspaceMonitoring.sessions.values());
    const adminSessionCount = this.workspaceMonitoring.adminSessions.size;
    const regularSessionCount = activeSessions.length - adminSessionCount;
    
    // 不正行為統計
    const suspiciousStats = {
      totalSuspiciousActivities: this.workspaceMonitoring.securityLogs.filter(log => 
        log.type === 'suspicious_activity'
      ).length,
      playersWithSuspiciousActivity: activeSessions.filter(session => 
        session.suspiciousActivity > 0
      ).length,
      highRiskPlayers: activeSessions.filter(session => 
        session.suspiciousActivity >= this.workspaceMonitoring.suspiciousThreshold
      ).length
    };
    
    // セッション詳細
    const sessionDetails = activeSessions.map(session => ({
      sessionId: session.playerId, // セキュリティのため実際のセッションIDは隠す
      startTime: new Date(session.startTime).toLocaleString('ja-JP'),
      lastActivity: new Date(session.lastActivity).toLocaleString('ja-JP'),
      currentView: session.currentView,
      suspiciousActivity: session.suspiciousActivity,
      isAdmin: this.workspaceMonitoring.adminSessions.has(session.sessionId),
      userAgent: session.userAgent.substring(0, 50) + '...', // セキュリティのため短縮
      screenInfo: session.screenInfo
    }));
    
    // 最近のセキュリティログ
    const recentLogs = this.workspaceMonitoring.securityLogs
      .slice(-50) // 最新50件
      .map(log => ({
        timestamp: new Date(log.timestamp).toLocaleString('ja-JP'),
        type: log.type,
        playerId: log.playerId,
        details: log.data
      }));
    
    return {
      overview: {
        totalActivePlayers: this.workspaceMonitoring.playerCount,
        adminSessions: adminSessionCount,
        regularSessions: regularSessionCount,
        maxSessions: this.workspaceMonitoring.maxSessions,
        sessionTimeout: this.workspaceMonitoring.sessionTimeout / (60 * 1000) + ' minutes'
      },
      suspiciousActivity: suspiciousStats,
      activeSessions: sessionDetails,
      recentSecurityLogs: recentLogs,
      systemHealth: {
        memoryUsage: this.workspaceMonitoring.sessions.size,
        logSize: this.workspaceMonitoring.securityLogs.length,
        uptimeHours: Math.floor((Date.now() - (activeSessions[0]?.startTime || Date.now())) / (1000 * 60 * 60))
      }
    };
  }

  /**
   * 特定プレイヤーの詳細情報を取得（管理者専用）
   */
  getPlayerDetails(playerId) {
    if (!this.isAdmin) {
      return { error: 'Unauthorized access' };
    }
    
    // プレイヤーのセッション情報を検索
    let targetSession = null;
    let targetSessionId = null;
    
    for (const [sessionId, session] of this.workspaceMonitoring.sessions) {
      if (session.playerId === playerId) {
        targetSession = session;
        targetSessionId = sessionId;
        break;
      }
    }
    
    if (!targetSession) {
      return { error: 'Player not found' };
    }
    
    // そのプレイヤーに関連するログを取得
    const playerLogs = this.workspaceMonitoring.securityLogs.filter(log => 
      log.playerId === playerId
    ).map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString('ja-JP'),
      type: log.type,
      details: log.data
    }));
    
    return {
      playerId: playerId,
      sessionInfo: {
        startTime: new Date(targetSession.startTime).toLocaleString('ja-JP'),
        lastActivity: new Date(targetSession.lastActivity).toLocaleString('ja-JP'),
        currentView: targetSession.currentView,
        suspiciousActivity: targetSession.suspiciousActivity,
        isAdmin: this.workspaceMonitoring.adminSessions.has(targetSessionId),
        userAgent: targetSession.userAgent,
        screenInfo: targetSession.screenInfo,
        ipFingerprint: targetSession.ipFingerprint
      },
      activityLogs: playerLogs,
      riskLevel: targetSession.suspiciousActivity >= this.workspaceMonitoring.suspiciousThreshold ? 'HIGH' : 
                 targetSession.suspiciousActivity > 2 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * セキュリティアクションを実行（管理者専用）
   */
  executeSecurityAction(action, targetPlayerId) {
    if (!this.isAdmin) {
      return { error: 'Unauthorized access' };
    }
    
    switch (action) {
      case 'kick_player':
        // プレイヤーをキック（セッション削除）
        for (const [sessionId, session] of this.workspaceMonitoring.sessions) {
          if (session.playerId === targetPlayerId) {
            this.workspaceMonitoring.sessions.delete(sessionId);
            this.workspaceMonitoring.adminSessions.delete(sessionId);
            this.workspaceMonitoring.playerCount--;
            
            this.logSecurityEvent('admin_kick', {
              targetPlayerId: targetPlayerId,
              adminSessionId: this.currentSessionId
            });
            
            return { success: true, message: `Player ${targetPlayerId} has been kicked` };
          }
        }
        return { error: 'Player not found' };
        
      case 'clear_suspicious':
        // 不正行為カウンターをリセット
        for (const [sessionId, session] of this.workspaceMonitoring.sessions) {
          if (session.playerId === targetPlayerId) {
            session.suspiciousActivity = 0;
            
            this.logSecurityEvent('admin_clear_suspicious', {
              targetPlayerId: targetPlayerId,
              adminSessionId: this.currentSessionId
            });
            
            return { success: true, message: `Suspicious activity cleared for ${targetPlayerId}` };
          }
        }
        return { error: 'Player not found' };
        
      default:
        return { error: 'Unknown action' };
    }
  }

  // ===============================
  // 新機能メソッド（機能フラグで制御）
  // ===============================

  
  // スキルシステム（skillSystem フラグで制御）
  useSkillInBattle(skillId) {
    if (!this.isFeatureEnabled('skillSystem')) return { success: false, message: 'スキル機能は無効です' };
    
    // 基本スキルシステムの実装
    const skills = {
      'power_attack': {
        name: '強力な一撃',
        spCost: 10,
        effect: (playerStats, enemy) => ({
          damage: Math.floor(playerStats.submission * 1.5),
          message: '強力な一撃で敵にダメージを与えた！'
        })
      },
      'focus': {
        name: '集中',
        spCost: 8,
        effect: (playerStats) => ({
          statBoost: { theory: 5 },
          message: '集中力が高まり理論力が向上した！'
        })
      },
      'teamwork': {
        name: 'チームワーク',
        spCost: 12,
        effect: (playerStats) => ({
          statBoost: { social: 8, submission: 3 },
          message: 'チームワークで能力が向上した！'
        })
      }
    };

    const skill = skills[skillId];
    if (!skill) {
      return { success: false, message: '不明なスキルです' };
    }

    if (this.playerStats.sp < skill.spCost) {
      return { success: false, message: `SPが不足しています（必要: ${skill.spCost}）` };
    }

    // SP消費
    this.playerStats.sp -= skill.spCost;

    // スキル効果を適用
    const result = skill.effect(this.playerStats, this.currentBattle?.enemy);
    
    if (result.statBoost) {
      Object.entries(result.statBoost).forEach(([stat, boost]) => {
        this.playerStats[stat] += boost;
      });
    }

    return { 
      success: true, 
      message: result.message,
      damage: result.damage || 0,
      spUsed: skill.spCost
    };
  }

  // ガチャシステム（gachaSystem フラグで制御）
  performGacha(gachaType = 'normal') {
    if (!this.isFeatureEnabled('gachaSystem')) return { success: false, message: 'ガチャ機能は無効です' };
    
    const gachaCosts = {
      normal: 300,
      premium: 1500,
      special: 3000
    };

    const cost = gachaCosts[gachaType];
    if (this.playerStats.money < cost) {
      return { success: false, message: `所持金が不足しています（必要: ${cost}円）` };
    }

    // 所持金を消費
    this.playerStats.money -= cost;

    // 外部データファイルからガチャアイテムを取得
    let items;
    try {
      // 動的インポートではなく、直接データを使用
      const gachaItemTables = {
        normal: [
          { name: 'エナジードリンク', rarity: 'common', effect: { sp: 20 }, probability: 50, icon: '/0203020016.png' },
          { name: '栄養食品', rarity: 'common', effect: { hp: 25 }, probability: 30 },
          { name: '参考書', rarity: 'rare', effect: { theory: 3 }, probability: 15 },
          { name: 'プレゼンキット', rarity: 'rare', effect: { social: 3 }, probability: 5 }
        ],
        premium: [
          { name: '高級参考書', rarity: 'rare', effect: { theory: 8 }, probability: 40 },
          { name: '万能ツール', rarity: 'rare', effect: { submission: 8 }, probability: 30 },
          { name: 'カリスマセット', rarity: 'epic', effect: { social: 12 }, probability: 20 },
          { name: '超集中薬', rarity: 'epic', effect: { theory: 15, sp: 50 }, probability: 10 }
        ],
        special: []
      };
      if (this.isFeatureEnabled('superRareItems')) {
        gachaItemTables.special = [
          { name: '特別参考書', rarity: 'epic', effect: { theory: 12 }, probability: 25 },
          { name: '特別ツール', rarity: 'epic', effect: { submission: 12 }, probability: 20 },
          { name: '特別お守り', rarity: 'epic', effect: { maxHP: 30, maxSP: 30 }, probability: 15 },
          { name: '伝説の教科書', rarity: 'legendary', effect: { theory: 25, submission: 15 }, probability: 15 },
          { name: '最強のお守り', rarity: 'legendary', effect: { maxHP: 50, maxSP: 50 }, probability: 12 },
          { name: '天才の証明', rarity: 'legendary', effect: { theory: 50 }, probability: 8 },
          { name: '友情の絆', rarity: 'legendary', effect: { social: 30, stress: -20 }, probability: 3 },
          { name: '時空の腕時計', rarity: 'mythic', effect: { theory: 100, submission: 100, social: 100 }, probability: 2}
        ];
      }

      items = gachaItemTables[gachaType];
    } catch (error) {
      console.error('ガチャアイテムデータの読み込みに失敗:', error);
      return { success: false, message: 'ガチャアイテムデータの読み込みに失敗しました' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: '利用可能なガチャアイテムがありません' };
    }

    const random = Math.random() * 100;
    let accumulated = 0;
    let selectedItem = null;

    for (const item of items) {
      accumulated += item.probability;
      if (random <= accumulated) {
        selectedItem = item;
        break;
      }
    }

    if (!selectedItem) {
      selectedItem = items[0]; // フォールバック
    }

    // アイテム効果を適用
    Object.entries(selectedItem.effect).forEach(([stat, value]) => {
      if (stat === 'stress') {
        this.playerStats.stress = Math.max(0, this.playerStats.stress + value);
      } else {
        this.playerStats[stat] = (this.playerStats[stat] || 0) + value;
      }
    });

    // 購入履歴に追加
    this.purchasedItems.push({
      itemId: `gacha_${Date.now()}`,
      itemName: `${selectedItem.rarity.toUpperCase()}: ${selectedItem.name}`,
      price: cost,
      purchaseDate: Date.now(),
      type: 'gacha',
      rarity: selectedItem.rarity
    });

    return { 
      success: true, 
      item: selectedItem,
      message: `${selectedItem.rarity.toUpperCase()}: ${selectedItem.name}を獲得しました！`,
      cost: cost
    };
  }

  // NPCイベント（npcEvents フラグで制御）
  triggerNPCEvent(npcName) {
    if (!this.isFeatureEnabled('npcEvents')) return { success: false, message: 'NPCイベント機能は無効です' };
    
    const npc = this.npcs[npcName];
    if (!npc) {
      return { success: false, message: '存在しないNPCです' };
    }

    // 好感度に基づくイベント
    const affection = npc.affection;
    let event = null;

    if (affection >= 100) {
      event = {
        title: `${npcName}との特別な時間`,
        content: `${npcName}との絆が深まり、特別なスキルを習得しました！`,
        rewards: { skill: npc.skills[0] || '友情スキル', statBonus: { social: 10 } }
      };
    } else if (affection >= 64) {
      event = {
        title: `${npcName}との協力`,
        content: `${npcName}があなたの勉強を手伝ってくれました`,
        rewards: { statBonus: { theory: 5, submission: 3 } }
      };
    } else if (affection >= 32) {
      event = {
        title: `${npcName}との会話`,
        content: `${npcName}と楽しい時間を過ごしました`,
        rewards: { statBonus: { social: 3 }, stress: -5 }
      };
    } else {
      return { success: false, message: '好感度が不足しています（32以上必要）' };
    }

    // 報酬を適用
    if (event.rewards.statBonus) {
      Object.entries(event.rewards.statBonus).forEach(([stat, bonus]) => {
        this.playerStats[stat] += bonus;
      });
    }
    if (event.rewards.stress) {
      this.playerStats.stress = Math.max(0, this.playerStats.stress + event.rewards.stress);
    }
    if (event.rewards.skill) {
      if (!this.playerSkills.includes(event.rewards.skill)) {
        this.playerSkills.push(event.rewards.skill);
      }
    }

    return { 
      success: true, 
      event: event,
      message: `${event.title}: ${event.content}`
    };
  }

  // プレイヤーチャット（playerChat フラグで制御）
  sendChatMessage(message, targetPlayerId = null) {
    if (!this.isFeatureEnabled('playerChat')) {
      return { success: false, message: 'チャット機能は無効です' };
    }
    
    // 入力検証
    if (!message || typeof message !== 'string') {
      return { success: false, message: 'メッセージが無効です' };
    }
    
    // メッセージ長制限
    if (message.length > 200) {
      return { success: false, message: 'メッセージが長すぎます（最大200文字）' };
    }
    
    // 空白のみのメッセージをチェック
    if (message.trim().length === 0) {
      return { success: false, message: 'メッセージが空です' };
    }
    
    // 現在のプレイヤー情報を取得
    const senderSession = this.workspaceMonitoring.sessions.get(this.currentSessionId);
    if (!senderSession) {
      return { success: false, message: 'セッション情報が見つかりません' };
    }
    
    // ブロックされているかチェック
    if (this.chatSystem.blockedUsers.has(senderSession.playerId)) {
      return { success: false, message: 'あなたはチャットから一時的にブロックされています' };
    }
    
    // 不適切な内容をフィルタリング
    const filteredMessage = this.filterChatMessage(message);
    if (!filteredMessage) {
      return { success: false, message: '不適切な内容が含まれています' };
    }
    
    // メッセージオブジェクトを作成
    const chatMessage = {
      id: this.chatSystem.messageIdCounter++,
      senderId: senderSession.playerId,
      senderName: this.generatePlayerDisplayName(senderSession.playerId),
      message: filteredMessage,
      timestamp: Date.now(),
      targetPlayerId: targetPlayerId, // null = 全体チャット
      type: targetPlayerId ? 'direct' : 'public',
      isAdmin: this.workspaceMonitoring.adminSessions.has(this.currentSessionId)
    };
    
    // メッセージを保存
    this.chatSystem.messages.push(chatMessage);
    
    // メッセージ数制限
    if (this.chatSystem.messages.length > this.chatSystem.maxMessages) {
      this.chatSystem.messages = this.chatSystem.messages.slice(-this.chatSystem.maxMessages);
    }
    
    // チャットデータを同期（LocalStorage）
    this.syncChatData();
    
    // セキュリティログ
    this.logSecurityEvent('chat_message', {
      messageId: chatMessage.id,
      messageLength: message.length,
      targetPlayerId: targetPlayerId
    });
    
    // アクティビティを更新
    this.updateCurrentView('chat');
    
    return { 
      success: true, 
      message: 'メッセージを送信しました',
      messageId: chatMessage.id
    };
  }

  // チャットメッセージのフィルタリング
  filterChatMessage(message) {
    // 基本的な不適切語フィルター
    const bannedWords = ['馬鹿', 'バカ', 'ばか', '死ね', '殺す', 'アホ', 'チート', 'hack'];
    const lowerMessage = message.toLowerCase();
    
    for (const word of bannedWords) {
      if (lowerMessage.includes(word.toLowerCase())) {
        return null; // フィルタリングで拒否
      }
    }
    
    // HTMLタグを除去
    return message.replace(/<[^>]*>/g, '');
  }

  // プレイヤー表示名を生成
  generatePlayerDisplayName(playerId) {
    // 管理者の場合は「管理者」と表示
    if (this.workspaceMonitoring.adminSessions.has(this.currentSessionId) && 
        this.workspaceMonitoring.sessions.get(this.currentSessionId)?.playerId === playerId) {
      return '管理者';
    }
    
    // カスタム名前が設定されている場合はそれを使用
    if (this.chatSystem.playerNames.has(playerId)) {
      return this.chatSystem.playerNames.get(playerId);
    }
    
    // デフォルトの匿名表示名を生成
    const suffix = playerId.split('_').pop() || '0000';
    return `プレイヤー${suffix.substring(0, 4)}`;
  }

  // チャットメッセージ一覧を取得
  getChatMessages(limit = 50) {
    if (!this.isFeatureEnabled('playerChat')) {
      return { success: false, message: 'チャット機能は無効です' };
    }
    
    // 最新のメッセージを他のプレイヤーから読み込み
    this.loadSharedMessages();
    
    const messages = this.chatSystem.messages
      .slice(-limit) // 最新のメッセージから指定数取得
      .filter(msg => {
        // 報告されたメッセージは表示しない
        if (this.chatSystem.reportedMessages.has(msg.id)) {
          return false;
        }
        
        // プライベートメッセージの場合、送信者または受信者のみ表示
        if (msg.type === 'direct') {
          const currentSession = this.workspaceMonitoring.sessions.get(this.currentSessionId);
          return currentSession && (
            msg.senderId === currentSession.playerId || 
            msg.targetPlayerId === currentSession.playerId
          );
        }
        
        return true; // パブリックメッセージは全員に表示
      })
      .map(msg => ({
        id: msg.id,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        type: msg.type,
        isAdmin: msg.isAdmin,
        // セキュリティのためにプレイヤーIDは含めない
      }));
    
    return { success: true, messages: messages };
  }

  // チャットメッセージを報告
  reportChatMessage(messageId) {
    if (!this.isFeatureEnabled('playerChat')) {
      return { success: false, message: 'チャット機能は無効です' };
    }
    
    const message = this.chatSystem.messages.find(msg => msg.id === messageId);
    if (!message) {
      return { success: false, message: 'メッセージが見つかりません' };
    }
    
    this.chatSystem.reportedMessages.add(messageId);
    
    // セキュリティログ
    this.logSecurityEvent('chat_report', {
      reportedMessageId: messageId,
      reportedSenderId: message.senderId
    });
    
    return { success: true, message: 'メッセージを報告しました' };
  }

  // プレイヤーをブロック（管理者のみ）
  blockPlayerFromChat(playerId) {
    if (!this.isAdmin) {
      return { success: false, message: '管理者権限が必要です' };
    }
    
    this.chatSystem.blockedUsers.add(playerId);
    
    this.logSecurityEvent('chat_block', {
      blockedPlayerId: playerId,
      adminSessionId: this.currentSessionId
    });
    
    return { success: true, message: `プレイヤー ${playerId} をブロックしました` };
  }

  // プレイヤーのブロックを解除（管理者のみ）
  unblockPlayerFromChat(playerId) {
    if (!this.isAdmin) {
      return { success: false, message: '管理者権限が必要です' };
    }
    
    this.chatSystem.blockedUsers.delete(playerId);
    
    this.logSecurityEvent('chat_unblock', {
      unblockedPlayerId: playerId,
      adminSessionId: this.currentSessionId
    });
    
    return { success: true, message: `プレイヤー ${playerId} のブロックを解除しました` };
  }

  // チャット統計を取得（管理者のみ）
  getChatStats() {
    if (!this.isAdmin) {
      return { success: false, message: '管理者権限が必要です' };
    }
    
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentMessages = this.chatSystem.messages.filter(msg => msg.timestamp > oneHourAgo);
    const dailyMessages = this.chatSystem.messages.filter(msg => msg.timestamp > oneDayAgo);
    
    return {
      success: true,
      stats: {
        totalMessages: this.chatSystem.messages.length,
        messagesLastHour: recentMessages.length,
        messagesLastDay: dailyMessages.length,
        blockedUsers: this.chatSystem.blockedUsers.size,
        reportedMessages: this.chatSystem.reportedMessages.size,
        activeUsers: new Set(recentMessages.map(msg => msg.senderId)).size
      }
    };
  }

  // プレイヤー名前を変更
  setPlayerDisplayName(newName) {
    if (!this.isFeatureEnabled('playerChat')) {
      return { success: false, message: 'チャット機能は無効です' };
    }
    
    // 入力検証
    if (!newName || typeof newName !== 'string') {
      return { success: false, message: '名前が無効です' };
    }
    
    // 名前の長さ制限
    if (newName.length > 20) {
      return { success: false, message: '名前が長すぎます（最大20文字）' };
    }
    
    // 空白のみの名前をチェック
    if (newName.trim().length === 0) {
      return { success: false, message: '名前が空です' };
    }
    
    // 不適切語フィルター
    const filteredName = this.filterChatMessage(newName.trim());
    if (!filteredName) {
      return { success: false, message: '不適切な内容が含まれています' };
    }
    
    // 管理者は名前を変更できない
    if (this.workspaceMonitoring.adminSessions.has(this.currentSessionId)) {
      return { success: false, message: '管理者は名前を変更できません' };
    }
    
    // 現在のプレイヤー情報を取得
    const currentSession = this.workspaceMonitoring.sessions.get(this.currentSessionId);
    if (!currentSession) {
      return { success: false, message: 'セッション情報が見つかりません' };
    }
    
    // 名前を設定
    this.chatSystem.playerNames.set(currentSession.playerId, filteredName);
    
    // セキュリティログ
    this.logSecurityEvent('player_name_change', {
      oldName: this.generatePlayerDisplayName(currentSession.playerId),
      newName: filteredName
    });
    
    return { success: true, message: `名前を「${filteredName}」に変更しました` };
  }

  // 現在のプレイヤー名前を取得
  getCurrentPlayerDisplayName() {
    if (!this.isFeatureEnabled('playerChat')) {
      return { success: false, message: 'チャット機能は無効です' };
    }
    
    const currentSession = this.workspaceMonitoring.sessions.get(this.currentSessionId);
    if (!currentSession) {
      return { success: false, message: 'セッション情報が見つかりません' };
    }
    
    const displayName = this.generatePlayerDisplayName(currentSession.playerId);
    return { success: true, name: displayName };
  }

  // ===============================
  // 新機能メソッド（機能フラグで制御）
  // ===============================

  /*
  // 操作説明ログは外部ファイル (tutorialLogs.js) で管理
  // GameMainコンポーネントで直接importして使用
  */

  // 進路選択処理
  setPlayerPath(path) {
    if (!this.isFeatureEnabled('chapter3')) return { success: false, message: '進路選択機能は無効です' };
    
    this.playerPath = path;
    return { success: true, message: `進路を${path}に設定しました` };
  }

  // ===============================
  // チャット同期システム（LocalStorage使用）
  // ===============================

  // チャットシステム初期化
  initializeChatSystem() {
    try {
      // LocalStorageからチャットデータを読み込み
      const savedChatData = localStorage.getItem('gameChat_shared');
      if (savedChatData) {
        const chatData = JSON.parse(savedChatData);
        this.chatSystem.messages = chatData.messages || [];
        this.chatSystem.messageIdCounter = chatData.messageIdCounter || 1;
        this.chatSystem.lastSyncTime = chatData.lastSyncTime || 0;
      }

      // 定期同期の設定
      this.startChatSync();

      // 他プレイヤーシミュレーションの開始
      if (this.chatSystem.simulateOtherPlayers) {
        this.startPlayerSimulation();
      }

    } catch (error) {
      console.error('チャットシステム初期化エラー:', error);
    }
  }

  // チャットデータの同期
  syncChatData() {
    try {
      const chatData = {
        messages: this.chatSystem.messages,
        messageIdCounter: this.chatSystem.messageIdCounter,
        lastSyncTime: Date.now()
      };
      
      localStorage.setItem('gameChat_shared', JSON.stringify(chatData));
      this.chatSystem.lastSyncTime = Date.now();
    } catch (error) {
      console.error('チャット同期エラー:', error);
    }
  }

  // 他のプレイヤーからのメッセージを読み込み
  loadSharedMessages() {
    try {
      const savedChatData = localStorage.getItem('gameChat_shared');
      if (savedChatData) {
        const chatData = JSON.parse(savedChatData);
        const newMessages = chatData.messages || [];
        
        // 新しいメッセージがあるかチェック
        if (newMessages.length > this.chatSystem.messages.length) {
          this.chatSystem.messages = newMessages;
          this.chatSystem.messageIdCounter = Math.max(
            this.chatSystem.messageIdCounter,
            chatData.messageIdCounter || 1
          );
          return true; // 新しいメッセージがある
        }
      }
      return false;
    } catch (error) {
      console.error('共有メッセージ読み込みエラー:', error);
      return false;
    }
  }

  // 定期同期開始
  startChatSync() {
    setInterval(() => {
      if (this.isFeatureEnabled('playerChat')) {
        this.loadSharedMessages();
      }
    }, this.chatSystem.syncInterval);
  }

  // 他プレイヤーのシミュレーション
  startPlayerSimulation() {
    const simulatedPlayers = [
      { name: '高専太郎', id: 'sim_player_1' },
      { name: '工学花子', id: 'sim_player_2' },
      { name: 'プログラマー次郎', id: 'sim_player_3' },
      { name: '電子工学美咲', id: 'sim_player_4' }
    ];

    const simulatedMessages = [
      'こんにちは！新しいプレイヤーです！',
      'この課題難しいですね...誰かヒントください😅',
      'レポート提出期限まであと2日！頑張りましょう💪',
      'プログラミングの宿題で詰まってます...',
      '実験レポートの書き方が分からない😭',
      'みんなはどの進路考えてますか？',
      '先輩に質問したいことがたくさんある！',
      'テスト勉強頑張ってます📚',
      '友達と一緒に勉強すると楽しいですね',
      '高専生活楽しんでます✨',
      '今日の授業内容、復習しないと...',
      'クラブ活動も忙しいけど充実してる！'
    ];

    // 10-30分間隔でランダムなメッセージを送信
    const sendSimulatedMessage = () => {
      if (!this.isFeatureEnabled('playerChat')) return;

      const player = simulatedPlayers[Math.floor(Math.random() * simulatedPlayers.length)];
      const message = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];

      const chatMessage = {
        id: this.chatSystem.messageIdCounter++,
        senderId: player.id,
        senderName: player.name,
        message: message,
        timestamp: Date.now(),
        targetPlayerId: null,
        type: 'public',
        isAdmin: false,
        isSimulated: true // シミュレートされたメッセージとしてマーク
      };

      this.chatSystem.messages.push(chatMessage);

      // メッセージ数制限
      if (this.chatSystem.messages.length > this.chatSystem.maxMessages) {
        this.chatSystem.messages = this.chatSystem.messages.slice(-this.chatSystem.maxMessages);
      }

      // 同期
      this.syncChatData();

      // 次のメッセージをスケジュール
      const nextInterval = (10 + Math.random() * 20) * 60 * 1000; // 10-30分
      setTimeout(sendSimulatedMessage, nextInterval);
    };

    // 初回メッセージを5-15秒後に送信
    const initialDelay = (5 + Math.random() * 10) * 1000;
    setTimeout(sendSimulatedMessage, initialDelay);
  }
}

export default GameState;
