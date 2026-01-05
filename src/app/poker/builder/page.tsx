'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import RangeEditor from '@/components/poker/RangeEditor';
import BoardSelector from '@/components/poker/BoardSelector';
import {
  CustomSolutionConfig,
  SolverProgress,
  SolverResult,
  createNewSolutionConfig,
  RangeWeights,
  BetSizingMode,
  DEFAULT_SOLVER_CONFIG,
  SavedSolution,
  StartingStreet,
} from '@/poker/solver/types';
import { CFRSolver } from '@/poker/solver/cfr_solver';
import { PostflopCFRSolver } from '@/poker/solver/postflop_solver';
import { Card } from '@/poker/solver/cards';
import {
  saveSolution,
  getSavedSolutions,
} from '@/poker/solver/storage';
import {
  PREFLOP_SCENARIOS,
  PreflopScenario,
  parseRangeString,
  loadRangeFromText,
} from '@/poker/solver/range_loader';

// Preflop range file contents (embedded for client-side use)
const RANGE_FILES: Record<string, string> = {};

// Fetch range file dynamically
async function loadRangeFile(filename: string): Promise<string> {
  try {
    const response = await fetch(`/preflopRanges/${filename}`);
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.error(`Failed to load range: ${filename}`, e);
  }
  return '';
}

export default function SolutionBuilderPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CustomSolutionConfig>(createNewSolutionConfig);
  const [activeTab, setActiveTab] = useState<'build' | 'summary'>('build');
  const [activeRangePlayer, setActiveRangePlayer] = useState<'IP' | 'OOP'>('OOP');
  const [solving, setSolving] = useState(false);
  const [progress, setProgress] = useState<SolverProgress | null>(null);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPreflopModal, setShowPreflopModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Board state for postflop
  const [board, setBoard] = useState<Card[]>([]);
  
  // Preflop scenario selection
  const [selectedScenario, setSelectedScenario] = useState<PreflopScenario | null>(null);

  // Update config helpers
  const updateConfig = useCallback((updates: Partial<CustomSolutionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates, updatedAt: Date.now() }));
  }, []);

  const updateIPRange = useCallback((weights: RangeWeights) => {
    setConfig(prev => ({
      ...prev,
      ipRange: { ...prev.ipRange, weights },
      updatedAt: Date.now(),
    }));
  }, []);

  const updateOOPRange = useCallback((weights: RangeWeights) => {
    setConfig(prev => ({
      ...prev,
      oopRange: { ...prev.oopRange, weights },
      updatedAt: Date.now(),
    }));
  }, []);

  const swapRanges = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      ipRange: { ...prev.oopRange },
      oopRange: { ...prev.ipRange },
      updatedAt: Date.now(),
    }));
  }, []);

  // Load preflop range from scenario
  const loadPreflopScenario = useCallback(async (scenario: PreflopScenario) => {
    try {
      const content = await loadRangeFile(scenario.filename);
      if (content) {
        const weights = parseRangeString(content);
        
        // Determine which player uses this range
        if (scenario.position === 'BB' || scenario.position === 'SB') {
          updateOOPRange(weights);
          setConfig(prev => ({
            ...prev,
            oopRange: { ...prev.oopRange, label: scenario.name, weights },
          }));
        } else {
          updateIPRange(weights);
          setConfig(prev => ({
            ...prev,
            ipRange: { ...prev.ipRange, label: scenario.name, weights },
          }));
        }
        
        setSelectedScenario(scenario);
      }
    } catch (e) {
      console.error('Failed to load scenario:', e);
    }
  }, [updateOOPRange, updateIPRange]);

  // Solve the position
  const handleSolve = useCallback(async () => {
    setError(null);
    setSolving(true);
    setProgress(null);
    setResult(null);

    try {
      let solver;
      
      if (board.length >= 3) {
        // Postflop solve
        solver = new PostflopCFRSolver(config, board, {
          ...DEFAULT_SOLVER_CONFIG,
          maxIterations: 300,
        });
      } else {
        // Preflop solve
        solver = new CFRSolver(config, {
          ...DEFAULT_SOLVER_CONFIG,
          maxIterations: 500,
        });
      }

      solver.onProgress((p) => {
        setProgress(p);
      });

      const solverResult = await solver.solve();
      setResult(solverResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Solving failed');
    } finally {
      setSolving(false);
    }
  }, [config, board]);

  // Save solution
  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    updateConfig({ name: saveName });
    saveSolution(saveName, config, result || undefined);
    setShowSaveModal(false);
    setSaveName('');
  }, [saveName, config, result, updateConfig]);

  // Load solution
  const handleLoad = useCallback((solution: SavedSolution) => {
    setConfig(solution.config);
    if (solution.result) {
      setResult(solution.result);
    }
    setShowLoadModal(false);
  }, []);

  // Get betting mode for display
  const getBettingModeLabel = (mode: BetSizingMode): string => {
    switch (mode) {
      case 'automatic': return 'Automatic';
      case 'dynamic': return 'Dynamic';
      case 'fixed': return 'Fixed';
    }
  };

  // Get current street based on board
  const getCurrentStreet = (): string => {
    if (board.length === 0) return 'Preflop';
    if (board.length === 3) return 'Flop';
    if (board.length === 4) return 'Turn';
    return 'River';
  };

  const activeRange = activeRangePlayer === 'IP' ? config.ipRange : config.oopRange;
  const updateActiveRange = activeRangePlayer === 'IP' ? updateIPRange : updateOOPRange;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/poker/heatmap')}>
          ← Back
        </button>
        <h1>Custom Solution Builder</h1>
        <div className={styles.headerActions}>
          <button onClick={() => setShowPreflopModal(true)} className={styles.headerBtn}>
            📖 Preflop Ranges
          </button>
          <button onClick={() => setShowLoadModal(true)} className={styles.headerBtn}>
            📂 Load
          </button>
          <button onClick={() => setShowSaveModal(true)} className={styles.headerBtn}>
            💾 Save
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'build' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('build')}
        >
          Build
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'summary' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary ⓘ
        </button>
      </div>

      {activeTab === 'build' ? (
        <div className={styles.builderLayout}>
          {/* Left Panel - Range Editor */}
          <div className={styles.leftPanel}>
            <div className={styles.rangePlayerSelector}>
              <button
                className={`${styles.playerBtn} ${activeRangePlayer === 'OOP' ? styles.activePlayer : ''}`}
                onClick={() => setActiveRangePlayer('OOP')}
              >
                OOP
              </button>
              <button
                className={`${styles.playerBtn} ${activeRangePlayer === 'IP' ? styles.activePlayer : ''}`}
                onClick={() => setActiveRangePlayer('IP')}
              >
                IP
              </button>
            </div>

            <RangeEditor
              label={activeRange.label || activeRangePlayer}
              range={activeRange.weights}
              onChange={updateActiveRange}
              onSwap={swapRanges}
              showSwapButton={true}
            />
          </div>

          {/* Center Panel - Stack/Pot/Board */}
          <div className={styles.centerPanel}>
            <div className={styles.configSection}>
              <h3>Game Setup</h3>
              
              <div className={styles.configGrid}>
                <div className={styles.configItem}>
                  <label>Stack (bb)</label>
                  <input
                    type="number"
                    value={config.stackSize}
                    onChange={(e) => updateConfig({ stackSize: parseFloat(e.target.value) || 100 })}
                    min="1"
                    max="999"
                    step="0.1"
                  />
                </div>
                
                <div className={styles.configItem}>
                  <label>Pot (bb)</label>
                  <input
                    type="number"
                    value={config.potSize}
                    onChange={(e) => updateConfig({ potSize: parseFloat(e.target.value) || 1.5 })}
                    min="0.1"
                    max="999"
                    step="0.1"
                  />
                </div>
              </div>

              <div className={styles.sprDisplay}>
                SPR: {(config.stackSize / config.potSize).toFixed(1)}
                <span className={styles.streetBadge}>{getCurrentStreet()}</span>
              </div>
            </div>

            {/* Board Selector for Postflop */}
            <div className={styles.boardSection}>
              <BoardSelector
                board={board}
                onChange={setBoard}
                maxCards={5}
              />
            </div>

            {/* Solve Button */}
            <div className={styles.solveSection}>
              <button
                className={styles.solveBtn}
                onClick={handleSolve}
                disabled={solving}
              >
                {solving ? 'Solving...' : `🧮 Solve ${getCurrentStreet()}`}
              </button>

              {progress && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(progress.iteration / progress.maxIterations) * 100}%` }}
                    />
                  </div>
                  <div className={styles.progressText}>
                    Iteration {progress.iteration} / {progress.maxIterations}
                    {progress.exploitability > 0 && (
                      <span> | Exploitability: {progress.exploitability.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  ❌ {error}
                </div>
              )}
            </div>

            {/* Result Preview */}
            {result && (
              <div className={styles.resultPreview}>
                <h4>✅ Solution Complete</h4>
                <div className={styles.resultStats}>
                  <span>Iterations: {result.totalIterations}</span>
                  <span>Time: {(result.solveTime / 1000).toFixed(1)}s</span>
                  <span>Exploitability: {result.finalExploitability.toFixed(3)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Betting Tree */}
          <div className={styles.rightPanel}>
            <div className={styles.configSection}>
              <h3>Betting Tree</h3>
              
              <div className={styles.configItem}>
                <label>Bet Sizing Mode</label>
                <select
                  value={config.bettingTree.oopConfig.preflop.mode}
                  onChange={(e) => {
                    const mode = e.target.value as BetSizingMode;
                    setConfig(prev => ({
                      ...prev,
                      bettingTree: {
                        ...prev.bettingTree,
                        oopConfig: {
                          ...prev.bettingTree.oopConfig,
                          preflop: { ...prev.bettingTree.oopConfig.preflop, mode },
                        },
                      },
                    }));
                  }}
                >
                  <option value="automatic">Automatic (Best for beginners)</option>
                  <option value="dynamic">Dynamic (N sizes with simplification)</option>
                  <option value="fixed">Fixed (Manual bet sizes)</option>
                </select>
              </div>

              <div className={styles.modeDescription}>
                {config.bettingTree.oopConfig.preflop.mode === 'automatic' && (
                  <p>Automatically simplifies to the best, highest EV size(s) at each decision point.</p>
                )}
                {config.bettingTree.oopConfig.preflop.mode === 'dynamic' && (
                  <p>Choose how many sizes you want, and we'll automatically simplify to optimal sizings.</p>
                )}
                {config.bettingTree.oopConfig.preflop.mode === 'fixed' && (
                  <p>Specify exactly what bet/raise sizes are allowed. Tree will NOT be simplified.</p>
                )}
              </div>

              {config.bettingTree.oopConfig.preflop.mode === 'dynamic' && (
                <div className={styles.dynamicConfig}>
                  <div className={styles.configItem}>
                    <label># Bet Sizes</label>
                    <input
                      type="number"
                      value={config.bettingTree.oopConfig.preflop.numBetSizes}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        setConfig(prev => ({
                          ...prev,
                          bettingTree: {
                            ...prev.bettingTree,
                            oopConfig: {
                              ...prev.bettingTree.oopConfig,
                              preflop: { ...prev.bettingTree.oopConfig.preflop, numBetSizes: num },
                            },
                          },
                        }));
                      }}
                      min="1"
                      max="5"
                    />
                  </div>
                  <div className={styles.configItem}>
                    <label># Raise Sizes</label>
                    <input
                      type="number"
                      value={config.bettingTree.oopConfig.preflop.numRaiseSizes}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        setConfig(prev => ({
                          ...prev,
                          bettingTree: {
                            ...prev.bettingTree,
                            oopConfig: {
                              ...prev.bettingTree.oopConfig,
                              preflop: { ...prev.bettingTree.oopConfig.preflop, numRaiseSizes: num },
                            },
                          },
                        }));
                      }}
                      min="1"
                      max="3"
                    />
                  </div>
                </div>
              )}

              <div className={styles.advancedToggle}>
                <details>
                  <summary>Advanced Options</summary>
                  <div className={styles.advancedOptions}>
                    <div className={styles.configItem}>
                      <label>
                        <input
                          type="checkbox"
                          checked={config.bettingTree.advancedOptions.alwaysAddAllIn}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              bettingTree: {
                                ...prev.bettingTree,
                                advancedOptions: {
                                  ...prev.bettingTree.advancedOptions,
                                  alwaysAddAllIn: e.target.checked,
                                },
                              },
                            }));
                          }}
                        />
                        Always add all-in option
                      </label>
                    </div>
                    <div className={styles.configItem}>
                      <label>Force all-in threshold (%)</label>
                      <input
                        type="number"
                        value={config.bettingTree.advancedOptions.forceAllInThreshold}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            bettingTree: {
                              ...prev.bettingTree,
                              advancedOptions: {
                                ...prev.bettingTree.advancedOptions,
                                forceAllInThreshold: parseInt(e.target.value) || 80,
                              },
                            },
                          }));
                        }}
                        min="50"
                        max="100"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Summary Tab */
        <div className={styles.summaryPanel}>
          <h2>Solution Summary</h2>
          
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <h4>Game Setup</h4>
              <p>Stack: {config.stackSize}bb</p>
              <p>Pot: {config.potSize}bb</p>
              <p>SPR: {(config.stackSize / config.potSize).toFixed(1)}</p>
              <p>Street: {getCurrentStreet()}</p>
              {board.length > 0 && (
                <p>Board: {board.map(c => `${c.rank}${c.suit}`).join(' ')}</p>
              )}
            </div>
            
            <div className={styles.summaryCard}>
              <h4>OOP Range</h4>
              <p>{config.oopRange.label}</p>
              <p>{Object.values(config.oopRange.weights).filter(v => v > 0).length} hands</p>
            </div>
            
            <div className={styles.summaryCard}>
              <h4>IP Range</h4>
              <p>{config.ipRange.label}</p>
              <p>{Object.values(config.ipRange.weights).filter(v => v > 0).length} hands</p>
            </div>
            
            <div className={styles.summaryCard}>
              <h4>Betting Tree</h4>
              <p>Mode: {getBettingModeLabel(config.bettingTree.oopConfig.preflop.mode)}</p>
            </div>
          </div>

          {result && (
            <div className={styles.resultSection}>
              <h3>Solution Results</h3>
              <p>Iterations: {result.totalIterations}</p>
              <p>Solve time: {(result.solveTime / 1000).toFixed(1)}s</p>
              <p>Exploitability: {result.finalExploitability.toFixed(4)}</p>
            </div>
          )}
        </div>
      )}

      {/* Preflop Ranges Modal */}
      {showPreflopModal && (
        <PreflopRangesModal
          onSelect={loadPreflopScenario}
          onClose={() => setShowPreflopModal(false)}
        />
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <LoadSolutionModal
          onLoad={handleLoad}
          onClose={() => setShowLoadModal(false)}
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h4>Save Solution</h4>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter solution name"
            />
            <div className={styles.modalActions}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preflop Ranges Modal
function PreflopRangesModal({
  onSelect,
  onClose,
}: {
  onSelect: (scenario: PreflopScenario) => void;
  onClose: () => void;
}) {
  const categories = ['open', 'call', '3bet', '4bet', '4b_call'] as const;
  const categoryNames = {
    open: 'Open Ranges',
    call: 'Call Ranges',
    '3bet': '3-Bet Ranges',
    '4bet': '4-Bet Ranges',
    '4b_call': '4-Bet Call Ranges',
  };
  
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>('open');
  const filteredScenarios = PREFLOP_SCENARIOS.filter(s => s.category === activeCategory);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
        <h4>Load Preflop Range</h4>
        
        <div className={styles.categoryTabs}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${activeCategory === cat ? styles.activeCategory : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {categoryNames[cat]}
            </button>
          ))}
        </div>
        
        <div className={styles.scenarioList}>
          {filteredScenarios.map(scenario => (
            <div
              key={scenario.id}
              className={styles.scenarioItem}
              onClick={() => {
                onSelect(scenario);
                onClose();
              }}
            >
              <div className={styles.scenarioInfo}>
                <span className={styles.scenarioName}>{scenario.name}</span>
                <span className={styles.scenarioNameZh}>{scenario.nameZh}</span>
              </div>
              <span className={styles.scenarioPosition}>{scenario.position}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Load Solution Modal Component
function LoadSolutionModal({
  onLoad,
  onClose,
}: {
  onLoad: (solution: SavedSolution) => void;
  onClose: () => void;
}) {
  const [solutions, setSolutions] = useState<SavedSolution[]>([]);

  useEffect(() => {
    setSolutions(getSavedSolutions());
  }, []);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h4>Load Solution</h4>
        {solutions.length === 0 ? (
          <p className={styles.emptyMessage}>No saved solutions found.</p>
        ) : (
          <div className={styles.solutionList}>
            {solutions.map(sol => (
              <div
                key={sol.id}
                className={styles.solutionItem}
                onClick={() => onLoad(sol)}
              >
                <div className={styles.solutionInfo}>
                  <span className={styles.solutionName}>{sol.name}</span>
                  <span className={styles.solutionMeta}>
                    {sol.config.stackSize}bb | {sol.config.potSize}bb pot
                  </span>
                </div>
                <span className={styles.solutionDate}>
                  {new Date(sol.updatedAt).toLocaleDateString()}
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
