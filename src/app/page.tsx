'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MainMenu() {
  const router = useRouter();

  return (
    <div className={`${styles.container} gradient-bg`}>
      <h1 className={styles.title}>Blackjack Pro</h1>
      
      <div className={styles.menu}>
        <button 
          className={styles.menuItem}
          onClick={() => router.push('/game?mode=free')}
        >
          <div className={styles.icon}>🃏</div>
          <div className={styles.content}>
            <h2>Free Play</h2>
            <p>Practice with standard rules</p>
          </div>
        </button>

        <button 
          className={`${styles.menuItem} ${styles.highlight}`}
          onClick={() => router.push('/game?mode=training')}
        >
          <div className={styles.icon}>🎓</div>
          <div className={styles.content}>
            <h2>Training Mode</h2>
            <p>Learn card counting & strategy with chips</p>
          </div>
        </button>

        <button 
          className={styles.menuItem}
          onClick={() => router.push('/tutorial')}
        >
          <div className={styles.icon}>📘</div>
          <div className={styles.content}>
            <h2>Tutorial</h2>
            <p>Learn the Hi-Lo system</p>
          </div>
        </button>
      </div>
    </div>
  );
}
