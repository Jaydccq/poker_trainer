/**
 * GTO Strategy Data for 6-max 100bb
 * Based on simplified GTO ranges for common preflop scenarios
 */
import { HandNotation, ActionFrequencies, ScenarioInfo, HandStrategy } from '../types';

// Scenario definitions
export const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'utg_rfi',
    name: 'UTG Open Raise',
    nameZh: 'UTG开池加注',
    description: 'Opening range from Under the Gun position',
    descriptionZh: '枪口位开池加注范围',
    position: 'UTG',
    action: 'RFI',
    difficulty: 'beginner',
    learningObjectives: [
      'Learn tight opening range from early position',
      'Understand position disadvantage requires stronger hands',
    ],
    learningObjectivesZh: [
      '学习前位紧凑的开池范围',
      '理解位置劣势需要更强的起手牌',
    ],
  },
  {
    id: 'btn_rfi',
    name: 'Button Open Raise',
    nameZh: 'BTN开池加注',
    description: 'Opening range from Button position',
    descriptionZh: '按钮位开池加注范围',
    position: 'BTN',
    action: 'RFI',
    difficulty: 'beginner',
    learningObjectives: [
      'Learn wide opening range from late position',
      'Understand position advantage allows more hands',
    ],
    learningObjectivesZh: [
      '学习后位宽松的开池范围',
      '理解位置优势可以打更多手牌',
    ],
  },
  {
    id: 'co_rfi',
    name: 'Cutoff Open Raise',
    nameZh: 'CO开池加注',
    description: 'Opening range from Cutoff position',
    descriptionZh: '关煞位开池加注范围',
    position: 'CO',
    action: 'RFI',
    difficulty: 'beginner',
    learningObjectives: [
      'Learn intermediate opening range',
      'Balance between position and remaining players',
    ],
    learningObjectivesZh: [
      '学习中等宽度的开池范围',
      '平衡位置和后面玩家数量',
    ],
  },
  {
    id: 'bb_vs_btn',
    name: 'BB Defense vs BTN',
    nameZh: 'BB对抗BTN',
    description: 'Big Blind defense against Button open',
    descriptionZh: '大盲位对抗按钮位开池',
    position: 'BB',
    vsPosition: 'BTN',
    action: 'vs_RFI',
    difficulty: 'intermediate',
    learningObjectives: [
      'Learn wide defending range from BB',
      'Understand pot odds with already invested big blind',
      'Identify 3-bet opportunities',
    ],
    learningObjectivesZh: [
      '学习大盲位的宽防守范围',
      '理解已投入大盲后的底池赔率',
      '识别3bet机会',
    ],
  },
  {
    id: 'sb_vs_btn',
    name: 'SB vs BTN Open',
    nameZh: 'SB对抗BTN',
    description: 'Small Blind response to Button open',
    descriptionZh: '小盲位对抗按钮位开池',
    position: 'SB',
    vsPosition: 'BTN',
    action: 'vs_RFI',
    difficulty: 'intermediate',
    learningObjectives: [
      'Learn 3-bet or fold strategy from SB',
      'Understand why calling is generally bad from SB',
    ],
    learningObjectivesZh: [
      '学习小盲位的3bet或弃牌策略',
      '理解为什么小盲位跟注通常不好',
    ],
  },
  {
    id: 'btn_vs_3bet',
    name: 'BTN vs BB 3-Bet',
    nameZh: 'BTN对抗BB的3bet',
    description: 'Button response to Big Blind 3-bet',
    descriptionZh: '按钮位面对大盲位3bet的应对',
    position: 'BTN',
    vsPosition: 'BB',
    action: 'vs_3bet',
    difficulty: 'advanced',
    learningObjectives: [
      'Learn 4-bet, call, and fold frequencies',
      'Understand pot odds and implied odds considerations',
      'Identify premium holdings for 4-betting',
    ],
    learningObjectivesZh: [
      '学习4bet、跟注和弃牌的频率',
      '理解底池赔率和隐含赔率',
      '识别适合4bet的优质底牌',
    ],
  },
];

// Strategy data type
export type StrategyData = Record<HandNotation, ActionFrequencies>;

/**
 * UTG RFI Strategy (tight ~15% range)
 */
export const UTG_RFI: StrategyData = {
  // Premium pairs
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0, raise: 1 },
  'JJ': { fold: 0, call: 0, raise: 1 },
  'TT': { fold: 0, call: 0, raise: 1 },
  '99': { fold: 0, call: 0, raise: 1 },
  '88': { fold: 0.1, call: 0, raise: 0.9 },
  '77': { fold: 0.3, call: 0, raise: 0.7 },
  '66': { fold: 0.5, call: 0, raise: 0.5 },
  '55': { fold: 0.6, call: 0, raise: 0.4 },
  '44': { fold: 0.7, call: 0, raise: 0.3 },
  '33': { fold: 0.8, call: 0, raise: 0.2 },
  '22': { fold: 0.8, call: 0, raise: 0.2 },
  
  // Broadway suited
  'AKs': { fold: 0, call: 0, raise: 1 },
  'AQs': { fold: 0, call: 0, raise: 1 },
  'AJs': { fold: 0, call: 0, raise: 1 },
  'ATs': { fold: 0, call: 0, raise: 1 },
  'KQs': { fold: 0, call: 0, raise: 1 },
  'KJs': { fold: 0, call: 0, raise: 1 },
  'KTs': { fold: 0.2, call: 0, raise: 0.8 },
  'QJs': { fold: 0.1, call: 0, raise: 0.9 },
  'QTs': { fold: 0.3, call: 0, raise: 0.7 },
  'JTs': { fold: 0.2, call: 0, raise: 0.8 },
  
  // Suited aces
  'A9s': { fold: 0.5, call: 0, raise: 0.5 },
  'A8s': { fold: 0.6, call: 0, raise: 0.4 },
  'A7s': { fold: 0.7, call: 0, raise: 0.3 },
  'A6s': { fold: 0.7, call: 0, raise: 0.3 },
  'A5s': { fold: 0.5, call: 0, raise: 0.5 },
  'A4s': { fold: 0.6, call: 0, raise: 0.4 },
  'A3s': { fold: 0.7, call: 0, raise: 0.3 },
  'A2s': { fold: 0.8, call: 0, raise: 0.2 },
  
  // Broadway offsuit
  'AKo': { fold: 0, call: 0, raise: 1 },
  'AQo': { fold: 0, call: 0, raise: 1 },
  'AJo': { fold: 0.2, call: 0, raise: 0.8 },
  'ATo': { fold: 0.5, call: 0, raise: 0.5 },
  'KQo': { fold: 0.3, call: 0, raise: 0.7 },
  'KJo': { fold: 0.6, call: 0, raise: 0.4 },
  'QJo': { fold: 0.7, call: 0, raise: 0.3 },
};

/**
 * BTN RFI Strategy (wide ~45% range)
 */
export const BTN_RFI: StrategyData = {
  // All pairs
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0, raise: 1 },
  'JJ': { fold: 0, call: 0, raise: 1 },
  'TT': { fold: 0, call: 0, raise: 1 },
  '99': { fold: 0, call: 0, raise: 1 },
  '88': { fold: 0, call: 0, raise: 1 },
  '77': { fold: 0, call: 0, raise: 1 },
  '66': { fold: 0, call: 0, raise: 1 },
  '55': { fold: 0, call: 0, raise: 1 },
  '44': { fold: 0, call: 0, raise: 1 },
  '33': { fold: 0.1, call: 0, raise: 0.9 },
  '22': { fold: 0.2, call: 0, raise: 0.8 },
  
  // All suited aces
  'AKs': { fold: 0, call: 0, raise: 1 },
  'AQs': { fold: 0, call: 0, raise: 1 },
  'AJs': { fold: 0, call: 0, raise: 1 },
  'ATs': { fold: 0, call: 0, raise: 1 },
  'A9s': { fold: 0, call: 0, raise: 1 },
  'A8s': { fold: 0, call: 0, raise: 1 },
  'A7s': { fold: 0, call: 0, raise: 1 },
  'A6s': { fold: 0, call: 0, raise: 1 },
  'A5s': { fold: 0, call: 0, raise: 1 },
  'A4s': { fold: 0, call: 0, raise: 1 },
  'A3s': { fold: 0, call: 0, raise: 1 },
  'A2s': { fold: 0, call: 0, raise: 1 },
  
  // Suited kings
  'KQs': { fold: 0, call: 0, raise: 1 },
  'KJs': { fold: 0, call: 0, raise: 1 },
  'KTs': { fold: 0, call: 0, raise: 1 },
  'K9s': { fold: 0, call: 0, raise: 1 },
  'K8s': { fold: 0, call: 0, raise: 1 },
  'K7s': { fold: 0.1, call: 0, raise: 0.9 },
  'K6s': { fold: 0.2, call: 0, raise: 0.8 },
  'K5s': { fold: 0.2, call: 0, raise: 0.8 },
  'K4s': { fold: 0.3, call: 0, raise: 0.7 },
  'K3s': { fold: 0.4, call: 0, raise: 0.6 },
  'K2s': { fold: 0.5, call: 0, raise: 0.5 },
  
  // Suited queens
  'QJs': { fold: 0, call: 0, raise: 1 },
  'QTs': { fold: 0, call: 0, raise: 1 },
  'Q9s': { fold: 0, call: 0, raise: 1 },
  'Q8s': { fold: 0.1, call: 0, raise: 0.9 },
  'Q7s': { fold: 0.3, call: 0, raise: 0.7 },
  'Q6s': { fold: 0.4, call: 0, raise: 0.6 },
  'Q5s': { fold: 0.5, call: 0, raise: 0.5 },
  'Q4s': { fold: 0.6, call: 0, raise: 0.4 },
  'Q3s': { fold: 0.7, call: 0, raise: 0.3 },
  'Q2s': { fold: 0.8, call: 0, raise: 0.2 },
  
  // Suited connectors
  'JTs': { fold: 0, call: 0, raise: 1 },
  'J9s': { fold: 0, call: 0, raise: 1 },
  'J8s': { fold: 0.2, call: 0, raise: 0.8 },
  'J7s': { fold: 0.4, call: 0, raise: 0.6 },
  'T9s': { fold: 0, call: 0, raise: 1 },
  'T8s': { fold: 0.1, call: 0, raise: 0.9 },
  'T7s': { fold: 0.4, call: 0, raise: 0.6 },
  '98s': { fold: 0, call: 0, raise: 1 },
  '97s': { fold: 0.2, call: 0, raise: 0.8 },
  '87s': { fold: 0, call: 0, raise: 1 },
  '86s': { fold: 0.3, call: 0, raise: 0.7 },
  '76s': { fold: 0.1, call: 0, raise: 0.9 },
  '75s': { fold: 0.4, call: 0, raise: 0.6 },
  '65s': { fold: 0.2, call: 0, raise: 0.8 },
  '54s': { fold: 0.3, call: 0, raise: 0.7 },
  
  // Offsuit broadway
  'AKo': { fold: 0, call: 0, raise: 1 },
  'AQo': { fold: 0, call: 0, raise: 1 },
  'AJo': { fold: 0, call: 0, raise: 1 },
  'ATo': { fold: 0, call: 0, raise: 1 },
  'A9o': { fold: 0.1, call: 0, raise: 0.9 },
  'A8o': { fold: 0.2, call: 0, raise: 0.8 },
  'A7o': { fold: 0.3, call: 0, raise: 0.7 },
  'A6o': { fold: 0.4, call: 0, raise: 0.6 },
  'A5o': { fold: 0.3, call: 0, raise: 0.7 },
  'A4o': { fold: 0.4, call: 0, raise: 0.6 },
  'A3o': { fold: 0.5, call: 0, raise: 0.5 },
  'A2o': { fold: 0.6, call: 0, raise: 0.4 },
  'KQo': { fold: 0, call: 0, raise: 1 },
  'KJo': { fold: 0, call: 0, raise: 1 },
  'KTo': { fold: 0.1, call: 0, raise: 0.9 },
  'K9o': { fold: 0.3, call: 0, raise: 0.7 },
  'K8o': { fold: 0.5, call: 0, raise: 0.5 },
  'K7o': { fold: 0.6, call: 0, raise: 0.4 },
  'QJo': { fold: 0.1, call: 0, raise: 0.9 },
  'QTo': { fold: 0.2, call: 0, raise: 0.8 },
  'Q9o': { fold: 0.5, call: 0, raise: 0.5 },
  'JTo': { fold: 0.2, call: 0, raise: 0.8 },
  'J9o': { fold: 0.5, call: 0, raise: 0.5 },
  'T9o': { fold: 0.4, call: 0, raise: 0.6 },
};

/**
 * CO RFI Strategy (~28% range)
 */
export const CO_RFI: StrategyData = {
  // All pairs
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0, raise: 1 },
  'JJ': { fold: 0, call: 0, raise: 1 },
  'TT': { fold: 0, call: 0, raise: 1 },
  '99': { fold: 0, call: 0, raise: 1 },
  '88': { fold: 0, call: 0, raise: 1 },
  '77': { fold: 0, call: 0, raise: 1 },
  '66': { fold: 0, call: 0, raise: 1 },
  '55': { fold: 0.1, call: 0, raise: 0.9 },
  '44': { fold: 0.2, call: 0, raise: 0.8 },
  '33': { fold: 0.4, call: 0, raise: 0.6 },
  '22': { fold: 0.5, call: 0, raise: 0.5 },
  
  // Suited aces
  'AKs': { fold: 0, call: 0, raise: 1 },
  'AQs': { fold: 0, call: 0, raise: 1 },
  'AJs': { fold: 0, call: 0, raise: 1 },
  'ATs': { fold: 0, call: 0, raise: 1 },
  'A9s': { fold: 0, call: 0, raise: 1 },
  'A8s': { fold: 0, call: 0, raise: 1 },
  'A7s': { fold: 0.1, call: 0, raise: 0.9 },
  'A6s': { fold: 0.1, call: 0, raise: 0.9 },
  'A5s': { fold: 0, call: 0, raise: 1 },
  'A4s': { fold: 0.1, call: 0, raise: 0.9 },
  'A3s': { fold: 0.2, call: 0, raise: 0.8 },
  'A2s': { fold: 0.3, call: 0, raise: 0.7 },
  
  // Suited broadways
  'KQs': { fold: 0, call: 0, raise: 1 },
  'KJs': { fold: 0, call: 0, raise: 1 },
  'KTs': { fold: 0, call: 0, raise: 1 },
  'K9s': { fold: 0.2, call: 0, raise: 0.8 },
  'K8s': { fold: 0.4, call: 0, raise: 0.6 },
  'QJs': { fold: 0, call: 0, raise: 1 },
  'QTs': { fold: 0, call: 0, raise: 1 },
  'Q9s': { fold: 0.2, call: 0, raise: 0.8 },
  'JTs': { fold: 0, call: 0, raise: 1 },
  'J9s': { fold: 0.2, call: 0, raise: 0.8 },
  'T9s': { fold: 0, call: 0, raise: 1 },
  '98s': { fold: 0.1, call: 0, raise: 0.9 },
  '87s': { fold: 0.2, call: 0, raise: 0.8 },
  '76s': { fold: 0.3, call: 0, raise: 0.7 },
  '65s': { fold: 0.4, call: 0, raise: 0.6 },
  
  // Offsuit
  'AKo': { fold: 0, call: 0, raise: 1 },
  'AQo': { fold: 0, call: 0, raise: 1 },
  'AJo': { fold: 0, call: 0, raise: 1 },
  'ATo': { fold: 0, call: 0, raise: 1 },
  'A9o': { fold: 0.4, call: 0, raise: 0.6 },
  'KQo': { fold: 0, call: 0, raise: 1 },
  'KJo': { fold: 0.1, call: 0, raise: 0.9 },
  'KTo': { fold: 0.3, call: 0, raise: 0.7 },
  'QJo': { fold: 0.2, call: 0, raise: 0.8 },
  'QTo': { fold: 0.4, call: 0, raise: 0.6 },
  'JTo': { fold: 0.3, call: 0, raise: 0.7 },
};

/**
 * BB vs BTN Defense Strategy (wide defense ~55%)
 */
export const BB_VS_BTN: StrategyData = {
  // Premium - 3bet
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0.1, raise: 0.9 },
  'JJ': { fold: 0, call: 0.3, raise: 0.7 },
  'TT': { fold: 0, call: 0.5, raise: 0.5 },
  '99': { fold: 0, call: 0.7, raise: 0.3 },
  '88': { fold: 0, call: 0.8, raise: 0.2 },
  '77': { fold: 0.1, call: 0.8, raise: 0.1 },
  '66': { fold: 0.2, call: 0.7, raise: 0.1 },
  '55': { fold: 0.3, call: 0.6, raise: 0.1 },
  '44': { fold: 0.4, call: 0.5, raise: 0.1 },
  '33': { fold: 0.5, call: 0.4, raise: 0.1 },
  '22': { fold: 0.6, call: 0.35, raise: 0.05 },
  
  // Strong suited
  'AKs': { fold: 0, call: 0.1, raise: 0.9 },
  'AQs': { fold: 0, call: 0.3, raise: 0.7 },
  'AJs': { fold: 0, call: 0.5, raise: 0.5 },
  'ATs': { fold: 0, call: 0.6, raise: 0.4 },
  'A9s': { fold: 0, call: 0.7, raise: 0.3 },
  'A8s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'A7s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'A6s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'A5s': { fold: 0, call: 0.6, raise: 0.4 },
  'A4s': { fold: 0.1, call: 0.6, raise: 0.3 },
  'A3s': { fold: 0.2, call: 0.6, raise: 0.2 },
  'A2s': { fold: 0.3, call: 0.5, raise: 0.2 },
  
  // Suited broadways
  'KQs': { fold: 0, call: 0.4, raise: 0.6 },
  'KJs': { fold: 0, call: 0.5, raise: 0.5 },
  'KTs': { fold: 0, call: 0.6, raise: 0.4 },
  'K9s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'K8s': { fold: 0.2, call: 0.7, raise: 0.1 },
  'K7s': { fold: 0.3, call: 0.6, raise: 0.1 },
  'K6s': { fold: 0.3, call: 0.6, raise: 0.1 },
  'K5s': { fold: 0.3, call: 0.6, raise: 0.1 },
  'K4s': { fold: 0.4, call: 0.5, raise: 0.1 },
  'K3s': { fold: 0.5, call: 0.4, raise: 0.1 },
  'K2s': { fold: 0.6, call: 0.35, raise: 0.05 },
  
  'QJs': { fold: 0, call: 0.6, raise: 0.4 },
  'QTs': { fold: 0, call: 0.7, raise: 0.3 },
  'Q9s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'Q8s': { fold: 0.2, call: 0.7, raise: 0.1 },
  'Q7s': { fold: 0.4, call: 0.5, raise: 0.1 },
  'Q6s': { fold: 0.4, call: 0.5, raise: 0.1 },
  'Q5s': { fold: 0.5, call: 0.4, raise: 0.1 },
  'Q4s': { fold: 0.6, call: 0.35, raise: 0.05 },
  'Q3s': { fold: 0.7, call: 0.25, raise: 0.05 },
  'Q2s': { fold: 0.8, call: 0.15, raise: 0.05 },
  
  'JTs': { fold: 0, call: 0.7, raise: 0.3 },
  'J9s': { fold: 0.1, call: 0.7, raise: 0.2 },
  'J8s': { fold: 0.2, call: 0.7, raise: 0.1 },
  'J7s': { fold: 0.4, call: 0.5, raise: 0.1 },
  
  'T9s': { fold: 0, call: 0.8, raise: 0.2 },
  'T8s': { fold: 0.1, call: 0.8, raise: 0.1 },
  '98s': { fold: 0.1, call: 0.8, raise: 0.1 },
  '87s': { fold: 0.1, call: 0.8, raise: 0.1 },
  '76s': { fold: 0.2, call: 0.7, raise: 0.1 },
  '65s': { fold: 0.3, call: 0.6, raise: 0.1 },
  '54s': { fold: 0.4, call: 0.5, raise: 0.1 },
  
  // Offsuit
  'AKo': { fold: 0, call: 0.2, raise: 0.8 },
  'AQo': { fold: 0, call: 0.4, raise: 0.6 },
  'AJo': { fold: 0, call: 0.6, raise: 0.4 },
  'ATo': { fold: 0.1, call: 0.7, raise: 0.2 },
  'A9o': { fold: 0.3, call: 0.6, raise: 0.1 },
  'A8o': { fold: 0.4, call: 0.5, raise: 0.1 },
  'A7o': { fold: 0.5, call: 0.4, raise: 0.1 },
  'A6o': { fold: 0.6, call: 0.35, raise: 0.05 },
  'A5o': { fold: 0.5, call: 0.4, raise: 0.1 },
  'A4o': { fold: 0.6, call: 0.35, raise: 0.05 },
  'A3o': { fold: 0.7, call: 0.25, raise: 0.05 },
  'A2o': { fold: 0.8, call: 0.15, raise: 0.05 },
  
  'KQo': { fold: 0, call: 0.5, raise: 0.5 },
  'KJo': { fold: 0.1, call: 0.6, raise: 0.3 },
  'KTo': { fold: 0.2, call: 0.6, raise: 0.2 },
  'K9o': { fold: 0.4, call: 0.5, raise: 0.1 },
  'K8o': { fold: 0.6, call: 0.35, raise: 0.05 },
  'K7o': { fold: 0.7, call: 0.25, raise: 0.05 },
  
  'QJo': { fold: 0.1, call: 0.7, raise: 0.2 },
  'QTo': { fold: 0.3, call: 0.6, raise: 0.1 },
  'Q9o': { fold: 0.5, call: 0.45, raise: 0.05 },
  
  'JTo': { fold: 0.2, call: 0.7, raise: 0.1 },
  'J9o': { fold: 0.5, call: 0.45, raise: 0.05 },
  'T9o': { fold: 0.4, call: 0.55, raise: 0.05 },
  '98o': { fold: 0.5, call: 0.45, raise: 0.05 },
  '87o': { fold: 0.6, call: 0.35, raise: 0.05 },
};

/**
 * SB vs BTN Strategy (3bet or fold heavy)
 */
export const SB_VS_BTN: StrategyData = {
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0, raise: 1 },
  'JJ': { fold: 0, call: 0.1, raise: 0.9 },
  'TT': { fold: 0, call: 0.2, raise: 0.8 },
  '99': { fold: 0.2, call: 0.3, raise: 0.5 },
  '88': { fold: 0.3, call: 0.3, raise: 0.4 },
  '77': { fold: 0.4, call: 0.3, raise: 0.3 },
  '66': { fold: 0.5, call: 0.2, raise: 0.3 },
  '55': { fold: 0.6, call: 0.2, raise: 0.2 },
  '44': { fold: 0.7, call: 0.15, raise: 0.15 },
  '33': { fold: 0.8, call: 0.1, raise: 0.1 },
  '22': { fold: 0.85, call: 0.1, raise: 0.05 },
  
  'AKs': { fold: 0, call: 0, raise: 1 },
  'AQs': { fold: 0, call: 0.1, raise: 0.9 },
  'AJs': { fold: 0, call: 0.2, raise: 0.8 },
  'ATs': { fold: 0.1, call: 0.3, raise: 0.6 },
  'A9s': { fold: 0.2, call: 0.3, raise: 0.5 },
  'A8s': { fold: 0.3, call: 0.3, raise: 0.4 },
  'A7s': { fold: 0.4, call: 0.2, raise: 0.4 },
  'A6s': { fold: 0.4, call: 0.2, raise: 0.4 },
  'A5s': { fold: 0.2, call: 0.2, raise: 0.6 },
  'A4s': { fold: 0.3, call: 0.2, raise: 0.5 },
  'A3s': { fold: 0.5, call: 0.2, raise: 0.3 },
  'A2s': { fold: 0.6, call: 0.2, raise: 0.2 },
  
  'KQs': { fold: 0, call: 0.2, raise: 0.8 },
  'KJs': { fold: 0.1, call: 0.3, raise: 0.6 },
  'KTs': { fold: 0.2, call: 0.3, raise: 0.5 },
  'K9s': { fold: 0.4, call: 0.2, raise: 0.4 },
  
  'QJs': { fold: 0.1, call: 0.3, raise: 0.6 },
  'QTs': { fold: 0.2, call: 0.3, raise: 0.5 },
  'JTs': { fold: 0.2, call: 0.3, raise: 0.5 },
  'T9s': { fold: 0.3, call: 0.3, raise: 0.4 },
  '98s': { fold: 0.4, call: 0.3, raise: 0.3 },
  '87s': { fold: 0.5, call: 0.2, raise: 0.3 },
  '76s': { fold: 0.6, call: 0.2, raise: 0.2 },
  
  'AKo': { fold: 0, call: 0, raise: 1 },
  'AQo': { fold: 0, call: 0.2, raise: 0.8 },
  'AJo': { fold: 0.1, call: 0.3, raise: 0.6 },
  'ATo': { fold: 0.3, call: 0.3, raise: 0.4 },
  'KQo': { fold: 0.1, call: 0.3, raise: 0.6 },
  'KJo': { fold: 0.3, call: 0.3, raise: 0.4 },
  'QJo': { fold: 0.5, call: 0.2, raise: 0.3 },
};

/**
 * BTN vs BB 3bet Strategy
 */
export const BTN_VS_3BET: StrategyData = {
  'AA': { fold: 0, call: 0, raise: 1 },
  'KK': { fold: 0, call: 0, raise: 1 },
  'QQ': { fold: 0, call: 0.2, raise: 0.8 },
  'JJ': { fold: 0, call: 0.5, raise: 0.5 },
  'TT': { fold: 0.1, call: 0.6, raise: 0.3 },
  '99': { fold: 0.2, call: 0.7, raise: 0.1 },
  '88': { fold: 0.3, call: 0.65, raise: 0.05 },
  '77': { fold: 0.5, call: 0.45, raise: 0.05 },
  '66': { fold: 0.6, call: 0.35, raise: 0.05 },
  '55': { fold: 0.7, call: 0.25, raise: 0.05 },
  '44': { fold: 0.8, call: 0.15, raise: 0.05 },
  
  'AKs': { fold: 0, call: 0.2, raise: 0.8 },
  'AQs': { fold: 0, call: 0.5, raise: 0.5 },
  'AJs': { fold: 0.1, call: 0.6, raise: 0.3 },
  'ATs': { fold: 0.2, call: 0.6, raise: 0.2 },
  'A5s': { fold: 0.2, call: 0.4, raise: 0.4 },
  'A4s': { fold: 0.3, call: 0.4, raise: 0.3 },
  
  'KQs': { fold: 0.1, call: 0.6, raise: 0.3 },
  'KJs': { fold: 0.2, call: 0.6, raise: 0.2 },
  'QJs': { fold: 0.3, call: 0.6, raise: 0.1 },
  'JTs': { fold: 0.3, call: 0.6, raise: 0.1 },
  'T9s': { fold: 0.4, call: 0.55, raise: 0.05 },
  '98s': { fold: 0.5, call: 0.45, raise: 0.05 },
  
  'AKo': { fold: 0, call: 0.3, raise: 0.7 },
  'AQo': { fold: 0.1, call: 0.6, raise: 0.3 },
  'AJo': { fold: 0.4, call: 0.5, raise: 0.1 },
  'KQo': { fold: 0.4, call: 0.5, raise: 0.1 },
};

// Map scenario IDs to strategy data
export const STRATEGY_MAP: Record<string, StrategyData> = {
  'utg_rfi': UTG_RFI,
  'btn_rfi': BTN_RFI,
  'co_rfi': CO_RFI,
  'bb_vs_btn': BB_VS_BTN,
  'sb_vs_btn': SB_VS_BTN,
  'btn_vs_3bet': BTN_VS_3BET,
};

/**
 * Get strategy for a scenario
 */
export function getStrategy(scenarioId: string): StrategyData | undefined {
  return STRATEGY_MAP[scenarioId];
}

/**
 * Get default action frequencies for hands not explicitly defined
 */
export function getDefaultFrequencies(): ActionFrequencies {
  return { fold: 1, call: 0, raise: 0 };
}

/**
 * Get strategy for a specific hand, returning default fold if not defined
 */
export function getHandStrategy(scenarioId: string, hand: HandNotation): ActionFrequencies {
  const strategy = STRATEGY_MAP[scenarioId];
  if (!strategy) return getDefaultFrequencies();
  return strategy[hand] || getDefaultFrequencies();
}
