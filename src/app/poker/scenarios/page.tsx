'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { SCENARIOS } from '@/poker/data/strategies';

export default function ScenariosPage() {
  const router = useRouter();
  
  const beginnerScenarios = SCENARIOS.filter(s => s.difficulty === 'beginner');
  const intermediateScenarios = SCENARIOS.filter(s => s.difficulty === 'intermediate');
  const advancedScenarios = SCENARIOS.filter(s => s.difficulty === 'advanced');
  
  const handleScenarioClick = (scenarioId: string) => {
    router.push(`/poker/training?scenario=${scenarioId}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← Back
        </button>
        <h1>Scenario Training</h1>
      </header>
      
      <div className={styles.intro}>
        <p>
          选择一个训练场景来练习特定的GTO策略。每个场景都有明确的学习目标。
        </p>
        <p className={styles.introEn}>
          Choose a training scenario to practice specific GTO strategies. Each scenario has clear learning objectives.
        </p>
      </div>
      
      {/* Beginner */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.badge} ${styles.beginner}`}>Beginner</span>
          基础入门
        </h2>
        <div className={styles.scenarioGrid}>
          {beginnerScenarios.map(scenario => (
            <div 
              key={scenario.id}
              className={styles.scenarioCard}
              onClick={() => handleScenarioClick(scenario.id)}
            >
              <div className={styles.cardHeader}>
                <h3>{scenario.name}</h3>
                <span className={styles.position}>{scenario.position}</span>
              </div>
              <p className={styles.cardDescription}>{scenario.nameZh}</p>
              <p className={styles.cardDescriptionEn}>{scenario.description}</p>
              
              <div className={styles.objectives}>
                <h4>Learning Objectives:</h4>
                <ul>
                  {scenario.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
              
              <button className={styles.startBtn}>
                Start Training →
              </button>
            </div>
          ))}
        </div>
      </section>
      
      {/* Intermediate */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.badge} ${styles.intermediate}`}>Intermediate</span>
          进阶提升
        </h2>
        <div className={styles.scenarioGrid}>
          {intermediateScenarios.map(scenario => (
            <div 
              key={scenario.id}
              className={styles.scenarioCard}
              onClick={() => handleScenarioClick(scenario.id)}
            >
              <div className={styles.cardHeader}>
                <h3>{scenario.name}</h3>
                <span className={styles.position}>
                  {scenario.position}
                  {scenario.vsPosition && ` vs ${scenario.vsPosition}`}
                </span>
              </div>
              <p className={styles.cardDescription}>{scenario.nameZh}</p>
              <p className={styles.cardDescriptionEn}>{scenario.description}</p>
              
              <div className={styles.objectives}>
                <h4>Learning Objectives:</h4>
                <ul>
                  {scenario.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
              
              <button className={styles.startBtn}>
                Start Training →
              </button>
            </div>
          ))}
        </div>
      </section>
      
      {/* Advanced */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.badge} ${styles.advanced}`}>Advanced</span>
          高级进阶
        </h2>
        <div className={styles.scenarioGrid}>
          {advancedScenarios.map(scenario => (
            <div 
              key={scenario.id}
              className={styles.scenarioCard}
              onClick={() => handleScenarioClick(scenario.id)}
            >
              <div className={styles.cardHeader}>
                <h3>{scenario.name}</h3>
                <span className={styles.position}>
                  {scenario.position}
                  {scenario.vsPosition && ` vs ${scenario.vsPosition}`}
                </span>
              </div>
              <p className={styles.cardDescription}>{scenario.nameZh}</p>
              <p className={styles.cardDescriptionEn}>{scenario.description}</p>
              
              <div className={styles.objectives}>
                <h4>Learning Objectives:</h4>
                <ul>
                  {scenario.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
              
              <button className={styles.startBtn}>
                Start Training →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
