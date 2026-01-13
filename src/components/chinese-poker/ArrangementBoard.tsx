'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Card, cardToString, RANKS_BY_VALUE, RANK_VALUES } from '@/poker/solver/cards';
import { Arrangement, FiveCardRank, ThreeCardRank } from '@/types/chinese-poker';
import { isFoul } from '@/utils/chinese-poker/validation';
import { isBackStrongerThanMiddle, isMiddleStrongerThanFront } from '@/utils/chinese-poker/comparison';
import { evaluateFiveCardHand } from '@/utils/chinese-poker/hand-5card';
import { evaluateThreeCardHand } from '@/utils/chinese-poker/hand-3card';
import PokerCard from './PokerCard';
import styles from './ArrangementBoard.module.css';

type Zone = 'front' | 'middle' | 'back' | 'unassigned';
type SortMode = 'suit' | 'rank';
type FocusZone = Exclude<Zone, 'unassigned'>;

interface ZonesState {
  front: Card[];
  middle: Card[];
  back: Card[];
  unassigned: Card[];
}

interface ArrangementBoardProps {
  cards: Card[];
  onSubmit: (arrangement: Arrangement) => void;
}

const ZONE_LIMITS: Record<Exclude<Zone, 'unassigned'>, number> = {
  front: 3,
  middle: 5,
  back: 5
};

const SUIT_ORDER: Record<Card['suit'], number> = {
  s: 0,
  h: 1,
  d: 2,
  c: 3
};

const ZONE_ORDER: FocusZone[] = ['back', 'middle', 'front'];
const ZONE_LABELS: Record<FocusZone, string> = {
  back: '后墩',
  middle: '中墩',
  front: '前墩'
};

export default function ArrangementBoard({ cards, onSubmit }: ArrangementBoardProps) {
  const [zones, setZones] = useState<ZonesState>({
    front: [],
    middle: [],
    back: [],
    unassigned: cards
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('suit');
  const [focusZone, setFocusZone] = useState<FocusZone>('back');
  const [history, setHistory] = useState<ZonesState[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showAllZones, setShowAllZones] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zonesScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    setZones({ front: [], middle: [], back: [], unassigned: cards });
    setHistory([]);
    setShowConfirm(false);
    setClearConfirm(false);
    setShowAllZones(false);
    setFocusZone('back');
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, [cards]);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const cardMap = useMemo(() => {
    return new Map(cards.map(card => [cardToString(card), card]));
  }, [cards]);

  const arrangement: Arrangement = useMemo(() => ({
    front: zones.front,
    middle: zones.middle,
    back: zones.back
  }), [zones.front, zones.middle, zones.back]);

  const sortedUnassigned = useMemo(() => {
    const list = [...zones.unassigned];
    if (sortMode === 'rank') {
      return list.sort((a, b) => {
        const rankDiff = RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
        if (rankDiff !== 0) return rankDiff;
        return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      });
    }
    return list.sort((a, b) => {
      const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      if (suitDiff !== 0) return suitDiff;
      return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
    });
  }, [sortMode, zones.unassigned]);

  const isComplete = zones.front.length === 3 && zones.middle.length === 5 && zones.back.length === 5;
  const isInvalid = isComplete && isFoul(arrangement);
  const middleStrongerThanBack = zones.middle.length === 5 && zones.back.length === 5
    && !isBackStrongerThanMiddle(zones.back, zones.middle);
  const frontStrongerThanMiddle = zones.front.length === 3 && zones.middle.length === 5
    && !isMiddleStrongerThanFront(zones.middle, zones.front);
  const hasConstraintWarning = middleStrongerThanBack || frontStrongerThanMiddle;

  const moveCard = useCallback((cardId: string, target: Zone) => {
    const card = cardMap.get(cardId);
    if (!card) return;

    setZones(prev => {
      const currentZone: Zone | null = (['front', 'middle', 'back', 'unassigned'] as Zone[])
        .find(zone => prev[zone].some(item => cardToString(item) === cardId)) || null;
      if (currentZone === target) {
        return prev;
      }

      if (target !== 'unassigned') {
        const limit = ZONE_LIMITS[target];
        const alreadyInTarget = prev[target].some(item => cardToString(item) === cardId);
        if (prev[target].length >= limit && !alreadyInTarget) {
          return prev;
        }
      }

      setHistory(historyPrev => [...historyPrev.slice(-19), prev]);
      setShowConfirm(false);
      setClearConfirm(false);

      const next: ZonesState = {
        front: prev.front.filter(item => cardToString(item) !== cardId),
        middle: prev.middle.filter(item => cardToString(item) !== cardId),
        back: prev.back.filter(item => cardToString(item) !== cardId),
        unassigned: prev.unassigned.filter(item => cardToString(item) !== cardId)
      };

      if (target === 'unassigned') {
        next.unassigned = [...next.unassigned, card];
      } else {
        next[target] = [...next[target], card];
      }

      return next;
    });
  }, [cardMap]);

  useEffect(() => {
    if (focusZone && zones[focusZone].length >= ZONE_LIMITS[focusZone]) {
      const currentIndex = ZONE_ORDER.indexOf(focusZone);
      const remaining = ZONE_ORDER.slice(currentIndex + 1)
        .find(zone => zones[zone].length < ZONE_LIMITS[zone]);
      if (remaining) {
        setFocusZone(remaining);
      }
    }
  }, [focusZone, zones]);

  const handleDragStart = useCallback((cardId: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(cardId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setActiveZone(null);
  }, []);

  const handleDrop = useCallback((zone: Zone) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('text/plain');
    if (!cardId) return;
    moveCard(cardId, zone);
    if (zone !== 'unassigned') {
      setFocusZone(zone);
    }
    setActiveZone(null);
  }, [moveCard]);

  const allowDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleClear = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true);
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
      clearTimeoutRef.current = setTimeout(() => {
        setClearConfirm(false);
      }, 2000);
      return;
    }

    setHistory(historyPrev => [...historyPrev.slice(-19), zones]);
    setZones({ front: [], middle: [], back: [], unassigned: cards });
    setClearConfirm(false);
    setShowConfirm(false);
  }, [cards, clearConfirm, zones]);

  const handleUndo = useCallback(() => {
    setHistory(historyPrev => {
      if (historyPrev.length === 0) return historyPrev;
      const previous = historyPrev[historyPrev.length - 1];
      setZones(previous);
      return historyPrev.slice(0, -1);
    });
    setShowConfirm(false);
    setClearConfirm(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isComplete || isInvalid) return;
    setShowConfirm(true);
  }, [isComplete, isInvalid]);

  const handleConfirmSubmit = useCallback(() => {
    if (!isComplete || isInvalid) return;
    onSubmit(arrangement);
  }, [arrangement, isComplete, isInvalid, onSubmit]);

  const getRankLabel = useCallback((rank: Card['rank'] | number) => {
    const rankValue = typeof rank === 'number' ? RANKS_BY_VALUE[rank] : rank;
    return rankValue === 'T' ? '10' : rankValue;
  }, []);

  const getHighCardLabel = useCallback((cardsToCheck: Card[]) => {
    const top = Math.max(...cardsToCheck.map(card => RANK_VALUES[card.rank]));
    return getRankLabel(top);
  }, [getRankLabel]);

  const getThreeCardLabel = useCallback((cardsToCheck: Card[]) => {
    if (cardsToCheck.length !== 3) return '--';
    const value = evaluateThreeCardHand(cardsToCheck);
    const primary = getRankLabel(value.primaryValue);

    if (value.rank === ThreeCardRank.THREE_OF_A_KIND) {
      return `${primary}三条`;
    }
    if (value.rank === ThreeCardRank.PAIR) {
      return `对${primary}`;
    }
    return `${primary}高`;
  }, [getRankLabel]);

  const getFiveCardLabel = useCallback((cardsToCheck: Card[]) => {
    if (cardsToCheck.length !== 5) return '--';
    const value = evaluateFiveCardHand(cardsToCheck);
    switch (value.rank) {
      case FiveCardRank.ROYAL_FLUSH:
        return '皇家同花顺';
      case FiveCardRank.STRAIGHT_FLUSH:
        return '同花顺';
      case FiveCardRank.FOUR_OF_A_KIND:
        return '四条';
      case FiveCardRank.FULL_HOUSE:
        return '葫芦';
      case FiveCardRank.FLUSH:
        return '同花';
      case FiveCardRank.STRAIGHT:
        return '顺子';
      case FiveCardRank.THREE_OF_A_KIND:
        return '三条';
      case FiveCardRank.TWO_PAIR:
        return '两对';
      case FiveCardRank.ONE_PAIR:
        return '一对';
      case FiveCardRank.HIGH_CARD:
      default:
        return `${getHighCardLabel(cardsToCheck)}高`;
    }
  }, [getHighCardLabel]);

  const focusMessage = useMemo(() => {
    if (isComplete) {
      return '✅ 排列完成，准备提交';
    }

    const focusCount = zones[focusZone].length;
    const focusLimit = ZONE_LIMITS[focusZone];
    const focusLabel = focusZone === 'back' ? '后墩' : focusZone === 'middle' ? '中墩' : '前墩';

    if (focusZone === 'middle' && zones.back.length === 5) {
      return `✅ 后墩完成，请继续中墩 (${focusCount}/${focusLimit})`;
    }
    if (focusZone === 'front' && zones.middle.length === 5) {
      return `✅ 中墩完成，请继续前墩 (${focusCount}/${focusLimit})`;
    }
    return `👉 正在摆：${focusLabel} (${focusCount}/${focusLimit})`;
  }, [focusZone, isComplete, zones]);

  const warningMessage = useMemo(() => {
    if (middleStrongerThanBack) {
      return '⚠ 中墩强于后墩，请调整';
    }
    if (frontStrongerThanMiddle) {
      return '⚠ 前墩强于中墩，请调整';
    }
    return '';
  }, [frontStrongerThanMiddle, middleStrongerThanBack]);

  const getSmartTarget = useCallback((currentZones: ZonesState) => {
    if (currentZones[focusZone].length < ZONE_LIMITS[focusZone]) {
      return focusZone;
    }
    const currentIndex = ZONE_ORDER.indexOf(focusZone);
    const after = ZONE_ORDER.slice(currentIndex + 1)
      .find(zone => currentZones[zone].length < ZONE_LIMITS[zone]);
    if (after) return after;
    const before = ZONE_ORDER.slice(0, currentIndex)
      .find(zone => currentZones[zone].length < ZONE_LIMITS[zone]);
    return before ?? null;
  }, [focusZone]);

  const scrollToZone = useCallback((zone: FocusZone) => {
    const container = zonesScrollRef.current;
    setFocusZone(zone);
    if (showAllZones) return;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const targetIndex = ZONE_ORDER.indexOf(zone);
    const target = children[targetIndex];
    if (!target) return;
    container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
  }, [showAllZones]);

  const handleZoneScroll = useCallback(() => {
    if (showAllZones) return;
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = zonesScrollRef.current;
      if (!container) return;
      const children = Array.from(container.children) as HTMLElement[];
      if (!children.length) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      children.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(childCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      const zone = ZONE_ORDER[closestIndex];
      if (zone && zone !== focusZone) {
        setFocusZone(zone);
      }
    });
  }, [focusZone, showAllZones]);

  const handleToggleView = useCallback(() => {
    setShowAllZones(prev => !prev);
  }, []);

  useEffect(() => {
    if (!showAllZones) {
      scrollToZone(focusZone);
    }
  }, [focusZone, scrollToZone, showAllZones]);

  const handleQuickPlace = useCallback((cardId: string) => {
    const target = getSmartTarget(zones);
    if (!target) return;
    moveCard(cardId, target);
    setFocusZone(target);
  }, [getSmartTarget, moveCard, zones]);

  const renderZoneCards = (zone: Zone, zoneCards: Card[], maxSlots?: number, size?: 'sm' | 'md') => {
    const slots = maxSlots ?? zoneCards.length;

    return (
      <div className={styles.slotRow}>
        {zoneCards.map(card => {
          const cardId = cardToString(card);
          return (
            <button
              key={cardId}
              type="button"
              className={`${styles.cardWrapper} ${draggingId === cardId ? styles.dragging : ''}`}
              draggable
              onDragStart={handleDragStart(cardId)}
              onDragEnd={handleDragEnd}
              onDoubleClick={zone === 'unassigned' ? undefined : () => moveCard(cardId, 'unassigned')}
              onClick={zone === 'unassigned' ? () => handleQuickPlace(cardId) : undefined}
            >
              <PokerCard card={card} size={size} />
            </button>
          );
        })}
        {Array.from({ length: Math.max(slots - zoneCards.length, 0) }).map((_, index) => (
          <div key={`${zone}-slot-${index}`} className={styles.emptySlot} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.board}>
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.title}>排列你的十三张牌</h2>
          <p className={styles.subtitle}>点选卡牌自动放到目标墩位，拖拽用于微调。后墩必须强于中墩，中墩强于前墩。</p>
        </div>
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            撤销一步
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleToggleView}
          >
            {showAllZones ? '单墩视图' : '显示三墩'}
          </button>
          <button
            type="button"
            className={`${styles.ghostButton} ${clearConfirm ? styles.dangerButton : ''}`}
            onClick={handleClear}
          >
            {clearConfirm ? '确认清空' : '全部清空'}
          </button>
        </div>
      </div>

      <div className={styles.focusBanner}>
        <span className={styles.focusText}>{focusMessage}</span>
        <span className={styles.focusHint}>
          {!showAllZones && <span className={styles.hintDesktop}>左右滑动或点击步骤切换墩位</span>}
          {!showAllZones && <span className={styles.hintMobile}>左右滑动切换墩位</span>}
          <span>{showAllZones ? '点击墩位可设为目标' : '点击「显示三墩」可总览全部'}</span>
          <span>点击手牌可快速放入</span>
        </span>
      </div>

      <div className={styles.stepper}>
        {ZONE_ORDER.map((zone, index) => {
          const count = zones[zone].length;
          const limit = ZONE_LIMITS[zone];
          const isDone = count === limit;
          const isActive = focusZone === zone;

          return (
            <button
              key={zone}
              type="button"
              className={`${styles.step} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}
              onClick={() => scrollToZone(zone)}
            >
              <span className={styles.stepIndex}>{index + 1}</span>
              <span className={styles.stepLabel}>{ZONE_LABELS[zone]}</span>
              <span className={styles.stepCount}>{count}/{limit}</span>
            </button>
          );
        })}
      </div>

      <div
        className={`${styles.zonesContainer} ${showAllZones ? styles.zonesAll : ''}`}
        ref={zonesScrollRef}
        onScroll={showAllZones ? undefined : handleZoneScroll}
      >
        <div
          className={`${styles.zone} ${styles.zoneBack} ${activeZone === 'back' ? styles.zoneActive : ''} ${focusZone === 'back' ? styles.zoneFocus : ''} ${middleStrongerThanBack ? styles.zoneInvalid : ''}`}
          onDragOver={allowDrop}
          onDrop={handleDrop('back')}
          onDragEnter={() => setActiveZone('back')}
          onDragLeave={() => setActiveZone(null)}
          onClick={() => setFocusZone('back')}
        >
          <div className={styles.zoneHeader}>
            <div>
              <div className={styles.zoneLabel}>后墩</div>
              <div className={styles.zoneHint}>5 张</div>
            </div>
            <span className={styles.zoneCount}>{zones.back.length}/5</span>
          </div>
          {renderZoneCards('back', zones.back, 5)}
        </div>

        <div
          className={`${styles.zone} ${styles.zoneMiddle} ${activeZone === 'middle' ? styles.zoneActive : ''} ${focusZone === 'middle' ? styles.zoneFocus : ''} ${(middleStrongerThanBack || frontStrongerThanMiddle) ? styles.zoneInvalid : ''}`}
          onDragOver={allowDrop}
          onDrop={handleDrop('middle')}
          onDragEnter={() => setActiveZone('middle')}
          onDragLeave={() => setActiveZone(null)}
          onClick={() => setFocusZone('middle')}
        >
          <div className={styles.zoneHeader}>
            <div>
              <div className={styles.zoneLabel}>中墩</div>
              <div className={styles.zoneHint}>5 张</div>
            </div>
            <span className={styles.zoneCount}>{zones.middle.length}/5</span>
          </div>
          {renderZoneCards('middle', zones.middle, 5)}
        </div>

        <div
          className={`${styles.zone} ${styles.zoneFront} ${activeZone === 'front' ? styles.zoneActive : ''} ${focusZone === 'front' ? styles.zoneFocus : ''} ${frontStrongerThanMiddle ? styles.zoneInvalid : ''}`}
          onDragOver={allowDrop}
          onDrop={handleDrop('front')}
          onDragEnter={() => setActiveZone('front')}
          onDragLeave={() => setActiveZone(null)}
          onClick={() => setFocusZone('front')}
        >
          <div className={styles.zoneHeader}>
            <div>
              <div className={styles.zoneLabel}>前墩</div>
              <div className={styles.zoneHint}>3 张</div>
            </div>
            <span className={styles.zoneCount}>{zones.front.length}/3</span>
          </div>
          {renderZoneCards('front', zones.front, 3)}
        </div>
      </div>

      <div
        className={`${styles.zone} ${styles.unassigned} ${activeZone === 'unassigned' ? styles.zoneActive : ''}`}
        onDragOver={allowDrop}
        onDrop={handleDrop('unassigned')}
        onDragEnter={() => setActiveZone('unassigned')}
        onDragLeave={() => setActiveZone(null)}
      >
        <div className={styles.zoneHeader}>
          <div>
            <div className={styles.zoneLabel}>未分配</div>
            <div className={styles.zoneHint}>剩余卡牌</div>
          </div>
          <div className={styles.unassignedControls}>
            <span className={styles.zoneCount}>{zones.unassigned.length}</span>
            <div className={styles.sortGroup}>
              <button
                type="button"
                className={`${styles.sortButton} ${sortMode === 'suit' ? styles.sortButtonActive : ''}`}
                onClick={() => setSortMode('suit')}
              >
                按花色
              </button>
              <button
                type="button"
                className={`${styles.sortButton} ${sortMode === 'rank' ? styles.sortButtonActive : ''}`}
                onClick={() => setSortMode('rank')}
              >
                按大小
              </button>
            </div>
          </div>
        </div>
        {renderZoneCards('unassigned', sortedUnassigned, undefined, 'sm')}
      </div>

      <div className={styles.statusRow}>
        {!isComplete && (
          <span className={styles.statusHint}>还需要放置 {13 - (zones.front.length + zones.middle.length + zones.back.length)} 张牌</span>
        )}
        {isComplete && !isInvalid && (
          <span className={styles.statusValid}>排列合法，准备分析</span>
        )}
        {isComplete && isInvalid && (
          <span className={styles.statusInvalid}>当前排列为相公，请调整强度顺序</span>
        )}
        {hasConstraintWarning && <span className={styles.statusWarning}>{warningMessage}</span>}
        <span className={styles.statusTip}>双击已放置牌可放回牌堆</span>
      </div>

      {showConfirm && isComplete && !isInvalid && (
        <div className={styles.confirmPanel}>
          <div className={styles.confirmHeader}>
            <span className={styles.confirmTitle}>最后确认</span>
            <span className={styles.confirmHint}>提交后将开始分析</span>
          </div>
          <ul className={styles.confirmList}>
            <li>✔ 后墩：{getFiveCardLabel(zones.back)}</li>
            <li>✔ 中墩：{getFiveCardLabel(zones.middle)}</li>
            <li>✔ 前墩：{getThreeCardLabel(zones.front)}</li>
          </ul>
          <div className={styles.confirmPrompt}>确认提交？</div>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.primaryButton} onClick={handleConfirmSubmit}>
              确认提交
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setShowConfirm(false)}>
              继续调整
            </button>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!isComplete || isInvalid}
          onClick={handleSubmit}
        >
          提交
        </button>
      </div>
    </div>
  );
}
