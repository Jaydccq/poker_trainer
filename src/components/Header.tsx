'use client';

import { useI18n } from '@/hooks/useI18n';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onBack?: () => void;
}

export default function Header({ onOpenSettings, onOpenStats, onBack }: HeaderProps) {
  const { t, language, toggleLanguage } = useI18n();
  
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onBack && (
          <button className={styles.iconBtn} onClick={onBack} aria-label="Back">
            ⬅️
          </button>
        )}
        <h1 className={styles.title}>🃏 {t('title')}</h1>
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.langBtn}
          onClick={toggleLanguage}
        >
          {language === 'zh' ? 'EN' : '中'}
        </button>
        
        <button 
          className={styles.iconBtn}
          onClick={onOpenStats}
          aria-label={t('stats')}
        >
          📊
        </button>
        
        <button 
          className={styles.iconBtn}
          onClick={onOpenSettings}
          aria-label={t('settings')}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
