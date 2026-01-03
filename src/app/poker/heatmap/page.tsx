'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { RANKS, HandInfo } from '@/poker/types';
import { getHandMatrix, getHeatmapColor, getCombos, POSITIONS } from '@/poker/constants';
import { SCENARIOS, STRATEGY_MAP, getHandStrategy, StrategyData } from '@/poker/data/strategies';

export default function HeatmapPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState('btn_rfi');
  const [filter, setFilter] = useState<'all' | 'pairs' | 'suited' | 'offsuit'>('all');
  const [hoveredHand, setHoveredHand] = useState<HandInfo | null>(null);
  
  const matrix = useMemo(() => getHandMatrix(), []);
  const strategy = STRATEGY_MAP[selectedScenario] || {};
  const scenario = SCENARIOS.find(s => s.id === selectedScenario);
  
  // Filter logic
  const shouldShow = useCallback((cell: HandInfo) => {
    if (filter === 'all') return true;
    if (filter === 'pairs') return cell.type === 'pair';
    if (filter === 'suited') return cell.type === 'suited';
    if (filter === 'offsuit') return cell.type === 'offsuit';
    return true;
  }, [filter]);
  
  // Get cell data
  const getCellData = useCallback((cell: HandInfo) => {
    const freq = getHandStrategy(selectedScenario, cell.notation);
    const color = getHeatmapColor(freq.raise, freq.call, freq.fold);
    return { ...freq, color };
  }, [selectedScenario]);
  
  // Export to CSV
  const exportCSV = useCallback(() => {
    const rows = ['Hand,Type,Raise%,Call%,Fold%'];
    for (const row of matrix) {
      for (const cell of row) {
        const freq = getHandStrategy(selectedScenario, cell.notation);
        rows.push(`${cell.notation},${cell.type},${(freq.raise * 100).toFixed(1)},${(freq.call * 100).toFixed(1)},${(freq.fold * 100).toFixed(1)}`);
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScenario}_strategy.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedScenario, matrix]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← Back
        </button>
        <h1>GTO Range Heatmap</h1>
      </header>
      
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Scenario:</label>
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(e.target.value)}
            className={styles.select}
          >
            {SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.controlGroup}>
          <label>Filter:</label>
          <div className={styles.filterBtns}>
            {(['all', 'pairs', 'suited', 'offsuit'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'pairs' ? 'Pairs' : f === 'suited' ? 'Suited' : 'Offsuit'}
              </button>
            ))}
          </div>
        </div>
        
        <button className={styles.exportBtn} onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>
      
      {scenario && (
        <div className={styles.scenarioInfo}>
          <h2>{scenario.name} <span className={styles.zhName}>{scenario.nameZh}</span></h2>
          <p>{scenario.description}</p>
          <span className={`${styles.difficulty} ${styles[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>
      )}
      
      <div className={styles.heatmapContainer}>
        <div className={styles.heatmap}>
          {/* Column headers */}
          <div className={styles.headerRow}>
            <div className={styles.cornerCell}></div>
            {RANKS.map(rank => (
              <div key={rank} className={styles.headerCell}>{rank}</div>
            ))}
          </div>
          
          {/* Grid rows */}
          {matrix.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.row}>
              <div className={styles.headerCell}>{RANKS[rowIdx]}</div>
              {row.map((cell, colIdx) => {
                const data = getCellData(cell);
                const show = shouldShow(cell);
                return (
                  <div
                    key={colIdx}
                    className={`${styles.cell} ${!show ? styles.dimmed : ''}`}
                    style={{ backgroundColor: show ? data.color : 'rgba(30,30,40,0.5)' }}
                    onMouseEnter={() => setHoveredHand(cell)}
                    onMouseLeave={() => setHoveredHand(null)}
                  >
                    <span className={styles.handLabel}>{cell.notation}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Tooltip */}
        {hoveredHand && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipHeader}>
              <strong>{hoveredHand.notation}</strong>
              <span className={styles.combos}>{getCombos(hoveredHand.type)} combos</span>
            </div>
            <div className={styles.tooltipBody}>
              {(() => {
                const freq = getHandStrategy(selectedScenario, hoveredHand.notation);
                return (
                  <>
                    <div className={styles.freqRow}>
                      <span className={styles.raiseLabel}>Raise</span>
                      <div className={styles.freqBar}>
                        <div 
                          className={styles.freqFill} 
                          style={{ width: `${freq.raise * 100}%`, backgroundColor: '#22c55e' }}
                        />
                      </div>
                      <span>{(freq.raise * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.freqRow}>
                      <span className={styles.callLabel}>Call</span>
                      <div className={styles.freqBar}>
                        <div 
                          className={styles.freqFill} 
                          style={{ width: `${freq.call * 100}%`, backgroundColor: '#eab308' }}
                        />
                      </div>
                      <span>{(freq.call * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.freqRow}>
                      <span className={styles.foldLabel}>Fold</span>
                      <div className={styles.freqBar}>
                        <div 
                          className={styles.freqFill} 
                          style={{ width: `${freq.fold * 100}%`, backgroundColor: '#6b7280' }}
                        />
                      </div>
                      <span>{(freq.fold * 100).toFixed(0)}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#22c55e' }}></div>
          <span>Pure Raise</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#4ade80' }}></div>
          <span>Mostly Raise</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#eab308' }}></div>
          <span>Call</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#4b5563' }}></div>
          <span>Fold</span>
        </div>
      </div>
    </div>
  );
}
