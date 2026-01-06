'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useState,
} from 'react';
import { Language } from '@/types';

const translations = {
  zh: {
    title: 'Blackjack 训练器',
    settings: '设置',
    stats: '统计',
    hit: '要牌',
    stand: '停牌',
    double: '加倍',
    split: '分牌',
    surrender: '投降',
    insurance: '保险',
    correct: '正确！',
    incorrect: '错误',
    recommended: '推荐操作',
    reason: '理由',
    continueMyChoice: '按我选择继续',
    useRecommended: '改用推荐操作',
    dealer: '庄家',
    player: '玩家',
    total: '点数',
    soft: '软',
    hard: '硬',
    pair: '对子',
    newGame: '新一局',
    win: '赢',
    lose: '输',
    push: '平局',
    blackjack: 'Blackjack!',
    busted: '爆牌',
    decks: '牌副数',
    dealerRule: '庄家规则',
    blackjackPays: 'BJ 赔率',
    doubleAfterSplit: '分牌后加倍 (DAS)',
    lateSurrender: '迟降 (Surrender)',
    enabled: '开启',
    disabled: '关闭',
    accuracy: '正确率',
    totalDecisions: '总决策数',
    topErrors: '常错场景',
    recentHistory: '最近记录',
    maxSplitHands: '最大分牌数',
    acesSplitOneCard: 'A分牌后只补一张',
    runningCountLabel: '流水数',
    trueCountLabel: '真数',
    chipsLabel: '筹码',
    placeNextBet: '请下注下一手...',
    balanceLabel: '余额',
    betLabel: '下注',
    clear: '清除',
    deal: '发牌',
    minBetIs: '最低下注为',
    clearAllData: '清除所有数据',
    correctStrategy: '正确策略',
    youChose: '你选择了',
    vs: '对',
    refillNotice: '筹码已补充至 $1000！继续练习！',
  },
  en: {
    title: 'Blackjack Trainer',
    settings: 'Settings',
    stats: 'Stats',
    hit: 'Hit',
    stand: 'Stand',
    double: 'Double',
    split: 'Split',
    surrender: 'Surrender',
    insurance: 'Insurance',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    recommended: 'Recommended',
    reason: 'Reason',
    continueMyChoice: 'Continue with my choice',
    useRecommended: 'Use recommended action',
    dealer: 'Dealer',
    player: 'Player',
    total: 'Total',
    soft: 'Soft',
    hard: 'Hard',
    pair: 'Pair',
    newGame: 'New Hand',
    win: 'Win',
    lose: 'Lose',
    push: 'Push',
    blackjack: 'Blackjack!',
    busted: 'Busted',
    decks: 'Decks',
    dealerRule: 'Dealer Rule',
    blackjackPays: 'BJ Pays',
    doubleAfterSplit: 'Double After Split',
    lateSurrender: 'Late Surrender',
    enabled: 'On',
    disabled: 'Off',
    accuracy: 'Accuracy',
    totalDecisions: 'Total Decisions',
    topErrors: 'Top Errors',
    recentHistory: 'Recent History',
    maxSplitHands: 'Max Split Hands',
    acesSplitOneCard: 'Aces Split One Card',
    runningCountLabel: 'Running Count',
    trueCountLabel: 'True Count',
    chipsLabel: 'Chips',
    placeNextBet: 'Place your next bet...',
    balanceLabel: 'Balance',
    betLabel: 'Bet',
    clear: 'Clear',
    deal: 'Deal',
    minBetIs: 'Min bet is',
    clearAllData: 'Clear All Data',
    correctStrategy: 'Correct Strategy',
    youChose: 'You chose',
    vs: 'vs',
    refillNotice: 'Chips refilled to $1000! Keep practicing!',
  }
} as const;

export type TranslationKey = keyof typeof translations.zh;

type I18nContextValue = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('blackjack-lang') as Language;
    if (saved === 'zh' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('blackjack-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  const value = useMemo(() => ({ language, toggleLanguage, t }), [language, toggleLanguage, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
