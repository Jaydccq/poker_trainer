import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { normalizeRoomCode, validateRoomCode } from "@/lib/utils/room-code";

/**
 * POST /api/rooms/[roomCode]/seat
 * Change a player's seat during lobby phase
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const { playerId, newSeatNumber } = await req.json();

    if (!validateRoomCode(roomCode)) {
      return NextResponse.json(
        { error: "Invalid room code format" },
        { status: 400 }
      );
    }

    if (!playerId || typeof newSeatNumber !== "number") {
      return NextResponse.json(
        { error: "playerId and newSeatNumber are required" },
        { status: 400 }
      );
    }

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.state !== "lobby") {
      return NextResponse.json(
        { error: "Seats can only be changed in the lobby" },
        { status: 400 }
      );
    }

    const updatedRoom = await RoomManager.updatePlayerSeat(
      normalizedRoomCode,
      playerId,
      newSeatNumber
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { error: "Seat unavailable or invalid" },
        { status: 400 }
      );
    }

    return NextResponse.json({ room: updatedRoom }, { status: 200 });
  } catch (error) {
    console.error("Error changing seat:", error);
    return NextResponse.json(
      { error: "Failed to change seat" },
      { status: 500 }
    );
  }
}
