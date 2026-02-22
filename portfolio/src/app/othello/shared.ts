export type Player = "B" | "W" | null;
export const SIZE = 8;
export const AI_PLAYER: Player = "W";
export const directions = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
