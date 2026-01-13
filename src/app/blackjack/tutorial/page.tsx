'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, DollarSign, Target, BookOpen } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

export default function Tutorial() {
  const router = useRouter();
  const { t, language } = useI18n();

  const content = {
    zh: {
      title: "算牌教学 (Hi-Lo)",
      intro: "算牌不是为了必胜，而是为了在获胜概率大时增加下注。",
      runningCount: {
        title: "1. 流水数 (Running Count)",
        desc: "每出现一张牌，都需要在心中更新计分：",
        low: "2, 3, 4, 5, 6",
        mid: "7, 8, 9",
        high: "10, J, Q, K, A",
        lowDesc: "+1 (小牌移出，剩大牌，玩家优势)",
        midDesc: "0 (中性牌，无影响)",
        highDesc: "-1 (大牌移出，剩小牌，庄家优势)"
      },
      trueCount: {
        title: "2. 真数 (True Count)",
        desc: "因为牌数不同影响不同，需要用剩余牌副数进行标准化。",
        formula: "真数 = 流水数 ÷ 剩余副数",
        example: "例如：流水数 +12，剩余 3 副牌 -> 真数 +4"
      },
      betting: {
        title: "3. 下注策略 (Betting Ramp)",
        desc: "真数越高，玩家优势越大，应加大注码。",
        rules: [
          "真数 ≤ 1: 最小注 (或离桌)",
          "真数 +2: 2倍注",
          "真数 +3: 4-6倍注",
          "真数 ≥ +5: 最大注"
        ]
      }
    },
    en: {
      title: "Card Counting (Hi-Lo)",
      intro: "Counting is about identifying when the deck favors the player.",
      runningCount: {
        title: "1. Running Count",
        desc: "Update your count for every card you see:",
        low: "2, 3, 4, 5, 6",
        mid: "7, 8, 9",
        high: "10, J, Q, K, A",
        lowDesc: "+1 (Low cards gone, deck is rich)",
        midDesc: "0 (Neutral, no effect)",
        highDesc: "-1 (High cards gone, deck is poor)"
      },
      trueCount: {
        title: "2. True Count",
        desc: "Adjust for the number of decks remaining.",
        formula: "True Count = Running Count ÷ Decks Remaining",
        example: "Ex: Running +12, 3 Decks left -> True +4"
      },
      betting: {
        title: "3. Betting Ramp",
        desc: "Bet more when the True Count is high.",
        rules: [
          "TC ≤ 1: Min Bet",
          "TC +2: 2 Units",
          "TC +3: 4-6 Units",
          "TC ≥ +5: Max Bet"
        ]
      }
    }
  };

  const text = content[language];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="flex items-center gap-5 px-5 py-4 bg-black/20">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push('/')}
        >
          Back
        </Button>
        <h1 className="text-xl font-bold text-white">
          {language === 'zh' ? '21点教学' : 'Blackjack Tutorial'}
        </h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-[#7C3AED]" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">{text.title}</h1>
          </div>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">{text.intro}</p>
        </div>

        {/* Running Count Section */}
        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#7C3AED]" />
            <h2 className="text-2xl font-bold text-white">{text.runningCount.title}</h2>
          </div>
          <p className="text-[#94A3B8]">{text.runningCount.desc}</p>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card variant="stat" className="p-4 space-y-2">
              <div className="text-3xl font-bold text-[#22c55e]">+1</div>
              <div className="font-mono text-white">{text.runningCount.low}</div>
              <div className="text-sm text-[#94A3B8]">{text.runningCount.lowDesc}</div>
            </Card>
            <Card variant="stat" className="p-4 space-y-2">
              <div className="text-3xl font-bold text-[#94A3B8]">0</div>
              <div className="font-mono text-white">{text.runningCount.mid}</div>
              <div className="text-sm text-[#94A3B8]">{text.runningCount.midDesc}</div>
            </Card>
            <Card variant="stat" className="p-4 space-y-2">
              <div className="text-3xl font-bold text-[#ef4444]">-1</div>
              <div className="font-mono text-white">{text.runningCount.high}</div>
              <div className="text-sm text-[#94A3B8]">{text.runningCount.highDesc}</div>
            </Card>
          </div>
        </Card>

        {/* True Count Section */}
        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#7C3AED]" />
            <h2 className="text-2xl font-bold text-white">{text.trueCount.title}</h2>
          </div>
          <p className="text-[#94A3B8]">{text.trueCount.desc}</p>
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg p-4 font-mono text-lg text-[#7C3AED] text-center">
            {text.trueCount.formula}
          </div>
          <p className="text-sm text-[#94A3B8] italic">{text.trueCount.example}</p>
        </Card>

        {/* Betting Strategy Section */}
        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-[#7C3AED]" />
            <h2 className="text-2xl font-bold text-white">{text.betting.title}</h2>
          </div>
          <p className="text-[#94A3B8]">{text.betting.desc}</p>
          <ul className="space-y-2 mt-4">
            {text.betting.rules.map((rule, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-3 bg-[#252542] rounded-lg border border-[#7C3AED]/20"
              >
                <div className="w-6 h-6 bg-[#7C3AED]/20 rounded-full flex items-center justify-center text-[#7C3AED] text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-white">{rule}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Strategy Report Section */}
        <section className="mt-12 space-y-6">
          <div className="text-center space-y-3">
            <span className="text-sm font-semibold text-[#7C3AED] uppercase tracking-wider">
              {language === 'zh' ? '策略验证报告' : 'Strategy Verification Report'}
            </span>
            <h2 className="text-3xl font-bold text-white">
              {language === 'zh'
                ? '用户策略全维度解析与优化建议'
                : 'Comprehensive Strategy Analysis & Optimization Guide'}
            </h2>
            <p className="text-[#94A3B8] max-w-3xl mx-auto">
              {language === 'zh'
                ? '以多副牌、S17、DAS为基础，逐章验证策略正确性，并补充投降与保险等缺失环节。'
                : 'Multi-deck, S17, DAS basic strategy verification with surrender and insurance coverage.'}
            </p>
          </div>

          {language === 'zh' ? (
            <>
              {/* Chapter 1 */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    01
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-white">第一章：引言与21点数学原理</h3>

                    <div className="space-y-3 text-[#94A3B8]">
                      <div>
                        <h4 className="text-white font-semibold mb-2">1.1 21点的博弈本质</h4>
                        <p>
                          21点并非比大小，而是基于不完全信息的概率管理博弈。核心目标是最大化每一手牌的
                          期望值（EV），而不是"凑齐21点"。基本策略来自对数亿手牌的模拟，针对每一种
                          "玩家点数 vs 庄家明牌"寻找最大EV决策。
                        </p>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-2">1.2 赌场优势的来源与控制</h4>
                        <p>
                          在"盲打"情况下赌场优势通常超过5%，主要源于爆牌先行原则：玩家先爆牌即判负。
                          通过严格执行基本策略，可将优势压缩至约<span className="text-[#22c55e] font-bold">0.5%</span>。
                        </p>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-2">1.3 报告分析框架</h4>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>策略准确性验证：对比标准 S17/DAS 多副牌策略表。</li>
                          <li>规则适用性分析：识别 H17 vs S17 的关键差异。</li>
                          <li>缺失环节补充：投降策略与保险策略的补充。</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 2 */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    02
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第二章：硬牌（Hard Hand）策略验证</h3>
                    <p className="text-sm text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-3">
                      硬牌：手中不含A，或A只能算1点避免爆牌（如10+6+A=17）。
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.1 ≤ 8 点</h4>
                        <p className="text-sm text-[#94A3B8]">要牌正确：永不爆牌，停牌EV极低，Hit是唯一正解。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.2 9 点</h4>
                        <p className="text-sm text-[#94A3B8]">对3–6加倍，否则Hit；多副牌S17下正确。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.3 10 点</h4>
                        <p className="text-sm text-[#94A3B8]">对2–9加倍；对10/A要牌以保留容错空间。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.4 11 点</h4>
                        <p className="text-sm text-[#94A3B8]">S17：对A要牌；H17：对A加倍（规则关键分歧）。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.5 12 点</h4>
                        <p className="text-sm text-[#94A3B8]">4–6停牌；对2/3/7–A要牌，数学上最关键的僵局点。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">2.6 13–16 点</h4>
                        <p className="text-sm text-[#94A3B8]">
                          2–6停牌；7–A要牌。若允许投降：16对9/10/A、15对10应投降。
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg">
                      <strong className="text-white">2.7 17–21 点：</strong>
                      <span className="text-[#94A3B8]">成牌停牌，无争议。要牌爆牌概率远高于改善收益。</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 3 */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    03
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第三章：软牌（Soft Hand）策略验证</h3>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">3.1 A2–A5（软13-软16）</h4>
                        <p className="text-sm text-[#94A3B8]">对5–6加倍；A4/A5对4–6加倍，其余要牌。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">3.2 A6（软17）</h4>
                        <p className="text-sm text-[#94A3B8]">对3–6加倍，其余要牌，软17不可停。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">3.3 A7（软18）</h4>
                        <p className="text-sm text-[#94A3B8]">2/7/8停牌；3–6加倍；9/10/A要牌（S17正确）。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">3.4 A8/A9（软19/软20）</h4>
                        <p className="text-sm text-[#94A3B8]">S17停牌；H17下A8对6应加倍。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 4 */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    04
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第四章：对子（Pairs）与分牌</h3>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.1 AA / 88</h4>
                        <p className="text-sm text-[#94A3B8]">必分：AA是两个11，88避免硬16。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.2 22 / 33 / 77</h4>
                        <p className="text-sm text-[#94A3B8]">对2–7分，否则要牌（DAS前提）。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.3 44</h4>
                        <p className="text-sm text-[#94A3B8]">对5–6分，其余要牌；无DAS则永不分。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.4 55</h4>
                        <p className="text-sm text-[#94A3B8]">永不分牌；10点是加倍的黄金起手。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.5 66</h4>
                        <p className="text-sm text-[#94A3B8]">对2–6分，其余要牌（DAS）。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">4.6 99</h4>
                        <p className="text-sm text-[#94A3B8]">2-6、8-9分；7/10/A停牌。</p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg">
                      <strong className="text-white">4.7 TT：</strong>
                      <span className="text-[#94A3B8]">永远停牌，20点胜率极高，严禁分10。</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 5 - H17 vs S17 */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    05
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第五章：H17 与 S17 深度对比</h3>
                    <p className="text-[#94A3B8]">
                      S17：庄家软17停牌，对玩家有利；H17：软17要牌，赌场优势上升约0.2%。
                    </p>

                    <div className="overflow-x-auto">
                      <div className="min-w-full bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <div className="grid grid-cols-4 gap-px bg-[#7C3AED]/20">
                          <div className="bg-[#7C3AED]/20 p-3 font-semibold text-white text-sm">玩家手牌</div>
                          <div className="bg-[#7C3AED]/20 p-3 font-semibold text-white text-sm">庄家明牌</div>
                          <div className="bg-[#7C3AED]/20 p-3 font-semibold text-white text-sm">S17 策略</div>
                          <div className="bg-[#7C3AED]/20 p-3 font-semibold text-white text-sm">H17 策略</div>

                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">11</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">A</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">Hit</div>
                          <div className="bg-[#252542] p-3 text-[#22c55e] font-semibold text-sm">Double</div>

                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">A,8（软19）</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">6</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">Stand</div>
                          <div className="bg-[#252542] p-3 text-[#22c55e] font-semibold text-sm">Double</div>

                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">A,7（软18）</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">2</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">Stand</div>
                          <div className="bg-[#252542] p-3 text-[#22c55e] font-semibold text-sm">Double</div>

                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">投降 15</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">A</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">Hit</div>
                          <div className="bg-[#252542] p-3 text-[#ef4444] font-semibold text-sm">Surrender</div>

                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">投降 17</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">A</div>
                          <div className="bg-[#252542] p-3 text-[#94A3B8] text-sm">Stand</div>
                          <div className="bg-[#252542] p-3 text-[#ef4444] font-semibold text-sm">Surrender</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 6 - Insurance */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    06
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第六章：保险（Insurance）策略</h3>
                    <p className="text-[#94A3B8]">
                      保险赌庄家底牌是否为10点，赔率2赔1。数学期望为负：
                    </p>
                    <div className="bg-[#252542] border border-[#7C3AED]/20 rounded-lg p-4 font-mono text-[#7C3AED] text-center">
                      EV = (16/51 × 2) - (35/51 × 1) = -5.89%
                    </div>
                    <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                      <p className="text-white">
                        <strong>结论：</strong>不数牌时永远不要买保险或"收先（Even Money）"。只有真数 ≥ +3
                        时保险才可能为正EV。
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 7 - Surrender */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    07
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第七章：投降（Surrender）策略补全</h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">S17 投降</h4>
                        <p className="text-sm text-[#94A3B8]">硬16 vs 9/10/A、硬15 vs 10。</p>
                      </div>
                      <div className="p-4 bg-[#252542] rounded-lg border border-[#7C3AED]/20">
                        <h4 className="text-white font-semibold mb-2">H17 额外投降</h4>
                        <p className="text-sm text-[#94A3B8]">硬15 vs A、硬17 vs A（EV &lt; -0.5）。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chapter 8 - Summary */}
              <Card variant="glass" className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    08
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white">第八章：总结与最终建议</h3>
                    <ul className="space-y-2">
                      {[
                        '适用范围：多副牌（4/6/8）、S17、DAS、未计投降。',
                        '确认规则：桌面标注"Pays 3 to 2"与"Dealer stands on all 17s"。',
                        '警惕H17：11对A与软18/软19相关打法需要调整。',
                        '若允许投降，务必补充关键投降点。',
                        '拒绝保险，非算牌玩家坚持0.4%–0.6%优势区间。'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[#94A3B8]">
                          <span className="text-[#7C3AED] mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card variant="glass" className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  01
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-white">Full English strategy guide coming soon</h3>
                  <div className="space-y-2 text-[#94A3B8]">
                    <p>The complete English translation of all 8 strategy chapters is being prepared.</p>
                    <p>For now, please refer to the card counting tutorial above and practice with the Training Mode.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
