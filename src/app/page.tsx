'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MainMenu() {
  const router = useRouter();

  return (
    <div className={`${styles.container} gradient-bg`}>
      <h1 className={styles.title}>Casino Training Pro</h1>
      <p className={styles.subtitle}>Master the Art of Card Games</p>
      
      <div className={styles.gamesGrid}>
        {/* Blackjack Section */}
        <div className={styles.gameSection}>
          <div className={styles.gameHeader}>
            <span className={styles.gameIcon}>🃏</span>
            <h2>Blackjack</h2>
          </div>
          <p className={styles.gameDescription}>
            Learn card counting and perfect basic strategy
          </p>
          
          <div className={styles.menu}>
            <button 
              className={styles.menuItem}
              onClick={() => router.push('/blackjack?mode=free')}
            >
              <div className={styles.icon}>🎲</div>
              <div className={styles.content}>
                <h3>Free Play</h3>
                <p>Practice with standard rules</p>
              </div>
            </button>

            <button 
              className={`${styles.menuItem} ${styles.highlight}`}
              onClick={() => router.push('/blackjack?mode=training')}
            >
              <div className={styles.icon}>🎓</div>
              <div className={styles.content}>
                <h3>Training Mode</h3>
                <p>Card counting & strategy tips</p>
              </div>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => router.push('/blackjack/tutorial')}
            >
              <div className={styles.icon}>📘</div>
              <div className={styles.content}>
                <h3>Tutorial</h3>
                <p>Learn the Hi-Lo system</p>
              </div>
            </button>
          </div>
        </div>

        {/* Poker GTO Trainer Section */}
        <div className={styles.gameSection}>
          <div className={styles.gameHeader}>
            <span className={styles.gameIcon}>♠️</span>
            <h2>Poker GTO</h2>
          </div>
          <p className={styles.gameDescription}>
            Master Game Theory Optimal strategy for Texas Hold&apos;em
          </p>
          
          <div className={styles.menu}>
            <button 
              className={`${styles.menuItem} ${styles.highlight}`}
              onClick={() => router.push('/poker/training')}
            >
              <div className={styles.icon}>🎯</div>
              <div className={styles.content}>
                <h3>Preflop Training</h3>
                <p>Practice GTO open and defense ranges</p>
              </div>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => router.push('/poker/heatmap')}
            >
              <div className={styles.icon}>🗺️</div>
              <div className={styles.content}>
                <h3>Range Heatmap</h3>
                <p>Visualize GTO ranges</p>
              </div>
            </button>

            <button 
              className={`${styles.menuItem} ${styles.special}`}
              onClick={() => router.push('/poker/builder')}
            >
              <div className={styles.icon}>🧮</div>
              <div className={styles.content}>
                <h3>Custom Solutions</h3>
                <p>Build & solve custom GTO scenarios</p>
              </div>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => router.push('/poker/scenarios')}
            >
              <div className={styles.icon}>📊</div>
              <div className={styles.content}>
                <h3>Scenario Training</h3>
                <p>6 curated training scenarios</p>
              </div>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => router.push('/poker/stats')}
            >
              <div className={styles.icon}>📈</div>
              <div className={styles.content}>
                <h3>Statistics</h3>
                <p>Track your progress</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
