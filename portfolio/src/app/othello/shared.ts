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

export function createInitialBoard(): Player[][] {
  const board = Array.from({ length: SIZE }, () =>
    Array<Player>(SIZE).fill(null),
  );
  board[3][3] = "W";
  board[4][4] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  return board;
}