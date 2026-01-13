/**
 * Utility functions for generating and validating room codes
 */

/**
 * Generate a random 4-character alphanumeric room code
 * @returns A 4-character room code (e.g., "A3K9")
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate a room code format
 * @param code - The room code to validate
 * @returns true if the code is valid (4 alphanumeric characters), false otherwise
 */
export function validateRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/.test(code);
}

/**
 * Normalize a room code to uppercase
 * @param code - The room code to normalize
 * @returns The normalized room code
 */
export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().trim();
}
