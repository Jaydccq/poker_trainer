'use client';

import { Action } from '@/types';
import { useI18n, TranslationKey } from '@/hooks/useI18n';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  onAction: (action: Action) => void;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  canInsurance: boolean;
  disabled?: boolean;
}

const ACTION_CONFIG: Array<{
  action: Action;
  labelKey: TranslationKey;
  colorClass: string;
}> = [
  { action: 'hit', labelKey: 'hit', colorClass: 'primary' },
  { action: 'stand', labelKey: 'stand', colorClass: 'warning' },
  { action: 'double', labelKey: 'double', colorClass: 'success' },
  { action: 'split', labelKey: 'split', colorClass: 'info' },
  { action: 'surrender', labelKey: 'surrender', colorClass: 'danger' },
  { action: 'insurance', labelKey: 'insurance', colorClass: 'muted' },
];

export default function ActionBar({
  onAction,
  canHit,
  canStand,
  canDouble,
  canSplit,
  canSurrender,
  canInsurance,
  disabled = false,
}: ActionBarProps) {
  const { t } = useI18n();
  
  const isEnabled = (action: Action): boolean => {
    if (disabled) return false;
    switch (action) {
      case 'hit': return canHit;
      case 'stand': return canStand;
      case 'double': return canDouble;
      case 'split': return canSplit;
      case 'surrender': return canSurrender;
      case 'insurance': return canInsurance;
    }
  };
  
  return (
    <div className={styles.actionBar}>
      <div className={styles.grid}>
        {ACTION_CONFIG.map(({ action, labelKey, colorClass }) => (
          <button
            key={action}
            className={`${styles.button} ${styles[colorClass]}`}
            onClick={() => onAction(action)}
            disabled={!isEnabled(action)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
