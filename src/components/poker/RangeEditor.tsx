'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from './RangeEditor.module.css';
import { RangeWeights, createEmptyRange, createFullRange, getRangePercent, getRangeCombos } from '@/poker/solver/types';
import { RANKS, HandInfo } from '@/poker/types';
import { getHandMatrix, getHeatmapColor } from '@/poker/constants';
import { exportRangeToString, importRangeFromString, getSavedRanges, saveRange as saveRangeToStorage } from '@/poker/solver/storage';

interface RangeEditorProps {
  label: string;
  range: RangeWeights;
  onChange: (range: RangeWeights) => void;
  onSwap?: () => void;
  showSwapButton?: boolean;
}

export default function RangeEditor({
  label,
  range,
  onChange,
  onSwap,
  showSwapButton = false,
}: RangeEditorProps) {
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [weight, setWeight] = useState(1);
  const [linearFrom, setLinearFrom] = useState(0);
  const [linearTo, setLinearTo] = useState(100);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [saveName, setSaveName] = useState('');
  const [hoveredHand, setHoveredHand] = useState<HandInfo | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const matrix = getHandMatrix();

  // Get sorted hands for linear selection
  const sortedHands = React.useMemo(() => {
    // Standard hand ranking for linear slider
    const hands: { notation: string; rank: number }[] = [];
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const cell = matrix[row][col];
        // Calculate rank (pairs > suited > offsuit, with high cards first)
        let rank = (26 - row - col) * 10;
        if (cell.type === 'pair') rank += 500;
        else if (cell.type === 'suited') rank += 100;
        hands.push({ notation: cell.notation, rank });
      }
    }
    return hands.sort((a, b) => b.rank - a.rank).map(h => h.notation);
  }, [matrix]);

  // Apply linear slider
  const applyLinearRange = useCallback(() => {
    const newRange = createEmptyRange();
    const fromIdx = Math.floor((linearFrom / 100) * sortedHands.length);
    const toIdx = Math.floor((linearTo / 100) * sortedHands.length);
    
    for (let i = fromIdx; i < toIdx && i < sortedHands.length; i++) {
      newRange[sortedHands[i]] = weight;
    }
    onChange(newRange);
  }, [linearFrom, linearTo, weight, sortedHands, onChange]);

  // Handle mouse events for painting
  const handleMouseDown = useCallback((notation: string) => {
    const currentWeight = range[notation] || 0;
    const newMode = currentWeight > 0 ? 'remove' : 'add';
    setPaintMode(newMode);
    
    const newRange = { ...range };
    newRange[notation] = newMode === 'add' ? weight : 0;
    onChange(newRange);
  }, [range, weight, onChange]);

  const handleMouseEnter = useCallback((notation: string) => {
    if (paintMode === null) return;
    
    const newRange = { ...range };
    newRange[notation] = paintMode === 'add' ? weight : 0;
    onChange(newRange);
  }, [range, weight, paintMode, onChange]);

  const handleMouseUp = useCallback(() => {
    setPaintMode(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Handle scroll for weight adjustment
  const handleWheel = useCallback((e: React.WheelEvent, notation: string) => {
    e.preventDefault();
    const currentWeight = range[notation] || 0;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newWeight = Math.max(0, Math.min(1, currentWeight + delta));
    
    const newRange = { ...range };
    newRange[notation] = Math.round(newWeight * 10) / 10;
    onChange(newRange);
  }, [range, onChange]);

  // Import range
  const handleImport = useCallback(() => {
    const imported = importRangeFromString(importText);
    onChange(imported);
    setShowImportModal(false);
    setImportText('');
  }, [importText, onChange]);

  // Export range
  const handleExport = useCallback(() => {
    const text = exportRangeToString(range);
    navigator.clipboard.writeText(text);
    alert('Range copied to clipboard!');
  }, [range]);

  // Save range
  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    saveRangeToStorage(saveName, range);
    setShowSaveModal(false);
    setSaveName('');
    alert('Range saved!');
  }, [saveName, range]);

  // Clear range
  const handleClear = useCallback(() => {
    onChange(createEmptyRange());
  }, [onChange]);

  // Fill range
  const handleFill = useCallback(() => {
    onChange(createFullRange());
  }, [onChange]);

  // Stats
  const rangePercent = getRangePercent(range);
  const rangeCombos = getRangeCombos(range);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.label}>{label}</h3>
        <div className={styles.stats}>
          <span className={styles.stat}>{rangePercent.toFixed(1)}%</span>
          <span className={styles.stat}>{rangeCombos.toFixed(0)} combos</span>
        </div>
        {showSwapButton && onSwap && (
          <button className={styles.swapBtn} onClick={onSwap} title="Swap ranges">
            ⇄
          </button>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.weightControl}>
          <label>Weight:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
          />
          <span>{(weight * 100).toFixed(0)}%</span>
        </div>

        <div className={styles.linearControl}>
          <label>From:</label>
          <input
            type="number"
            min="0"
            max="100"
            value={linearFrom}
            onChange={(e) => setLinearFrom(parseInt(e.target.value) || 0)}
          />
          <label>To:</label>
          <input
            type="number"
            min="0"
            max="100"
            value={linearTo}
            onChange={(e) => setLinearTo(parseInt(e.target.value) || 0)}
          />
          <button onClick={applyLinearRange} className={styles.applyBtn}>
            Apply
          </button>
        </div>
      </div>

      <div className={styles.gridContainer} ref={gridRef}>
        <div className={styles.headerRow}>
          <div className={styles.cornerCell}></div>
          {RANKS.map(rank => (
            <div key={rank} className={styles.headerCell}>{rank}</div>
          ))}
        </div>
        
        {matrix.map((row, rowIdx) => (
          <div key={rowIdx} className={styles.row}>
            <div className={styles.headerCell}>{RANKS[rowIdx]}</div>
            {row.map((cell, colIdx) => {
              const cellWeight = range[cell.notation] || 0;
              const isActive = cellWeight > 0;
              const color = isActive 
                ? `rgba(34, 197, 94, ${0.3 + cellWeight * 0.7})`
                : 'rgba(30, 30, 40, 0.5)';
              
              return (
                <div
                  key={colIdx}
                  className={`${styles.cell} ${isActive ? styles.active : ''}`}
                  style={{ backgroundColor: color }}
                  onMouseDown={() => handleMouseDown(cell.notation)}
                  onMouseEnter={() => handleMouseEnter(cell.notation)}
                  onWheel={(e) => handleWheel(e, cell.notation)}
                  onMouseOver={() => setHoveredHand(cell)}
                  onMouseOut={() => setHoveredHand(null)}
                >
                  <span className={styles.handLabel}>{cell.notation}</span>
                  {cellWeight > 0 && cellWeight < 1 && (
                    <span className={styles.weightLabel}>
                      {(cellWeight * 100).toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hoveredHand && (
        <div className={styles.tooltip}>
          <strong>{hoveredHand.notation}</strong>
          <span>
            Weight: {((range[hoveredHand.notation] || 0) * 100).toFixed(0)}%
          </span>
          <span className={styles.tipHint}>Scroll to adjust weight</span>
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={handleClear} className={styles.actionBtn}>
          Clear
        </button>
        <button onClick={handleFill} className={styles.actionBtn}>
          Fill
        </button>
        <button onClick={handleExport} className={styles.actionBtn}>
          📤 Export
        </button>
        <button onClick={() => setShowImportModal(true)} className={styles.actionBtn}>
          📥 Import
        </button>
        <button onClick={() => setShowSaveModal(true)} className={styles.actionBtn}>
          💾 Save
        </button>
        <button onClick={() => setShowLoadModal(true)} className={styles.actionBtn}>
          📂 Load
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h4>Import Range</h4>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste range here (e.g., AA,KK,QQ,AKs,AKo:0.5)"
              rows={4}
            />
            <div className={styles.modalActions}>
              <button onClick={handleImport}>Import</button>
              <button onClick={() => setShowImportModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h4>Save Range</h4>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter range name"
            />
            <div className={styles.modalActions}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <LoadRangeModal
          onLoad={(loadedRange) => {
            onChange(loadedRange);
            setShowLoadModal(false);
          }}
          onClose={() => setShowLoadModal(false)}
        />
      )}
    </div>
  );
}

// Separate component for loading saved ranges
function LoadRangeModal({
  onLoad,
  onClose,
}: {
  onLoad: (range: RangeWeights) => void;
  onClose: () => void;
}) {
  const savedRanges = getSavedRanges();

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h4>Load Saved Range</h4>
        {savedRanges.length === 0 ? (
          <p>No saved ranges found.</p>
        ) : (
          <div className={styles.savedList}>
            {savedRanges.map(saved => (
              <div
                key={saved.id}
                className={styles.savedItem}
                onClick={() => onLoad(saved.range)}
              >
                <span className={styles.savedName}>{saved.name}</span>
                <span className={styles.savedDate}>
                  {new Date(saved.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className={styles.modalActions}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
