export const MULTIPLAYER_SESSION_KEY = "blackjack:multiplayer-session";

export interface MultiplayerSession {
  roomCode: string;
  playerId: string;
  displayName?: string;
  updatedAt: number;
}

export const loadMultiplayerSession = (): MultiplayerSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MULTIPLAYER_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MultiplayerSession;
  } catch {
    return null;
  }
};

export const saveMultiplayerSession = (session: MultiplayerSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MULTIPLAYER_SESSION_KEY, JSON.stringify(session));
};

export const clearMultiplayerSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MULTIPLAYER_SESSION_KEY);
};
