import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { MultiplayerGameEngine } from "@/lib/game/multiplayer-engine";
import { normalizeRoomCode } from "@/lib/utils/room-code";
import { Action } from "@/types";

/**
 * POST /api/rooms/[roomCode]/action
 * Execute a player action (hit, stand, double, split, surrender)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId, action } = await req.json();

    if (!playerId || !action) {
      return NextResponse.json(
        { error: "Invalid request: playerId and action required" },
        { status: 400 }
      );
    }

    const validActions: Action[] = ["hit", "stand", "double", "split", "surrender"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.gameState) {
      return NextResponse.json({ error: "Game not active" }, { status: 400 });
    }

    if (room.gameState.phase !== "playerTurn") {
      return NextResponse.json(
        { error: "Not in player turn phase" },
        { status: 400 }
      );
    }

    // Validate it's this player's turn
    if (room.gameState.currentPlayerId !== playerId) {
      return NextResponse.json(
        { error: "Not your turn" },
        { status: 403 }
      );
    }

    // Process action
    const engine = new MultiplayerGameEngine(room);
    const events = await engine.processAction(playerId, action);

    return NextResponse.json(
      {
        message: "Action executed",
        events,
        gameState: room.gameState,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process action" },
      { status: 500 }
    );
  }
}
