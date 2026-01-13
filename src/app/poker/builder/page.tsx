'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FolderOpen, Save, Calculator, Settings } from 'lucide-react';
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
import { Button } from '@/components/ui';

const RANGE_FILES: Record<string, string> = {};

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

  const [board, setBoard] = useState<Card[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<PreflopScenario | null>(null);

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

  const loadPreflopScenario = useCallback(async (scenario: PreflopScenario) => {
    try {
      const content = await loadRangeFile(scenario.filename);
      if (content) {
        const weights = parseRangeString(content);

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

  const handleSolve = useCallback(async () => {
    setError(null);
    setSolving(true);
    setProgress(null);
    setResult(null);

    try {
      let solver;

      if (board.length >= 3) {
        solver = new PostflopCFRSolver(config, board, {
          ...DEFAULT_SOLVER_CONFIG,
          maxIterations: 300,
        });
      } else {
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

  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    updateConfig({ name: saveName });
    saveSolution(saveName, config, result || undefined);
    setShowSaveModal(false);
    setSaveName('');
  }, [saveName, config, result, updateConfig]);

  const handleLoad = useCallback((solution: SavedSolution) => {
    setConfig(solution.config);
    if (solution.result) {
      setResult(solution.result);
    }
    setShowLoadModal(false);
  }, []);

  const getBettingModeLabel = (mode: BetSizingMode): string => {
    switch (mode) {
      case 'automatic': return 'Automatic';
      case 'dynamic': return 'Dynamic';
      case 'fixed': return 'Fixed';
    }
  };

  const getCurrentStreet = (): string => {
    if (board.length === 0) return 'Preflop';
    if (board.length === 3) return 'Flop';
    if (board.length === 4) return 'Turn';
    return 'River';
  };

  const activeRange = activeRangePlayer === 'IP' ? config.ipRange : config.oopRange;
  const updateActiveRange = activeRangePlayer === 'IP' ? updateIPRange : updateOOPRange;

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-black/20">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => router.push('/poker/heatmap')}
          >
            Back
          </Button>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Custom Solution Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={BookOpen}
            onClick={() => setShowPreflopModal(true)}
          >
            Preflop Ranges
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={FolderOpen}
            onClick={() => setShowLoadModal(true)}
          >
            Load
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={() => setShowSaveModal(true)}
          >
            Save
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-5 py-3 bg-white/5">
        <button
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'build'
              ? 'bg-[#7C3AED] text-white shadow-lg'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('build')}
        >
          Build
        </button>
        <button
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#7C3AED] text-white shadow-lg'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {activeTab === 'build' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
          {/* Left Panel - Range Editor */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeRangePlayer === 'OOP'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
                  }`}
                  onClick={() => setActiveRangePlayer('OOP')}
                >
                  OOP
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeRangePlayer === 'IP'
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
                  }`}
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
          </div>

          {/* Center Panel - Stack/Pot/Board */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Game Setup
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-[#94A3B8] uppercase mb-1.5">Stack (bb)</label>
                  <input
                    type="number"
                    value={config.stackSize}
                    onChange={(e) => updateConfig({ stackSize: parseFloat(e.target.value) || 100 })}
                    min="1"
                    max="999"
                    step="0.1"
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#94A3B8] uppercase mb-1.5">Pot (bb)</label>
                  <input
                    type="number"
                    value={config.potSize}
                    onChange={(e) => updateConfig({ potSize: parseFloat(e.target.value) || 1.5 })}
                    min="0.1"
                    max="999"
                    step="0.1"
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-semibold">SPR: {(config.stackSize / config.potSize).toFixed(1)}</span>
                <span className="px-2.5 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED] rounded-full text-xs font-semibold">
                  {getCurrentStreet()}
                </span>
              </div>
            </div>

            {/* Board Selector */}
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <BoardSelector
                board={board}
                onChange={setBoard}
                maxCards={5}
              />
            </div>

            {/* Solve Button */}
            <div className="space-y-3">
              <Button
                variant="cta"
                size="lg"
                icon={Calculator}
                className="w-full text-base font-bold"
                onClick={handleSolve}
                disabled={solving}
              >
                {solving ? 'Solving...' : `Solve ${getCurrentStreet()}`}
              </Button>

              {progress && (
                <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#7C3AED] transition-all duration-300"
                      style={{ width: `${(progress.iteration / progress.maxIterations) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#94A3B8] flex justify-between">
                    <span>Iteration {progress.iteration} / {progress.maxIterations}</span>
                    {progress.exploitability > 0 && (
                      <span>Exploitability: {progress.exploitability.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-3 text-sm text-[#ef4444]">
                  ✗ {error}
                </div>
              )}

              {result && (
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[#22c55e] mb-2">✓ Solution Complete</h4>
                  <div className="flex gap-4 text-xs text-[#94A3B8]">
                    <span>Iterations: {result.totalIterations}</span>
                    <span>Time: {(result.solveTime / 1000).toFixed(1)}s</span>
                    <span>Exploitability: {result.finalExploitability.toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Betting Tree */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-family-heading)' }}>
                <Settings className="w-5 h-5 text-[#7C3AED]" />
                Betting Tree
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#94A3B8] uppercase mb-1.5">Bet Sizing Mode</label>
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
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] cursor-pointer"
                  >
                    <option value="automatic">Automatic (Best for beginners)</option>
                    <option value="dynamic">Dynamic (N sizes with simplification)</option>
                    <option value="fixed">Fixed (Manual bet sizes)</option>
                  </select>
                </div>

                <div className="p-3 bg-white/5 rounded-lg text-xs text-[#E2E8F0]/80">
                  {config.bettingTree.oopConfig.preflop.mode === 'automatic' && (
                    <p>Automatically simplifies to the best, highest EV size(s) at each decision point.</p>
                  )}
                  {config.bettingTree.oopConfig.preflop.mode === 'dynamic' && (
                    <p>Choose how many sizes you want, and we will automatically simplify to optimal sizings.</p>
                  )}
                  {config.bettingTree.oopConfig.preflop.mode === 'fixed' && (
                    <p>Specify exactly what bet/raise sizes are allowed. Tree will NOT be simplified.</p>
                  )}
                </div>

                {config.bettingTree.oopConfig.preflop.mode === 'dynamic' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#94A3B8] uppercase mb-1.5"># Bet Sizes</label>
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
                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] uppercase mb-1.5"># Raise Sizes</label>
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
                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>
                )}

                <details className="group">
                  <summary className="text-sm font-semibold text-[#7C3AED] cursor-pointer list-none flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    Advanced Options
                  </summary>
                  <div className="mt-3 space-y-3 pl-5">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]"
                      />
                      Always add all-in option
                    </label>
                    <div>
                      <label className="block text-xs text-[#94A3B8] uppercase mb-1.5">Force all-in threshold (%)</label>
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
                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
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
        <div className="p-5 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Solution Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#7C3AED] uppercase mb-3">Game Setup</h4>
              <div className="space-y-1.5 text-sm">
                <p>Stack: {config.stackSize}bb</p>
                <p>Pot: {config.potSize}bb</p>
                <p>SPR: {(config.stackSize / config.potSize).toFixed(1)}</p>
                <p>Street: {getCurrentStreet()}</p>
                {board.length > 0 && (
                  <p>Board: {board.map(c => `${c.rank}${c.suit}`).join(' ')}</p>
                )}
              </div>
            </div>

            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#7C3AED] uppercase mb-3">OOP Range</h4>
              <div className="space-y-1.5 text-sm">
                <p>{config.oopRange.label}</p>
                <p>{Object.values(config.oopRange.weights).filter(v => v > 0).length} hands</p>
              </div>
            </div>

            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#7C3AED] uppercase mb-3">IP Range</h4>
              <div className="space-y-1.5 text-sm">
                <p>{config.ipRange.label}</p>
                <p>{Object.values(config.ipRange.weights).filter(v => v > 0).length} hands</p>
              </div>
            </div>

            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-[#7C3AED] uppercase mb-3">Betting Tree</h4>
              <div className="space-y-1.5 text-sm">
                <p>Mode: {getBettingModeLabel(config.bettingTree.oopConfig.preflop.mode)}</p>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-5">
              <h3 className="text-lg font-bold text-[#22c55e] mb-3">Solution Results</h3>
              <div className="space-y-1.5 text-sm">
                <p>Iterations: {result.totalIterations}</p>
                <p>Solve time: {(result.solveTime / 1000).toFixed(1)}s</p>
                <p>Exploitability: {result.finalExploitability.toFixed(4)}</p>
              </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A2E] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
              Save Solution
            </h4>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter solution name"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                Save
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A2E] border border-white/20 rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Load Preflop Range
        </h4>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {categoryNames[cat]}
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          {filteredScenarios.map(scenario => (
            <div
              key={scenario.id}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all duration-200"
              onClick={() => {
                onSelect(scenario);
                onClose();
              }}
            >
              <div>
                <div className="font-semibold">{scenario.name}</div>
                <div className="text-sm text-[#94A3B8]">{scenario.nameZh}</div>
              </div>
              <span className="px-2.5 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED] rounded-full text-xs font-semibold">
                {scenario.position}
              </span>
            </div>
          ))}
        </div>

        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function LoadSolutionModal({
  onLoad,
  onClose,
}: {
  onLoad: (solution: SavedSolution) => void;
  onClose: () => void;
}) {
  const [solutions] = useState<SavedSolution[]>(() => {
    if (typeof window === 'undefined') return [];
    return getSavedSolutions();
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A2E] border border-white/20 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Load Solution
        </h4>
        {solutions.length === 0 ? (
          <p className="text-[#94A3B8] text-center py-8">No saved solutions found.</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
            {solutions.map(sol => (
              <div
                key={sol.id}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all duration-200"
                onClick={() => onLoad(sol)}
              >
                <div>
                  <div className="font-semibold">{sol.name}</div>
                  <div className="text-sm text-[#94A3B8]">
                    {sol.config.stackSize}bb | {sol.config.potSize}bb pot
                  </div>
                </div>
                <span className="text-xs text-[#94A3B8]">
                  {new Date(sol.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
