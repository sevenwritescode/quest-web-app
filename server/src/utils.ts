import { randomBytes } from "crypto";

/**
 * Returns a new array with the elements of the input array shuffled using the Fisher-Yates algorithm
 * with cryptographically secure randomness.
 * @param array - The array to shuffle.
 * @returns A new shuffled array.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    // Read 4 bytes of secure random data, convert to unsigned 32-bit integer
    const rand = randomBytes(4).readUInt32BE(0);
    const j = rand % (i + 1);
  // Swap elements using a temporary variable and non-null assertions to satisfy TypeScript
  const tmp = result[i]!;
  result[i] = result[j]!;
  result[j] = tmp;
  }
  return result;
}
