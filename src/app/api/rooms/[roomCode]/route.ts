import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { normalizeRoomCode, validateRoomCode } from "@/lib/utils/room-code";

/**
 * GET /api/rooms/[roomCode]
 * Get room state
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);

    if (!validateRoomCode(normalizedRoomCode)) {
      return NextResponse.json(
        { error: "Invalid room code format" },
        { status: 400 }
      );
    }

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error("Error getting room:", error);
    return NextResponse.json(
      { error: "Failed to get room" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms/[roomCode]
 * Leave room (removes player from room)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId } = await req.json();

    if (!validateRoomCode(normalizedRoomCode)) {
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

    if (!room.players[playerId]) {
      return NextResponse.json(
        { error: "Player not in room" },
        { status: 404 }
      );
    }

    const updatedRoom = await RoomManager.removePlayer(normalizedRoomCode, playerId);

    // Room was deleted (no players left)
    if (!updatedRoom) {
      return NextResponse.json(
        { message: "Room deleted (no players remaining)" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Player removed from room", room: updatedRoom },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { error: "Failed to leave room" },
      { status: 500 }
    );
  }
}
