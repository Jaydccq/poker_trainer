import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import {
  JoinRoomRequest,
  JoinRoomResponse,
  RoomPlayer,
} from "@/types/multiplayer";
import { nanoid } from "nanoid";
import { normalizeRoomCode, validateRoomCode } from "@/lib/utils/room-code";

export async function POST(req: NextRequest) {
  try {
    const body: JoinRoomRequest = await req.json();
    const { roomCode: rawRoomCode, displayName, seatNumber } = body;

    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    if (displayName.length > 20) {
      return NextResponse.json(
        { error: "Display name must be 20 characters or less" },
        { status: 400 }
      );
    }

    // Normalize and validate room code
    const roomCode = normalizeRoomCode(rawRoomCode);
    if (!validateRoomCode(roomCode)) {
      return NextResponse.json(
        { error: "Invalid room code format" },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await RoomManager.getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room is full
    if (Object.keys(room.players).length >= room.settings.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Check if room is in game
    if (room.state === "playing") {
      return NextResponse.json(
        { error: "Game already in progress" },
        { status: 400 }
      );
    }

    // Generate unique player ID
    const playerId = nanoid();

    // Find available seat
    let assignedSeat = seatNumber || 1;
    if (seatNumber) {
      // Check if requested seat is available
      const seatTaken = Object.values(room.players).some(
        (p) => p.seatNumber === seatNumber
      );
      if (seatTaken) {
        return NextResponse.json(
          { error: "Seat already taken" },
          { status: 400 }
        );
      }
    } else {
      // Find first available seat
      const occupiedSeats = new Set(
        Object.values(room.players).map((p) => p.seatNumber)
      );
      for (let i = 1; i <= 6; i++) {
        if (!occupiedSeats.has(i)) {
          assignedSeat = i;
          break;
        }
      }
    }

    // Create new player
    const newPlayer: RoomPlayer = {
      playerId,
      displayName: displayName.trim(),
      seatNumber: assignedSeat,
      bankroll: room.settings.buyIn,
      status: "waiting",
      connectionState: "connected",
      lastActivity: Date.now(),
    };

    // Add player to room
    const updatedRoom = await RoomManager.addPlayer(roomCode, newPlayer);
    if (!updatedRoom) {
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    const response: JoinRoomResponse = {
      playerId,
      room: updatedRoom,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
