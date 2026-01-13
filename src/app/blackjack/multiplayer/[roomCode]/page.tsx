"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { RoomPlayer } from "@/types/multiplayer";
import { PlayingCard } from "@/components/multiplayer/PlayingCard";
import { CasinoChip } from "@/components/multiplayer/CasinoChip";
import { TurnTimer } from "@/components/multiplayer/TurnTimer";
import { GameButton } from "@/components/multiplayer/GameButton";
import { loadMultiplayerSession } from "@/utils/multiplayerSession";

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

const SEAT_COUNT = 6;

export default function RoomPage({ params }: PageProps) {
  const { roomCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchPlayerId = searchParams.get("playerId") || "";

  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [betAmount, setBetAmount] = useState<number>(0);
  const reconnectAttemptedRef = useRef(false);

  const resolvedPlayerId = useMemo(() => {
    if (searchPlayerId) {
      return searchPlayerId;
    }

    if (typeof window === "undefined") {
      return "";
    }

    const stored = loadMultiplayerSession();
    if (stored?.roomCode === roomCode && stored.playerId) {
      return stored.playerId;
    }

    return "";
  }, [searchPlayerId, roomCode]);

  const {
    room,
    loading: roomLoading,
    fetchRoom,
    leaveRoom,
    changeSeat,
    reconnectRoom,
    isConnected,
  } = useMultiplayerRoom({
    roomCode,
    playerId: resolvedPlayerId,
    autoConnect: !!resolvedPlayerId,
  });

  const {
    gameState,
    loading: gameLoading,
    isMyTurn,
    turnTimeRemaining,
    startGame,
    placeBet,
    skipRound,
    executeAction,
    endSession,
  } = useMultiplayerGame({
    roomCode,
    playerId: resolvedPlayerId,
    autoConnect: !!resolvedPlayerId,
  });

  useEffect(() => {
    if (!searchPlayerId && resolvedPlayerId && !reconnectAttemptedRef.current) {
      reconnectAttemptedRef.current = true;
      reconnectRoom(roomCode, resolvedPlayerId);
    }
  }, [searchPlayerId, resolvedPlayerId, reconnectRoom, roomCode]);

  useEffect(() => {
    if (roomCode) {
      fetchRoom(roomCode);
    }
  }, [roomCode, fetchRoom]);

  const handleStartGame = async () => {
    await startGame();
  };

  const handlePlaceBet = async () => {
    if (betAmount >= (room?.settings.minBet || 10)) {
      await placeBet(betAmount);
      setBetAmount(0);
    }
  };

  const handleAddToBet = (chipValue: number) => {
    setSelectedChip(chipValue);
    setBetAmount((prev) => prev + chipValue);
  };

  const handleLeaveRoom = async () => {
    if (!resolvedPlayerId) {
      router.push("/blackjack/multiplayer");
      return;
    }
    await leaveRoom(roomCode, resolvedPlayerId);
    router.push("/blackjack/multiplayer");
  };

  const handleEndSession = async () => {
    await endSession();
    router.push(`/blackjack/multiplayer/${roomCode}/review?playerId=${resolvedPlayerId}`);
  };

  const seatMap = useMemo(() => {
    const map = new Map<number, RoomPlayer>();
    if (!room) return map;
    Object.values(room.players).forEach((player) => {
      map.set(player.seatNumber, player);
    });
    return map;
  }, [room]);

  if (roomLoading || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-amber-100 text-xl font-serif">Loading table...</div>
      </div>
    );
  }

  const playerId = resolvedPlayerId;
  const isHost = room.hostPlayerId === playerId;
  const myPlayer = room.players[playerId];
  const myHands = gameState?.playerHandsMap?.[playerId] || [];
  const activeHandIndex = gameState?.currentHandIndex || 0;
  const myHand = myHands[activeHandIndex];
  const currentPlayer = gameState?.currentPlayerId
    ? room.players[gameState.currentPlayerId]
    : null;
  const isResultsPhase = gameState?.phase === "results";
  const isBettingPhase = gameState?.phase === "betting";
  const isPlayerTurnPhase = gameState?.phase === "playerTurn";
  const hasPlacedBet = isBettingPhase && gameState?.bets?.[playerId] !== undefined;
  const hasSkipped = isBettingPhase && gameState?.skippedPlayers?.[playerId] === true;
  const myRoundResults = isResultsPhase ? gameState?.roundResults?.[playerId] : undefined;
  // Use previous round data when in results phase to show what happened
  const previousRoundHands = isResultsPhase ? (gameState?.previousRound?.playerHandsMap?.[playerId] || myHands) : myHands;
  const displayHand = previousRoundHands[activeHandIndex] || myHand;

  const renderOtherSeat = (seatNumber: number) => {
    const player = seatMap.get(seatNumber) || null;
    const isSeatLocked = seatNumber > room.settings.maxPlayers;
    const isCurrentPlayer = player?.playerId === playerId;
    const isCurrentTurn = player?.playerId === gameState?.currentPlayerId;
    const isDisconnected =
      player?.status === "disconnected" || player?.connectionState === "disconnected";
    const seatHands = player ? gameState?.playerHandsMap?.[player.playerId] || [] : [];
    const playerBet = player ? gameState?.bets?.[player.playerId] : undefined;

    if (isCurrentPlayer) return null;

    return (
      <div
        key={seatNumber}
        className={`relative transition-all duration-500 ${
          isSeatLocked
            ? "opacity-20"
            : player
              ? "opacity-100"
              : "opacity-40 hover:opacity-60 cursor-pointer"
        }`}
      >
        <div
          className={`backdrop-blur-sm rounded-xl border p-3 min-h-[120px] transition-all duration-300 ${
            isSeatLocked
              ? "border-emerald-900/30 bg-emerald-950/10"
              : player
                ? isCurrentTurn
                  ? "border-amber-400/60 bg-emerald-800/40 shadow-[0_0_25px_rgba(251,191,36,0.4)]"
                  : isDisconnected
                    ? "border-red-500/40 bg-emerald-900/20 grayscale"
                    : "border-amber-600/30 bg-emerald-900/30"
                : "border-amber-700/20 bg-emerald-950/20"
          }`}
          onClick={() => {
            if (!player && !isSeatLocked && myPlayer && room.state === "lobby") {
              changeSeat(seatNumber);
            }
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-amber-200/40 text-xs uppercase tracking-wider">
              Seat {seatNumber}
            </div>
            {isCurrentTurn && (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </div>

          {player ? (
            <div className="space-y-2">
              <div>
                <div className="text-amber-100 font-medium text-sm truncate">
                  {player.displayName}
                </div>
                <div className="text-amber-200/50 text-xs">${player.bankroll}</div>
              </div>

              {seatHands.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {seatHands[0].cards.slice(0, 3).map((card, idx) => (
                    <PlayingCard
                      key={idx}
                      card={card}
                      className="w-8 h-12"
                    />
                  ))}
                  {seatHands[0].cards.length > 3 && (
                    <div className="w-8 h-12 bg-emerald-900/50 rounded flex items-center justify-center text-amber-200/50 text-xs">
                      +{seatHands[0].cards.length - 3}
                    </div>
                  )}
                </div>
              )}

              {playerBet !== undefined && (
                <div className="text-amber-300 text-xs font-semibold">Bet: ${playerBet}</div>
              )}

              {isDisconnected && (
                <div className="text-red-400 text-xs">Disconnected</div>
              )}
            </div>
          ) : (
            <div className="text-center text-amber-200/30 text-xs mt-4">
              {isSeatLocked ? "Closed" : "Empty"}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!gameState || room.state === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-serif text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 mb-2">
                Room {roomCode}
              </h1>
              <div className="flex items-center gap-3 text-amber-100/60 text-sm">
                <span>{Object.keys(room.players).length} players</span>
                <span className="h-1 w-1 rounded-full bg-amber-200/40" />
                <span>{isConnected ? "Connected" : "Connecting..."}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <GameButton
                onClick={async () => {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(roomCode);
                  }
                }}
                variant="secondary"
              >
                Copy Code
              </GameButton>
              <GameButton onClick={handleLeaveRoom} variant="danger">
                Leave
              </GameButton>
            </div>
          </div>

          <div className="bg-emerald-900/30 backdrop-blur-sm border-2 border-amber-600/20 rounded-2xl p-6 mb-8">
            <h2 className="font-serif text-xl font-bold text-amber-100 mb-4">Table Rules</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-amber-100/70 text-sm">
              <div>
                <div className="text-amber-100/50">Max Players</div>
                <div className="font-semibold text-amber-200">{room.settings.maxPlayers}</div>
              </div>
              <div>
                <div className="text-amber-100/50">Buy In</div>
                <div className="font-semibold text-amber-200">${room.settings.buyIn}</div>
              </div>
              <div>
                <div className="text-amber-100/50">Min Bet</div>
                <div className="font-semibold text-amber-200">${room.settings.minBet}</div>
              </div>
              <div>
                <div className="text-amber-100/50">Max Bet</div>
                <div className="font-semibold text-amber-200">${room.settings.maxBet}</div>
              </div>
              <div>
                <div className="text-amber-100/50">Decision Time</div>
                <div className="font-semibold text-amber-200">{room.settings.turnTimeoutSeconds}s</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: SEAT_COUNT }, (_, i) => {
              const seatNumber = i + 1;
              const player = seatMap.get(seatNumber) || null;
              const isSeatLocked = seatNumber > room.settings.maxPlayers;
              const isCurrentPlayer = player?.playerId === playerId;

              return (
                <div
                  key={seatNumber}
                  className={`rounded-2xl border-2 p-6 min-h-[180px] flex flex-col justify-between transition-all duration-300 ${
                    isSeatLocked
                      ? "border-emerald-900/30 bg-emerald-950/10 opacity-40"
                      : player
                        ? isCurrentPlayer
                          ? "border-amber-500/60 bg-emerald-800/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                          : "border-amber-600/40 bg-emerald-900/30"
                        : "border-amber-700/25 bg-emerald-950/20 hover:border-amber-500/40 hover:bg-emerald-900/25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!player && !isSeatLocked && myPlayer) {
                      changeSeat(seatNumber);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-amber-200/50 text-sm font-serif">Seat {seatNumber}</div>
                    {isSeatLocked && (
                      <span className="text-xs uppercase tracking-wide text-amber-100/30">
                        Closed
                      </span>
                    )}
                  </div>

                  {player ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-amber-100 font-semibold text-lg">
                          {player.displayName}
                        </div>
                        <div className="text-amber-200/60 text-sm">${player.bankroll}</div>
                      </div>

                      {isCurrentPlayer && (
                        <div className="inline-flex px-3 py-1.5 bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/50 rounded-full">
                          <span className="text-amber-200 text-xs font-bold uppercase tracking-wide">
                            You
                          </span>
                        </div>
                      )}
                      {player.playerId === room.hostPlayerId && (
                        <div className="inline-flex px-3 py-1.5 bg-gradient-to-r from-amber-600/40 to-yellow-500/40 border border-amber-400/60 rounded-full ml-2">
                          <span className="text-amber-100 text-xs font-bold uppercase tracking-wide">
                            Host
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 text-center">
                      {!isSeatLocked && myPlayer && (
                        <div className="text-amber-200/40 text-sm font-medium">Click to sit</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isHost ? (
            <div className="flex justify-center">
              <GameButton
                onClick={handleStartGame}
                disabled={Object.keys(room.players).length === 0 || gameLoading}
                variant="warning"
                className="px-12 py-4 text-lg font-serif"
              >
                {gameLoading ? "Starting..." : "Deal Cards"}
              </GameButton>
            </div>
          ) : (
            <div className="text-center text-amber-100/50 font-serif">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Casino Table Background with Green Felt Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-emerald-800/20 to-transparent" />
      </div>

      {/* Table Surface with Perspective */}
      <div className="relative min-h-screen flex flex-col">
        {/* Dealer Area - Top */}
        <div className="relative pt-8 pb-6">
          {/* Dealer Rules Text */}
          <div className="text-center mb-4">
            <div className="inline-block px-6 py-2 border-2 border-amber-700/40 rounded-full bg-emerald-900/40 backdrop-blur-sm">
              <p className="text-amber-300/70 text-xs uppercase tracking-widest font-serif">
                Dealer must draw to 16 and stand on all 17s • Blackjack pays 3:2
              </p>
            </div>
          </div>

          {/* Dealer Hand */}
          <div className="text-center">
            <div className="text-amber-200/60 text-sm mb-3 uppercase tracking-widest font-serif">
              Dealer
            </div>
            <div className="flex justify-center gap-3 mb-3">
              {gameState.dealerHand.cards.map((card, i) => (
                <PlayingCard
                  key={i}
                  card={card}
                  faceDown={
                    i === 1 &&
                    gameState.phase === "playerTurn" &&
                    !gameState.dealerHoleCardRevealed
                  }
                  animateIn
                  dealIndex={i}
                  isBlackjack={
                    gameState.dealerHand.total === 21 && gameState.dealerHand.cards.length === 2
                  }
                  isBust={gameState.dealerHand.total > 21}
                  className="w-20 h-28 shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
                />
              ))}
            </div>
            <div className="text-amber-100 font-bold text-lg">
              {gameState.phase === "playerTurn" && !gameState.dealerHoleCardRevealed
                ? `Showing: ${gameState.dealerHand.cards[0].rank}`
                : `Total: ${gameState.dealerHand.total}`}
            </div>
            {gameState.dealerHand.total > 21 && (
              <div className="text-red-400 font-bold text-xl mt-2 motion-safe:animate-pulse">
                BUST!
              </div>
            )}
            {gameState.dealerHand.total === 21 && gameState.dealerHand.cards.length === 2 && (
              <div className="text-amber-400 font-bold text-xl mt-2 motion-safe:animate-pulse">
                BLACKJACK!
              </div>
            )}
          </div>

          {/* Round Info */}
          <div className="absolute top-8 left-8 bg-emerald-900/60 backdrop-blur-md border border-amber-600/30 rounded-xl px-4 py-2">
            <div className="text-amber-200/60 text-xs mb-1">Round</div>
            <div className="text-amber-100 font-bold text-2xl font-serif">
              {gameState.roundNumber}
            </div>
          </div>

          {/* Card Count */}
          <div className="absolute top-8 right-8 bg-emerald-900/60 backdrop-blur-md border border-amber-600/30 rounded-xl px-4 py-2">
            <div className="flex gap-4 text-sm">
              <div>
                <div className="text-amber-200/60 text-xs">Running</div>
                <div className="text-amber-100 font-bold">{gameState.runningCount}</div>
              </div>
              <div>
                <div className="text-amber-200/60 text-xs">True</div>
                <div className="text-amber-100 font-bold">{gameState.trueCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Playing Area */}
        <div className="flex-1 px-8 pb-8 flex items-center">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-[1fr_2fr_1fr] gap-8 items-start">
            {/* Left Side Seats (1-3) */}
            <div className="space-y-4">
              {[1, 2, 3].map((seatNum) => renderOtherSeat(seatNum))}
            </div>

            {/* Center - Player's Main Hand (Visual Focus) */}
            <div className="space-y-6">
              {/* Current Turn Indicator */}
              {currentPlayer && isPlayerTurnPhase && (
                <div className="text-center bg-emerald-900/50 backdrop-blur-md border-2 border-amber-500/40 rounded-2xl px-6 py-4">
                  <div className="text-amber-200/70 text-sm mb-2 uppercase tracking-widest">
                    Current Turn
                  </div>
                  <div className="text-amber-100 font-bold text-lg font-serif">
                    {isMyTurn ? "Your Turn" : currentPlayer.displayName}
                  </div>
                  {isMyTurn && turnTimeRemaining !== null && (
                    <div className="mt-3">
                      <TurnTimer
                        timeRemaining={turnTimeRemaining}
                        maxTime={room.settings.turnTimeoutSeconds}
                        isActive={isMyTurn}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Player's Hands - Show all hands for split, during playerTurn AND results phase */}
              {(isPlayerTurnPhase || isResultsPhase) && (previousRoundHands.length > 0 || myHands.length > 0) && (
                <div className="flex flex-wrap justify-center gap-4">
                  {(isResultsPhase ? previousRoundHands : myHands).map((hand, handIndex) => {
                    const isActiveHand = isPlayerTurnPhase && handIndex === activeHandIndex && isMyTurn;
                    const handResult = isResultsPhase && myRoundResults ? myRoundResults[handIndex] : null;
                    
                    return (
                      <div
                        key={handIndex}
                        className={`relative bg-gradient-to-b from-emerald-800/60 to-emerald-900/60 backdrop-blur-lg border-4 rounded-3xl p-6 transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
                          hand.total > 21
                            ? "border-red-500/70 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
                            : hand.total === 21 && hand.cards.length === 2
                              ? "border-amber-500/80 shadow-[0_0_50px_rgba(251,191,36,0.6)]"
                              : isActiveHand
                                ? "border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                                : "border-amber-600/50 opacity-80"
                        }`}
                      >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-400/10 to-transparent pointer-events-none" />

                        <div className="relative text-center">
                          <div className="text-amber-200/70 text-sm mb-3 uppercase tracking-[0.2em] font-serif">
                            {(isResultsPhase ? previousRoundHands : myHands).length > 1
                              ? `Hand ${handIndex + 1}`
                              : "You"}
                            {isActiveHand && (
                              <span className="ml-2 text-amber-400">• Active</span>
                            )}
                          </div>
                          <div className="flex justify-center gap-3 mb-3">
                            {hand.cards.map((card, i) => (
                              <PlayingCard
                                key={i}
                                card={card}
                                dealIndex={i}
                                isBlackjack={hand.total === 21 && hand.cards.length === 2}
                                isBust={hand.total > 21}
                                className="w-20 h-28 shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                              />
                            ))}
                          </div>
                          <div className="text-amber-100 font-bold text-2xl font-serif mb-1">
                            {hand.total}
                          </div>
                          {hand.total > 21 && (
                            <div className="text-red-400 font-bold text-lg mt-1">BUST!</div>
                          )}
                          {hand.total === 21 && hand.cards.length === 2 && (
                            <div className="text-amber-400 font-bold text-lg mt-1">BLACKJACK!</div>
                          )}
                          {/* Show result badge in results phase */}
                          {handResult && (
                            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                              handResult === "win" || handResult === "blackjack"
                                ? "bg-green-500/40 text-green-300 border-2 border-green-400/60"
                                : handResult === "push"
                                  ? "bg-amber-500/40 text-amber-300 border-2 border-amber-400/60"
                                  : handResult === "surrender"
                                    ? "bg-gray-500/40 text-gray-300 border-2 border-gray-400/60"
                                    : "bg-red-500/40 text-red-300 border-2 border-red-400/60"
                            }`}>
                              {handResult === "blackjack" ? "BLACKJACK!" : handResult.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Betting Area for Betting Phase */}
              {isBettingPhase && myPlayer && (
                <div className="bg-gradient-to-b from-emerald-800/70 to-emerald-900/70 backdrop-blur-lg border-3 border-amber-600/40 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className="text-center mb-6">
                    <div className="text-amber-400 font-bold text-2xl font-serif mb-3">
                      {hasSkipped ? "Currently Sitting Out" : "Place Your Bet"}
                    </div>
                    {hasSkipped && (
                      <div className="text-amber-200/60 text-sm">
                        Place a bet below to re-enter this round
                      </div>
                    )}
                  </div>

                  {!hasPlacedBet && (
                    <>
                      <div className="text-center mb-6">
                        <div className="text-amber-200/60 text-sm mb-4">
                          ${room.settings.minBet} - ${room.settings.maxBet}
                        </div>
                        <div className="text-5xl font-bold text-amber-400 font-serif">
                          ${betAmount}
                        </div>
                      </div>

                      <div className="flex justify-center gap-4 mb-6">
                        {[5, 10, 25, 50, 100, 500].map((value) => (
                          <CasinoChip
                            key={value}
                            value={value}
                            onClick={() => handleAddToBet(value)}
                            selected={selectedChip === value}
                            className="w-16 h-16"
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <GameButton
                          onClick={() => setBetAmount(0)}
                          variant="danger"
                          className="flex-1"
                        >
                          Clear
                        </GameButton>
                        <GameButton
                          onClick={handlePlaceBet}
                          disabled={
                            betAmount < room.settings.minBet ||
                            betAmount > room.settings.maxBet ||
                            betAmount > myPlayer.bankroll
                          }
                          variant="warning"
                          className="flex-[2] text-lg font-serif"
                        >
                          {betAmount >= room.settings.minBet &&
                          betAmount <= room.settings.maxBet &&
                          betAmount <= myPlayer.bankroll
                            ? hasSkipped ? "Re-enter Round" : "Bet"
                            : betAmount < room.settings.minBet
                              ? `Min $${room.settings.minBet}`
                              : betAmount > myPlayer.bankroll
                                ? "Insufficient"
                                : `Max $${room.settings.maxBet}`}
                        </GameButton>
                      </div>

                      {!hasSkipped && (
                        <GameButton
                          onClick={skipRound}
                          disabled={gameLoading}
                          variant="secondary"
                          className="w-full mt-3 text-sm"
                        >
                          Skip Round
                        </GameButton>
                      )}
                    </>
                  )}

                  {hasPlacedBet && (
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-xl mb-2 font-serif">
                        Bet Placed
                      </div>
                      <div className="text-amber-400 font-bold text-3xl">
                        ${gameState?.bets?.[playerId]}
                      </div>
                      <div className="text-amber-200/60 mt-2">Waiting for players...</div>
                    </div>
                  )}
                </div>
              )}

              {/* Results Phase - Continue to Next Round */}
              {isResultsPhase && myPlayer && (
                <div className="bg-gradient-to-b from-emerald-800/70 to-emerald-900/70 backdrop-blur-lg border-3 border-amber-600/40 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className="text-center mb-6">
                    <div className="text-amber-400 font-bold text-2xl font-serif mb-3">
                      Round Complete
                    </div>
                    <div className="text-amber-200/60 text-sm">
                      Place a bet to start the next round
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-amber-200/60 text-sm mb-4">
                      ${room.settings.minBet} - ${room.settings.maxBet}
                    </div>
                    <div className="text-5xl font-bold text-amber-400 font-serif">
                      ${betAmount}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 mb-6">
                    {[5, 10, 25, 50, 100, 500].map((value) => (
                      <CasinoChip
                        key={value}
                        value={value}
                        onClick={() => handleAddToBet(value)}
                        selected={selectedChip === value}
                        className="w-16 h-16"
                      />
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <GameButton
                      onClick={() => setBetAmount(0)}
                      variant="danger"
                      className="flex-1"
                    >
                      Clear
                    </GameButton>
                    <GameButton
                      onClick={handlePlaceBet}
                      disabled={
                        betAmount < room.settings.minBet ||
                        betAmount > room.settings.maxBet ||
                        betAmount > myPlayer.bankroll
                      }
                      variant="warning"
                      className="flex-[2] text-lg font-serif"
                    >
                      {betAmount >= room.settings.minBet &&
                      betAmount <= room.settings.maxBet &&
                      betAmount <= myPlayer.bankroll
                        ? "Next Round"
                        : betAmount < room.settings.minBet
                          ? `Min $${room.settings.minBet}`
                          : betAmount > myPlayer.bankroll
                            ? "Insufficient"
                            : `Max $${room.settings.maxBet}`}
                    </GameButton>
                  </div>

                  <GameButton
                    onClick={skipRound}
                    disabled={gameLoading}
                    variant="secondary"
                    className="w-full mt-3 text-sm"
                  >
                    Skip Round
                  </GameButton>
                </div>
              )}
            </div>

            {/* Right Side Seats (4-6) */}
            <div className="space-y-4">
              {[4, 5, 6].map((seatNum) => renderOtherSeat(seatNum))}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="relative pb-8 px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-emerald-900/60 via-emerald-800/60 to-emerald-900/60 backdrop-blur-lg border-2 border-amber-600/30 rounded-2xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
              {/* Player Actions */}
              {isMyTurn && myHand && myHand.total <= 21 && gameState.phase === "playerTurn" && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => executeAction("hit")}
                    disabled={gameLoading}
                    className="group relative w-20 h-20 rounded-full bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-3 border-green-400/50 shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_30px_rgba(34,197,94,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                    <span className="relative text-white font-bold text-sm uppercase tracking-wide">
                      Hit
                    </span>
                  </button>

                  <button
                    onClick={() => executeAction("stand")}
                    disabled={gameLoading}
                    className="group relative w-20 h-20 rounded-full bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-3 border-red-400/50 shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_6px_30px_rgba(239,68,68,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                    <span className="relative text-white font-bold text-sm uppercase tracking-wide">
                      Stand
                    </span>
                  </button>

                  {myHand.cards.length === 2 && (
                    <>
                      <button
                        onClick={() => executeAction("double")}
                        disabled={
                          gameLoading ||
                          (myPlayer && myPlayer.bankroll < (gameState?.bets?.[playerId] || 0))
                        }
                        className="group relative w-20 h-20 rounded-full bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-3 border-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_30px_rgba(251,191,36,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                        <span className="relative text-white font-bold text-xs uppercase tracking-wide">
                          Double
                        </span>
                      </button>

                      {myHand.isPair && (
                        <button
                          onClick={() => executeAction("split")}
                          disabled={
                            gameLoading ||
                            (myPlayer && myPlayer.bankroll < (gameState?.bets?.[playerId] || 0))
                          }
                          className="group relative w-20 h-20 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-3 border-blue-400/50 shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                          <span className="relative text-white font-bold text-sm uppercase tracking-wide">
                            Split
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => executeAction("surrender")}
                        disabled={gameLoading}
                        className="group relative w-20 h-20 rounded-full bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-3 border-gray-400/50 shadow-[0_4px_20px_rgba(107,114,128,0.4)] hover:shadow-[0_6px_30px_rgba(107,114,128,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                        <span className="relative text-white font-bold text-xs uppercase tracking-wide">
                          Surrender
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bankroll and Exit */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-amber-600/20">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-amber-200/60 text-xs uppercase tracking-wider">
                      Bankroll
                    </div>
                    <div className="text-amber-400 font-bold text-2xl font-serif">
                      ${myPlayer?.bankroll || 0}
                    </div>
                  </div>
                  {gameState?.bets?.[playerId] && (
                    <div>
                      <div className="text-amber-200/60 text-xs uppercase tracking-wider">
                        Current Bet
                      </div>
                      <div className="text-amber-300 font-bold text-xl font-serif">
                        ${gameState.bets[playerId]}
                      </div>
                    </div>
                  )}
                </div>

                {isHost && (
                  <GameButton onClick={handleEndSession} variant="danger">
                    End Session
                  </GameButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
