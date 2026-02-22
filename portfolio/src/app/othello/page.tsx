"use client";

import { useState, useMemo } from "react";

type Player = "B" | "W" | null;
const SIZE = 8;

const directions = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function createInitialBoard(): Player[][] {
  const board: Player[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(null),
  );

  board[3][3] = "W";
  board[4][4] = "W";
  board[3][4] = "B";
  board[4][3] = "B";

  return board;
}

export default function OthelloPage() {
  const [board, setBoard] = useState<Player[][]>(createInitialBoard());
  const [turn, setTurn] = useState<Player>("B");

  const opponent = (p: Player) => (p === "B" ? "W" : "B");

  const isValidMove = (row: number, col: number, player: Player) => {
    if (board[row][col] !== null) return false;
    const opp = opponent(player);

    return directions.some(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let hasOppBetween = false;

      while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[x][y] === opp) {
        x += dx;
        y += dy;
        hasOppBetween = true;
      }

      if (
        hasOppBetween &&
        x >= 0 &&
        x < SIZE &&
        y >= 0 &&
        y < SIZE &&
        board[x][y] === player
      ) {
        return true;
      }

      return false;
    });
  };

  const makeMove = (row: number, col: number) => {
    if (!isValidMove(row, col, turn)) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = turn;
    const opp = opponent(turn);

    directions.forEach(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      const toFlip: [number, number][] = [];

      while (
        x >= 0 &&
        x < SIZE &&
        y >= 0 &&
        y < SIZE &&
        newBoard[x][y] === opp
      ) {
        toFlip.push([x, y]);
        x += dx;
        y += dy;
      }

      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && newBoard[x][y] === turn) {
        toFlip.forEach(([fx, fy]) => {
          newBoard[fx][fy] = turn;
        });
      }
    });

    setBoard(newBoard);
    setTurn(opp);
  };

  const scores = useMemo(() => {
    let black = 0;
    let white = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell === "B") black++;
        if (cell === "W") white++;
      }),
    );
    return { black, white };
  }, [board]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn("B");
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Othello Game</h1>

      <p>Turn: {turn === "B" ? "Black ⚫" : "White ⚪"}</p>

      <p>
        ⚫ {scores.black} : ⚪ {scores.white}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${SIZE}, 50px)`,
          gap: 2,
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {board.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() => makeMove(i, j)}
              style={{
                width: 50,
                height: 50,
                background: "#2e7d32",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isValidMove(i, j, turn) ? "pointer" : "default",
              }}
            >
              {cell && (
                <div
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: "50%",
                    background: cell === "B" ? "black" : "white",
                  }}
                />
              )}
            </div>
          )),
        )}
      </div>

      <button
        onClick={resetGame}
        style={{
          marginTop: 20,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Reset Game
      </button>
    </div>
  );
}
