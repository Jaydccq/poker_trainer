import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { MultiplayerGameEngine } from "@/lib/game/multiplayer-engine";
import { normalizeRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/bet
 * Place a bet during the betting phase
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId, amount } = await req.json();

    if (!playerId || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Invalid request: playerId and amount required" },
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

    // Validate bet amount
    const { minBet, maxBet } = room.settings;
    if (amount < minBet || amount > maxBet) {
      return NextResponse.json(
        { error: `Bet must be between $${minBet} and $${maxBet}` },
        { status: 400 }
      );
    }

    // Check bankroll
    const player = room.players[playerId];
    if (player.bankroll < amount) {
      return NextResponse.json(
        { error: "Insufficient bankroll" },
        { status: 400 }
      );
    }

    // Place bet
    const engine = new MultiplayerGameEngine(room);
    const events = await engine.placeBet(playerId, amount);

    return NextResponse.json(
      {
        message: "Bet placed",
        events,
        gameState: room.gameState,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error placing bet:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to place bet" },
      { status: 500 }
    );
  }
}
