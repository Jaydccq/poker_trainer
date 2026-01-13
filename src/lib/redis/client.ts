import { Redis } from "@upstash/redis";
import {
  MultiplayerRoom,
  RoomPlayer,
  RoomSettings,
  SessionHistory,
} from "@/types/multiplayer";
import {
  generateRoomCode,
  validateRoomCode,
} from "@/lib/utils/room-code";

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Room TTL constants
const ROOM_TTL_SECONDS = 7200; // 2 hours
const HISTORY_TTL_SECONDS = 86400; // 24 hours

/**
 * RoomManager handles all Redis operations for multiplayer rooms
 */
export class RoomManager {
  /**
   * Create a new multiplayer room
   * @param settings - Room settings
   * @param hostPlayer - The host player who creates the room
   * @returns The created room
   */
  static async createRoom(
    settings: RoomSettings,
    hostPlayer: RoomPlayer
  ): Promise<MultiplayerRoom> {
    const roomCode = await this.generateUniqueRoomCode();
    const now = Date.now();

    const room: MultiplayerRoom = {
      roomCode,
      hostPlayerId: hostPlayer.playerId,
      state: "lobby",
      settings,
      players: {
        [hostPlayer.playerId]: hostPlayer,
      },
      gameState: null,
      createdAt: now,
      lastActivity: now,
      updatedAt: now,
    };

    // Store room in Redis
    await redis.set(`room:${roomCode}`, JSON.stringify(room), {
      ex: ROOM_TTL_SECONDS,
    });

    // Add to active rooms set
    await redis.zadd("roomcode:active", {
      score: now,
      member: roomCode,
    });

    return room;
  }

  /**
   * Get a room by room code
   * @param roomCode - The room code
   * @returns The room or null if not found
   */
  static async getRoom(roomCode: string): Promise<MultiplayerRoom | null> {
    if (!validateRoomCode(roomCode)) {
      console.log(`[RoomManager.getRoom] Invalid room code: ${roomCode}`);
      return null;
    }

    console.log(`[RoomManager.getRoom] Fetching room: room:${roomCode}`);
    // Upstash Redis returns the parsed object directly, not a string
    const data = await redis.get(`room:${roomCode}`);
    console.log(`[RoomManager.getRoom] Redis response type:`, typeof data, 'value:', data);
    
    if (!data) {
      console.log(`[RoomManager.getRoom] Room not found in Redis`);
      return null;
    }

    try {
      // If data is already an object, return it directly
      if (typeof data === 'object') {
        console.log(`[RoomManager.getRoom] Returning object directly:`, (data as MultiplayerRoom).roomCode);
        return data as MultiplayerRoom;
      }
      
      // If it's a string, parse it
      const room = JSON.parse(data as string) as MultiplayerRoom;
      console.log(`[RoomManager.getRoom] Successfully parsed room:`, room.roomCode);
      return room;
    } catch (error) {
      console.error(`[RoomManager.getRoom] Parse error:`, error);
      return null;
    }
  }

  /**
   * Update a room
   * @param room - The room to update
   */
  static async updateRoom(room: MultiplayerRoom): Promise<void> {
    const now = Date.now();
    room.lastActivity = now;
    room.updatedAt = now;

    await redis.set(`room:${room.roomCode}`, JSON.stringify(room), {
      ex: ROOM_TTL_SECONDS,
    });
  }

  /**
   * Delete a room
   * @param roomCode - The room code
   */
  static async deleteRoom(roomCode: string): Promise<void> {
    await redis.del(`room:${roomCode}`);
    await redis.zrem("roomcode:active", roomCode);
  }

  /**
   * Add a player to a room
   * @param roomCode - The room code
   * @param player - The player to add
   * @returns The updated room or null if room not found or full
   */
  static async addPlayer(
    roomCode: string,
    player: RoomPlayer
  ): Promise<MultiplayerRoom | null> {
    const room = await this.getRoom(roomCode);
    if (!room) {
      return null;
    }

    // Check if room is full
    if (Object.keys(room.players).length >= room.settings.maxPlayers) {
      return null;
    }

    // Check if room is in game
    if (room.state === "playing") {
      return null;
    }

    // Add player
    room.players[player.playerId] = player;

    await this.updateRoom(room);
    return room;
  }

  /**
   * Remove a player from a room
   * @param roomCode - The room code
   * @param playerId - The player ID
   * @returns The updated room or null if room not found
   */
  static async removePlayer(
    roomCode: string,
    playerId: string
  ): Promise<MultiplayerRoom | null> {
    const room = await this.getRoom(roomCode);
    if (!room) {
      return null;
    }

    delete room.players[playerId];

    // If no players left, delete the room
    if (Object.keys(room.players).length === 0) {
      await this.deleteRoom(roomCode);
      return null;
    }

    // If host left, assign new host
    if (room.hostPlayerId === playerId) {
      const remainingPlayers = Object.keys(room.players);
      if (remainingPlayers.length > 0) {
        room.hostPlayerId = remainingPlayers[0];
      }
    }

    await this.updateRoom(room);
    return room;
  }

  /**
   * Update a player's seat in a room
   * @param roomCode - The room code
   * @param playerId - The player ID
   * @param newSeatNumber - The new seat number (1-6)
   * @returns The updated room or null if invalid
   */
  static async updatePlayerSeat(
    roomCode: string,
    playerId: string,
    newSeatNumber: number
  ): Promise<MultiplayerRoom | null> {
    const room = await this.getRoom(roomCode);
    if (!room || !room.players[playerId]) {
      return null;
    }

    // Check if seat is already taken
    const seatTaken = Object.values(room.players).some(
      (p) => p.seatNumber === newSeatNumber && p.playerId !== playerId
    );

    if (seatTaken) {
      return null;
    }

    // Validate seat number
    if (newSeatNumber < 1 || newSeatNumber > 6) {
      return null;
    }

    room.players[playerId].seatNumber = newSeatNumber;
    await this.updateRoom(room);
    return room;
  }

  /**
   * Save session history for post-game review
   * @param history - The session history
   */
  static async saveHistory(history: SessionHistory): Promise<void> {
    await redis.set(
      `room:${history.roomCode}:history`,
      JSON.stringify(history),
      {
        ex: HISTORY_TTL_SECONDS,
      }
    );
  }

  /**
   * Get session history
   * @param roomCode - The room code
   * @returns The session history or null if not found
   */
  static async getHistory(roomCode: string): Promise<SessionHistory | null> {
    const data = await redis.get<string>(`room:${roomCode}:history`);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data as string) as SessionHistory;
    } catch {
      return null;
    }
  }

  /**
   * Generate a unique room code
   * @returns A unique 4-character room code
   */
  private static async generateUniqueRoomCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = generateRoomCode();
      const exists = await this.isRoomCodeActive(code);
      if (!exists) {
        return code;
      }
      attempts++;
    }

    throw new Error("Failed to generate unique room code");
  }

  /**
   * Check if a room code is active
   * @param code - The room code to check
   * @returns true if the room code is active, false otherwise
   */
  private static async isRoomCodeActive(code: string): Promise<boolean> {
    const score = await redis.zscore("roomcode:active", code);
    return score !== null;
  }

  /**
   * Clean up expired rooms (to be called periodically)
   * @param olderThan - Timestamp threshold (rooms older than this will be removed)
   */
  static async cleanupExpiredRooms(olderThan: number): Promise<number> {
    const expiredCodes = await redis.zrange(
      "roomcode:active",
      0,
      olderThan,
      { byScore: true }
    );

    if (!expiredCodes || expiredCodes.length === 0) {
      return 0;
    }

    for (const code of expiredCodes) {
      await this.deleteRoom(code as string);
    }

    return expiredCodes.length;
  }
}
