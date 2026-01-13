import { NextRequest, NextResponse } from "next/server";
import { RoomManager } from "@/lib/redis/client";
import {
  CreateRoomRequest,
  CreateRoomResponse,
  RoomPlayer,
  RoomSettings,
} from "@/types/multiplayer";
import { DEFAULT_RULES } from "@/lib/game/config";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body: CreateRoomRequest = await req.json();
    const { displayName, settings } = body;

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

    // Generate unique player ID
    const playerId = nanoid();

    // Create default settings
    const defaultSettings: RoomSettings = {
      maxPlayers: settings?.maxPlayers || 6,
      buyIn: 1000, // Fixed buy-in
      minBet: settings?.minBet || 10,
      maxBet: settings?.maxBet || 500,
      rules: settings?.rules || DEFAULT_RULES,
      turnTimeoutSeconds: settings?.turnTimeoutSeconds || 15,
      disconnectTimeoutSeconds: settings?.disconnectTimeoutSeconds || 30,
    };

    // Validate settings
    if (
      defaultSettings.maxPlayers < 1 ||
      defaultSettings.maxPlayers > 6
    ) {
      return NextResponse.json(
        { error: "Max players must be between 1 and 6" },
        { status: 400 }
      );
    }

    if (
      defaultSettings.turnTimeoutSeconds < 10 ||
      defaultSettings.turnTimeoutSeconds > 60
    ) {
      return NextResponse.json(
        { error: "Turn timeout must be between 10 and 60 seconds" },
        { status: 400 }
      );
    }

    // Create host player
    const hostPlayer: RoomPlayer = {
      playerId,
      displayName: displayName.trim(),
      seatNumber: 1, // Host takes seat 1 by default
      bankroll: defaultSettings.buyIn,
      status: "waiting",
      connectionState: "connected",
      lastActivity: Date.now(),
    };

    // Create the room
    const room = await RoomManager.createRoom(defaultSettings, hostPlayer);

    const response: CreateRoomResponse = {
      roomCode: room.roomCode,
      playerId,
      room,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
