import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import { normalizeRoomCode } from "@/lib/utils/room-code";

/**
 * GET /api/rooms/[roomCode]/history
 * Retrieve session history for post-game review
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const normalizedRoomCode = normalizeRoomCode(roomCode);

    const room = await RoomManager.getRoom(normalizedRoomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if session has ended
    if (room.state !== "review") {
      return NextResponse.json(
        { error: "Session must be ended to view history" },
        { status: 400 }
      );
    }

    const history = await RoomManager.getHistory(normalizedRoomCode);
    if (!history) {
      return NextResponse.json(
        { error: "History not found" },
        { status: 404 }
      );
    }

    // Calculate per-player statistics
    const playerStats = history.players.map((playerId) => {
      const playerRounds = history.rounds.map((round) =>
        round.playerActions.find((pa) => pa.playerId === playerId)
      ).filter((pa) => pa !== undefined);

      const totalHands = playerRounds.reduce(
        (sum, pr) => sum + (pr?.hands.length || 0),
        0
      );
      const totalDecisions = playerRounds.reduce(
        (sum, pr) =>
          sum +
          (pr?.hands.reduce(
            (handSum, hand) => handSum + hand.decisions.length,
            0
          ) || 0),
        0
      );
      const correctDecisions = playerRounds.reduce(
        (sum, pr) =>
          sum +
          (pr?.hands.reduce(
            (handSum, hand) =>
              handSum +
              hand.decisions.filter((d) => d.isCorrect).length,
            0
          ) || 0),
        0
      );

      const finalRound = playerRounds[playerRounds.length - 1];
      const initialBankroll = 1000; // Fixed buy-in
      const finalBankroll = finalRound?.finalBankroll || initialBankroll;
      const netResult = finalBankroll - initialBankroll;

      return {
        playerId,
        displayName: finalRound?.displayName || "Unknown",
        totalHands,
        totalDecisions,
        correctDecisions,
        accuracy: totalDecisions > 0 ? correctDecisions / totalDecisions : 0,
        initialBankroll,
        finalBankroll,
        netResult,
      };
    });

    return NextResponse.json(
      {
        history,
        playerStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
