import { Card, Hand, Action, GameRules, GamePhase, RoundResult } from "./index";

// ===== Room & Player Models =====

export interface MultiplayerRoom {
  roomCode: string; // 4-char code (e.g., "ABCD")
  hostPlayerId: string;
  state: RoomState;
  settings: RoomSettings;
  players: Record<string, RoomPlayer>; // playerId -> RoomPlayer
  gameState: MultiplayerGameState | null;
  createdAt: number;
  lastActivity: number;
  updatedAt: number; // For polling change detection
}

export type RoomState = "lobby" | "playing" | "review";

export interface RoomSettings {
  maxPlayers: number; // 1-6
  buyIn: number; // Fixed $1000
  minBet: number; // Minimum bet (default 10)
  maxBet: number; // Maximum bet (default 500)
  rules: GameRules;
  turnTimeoutSeconds: number; // 10-25s (configurable)
  disconnectTimeoutSeconds: number; // 30s
}

export interface RoomPlayer {
  playerId: string;
  displayName: string;
  seatNumber: number; // 1-6
  bankroll: number;
  status: PlayerStatus;
  connectionState: ConnectionState;
  lastActivity: number;
}

export type PlayerStatus =
  | "waiting"
  | "active"
  | "busted"
  | "standing"
  | "disconnected";

export type ConnectionState = "connected" | "disconnected" | "timeout";

// ===== Multiplayer Game State =====

export interface MultiplayerGameState {
  // Deck state
  shoe: Card[];
  dealerHand: Hand;
  dealerHoleCardRevealed: boolean;

  // Player hands mapping (playerId -> their hands)
  playerHandsMap: Record<string, Hand[]>;

  // Turn tracking
  currentPlayerId: string | null;
  currentHandIndex: number;

  // Turn timer
  turnStartTime: number | null;
  turnTimeoutAt: number | null;

  // Phase
  phase: GamePhase;

  // Round tracking
  roundNumber: number;
  bets: Record<string, number>; // playerId -> bet amount
  skippedPlayers: Record<string, boolean>; // playerId -> true if skipping this round

  // Round results (for results phase display)
  roundResults: Record<string, RoundResult[]>; // playerId -> results for each hand

  // Previous round data (for displaying after settlement)
  previousRound?: {
    dealerHand: Hand;
    playerHandsMap: Record<string, Hand[]>;
    results: Record<string, RoundResult[]>;
  };

  // Card counting
  runningCount: number;
  trueCount: number;
}

// ===== Session History for Post-Game Review =====

export interface SessionHistory {
  roomCode: string;
  sessionId: string;
  startTime: number;
  endTime: number | null;
  players: string[]; // playerIds
  rounds: RoundHistory[];
}

export interface RoundHistory {
  roundNumber: number;
  timestamp: number;
  dealerHand: Hand;
  playerActions: PlayerRoundActions[];
}

export interface PlayerRoundActions {
  playerId: string;
  displayName: string;
  seatNumber: number;
  bet: number;
  hands: HandHistory[];
  finalBankroll: number;
  netResult: number; // +/- for this round
}

export interface HandHistory {
  cards: Card[];
  decisions: DecisionHistory[];
  result: RoundResult;
  payout: number;
}

export interface DecisionHistory {
  timestamp: number;
  handState: Card[]; // Cards at decision time
  dealerUpcard: Card;
  action: Action;
  recommendedAction: Action; // From strategy engine
  isCorrect: boolean;
  timeToDecide: number; // milliseconds
}

// ===== Real-time Events =====

export type MultiplayerEvent =
  // Player events
  | {
      type: "player:joined";
      playerId: string;
      player: RoomPlayer;
    }
  | {
      type: "player:left";
      playerId: string;
    }
  | {
      type: "player:disconnected";
      playerId: string;
    }
  | {
      type: "player:reconnected";
      playerId: string;
    }
  | {
      type: "player:seatChanged";
      playerId: string;
      newSeatNumber: number;
    }
  // Game lifecycle events
  | {
      type: "game:started";
    }
  | {
      type: "game:roundStart";
      roundNumber: number;
    }
  | {
      type: "game:betPlaced";
      playerId: string;
      amount: number;
    }
  | {
      type: "game:dealing";
      hands: Record<string, Hand[]>;
      dealerHand: Hand;
    }
  | {
      type: "game:turnStart";
      playerId: string;
      handIndex: number;
      timeoutAt: number;
    }
  | {
      type: "game:action";
      playerId: string;
      handIndex: number;
      action: Action;
      updatedHand: Hand;
      wasTimeout?: boolean;
    }
  | {
      type: "game:turnEnd";
      playerId: string;
      handIndex: number;
    }
  | {
      type: "game:dealerTurn";
      dealerHand: Hand;
    }
  | {
      type: "game:roundEnd";
      results: Record<string, RoundResult[]>;
      payouts: Record<string, number>;
      updatedBankrolls: Record<string, number>;
    }
  | {
      type: "game:ended";
    }
  // Error events
  | {
      type: "error";
      message: string;
      playerId?: string;
    };

// ===== API Request/Response Types =====

export interface CreateRoomRequest {
  displayName: string;
  settings?: Partial<RoomSettings>;
}

export interface CreateRoomResponse {
  roomCode: string;
  playerId: string;
  room: MultiplayerRoom;
}

export interface JoinRoomRequest {
  roomCode: string;
  displayName: string;
  seatNumber?: number;
}

export interface JoinRoomResponse {
  playerId: string;
  room: MultiplayerRoom;
}

export interface PlaceBetRequest {
  playerId: string;
  amount: number;
}

export interface PlayerActionRequest {
  playerId: string;
  action: Action;
}

export interface ChangeSeatRequest {
  playerId: string;
  newSeatNumber: number;
}

export interface ReconnectRequest {
  playerId: string;
}

export interface DisconnectRequest {
  playerId: string;
}
