import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { MultiplayerGameEngine } from "@/lib/game/multiplayer-engine";
import { normalizeRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/end
 * End the game session (host only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Invalid request: playerId required" },
        { status: 400 }
      );
    }

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if requester is host
    if (room.hostPlayerId !== playerId) {
      return NextResponse.json(
        { error: "Only host can end the session" },
        { status: 403 }
      );
    }

    // End session
    const engine = new MultiplayerGameEngine(room);
    await engine.endSession();

    return NextResponse.json(
      {
        message: "Session ended",
        room: {
          ...room,
          state: "review",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to end session" },
      { status: 500 }
    );
  }
}
