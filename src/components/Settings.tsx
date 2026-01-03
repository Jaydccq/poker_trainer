'use client';

import { GameRules } from '@/types';
import { useI18n } from '@/hooks/useI18n';
import styles from './Settings.module.css';

interface SettingsProps {
  rules: GameRules;
  onUpdateRules: (rules: Partial<GameRules>) => void;
  onClose: () => void;
}

export default function Settings({ rules, onUpdateRules, onClose }: SettingsProps) {
  const { t } = useI18n();
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t('settings')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.row}>
            <label>{t('decks')}</label>
            <select 
              value={rules.decks}
              onChange={e => onUpdateRules({ decks: Number(e.target.value) })}
            >
              {[1, 2, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.row}>
            <label>{t('dealerRule')}</label>
            <select 
              value={rules.dealerRule}
              onChange={e => onUpdateRules({ dealerRule: e.target.value as 'S17' | 'H17' })}
            >
              <option value="S17">S17</option>
              <option value="H17">H17</option>
            </select>
          </div>
          
          <div className={styles.row}>
            <label>{t('blackjackPays')}</label>
            <select 
              value={rules.blackjackPayout}
              onChange={e => onUpdateRules({ blackjackPayout: e.target.value as '3:2' | '6:5' })}
            >
              <option value="3:2">3:2</option>
              <option value="6:5">6:5</option>
            </select>
          </div>
          
          <div className={styles.toggleRow}>
            <label>{t('doubleAfterSplit')}</label>
            <button 
              className={`${styles.toggle} ${rules.doubleAfterSplit ? styles.on : ''}`}
              onClick={() => onUpdateRules({ doubleAfterSplit: !rules.doubleAfterSplit })}
            >
              {rules.doubleAfterSplit ? t('enabled') : t('disabled')}
            </button>
          </div>
          
          <div className={styles.toggleRow}>
            <label>{t('lateSurrender')}</label>
            <button 
              className={`${styles.toggle} ${rules.lateSurrender ? styles.on : ''}`}
              onClick={() => onUpdateRules({ lateSurrender: !rules.lateSurrender })}
            >
              {rules.lateSurrender ? t('enabled') : t('disabled')}
            </button>
          </div>
          
          <div className={styles.toggleRow}>
            <label>{t('acesSplitOneCard')}</label>
            <button 
              className={`${styles.toggle} ${rules.acesSplitOneCard ? styles.on : ''}`}
              onClick={() => onUpdateRules({ acesSplitOneCard: !rules.acesSplitOneCard })}
            >
              {rules.acesSplitOneCard ? t('enabled') : t('disabled')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
