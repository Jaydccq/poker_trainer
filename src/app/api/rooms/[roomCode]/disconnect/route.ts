import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { normalizeRoomCode, validateRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/disconnect
 * Mark player as disconnected in room state
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId } = await req.json();

    if (!validateRoomCode(roomCode)) {
      return NextResponse.json(
        { error: "Invalid room code format" },
        { status: 400 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const player = room.players[playerId];
    if (!player) {
      return NextResponse.json(
        { error: "Player not found in room" },
        { status: 404 }
      );
    }

    player.connectionState = "disconnected";
    player.status = "disconnected";
    player.lastActivity = Date.now();

    await RoomManager.updateRoom(room);

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error("Error marking disconnected:", error);
    return NextResponse.json(
      { error: "Failed to mark disconnected" },
      { status: 500 }
    );
  }
}
