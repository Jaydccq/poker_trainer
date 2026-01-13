import { useState, useCallback, useEffect, useRef } from "react";
import { MultiplayerGameState, SessionHistory } from "@/types/multiplayer";
import { Action } from "@/types";
import { usePolling } from "./usePolling";

interface UseMultiplayerGameOptions {
  roomCode: string;
  playerId: string;
  onGameStateUpdate?: (gameState: MultiplayerGameState) => void;
  onTurnTimeout?: () => void;
  autoConnect?: boolean;
  /** Polling interval in milliseconds (default: 1000ms for faster game updates) */
  pollingInterval?: number;
}

export function useMultiplayerGame({
  roomCode,
  playerId,
  onGameStateUpdate,
  onTurnTimeout,
  autoConnect = true,
  pollingInterval = 1000,
}: UseMultiplayerGameOptions) {
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [history, setHistory] = useState<SessionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(null);

  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutWarnedRef = useRef(false);
  const lastGameStateRef = useRef<string>("");
  const autoStandingRef = useRef(false);
  const onGameStateUpdateRef = useRef(onGameStateUpdate);
  const onTurnTimeoutRef = useRef(onTurnTimeout);

  // Keep refs updated
  useEffect(() => {
    onGameStateUpdateRef.current = onGameStateUpdate;
    onTurnTimeoutRef.current = onTurnTimeout;
  }, [onGameStateUpdate, onTurnTimeout]);

  // Handle polled data
  const handlePolledData = useCallback((data: { room: { gameState?: MultiplayerGameState } }) => {
    const newGameState = data.room?.gameState;
    
    if (!newGameState) {
      if (gameState) {
        setGameState(null);
      }
      return;
    }

    // Compare serialized states to avoid unnecessary updates
    const serialized = JSON.stringify(newGameState);
    if (serialized !== lastGameStateRef.current) {
      lastGameStateRef.current = serialized;
      setGameState(newGameState);
      
      if (onGameStateUpdateRef.current) {
        onGameStateUpdateRef.current(newGameState);
      }
    }
  }, [gameState]);

  // Set up polling for game state
  const { poll } = usePolling<{ room: { gameState?: MultiplayerGameState } }>({
    url: roomCode ? `/api/rooms/${roomCode}` : "",
    interval: pollingInterval,
    enabled: autoConnect && !!roomCode && !!playerId,
    onData: handlePolledData,
    onError: (err) => {
      console.error("Game polling error:", err);
    },
  });

  // Turn timer - calculate locally based on turnTimeoutAt from server
  useEffect(() => {
    if (!gameState || gameState.currentPlayerId !== playerId) {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      setTurnTimeRemaining(null);
      timeoutWarnedRef.current = false;
      autoStandingRef.current = false;
      return;
    }

    // Calculate time remaining from server's turnTimeoutAt
    const endTime = gameState.turnTimeoutAt || (Date.now() + 15 * 1000);
    timeoutWarnedRef.current = false;

    setTurnTimeRemaining(Math.max(Math.ceil((endTime - Date.now()) / 1000), 0));

    turnTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      setTurnTimeRemaining(Math.max(remaining, 0));

      // Auto-stand on timeout (with guard against multiple calls)
      if (remaining <= 0 && !autoStandingRef.current) {
        autoStandingRef.current = true;
        if (turnTimerRef.current) {
          clearInterval(turnTimerRef.current);
          turnTimerRef.current = null;
        }
        if (onTurnTimeoutRef.current) {
          onTurnTimeoutRef.current();
        }
        // Auto-execute stand
        executeAction("stand");
      }
    }, 200);

    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerId, gameState?.turnTimeoutAt, playerId]);

  // Start game
  const startGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start game");
      }

      const { gameState: newGameState } = await response.json();
      setGameState(newGameState);
      lastGameStateRef.current = JSON.stringify(newGameState);

      if (onGameStateUpdateRef.current) {
        onGameStateUpdateRef.current(newGameState);
      }

      // Trigger immediate poll to sync all clients
      setTimeout(() => poll(), 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error starting game:", err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId, poll]);

  // Place bet
  const placeBet = useCallback(async (amount: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to place bet");
      }

      const { gameState: newGameState } = await response.json();
      setGameState(newGameState);
      lastGameStateRef.current = JSON.stringify(newGameState);

      if (onGameStateUpdateRef.current) {
        onGameStateUpdateRef.current(newGameState);
      }

      // Trigger immediate poll to sync
      setTimeout(() => poll(), 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error placing bet:", err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId, poll]);

  // Execute action
  const executeAction = useCallback(async (action: Action) => {
    // Prevent duplicate actions while loading
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      // Clear turn timer immediately on action
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }

      const response = await fetch(`/api/rooms/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to execute action");
      }

      const { gameState: newGameState } = await response.json();
      setGameState(newGameState);
      lastGameStateRef.current = JSON.stringify(newGameState);

      if (onGameStateUpdateRef.current) {
        onGameStateUpdateRef.current(newGameState);
      }

      // Trigger immediate poll to sync
      setTimeout(() => poll(), 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error executing action:", err);
    } finally {
      setLoading(false);
      autoStandingRef.current = false;
    }
  }, [roomCode, playerId, loading, poll]);

  // End session
  const endSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to end session");
      }

      setGameState(null);
      lastGameStateRef.current = "";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error ending session:", err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/history`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch history");
      }

      const { history: sessionHistory, playerStats } = await response.json();
      setHistory(sessionHistory);

      return { history: sessionHistory, playerStats };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching history:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  // Skip this round (sit out)
  const skipRound = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to skip round");
      }

      const { gameState: newGameState } = await response.json();
      setGameState(newGameState);
      lastGameStateRef.current = JSON.stringify(newGameState);

      if (onGameStateUpdateRef.current) {
        onGameStateUpdateRef.current(newGameState);
      }

      // Trigger immediate poll to sync
      setTimeout(() => poll(), 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error skipping round:", err);
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId, poll]);

  return {
    gameState,
    history,
    loading,
    error,
    turnTimeRemaining,
    isMyTurn: gameState?.currentPlayerId === playerId,
    startGame,
    placeBet,
    skipRound,
    executeAction,
    endSession,
    fetchHistory,
    poll, // Expose manual poll trigger
  };
}
