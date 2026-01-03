import {
  Action,
  Card,
  GameRules,
  Hand,
  Rank,
  StrategyRecommendation,
} from "@/types";
import { calculateTotal, getHandType, isPair } from "./hand";

export interface StrategyContext {
  hand: Hand;
  dealerUpcard: Card;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  isAfterSplit: boolean;
}

export function recommendAction(
  context: StrategyContext,
  rules: GameRules
): StrategyRecommendation {
  const { hand, dealerUpcard, canSplit, canDouble, canSurrender } = context;
  const dealerValue = getDealerUpcardValue(dealerUpcard);

  // 1. check surrender
  if (canSurrender && rules.lateSurrender) {
    const surrenderResult = checkSurrender(hand, dealerValue, rules);
    if (surrenderResult) return surrenderResult;
  }

  // 2. pair strategy
  if (canSplit && isPair(hand.cards)) {
    const splitResult = checkPairStrategy(hand, dealerValue, rules, canDouble);
    if (splitResult.bestAction === "split") return splitResult;
  }

  // 3. soft hand strategy
  if (hand.isSoft && hand.cards.length === 2) {
    return checkSoftStrategy(hand, dealerValue, rules, canDouble);
  }

  // 4. hard hand strategy
  return checkHardStrategy(hand, dealerValue, rules, canDouble);
}

function getDealerUpcardValue(card: Card): number {
  return card.rank === "A" ? 11 : card.value;
}

function checkSurrender(
  hand: Hand,
  dealerValue: number,
  rules: GameRules
): StrategyRecommendation | null {
  const { total } = hand;

  // 对子 8,8 永远分牌，不投降
  if (isPair(hand.cards) && hand.cards[0].rank === "8") {
    return null;
  }

  // S17 投降条件
  if (rules.dealerRule === "S17") {
    // Hard 16 vs 9/10/A
    if (total === 16 && [9, 10, 11].includes(dealerValue)) {
      return {
        bestAction: "surrender",
        reason: {
          zh: "Hard 16 很弱，对手强牌，投降止损 EV 更高",
          en: "Hard 16 is weak against strong dealer cards, surrender saves EV",
        },
      };
    }
    // Hard 15 vs 10
    if (total === 15 && dealerValue === 10) {
      return {
        bestAction: "surrender",
        reason: {
          zh: "Hard 15 vs 10，投降比 Hit 期望值更高",
          en: "Hard 15 vs 10, surrender has better EV than hitting",
        },
      };
    }
  }

  // H17 额外投降条件
  if (rules.dealerRule === "H17") {
    // Hard 15 vs A
    if (total === 15 && dealerValue === 11) {
      return {
        bestAction: "surrender",
        reason: {
          zh: "H17 规则下 A 更危险，15 点投降",
          en: "Under H17, dealer A is more dangerous, surrender 15",
        },
      };
    }
    // Hard 17 vs A（反直觉！）
    if (total === 17 && dealerValue === 11) {
      return {
        bestAction: "surrender",
        reason: {
          zh: "反直觉：H17 下 Hard 17 vs A 应投降！庄家 Hit soft 17 提高了胜率",
          en: "Counter-intuitive: H17 makes dealer stronger, surrender hard 17 vs A",
        },
      };
    }
  }

  return null;
}
// --------------- 对子策略 ---------------
function checkPairStrategy(
  hand: Hand,
  dealerValue: number,
  rules: GameRules,
  canDouble: boolean
): StrategyRecommendation {
  const pairRank = hand.cards[0].rank;
  const pairValue = hand.cards[0].value;
  const hasDAS = rules.doubleAfterSplit;

  // A,A - 永远分
  if (pairRank === "A") {
    return {
      bestAction: "split",
      reason: {
        zh: "A,A 永远分！两个 11 点起手 vs 一个 12/soft 2",
        en: "Always split A,A! Two hands starting at 11 > one soft 12",
      },
    };
  }

  // 8,8 - 永远分
  if (pairRank === "8") {
    return {
      bestAction: "split",
      reason: {
        zh: "8,8 永远分！16 是最差的手牌，分成两个 8 起手",
        en: "Always split 8,8! 16 is the worst hand, split into two 8s",
      },
    };
  }

  // 10,10 - 永远停
  if (pairValue === 10) {
    return {
      bestAction: "stand",
      reason: {
        zh: "20 点已经很强，不要贪心分牌",
        en: "20 is very strong, don't get greedy",
      },
    };
  }

  // 5,5 - 当做 10 点处理，不分
  if (pairRank === "5") {
    if (dealerValue >= 2 && dealerValue <= 9 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "5,5 = 10 点，对弱牌加倍！不要分牌",
          en: "5,5 = 10 points, double against weak dealers! Never split",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "5,5 = 10 点，但庄家太强，只能 Hit",
        en: "5,5 = 10, but dealer is too strong, just hit",
      },
    };
  }

  // 9,9
  if (pairRank === "9") {
    if ([7, 10, 11].includes(dealerValue)) {
      return {
        bestAction: "stand",
        reason: {
          zh: "9,9 vs 7/10/A 停牌。18 点够强 or 分牌风险大",
          en: "9,9 stand vs 7/10/A. 18 is good enough or split is risky",
        },
      };
    }
    return {
      bestAction: "split",
      reason: {
        zh: "9,9 vs 弱牌分牌，两个 9 起手赢面大",
        en: "Split 9,9 vs weak dealers for two strong starts",
      },
    };
  }

  // 7,7
  if (pairRank === "7") {
    if (dealerValue >= 2 && dealerValue <= 7) {
      return {
        bestAction: "split",
        reason: {
          zh: "7,7 vs 弱牌分开打",
          en: "Split 7,7 against weak dealers",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "7,7 vs 强牌不分，14 点 Hit",
        en: "7,7 vs strong dealers, just hit 14",
      },
    };
  }

  // 6,6
  if (pairRank === "6") {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        bestAction: "split",
        reason: {
          zh: "6,6 vs 弱牌分开",
          en: "Split 6,6 against weak dealers",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "6,6 vs 强牌 Hit",
        en: "6,6 vs strong dealers, hit",
      },
    };
  }

  // 4,4
  if (pairRank === "4") {
    if (hasDAS && [5, 6].includes(dealerValue)) {
      return {
        bestAction: "split",
        reason: {
          zh: "4,4 只在 DAS 允许且 vs 5/6 时分",
          en: "Split 4,4 only with DAS vs 5/6",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "4,4 = 8 点，Hit",
        en: "4,4 = 8 points, hit",
      },
    };
  }

  // 3,3 和 2,2 策略相同
  if (pairRank === "3" || pairRank === "2") {
    if (dealerValue >= 2 && dealerValue <= 7) {
      return {
        bestAction: "split",
        reason: {
          zh: `${pairRank},${pairRank} vs 2-7 分开`,
          en: `Split ${pairRank},${pairRank} against 2-7`,
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: `${pairRank},${pairRank} vs 强牌 Hit`,
        en: `${pairRank},${pairRank} vs strong dealers, hit`,
      },
    };
  }

  // 默认不分
  return {
    bestAction: "hit",
    reason: { zh: "默认 Hit", en: "Default: hit" },
  };
}
// --------------- 软手策略 ---------------
function checkSoftStrategy(
  hand: Hand,
  dealerValue: number,
  rules: GameRules,
  canDouble: boolean
): StrategyRecommendation {
  const total = hand.total;
  const isH17 = rules.dealerRule === "H17";

  // A,9 / A,8（软 20/19）- 基本都 Stand
  if (total >= 19) {
    // H17 特例：A,8 vs 6 加倍
    if (isH17 && total === 19 && dealerValue === 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "H17 规则下 Soft 19 vs 6 可以加倍！庄家爆牌概率更高",
          en: "H17 rule: Double soft 19 vs 6! Dealer busts more often",
        },
      };
    }
    return {
      bestAction: "stand",
      reason: {
        zh: `Soft ${total} 已经很强，停牌`,
        en: `Soft ${total} is strong, stand`,
      },
    };
  }

  // A,7（软 18）
  if (total === 18) {
    // H17: A,7 vs 2 加倍
    if (isH17 && dealerValue === 2 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "H17 下 Soft 18 vs 2 加倍更优",
          en: "H17 rule: Double soft 18 vs 2",
        },
      };
    }
    // vs 3-6 加倍
    if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "Soft 18 vs 弱牌加倍！赢面大",
          en: "Double soft 18 against weak dealers",
        },
      };
    }
    // vs 2/7/8 停牌
    if ([2, 7, 8].includes(dealerValue)) {
      return {
        bestAction: "stand",
        reason: {
          zh: "Soft 18 vs 2/7/8 停牌即可",
          en: "Stand soft 18 vs 2/7/8",
        },
      };
    }
    // vs 9/10/A 要牌
    return {
      bestAction: "hit",
      reason: {
        zh: "Soft 18 vs 强牌要牌，18 不够安全",
        en: "Hit soft 18 vs strong dealers, 18 isn't safe enough",
      },
    };
  }

  // A,6（软 17）
  if (total === 17) {
    if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "Soft 17 vs 3-6 加倍",
          en: "Double soft 17 vs 3-6",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "Soft 17 必须 Hit，17 点站不住",
        en: "Must hit soft 17, can't stand on 17",
      },
    };
  }

  // A,5 / A,4（软 16/15）
  if (total === 16 || total === 15) {
    if (dealerValue >= 4 && dealerValue <= 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: `Soft ${total} vs 4-6 加倍`,
          en: `Double soft ${total} vs 4-6`,
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: `Soft ${total} 继续 Hit`,
        en: `Hit soft ${total}`,
      },
    };
  }

  // A,3 / A,2（软 14/13）
  if (total <= 14) {
    if (dealerValue >= 5 && dealerValue <= 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: `Soft ${total} vs 5-6 加倍`,
          en: `Double soft ${total} vs 5-6`,
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: `Soft ${total} 继续 Hit`,
        en: `Hit soft ${total}`,
      },
    };
  }

  return {
    bestAction: "hit",
    reason: { zh: "默认 Hit", en: "Default: hit" },
  };
}
// --------------- 硬手策略 ---------------
function checkHardStrategy(
  hand: Hand,
  dealerValue: number,
  rules: GameRules,
  canDouble: boolean
): StrategyRecommendation {
  const total = hand.total;
  const isH17 = rules.dealerRule === "H17";

  // 17+ 永远停
  if (total >= 17) {
    return {
      bestAction: "stand",
      reason: {
        zh: `${total} 点停牌，Hit 大概率爆`,
        en: `Stand on ${total}, hitting will likely bust`,
      },
    };
  }

  // 13-16 vs 弱牌停
  if (total >= 13 && total <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        bestAction: "stand",
        reason: {
          zh: `${total} vs 弱牌停！让庄家去冒爆牌风险`,
          en: `Stand ${total} vs weak dealer, let them risk busting`,
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: `${total} vs 强牌必须 Hit，虽然可能爆`,
        en: `Must hit ${total} vs strong dealer, risk busting`,
      },
    };
  }

  // 12 特殊
  if (total === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) {
      return {
        bestAction: "stand",
        reason: {
          zh: "12 vs 4-6 停！让庄家爆",
          en: "Stand 12 vs 4-6, let dealer bust",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "12 vs 2/3/7+ Hit，2/3 不够弱",
        en: "Hit 12 vs 2/3/7+, 2/3 aren't weak enough",
      },
    };
  }

  // 11 加倍（核心！）
  if (total === 11) {
    // H17: 11 vs A 也加倍
    if (isH17 || dealerValue !== 11) {
      if (canDouble) {
        return {
          bestAction: "double",
          reason: {
            zh: "11 点加倍！最佳起手之一",
            en: "Double on 11! One of the best starting hands",
          },
        };
      }
    }
    // S17 下 11 vs A 只 Hit
    if (!isH17 && dealerValue === 11) {
      return {
        bestAction: "hit",
        reason: {
          zh: "S17 规则下 11 vs A 只 Hit（不加倍）",
          en: "S17 rule: Just hit 11 vs A (don't double)",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "11 点 Hit",
        en: "Hit 11",
      },
    };
  }

  // 10 加倍
  if (total === 10) {
    if (dealerValue >= 2 && dealerValue <= 9 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "10 点 vs 2-9 加倍！",
          en: "Double 10 vs 2-9",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "10 vs 10/A Hit",
        en: "Hit 10 vs 10/A",
      },
    };
  }

  // 9 加倍
  if (total === 9) {
    if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
      return {
        bestAction: "double",
        reason: {
          zh: "9 点 vs 3-6 加倍",
          en: "Double 9 vs 3-6",
        },
      };
    }
    return {
      bestAction: "hit",
      reason: {
        zh: "9 点 Hit",
        en: "Hit 9",
      },
    };
  }

  // 8 及以下永远 Hit
  return {
    bestAction: "hit",
    reason: {
      zh: `${total} 点太小，Hit`,
      en: `${total} is too low, hit`,
    },
  };
}

export function shouldTakeInsurance(): StrategyRecommendation {
  return {
    bestAction: "stand", // 表示"不买"
    reason: {
      zh: "不算牌情况下，保险永远是负期望值，不建议购买",
      en: "Without card counting, insurance is always negative EV, not recommended",
    },
  };
}
