import { useState, useCallback, useEffect, useRef } from "react";
import { MultiplayerRoom, RoomSettings, CreateRoomResponse, JoinRoomResponse } from "@/types/multiplayer";
import { usePolling } from "./usePolling";
import {
  clearMultiplayerSession,
  saveMultiplayerSession,
} from "@/utils/multiplayerSession";

interface UseMultiplayerRoomOptions {
  roomCode?: string;
  playerId?: string;
  onRoomUpdate?: (room: MultiplayerRoom) => void;
  autoConnect?: boolean;
  /** Polling interval in milliseconds (default: 1500ms) */
  pollingInterval?: number;
}

export function useMultiplayerRoom({
  roomCode,
  playerId,
  onRoomUpdate,
  autoConnect = true,
  pollingInterval = 1500,
}: UseMultiplayerRoomOptions = {}) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const onRoomUpdateRef = useRef(onRoomUpdate);

  // Keep the callback ref updated
  useEffect(() => {
    onRoomUpdateRef.current = onRoomUpdate;
  }, [onRoomUpdate]);

  // Handle polled data
  const handlePolledData = useCallback((data: { room: MultiplayerRoom }) => {
    if (!data.room) return;
    
    // Only update if the room has changed (compare updatedAt timestamps)
    const roomUpdatedAt = data.room.updatedAt || 0;
    if (roomUpdatedAt > lastUpdateRef.current) {
      lastUpdateRef.current = roomUpdatedAt;
      setRoom(data.room);
      
      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(data.room);
      }
    }
  }, []);

  // Set up polling
  const { poll } = usePolling<{ room: MultiplayerRoom }>({
    url: roomCode ? `/api/rooms/${roomCode}` : "",
    interval: pollingInterval,
    enabled: autoConnect && !!roomCode && !!playerId,
    onData: handlePolledData,
    onError: (err) => {
      console.error("Polling error:", err);
    },
  });

  // Fetch room state manually
  const fetchRoom = useCallback(async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${code}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch room");
      }

      const { room: fetchedRoom } = await response.json();
      setRoom(fetchedRoom);
      lastUpdateRef.current = fetchedRoom.updatedAt || Date.now();

      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(fetchedRoom);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching room:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark player as disconnected when leaving
  const markDisconnected = useCallback(async () => {
    if (!roomCode || !playerId) return;
    try {
      await fetch(`/api/rooms/${roomCode}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } catch (err) {
      console.error("Error marking disconnected:", err);
    }
  }, [roomCode, playerId]);

  // Reconnect to room
  const reconnectRoom = useCallback(async (code: string, pId: string) => {
    try {
      const response = await fetch(`/api/rooms/${code}/reconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: pId }),
      });

      if (!response.ok) {
        return null;
      }

      const { room: updatedRoom } = await response.json();
      setRoom(updatedRoom);
      lastUpdateRef.current = updatedRoom.updatedAt || Date.now();

      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(updatedRoom);
      }

      saveMultiplayerSession({
        roomCode: code,
        playerId: pId,
        updatedAt: Date.now(),
      });

      return updatedRoom;
    } catch (err) {
      console.error("Error reconnecting to room:", err);
      return null;
    }
  }, []);

  // Handle page unload
  useEffect(() => {
    if (!roomCode || !playerId) return;

    const handleUnload = () => {
      // Use sendBeacon for reliable disconnect on page close
      navigator.sendBeacon?.(
        `/api/rooms/${roomCode}/disconnect`,
        JSON.stringify({ playerId })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [roomCode, playerId]);

  // Create new room
  const createRoom = useCallback(async (
    displayName: string,
    settings?: Partial<RoomSettings>
  ): Promise<CreateRoomResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          settings: {
            maxPlayers: 6,
            minBet: 10,
            maxBet: 500,
            turnTimeoutSeconds: 15,
            ...settings,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create room");
      }

      const data: CreateRoomResponse = await response.json();
      setRoom(data.room);
      lastUpdateRef.current = data.room.updatedAt || Date.now();
      saveMultiplayerSession({
        roomCode: data.roomCode,
        playerId: data.playerId,
        displayName: displayName.trim(),
        updatedAt: Date.now(),
      });

      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(data.room);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error creating room:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join existing room
  const joinRoom = useCallback(async (
    code: string,
    displayName: string,
    seatNumber?: number
  ): Promise<JoinRoomResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: code,
          displayName,
          seatNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join room");
      }

      const data: JoinRoomResponse = await response.json();
      setRoom(data.room);
      lastUpdateRef.current = data.room.updatedAt || Date.now();
      saveMultiplayerSession({
        roomCode: data.room.roomCode,
        playerId: data.playerId,
        displayName: displayName.trim(),
        updatedAt: Date.now(),
      });

      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(data.room);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error joining room:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(async (code: string, pId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: pId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave room");
      }

      setRoom(null);
      clearMultiplayerSession();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error leaving room:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Change seat
  const changeSeat = useCallback(async (newSeatNumber: number) => {
    if (!roomCode || !playerId) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/rooms/${roomCode}/seat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, newSeatNumber }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change seat");
      }

      const { room: updatedRoom } = await response.json();
      setRoom(updatedRoom);
      lastUpdateRef.current = updatedRoom.updatedAt || Date.now();

      if (onRoomUpdateRef.current) {
        onRoomUpdateRef.current(updatedRoom);
      }

      return updatedRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error changing seat:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId]);

  return {
    room,
    loading,
    error,
    isConnected: !!room, // With polling, we're "connected" if we have room data
    createRoom,
    joinRoom,
    leaveRoom,
    changeSeat,
    reconnectRoom,
    fetchRoom,
    refreshRoom: roomCode ? () => fetchRoom(roomCode) : undefined,
    poll, // Expose manual poll trigger
  };
}
