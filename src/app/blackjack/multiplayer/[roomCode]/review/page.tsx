"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { SessionHistory } from "@/types/multiplayer";
import { PlayingCard } from "@/components/multiplayer/PlayingCard";
import { calculateTotal } from "@/utils/hand";

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

interface PlayerStats {
  playerId: string;
  displayName: string;
  totalHands: number;
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number;
  initialBankroll: number;
  finalBankroll: number;
  netResult: number;
}

export default function ReviewPage({ params }: PageProps) {
  const { roomCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get("playerId") || "";

  const [history, setHistory] = useState<SessionHistory | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[] | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const { fetchHistory } = useMultiplayerGame({ roomCode, playerId, autoConnect: false });

  useEffect(() => {
    const loadHistory = async () => {
      const result = await fetchHistory();
      if (result) {
        setHistory(result.history);
        setPlayerStats(result.playerStats);
      }
    };
    loadHistory();
  }, [fetchHistory]);

  if (!history || !playerStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 flex items-center justify-center">
        <div className="text-yellow-100 text-xl">Loading session review...</div>
      </div>
    );
  }

  const myStats = playerStats.find((p) => p.playerId === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 mb-4">
            Session Review
          </h1>
          <p className="text-yellow-100/60">Room {roomCode}</p>
          <button
            onClick={() => router.push("/blackjack/multiplayer")}
            className="mt-4 px-6 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/40 text-yellow-200 rounded-lg transition-colors cursor-pointer"
          >
            Back to Lobby
          </button>
        </div>

        {/* Your Performance */}
        {myStats && (
          <div className="bg-gradient-to-br from-emerald-800/60 to-emerald-900/60 backdrop-blur-md border-2 border-yellow-600/40 rounded-2xl p-8 mb-8">
            <h2 className="font-serif text-3xl font-bold text-yellow-100 mb-6">Your Performance</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-emerald-950/50 rounded-xl p-6 border border-yellow-600/20">
                <div className="text-yellow-100/60 text-sm mb-2">Net Result</div>
                <div className={`text-4xl font-bold ${myStats.netResult >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {myStats.netResult >= 0 ? "+" : ""}${myStats.netResult}
                </div>
                <div className="text-yellow-100/40 text-sm mt-2">
                  ${myStats.initialBankroll} → ${myStats.finalBankroll}
                </div>
              </div>

              <div className="bg-emerald-950/50 rounded-xl p-6 border border-yellow-600/20">
                <div className="text-yellow-100/60 text-sm mb-2">Decision Accuracy</div>
                <div className="text-4xl font-bold text-yellow-400">
                  {(myStats.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-yellow-100/40 text-sm mt-2">
                  {myStats.correctDecisions}/{myStats.totalDecisions} correct
                </div>
              </div>

              <div className="bg-emerald-950/50 rounded-xl p-6 border border-yellow-600/20">
                <div className="text-yellow-100/60 text-sm mb-2">Hands Played</div>
                <div className="text-4xl font-bold text-yellow-100">{myStats.totalHands}</div>
              </div>

              <div className="bg-emerald-950/50 rounded-xl p-6 border border-yellow-600/20">
                <div className="text-yellow-100/60 text-sm mb-2">Rounds</div>
                <div className="text-4xl font-bold text-yellow-100">{history.rounds.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* All Players Stats */}
        <div className="bg-gradient-to-br from-emerald-800/60 to-emerald-900/60 backdrop-blur-md border-2 border-yellow-600/40 rounded-2xl p-8 mb-8">
          <h2 className="font-serif text-3xl font-bold text-yellow-100 mb-6">Leaderboard</h2>
          <div className="space-y-3">
            {[...playerStats]
              .sort((a, b) => b.netResult - a.netResult)
              .map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    player.playerId === playerId
                      ? "bg-yellow-600/20 border-2 border-yellow-600/40"
                      : "bg-emerald-950/50 border border-yellow-600/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${index === 0 ? "text-yellow-400" : "text-yellow-100/40"}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="text-yellow-100 font-semibold">{player.displayName}</div>
                      <div className="text-yellow-100/60 text-sm">
                        {player.correctDecisions}/{player.totalDecisions} correct ({(player.accuracy * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${player.netResult >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {player.netResult >= 0 ? "+" : ""}${player.netResult}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Round History */}
        <div className="bg-gradient-to-br from-emerald-800/60 to-emerald-900/60 backdrop-blur-md border-2 border-yellow-600/40 rounded-2xl p-8">
          <h2 className="font-serif text-3xl font-bold text-yellow-100 mb-6">Round History</h2>
          <div className="space-y-4">
            {history.rounds.map((round, index) => {
              const myActions = round.playerActions.find((pa) => pa.playerId === playerId);
              if (!myActions) return null;

              const isExpanded = selectedRound === index;

              return (
                <div key={index} className="bg-emerald-950/50 rounded-xl border border-yellow-600/20 overflow-hidden">
                  <button
                    onClick={() => setSelectedRound(isExpanded ? null : index)}
                    className="w-full p-4 flex items-center justify-between hover:bg-emerald-900/30 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-yellow-100 font-semibold">Round {index + 1}</div>
                      <div className="text-yellow-100/60 text-sm">
                        Bet: ${myActions.bet} | Result: {myActions.netResult >= 0 ? "+" : ""}${myActions.netResult}
                      </div>
                    </div>
                    <div className="text-yellow-100/40">
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-6 border-t border-yellow-600/20 space-y-6">
                      {/* Dealer Hand */}
                      <div>
                        <div className="text-yellow-100/60 text-sm mb-2">Dealer Hand</div>
                        <div className="flex gap-2">
                          {round.dealerHand.cards.map((card, i) => (
                            <PlayingCard key={i} card={card} />
                          ))}
                        </div>
                        <div className="text-yellow-100/60 text-sm mt-2">
                          Total: {round.dealerHand.total}
                        </div>
                      </div>

                      {/* Player Hands */}
                      {myActions.hands.map((hand, handIndex) => (
                        <div key={handIndex} className="bg-emerald-900/30 rounded-lg p-4">
                          <div className="text-yellow-100/60 text-sm mb-2">
                            {myActions.hands.length > 1 ? `Hand ${handIndex + 1}` : "Your Hand"}
                          </div>
                          <div className="flex gap-2 mb-4">
                            {hand.cards.map((card, i) => (
                              <PlayingCard key={i} card={card} />
                            ))}
                          </div>
                          <div className="text-yellow-100/60 text-sm mb-3">
                            Total: {calculateTotal(hand.cards).total} | Result: {hand.result}
                          </div>

                          {/* Decisions */}
                          {hand.decisions.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-yellow-100/60 text-sm font-semibold">Decisions:</div>
                              {hand.decisions.map((decision, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center justify-between p-3 rounded ${
                                    decision.isCorrect
                                      ? "bg-green-500/20 border border-green-500/40"
                                      : "bg-red-500/20 border border-red-500/40"
                                  }`}
                                >
                                  <div>
                                    <div className="text-yellow-100 font-semibold">
                                      {decision.action.toUpperCase()}
                                    </div>
                                    {!decision.isCorrect && (
                                      <div className="text-yellow-100/60 text-sm">
                                        Recommended: {decision.recommendedAction.toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className={decision.isCorrect ? "text-green-400" : "text-red-400"}>
                                    {decision.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
