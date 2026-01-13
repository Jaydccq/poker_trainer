import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { MultiplayerGameEngine } from "@/lib/game/multiplayer-engine";
import { normalizeRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/skip
 * Skip the current round (sit out)
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

    if (!room.gameState) {
      return NextResponse.json({ error: "Game not started" }, { status: 400 });
    }

    if (room.gameState.phase !== "betting" && room.gameState.phase !== "results") {
      return NextResponse.json(
        { error: "Not in betting phase" },
        { status: 400 }
      );
    }

    // Validate player is in room
    if (!room.players[playerId]) {
      return NextResponse.json(
        { error: "Player not in room" },
        { status: 403 }
      );
    }

    // Skip round
    const engine = new MultiplayerGameEngine(room);
    const events = await engine.skipRound(playerId);

    return NextResponse.json(
      {
        message: "Round skipped",
        events,
        gameState: room.gameState,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error skipping round:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to skip round" },
      { status: 500 }
    );
  }
}
