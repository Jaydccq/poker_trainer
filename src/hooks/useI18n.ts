'use client';

import { useState, useCallback, useEffect } from 'react';
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
  }
} as const;

export type TranslationKey = keyof typeof translations.zh;

export function useI18n() {
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
  
  return { language, toggleLanguage, t };
}
