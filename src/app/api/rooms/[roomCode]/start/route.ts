import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { MultiplayerGameEngine } from "@/lib/game/multiplayer-engine";
import { normalizeRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/start
 * Start the game (host only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId } = await req.json();

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if requester is host
    if (room.hostPlayerId !== playerId) {
      return NextResponse.json(
        { error: "Only host can start the game" },
        { status: 403 }
      );
    }

    // Check if enough players
    const playerCount = Object.keys(room.players).length;
    if (playerCount < 1) {
      return NextResponse.json(
        { error: "Need at least 1 player to start" },
        { status: 400 }
      );
    }

    // Start game
    const engine = new MultiplayerGameEngine(room);
    const gameState = await engine.startSession();

    return NextResponse.json(
      {
        message: "Game started",
        gameState,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
