"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";

const CreateRoomIcon = () => (
  <svg
    aria-hidden="true"
    className="h-12 w-12 text-yellow-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="3.5" width="18" height="17" rx="3" />
    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
  </svg>
);

const JoinRoomIcon = () => (
  <svg
    aria-hidden="true"
    className="h-12 w-12 text-yellow-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="4" y="5" width="13" height="15" rx="2" />
    <rect x="7" y="3" width="13" height="15" rx="2" />
  </svg>
);

export default function MultiplayerEntryPage() {
  const router = useRouter();
  const { createRoom, joinRoom, loading, error } = useMultiplayerRoom();

  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [settings, setSettings] = useState({
    maxPlayers: 6,
    minBet: 10,
    maxBet: 500,
    turnTimeoutSeconds: 15,
    rules: {
      decks: 6,
      dealerRule: "S17" as "S17" | "H17",
      blackjackPayout: "3:2" as "3:2" | "6:5",
      doubleAnyTwoCards: true,
      doubleAfterSplit: true,
      acesSplitOneCard: true,
      lateSurrender: true,
      insuranceEnabled: true,
    },
  });

  const handleCreateRoom = async () => {
    if (!displayName.trim()) return;

    const result = await createRoom(displayName.trim(), settings);
    if (result) {
      router.push(`/blackjack/multiplayer/${result.roomCode}?playerId=${result.playerId}`);
    }
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim() || !roomCode.trim()) return;

    const result = await joinRoom(roomCode.trim().toUpperCase(), displayName.trim());
    if (result) {
      router.push(`/blackjack/multiplayer/${result.room.roomCode}?playerId=${result.playerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 flex items-center justify-center p-4">
      {/* Casino Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.3),transparent_70%)]" />
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)] mb-4">
            Multiplayer Blackjack
          </h1>
          <p className="text-yellow-100/80 text-lg">Join or create a private room</p>
        </div>

        {!mode ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room Card */}
            <button
              onClick={() => setMode("create")}
              className="group bg-gradient-to-br from-emerald-800/50 to-emerald-900/50 backdrop-blur-sm border-2 border-yellow-600/40 rounded-2xl p-8 hover:border-yellow-500/70 transition-all duration-300 cursor-pointer hover:brightness-110 hover:bg-emerald-800/60"
            >
              <div className="mb-4 flex justify-center">
                <CreateRoomIcon />
              </div>
              <h2 className="font-serif text-2xl font-bold text-yellow-100 mb-2">Create Room</h2>
              <p className="text-yellow-100/70">Host a new game with custom settings</p>
            </button>

            {/* Join Room Card */}
            <button
              onClick={() => setMode("join")}
              className="group bg-gradient-to-br from-emerald-800/50 to-emerald-900/50 backdrop-blur-sm border-2 border-yellow-600/40 rounded-2xl p-8 hover:border-yellow-500/70 transition-all duration-300 cursor-pointer hover:brightness-110 hover:bg-emerald-800/60"
            >
              <div className="mb-4 flex justify-center">
                <JoinRoomIcon />
              </div>
              <h2 className="font-serif text-2xl font-bold text-yellow-100 mb-2">Join Room</h2>
              <p className="text-yellow-100/70">Enter a room code to join friends</p>
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-800/60 to-emerald-900/60 backdrop-blur-md border-2 border-yellow-600/40 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={() => setMode(null)}
              className="text-yellow-200/60 hover:text-yellow-200 mb-6 transition-colors"
            >
              ← Back
            </button>

            <h2 className="font-serif text-3xl font-bold text-yellow-100 mb-6">
              {mode === "create" ? "Create New Room" : "Join Room"}
            </h2>

            {/* Display Name Input */}
            <div className="mb-6">
              <label className="block text-yellow-100/80 mb-2 font-semibold">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-yellow-100/30 focus:outline-none focus:border-yellow-500/60 transition-colors"
              />
            </div>

            {mode === "join" ? (
              <div className="mb-6">
                <label className="block text-yellow-100/80 mb-2 font-semibold">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="Enter 4-character code"
                  className="w-full px-4 py-3 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white placeholder-yellow-100/30 focus:outline-none focus:border-yellow-500/60 transition-colors uppercase text-center text-2xl font-mono tracking-widest"
                />
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-yellow-100/80 mb-2 text-sm">Max Players</label>
                    <select
                      value={settings.maxPlayers}
                      onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-yellow-100/80 mb-2 text-sm">Turn Timeout</label>
                    <select
                      value={settings.turnTimeoutSeconds}
                      onChange={(e) => setSettings({ ...settings, turnTimeoutSeconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value={10}>10s</option>
                      <option value={15}>15s</option>
                      <option value={20}>20s</option>
                      <option value={25}>25s</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-yellow-100/80 mb-2 text-sm">Min Bet</label>
                    <input
                      type="number"
                      value={settings.minBet}
                      onChange={(e) => setSettings({ ...settings, minBet: Number(e.target.value) })}
                      min={5}
                      step={5}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-100/80 mb-2 text-sm">Max Bet</label>
                    <input
                      type="number"
                      value={settings.maxBet}
                      onChange={(e) => setSettings({ ...settings, maxBet: Number(e.target.value) })}
                      min={settings.minBet}
                      step={50}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-yellow-600/30 my-4" />

                {/* Game Rules Section */}
                <div className="text-yellow-100/80 font-semibold mb-2">Game Rules</div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-yellow-100/60 mb-2 text-sm">Decks</label>
                    <select
                      value={settings.rules.decks}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        rules: { ...settings.rules, decks: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      {[1, 2, 4, 6, 8].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-yellow-100/60 mb-2 text-sm">Dealer Rule</label>
                    <select
                      value={settings.rules.dealerRule}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        rules: { ...settings.rules, dealerRule: e.target.value as "S17" | "H17" }
                      })}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value="S17">Stand 17 (S17)</option>
                      <option value="H17">Hit 17 (H17)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-yellow-100/60 mb-2 text-sm">BJ Payout</label>
                    <select
                      value={settings.rules.blackjackPayout}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        rules: { ...settings.rules, blackjackPayout: e.target.value as "3:2" | "6:5" }
                      })}
                      className="w-full px-3 py-2 bg-emerald-950/50 border-2 border-yellow-600/30 rounded-lg text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value="3:2">3:2</option>
                      <option value="6:5">6:5</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-yellow-100/60 text-sm">Double After Split</label>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        rules: { ...settings.rules, doubleAfterSplit: !settings.rules.doubleAfterSplit }
                      })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        settings.rules.doubleAfterSplit
                          ? "bg-green-600/40 text-green-300 border border-green-500/50"
                          : "bg-gray-600/30 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {settings.rules.doubleAfterSplit ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-yellow-100/60 text-sm">Late Surrender</label>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        rules: { ...settings.rules, lateSurrender: !settings.rules.lateSurrender }
                      })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        settings.rules.lateSurrender
                          ? "bg-green-600/40 text-green-300 border border-green-500/50"
                          : "bg-gray-600/30 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {settings.rules.lateSurrender ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-yellow-100/60 text-sm">Aces Split One Card</label>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        rules: { ...settings.rules, acesSplitOneCard: !settings.rules.acesSplitOneCard }
                      })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        settings.rules.acesSplitOneCard
                          ? "bg-green-600/40 text-green-300 border border-green-500/50"
                          : "bg-gray-600/30 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {settings.rules.acesSplitOneCard ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={mode === "create" ? handleCreateRoom : handleJoinRoom}
              disabled={loading || !displayName.trim() || (mode === "join" && !roomCode.trim())}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
            >
              {loading ? "Loading..." : mode === "create" ? "Create Room" : "Join Room"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
