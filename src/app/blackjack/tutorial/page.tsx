'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Header from '@/components/Header';
import { useI18n } from '@/hooks/useI18n';

export default function Tutorial() {
  const router = useRouter();
  const { t, language } = useI18n();
  // We can use the global language or local override. 
  // Since useI18n is available, better to use it but we need specific content for tutorial.
  // I'll put content directly here for simplicity as it's static.
  
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
    <div className={`${styles.container} gradient-bg`}>
      <Header 
        onOpenSettings={() => {}} 
        onOpenStats={() => {}} 
        onBack={() => router.push('/')}
      />
      
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>{text.title}</h1>
        <p className={styles.intro}>{text.intro}</p>
        
        <div className={styles.section}>
          <h2>{text.runningCount.title}</h2>
          <p>{text.runningCount.desc}</p>
          
          <div className={styles.cards}>
            <div className={styles.cardGroup}>
              <div className={styles.cardVal}>+1</div>
              <div className={styles.cardList}>{text.runningCount.low}</div>
              <div className={styles.cardDesc}>{text.runningCount.lowDesc}</div>
            </div>
            <div className={styles.cardGroup}>
              <div className={styles.cardVal}>0</div>
              <div className={styles.cardList}>{text.runningCount.mid}</div>
              <div className={styles.cardDesc}>{text.runningCount.midDesc}</div>
            </div>
            <div className={styles.cardGroup}>
              <div className={styles.cardVal}>-1</div>
              <div className={styles.cardList}>{text.runningCount.high}</div>
              <div className={styles.cardDesc}>{text.runningCount.highDesc}</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>{text.trueCount.title}</h2>
          <p>{text.trueCount.desc}</p>
          <div className={styles.formula}>{text.trueCount.formula}</div>
          <p className={styles.example}>{text.trueCount.example}</p>
        </div>

        <div className={styles.section}>
          <h2>{text.betting.title}</h2>
          <p>{text.betting.desc}</p>
          <ul className={styles.rules}>
            {text.betting.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>

        {language === 'zh' && (
          <section className={styles.report}>
            <div className={styles.reportHeader}>
              <span className={styles.kicker}>策略验证报告</span>
              <h2 className={styles.reportTitle}>用户策略全维度解析与优化建议</h2>
              <p className={styles.reportIntro}>
                以多副牌、S17、DAS为基础，逐章验证策略正确性，并补充投降与保险等缺失环节。
              </p>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>01</div>
                <h3>第一章：引言与21点数学原理</h3>
              </div>
              <div className={styles.chapterBody}>
                <h4>1.1 21点的博弈本质</h4>
                <p>
                  21点并非比大小，而是基于不完全信息的概率管理博弈。核心目标是最大化每一手牌的
                  期望值（EV），而不是“凑齐21点”。基本策略来自对数亿手牌的模拟，针对每一种
                  “玩家点数 vs 庄家明牌”寻找最大EV决策。
                </p>
                <h4>1.2 赌场优势的来源与控制</h4>
                <p>
                  在“盲打”情况下赌场优势通常超过5%，主要源于爆牌先行原则：玩家先爆牌即判负。
                  通过严格执行基本策略，可将优势压缩至约<span className={styles.emph}>0.5%</span>。
                </p>
                <h4>1.3 报告分析框架</h4>
                <ul className={styles.list}>
                  <li>策略准确性验证：对比标准 S17/DAS 多副牌策略表。</li>
                  <li>规则适用性分析：识别 H17 vs S17 的关键差异。</li>
                  <li>缺失环节补充：投降策略与保险策略的补充。</li>
                </ul>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>02</div>
                <h3>第二章：硬牌（Hard Hand）策略验证</h3>
              </div>
              <div className={styles.chapterBody}>
                <p className={styles.note}>
                  硬牌：手中不含A，或A只能算1点避免爆牌（如10+6+A=17）。
                </p>
                <div className={styles.gridTwo}>
                  <div className={styles.card}>
                    <h4>2.1 ≤ 8 点</h4>
                    <p>要牌正确：永不爆牌，停牌EV极低，Hit是唯一正解。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>2.2 9 点</h4>
                    <p>对3–6加倍，否则Hit；多副牌S17下正确。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>2.3 10 点</h4>
                    <p>对2–9加倍；对10/A要牌以保留容错空间。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>2.4 11 点</h4>
                    <p>S17：对A要牌；H17：对A加倍（规则关键分歧）。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>2.5 12 点</h4>
                    <p>4–6停牌；对2/3/7–A要牌，数学上最关键的僵局点。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>2.6 13–16 点</h4>
                    <p>
                      2–6停牌；7–A要牌。若允许投降：16对9/10/A、15对10应投降。
                    </p>
                  </div>
                </div>
                <div className={styles.callout}>
                  <strong>2.7 17–21 点：</strong>成牌停牌，无争议。要牌爆牌概率远高于改善收益。
                </div>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>03</div>
                <h3>第三章：软牌（Soft Hand）策略验证</h3>
              </div>
              <div className={styles.chapterBody}>
                <div className={styles.gridTwo}>
                  <div className={styles.card}>
                    <h4>3.1 A2–A5（软13-软16）</h4>
                    <p>对5–6加倍；A4/A5对4–6加倍，其余要牌。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>3.2 A6（软17）</h4>
                    <p>对3–6加倍，其余要牌，软17不可停。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>3.3 A7（软18）</h4>
                    <p>2/7/8停牌；3–6加倍；9/10/A要牌（S17正确）。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>3.4 A8/A9（软19/软20）</h4>
                    <p>S17停牌；H17下A8对6应加倍。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>04</div>
                <h3>第四章：对子（Pairs）与分牌</h3>
              </div>
              <div className={styles.chapterBody}>
                <div className={styles.gridTwo}>
                  <div className={styles.card}>
                    <h4>4.1 AA / 88</h4>
                    <p>必分：AA是两个11，88避免硬16。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>4.2 22 / 33 / 77</h4>
                    <p>对2–7分，否则要牌（DAS前提）。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>4.3 44</h4>
                    <p>对5–6分，其余要牌；无DAS则永不分。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>4.4 55</h4>
                    <p>永不分牌；10点是加倍的黄金起手。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>4.5 66</h4>
                    <p>对2–6分，其余要牌（DAS）。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>4.6 99</h4>
                    <p>2-6、8-9分；7/10/A停牌。</p>
                  </div>
                </div>
                <div className={styles.callout}>
                  <strong>4.7 TT：</strong>永远停牌，20点胜率极高，严禁分10。
                </div>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>05</div>
                <h3>第五章：H17 与 S17 深度对比</h3>
              </div>
              <div className={styles.chapterBody}>
                <p>
                  S17：庄家软17停牌，对玩家有利；H17：软17要牌，赌场优势上升约0.2%。
                </p>
                <div className={styles.compareTable}>
                  <div className={styles.tableRow}>
                    <div className={styles.tableHead}>玩家手牌</div>
                    <div className={styles.tableHead}>庄家明牌</div>
                    <div className={styles.tableHead}>S17 策略</div>
                    <div className={styles.tableHead}>H17 策略</div>
                  </div>
                  <div className={styles.tableRow}>
                    <div>11</div>
                    <div>A</div>
                    <div>Hit</div>
                    <div>Double</div>
                  </div>
                  <div className={styles.tableRow}>
                    <div>A,8（软19）</div>
                    <div>6</div>
                    <div>Stand</div>
                    <div>Double</div>
                  </div>
                  <div className={styles.tableRow}>
                    <div>A,7（软18）</div>
                    <div>2</div>
                    <div>Stand</div>
                    <div>Double</div>
                  </div>
                  <div className={styles.tableRow}>
                    <div>投降 15</div>
                    <div>A</div>
                    <div>Hit</div>
                    <div>Surrender</div>
                  </div>
                  <div className={styles.tableRow}>
                    <div>投降 17</div>
                    <div>A</div>
                    <div>Stand</div>
                    <div>Surrender</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>06</div>
                <h3>第六章：保险（Insurance）策略</h3>
              </div>
              <div className={styles.chapterBody}>
                <p>
                  保险赌庄家底牌是否为10点，赔率2赔1。数学期望为负：
                </p>
                <div className={styles.formulaBlock}>
                  EV = (16/51 × 2) - (35/51 × 1) = -5.89%
                </div>
                <p className={styles.callout}>
                  结论：不数牌时永远不要买保险或“收先（Even Money）”。只有真数 ≥ +3
                  时保险才可能为正EV。
                </p>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>07</div>
                <h3>第七章：投降（Surrender）策略补全</h3>
              </div>
              <div className={styles.chapterBody}>
                <div className={styles.gridTwo}>
                  <div className={styles.card}>
                    <h4>S17 投降</h4>
                    <p>硬16 vs 9/10/A、硬15 vs 10。</p>
                  </div>
                  <div className={styles.card}>
                    <h4>H17 额外投降</h4>
                    <p>硬15 vs A、硬17 vs A（EV &lt; -0.5）。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chapter}>
              <div className={styles.chapterHeader}>
                <div className={styles.chapterIndex}>08</div>
                <h3>第八章：总结与最终建议</h3>
              </div>
              <div className={styles.chapterBody}>
                <ul className={styles.list}>
                  <li>适用范围：多副牌（4/6/8）、S17、DAS、未计投降。</li>
                  <li>确认规则：桌面标注“Pays 3 to 2”与“Dealer stands on all 17s”。</li>
                  <li>警惕H17：11对A与软18/软19相关打法需要调整。</li>
                  <li>若允许投降，务必补充关键投降点。</li>
                  <li>拒绝保险，非算牌玩家坚持0.4%–0.6%优势区间。</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
