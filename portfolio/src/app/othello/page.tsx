"use client";

import { useState, useMemo, useEffect } from "react";
import { AI_PLAYER, directions, Player, SIZE } from "./shared";
import { Disc } from "./Disc";

function createInitialBoard(): Player[][] {
  const board = Array.from({ length: SIZE }, () =>
    Array<Player>(SIZE).fill(null),
  );
  board[3][3] = "W";
  board[4][4] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  return board;
}

export default function OthelloPage() {
  const [board, setBoard] = useState<Player[][]>(createInitialBoard());
  const [displayBoard, setDisplayBoard] =
    useState<Player[][]>(createInitialBoard());
  const [turn, setTurn] = useState<Player>("B");
  const [gameOver, setGameOver] = useState(false);

  const opponent = (p: Player) => (p === "B" ? "W" : "B");

  const isValidMove = (
    b: Player[][],
    row: number,
    col: number,
    player: Player,
  ) => {
    if (b[row][col] !== null) return false;
    const opp = opponent(player);

    return directions.some(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      let hasOpp = false;

      while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && b[x][y] === opp) {
        x += dx;
        y += dy;
        hasOpp = true;
      }

      return (
        hasOpp && x >= 0 && x < SIZE && y >= 0 && y < SIZE && b[x][y] === player
      );
    });
  };

  const getValidMoves = (b: Player[][], player: Player) => {
    const moves: [number, number][] = [];
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (isValidMove(b, i, j, player)) {
          moves.push([i, j]);
        }
      }
    }
    return moves;
  };

  const applyMove = (
    b: Player[][],
    row: number,
    col: number,
    player: Player,
  ) => {
    const newBoard = b.map((r) => [...r]);
    newBoard[row][col] = player;
    const opp = opponent(player);

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

      if (
        x >= 0 &&
        x < SIZE &&
        y >= 0 &&
        y < SIZE &&
        newBoard[x][y] === player
      ) {
        toFlip.forEach(([fx, fy]) => {
          newBoard[fx][fy] = player;
        });
      }
    });

    return newBoard;
  };

  const scores = useMemo(() => {
    let black = 0,
      white = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell === "B") black++;
        if (cell === "W") white++;
      }),
    );
    return { black, white };
  }, [board]);

  // ===========================
  // AI (Minimax)
  // ===========================

  const evaluate = (b: Player[][]) => {
    let score = 0;
    b.forEach((row) =>
      row.forEach((cell) => {
        if (cell === AI_PLAYER) score += 1;
        if (cell === opponent(AI_PLAYER)) score -= 1;
      }),
    );
    return score;
  };

  const minimax = (
    b: Player[][],
    depth: number,
    player: Player,
    maximizing: boolean,
  ): number => {
    const moves = getValidMoves(b, player);
    if (depth === 0 || moves.length === 0) {
      return evaluate(b);
    }

    if (maximizing) {
      let maxEval = -Infinity;
      for (const [r, c] of moves) {
        const newBoard = applyMove(b, r, c, player);
        const evalScore = minimax(newBoard, depth - 1, opponent(player), false);
        maxEval = Math.max(maxEval, evalScore);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const [r, c] of moves) {
        const newBoard = applyMove(b, r, c, player);
        const evalScore = minimax(newBoard, depth - 1, opponent(player), true);
        minEval = Math.min(minEval, evalScore);
      }
      return minEval;
    }
  };

  const makeAIMove = () => {
    const moves = getValidMoves(board, AI_PLAYER);
    if (moves.length === 0) return;

    let bestScore = -Infinity;
    let bestMove = moves[0];

    for (const [r, c] of moves) {
      const newBoard = applyMove(board, r, c, AI_PLAYER);
      const score = minimax(newBoard, 3, opponent(AI_PLAYER), false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }

    const newBoard = applyMove(board, bestMove[0], bestMove[1], AI_PLAYER);
    setBoard(newBoard);

    // 🔥 바뀐 셀 찾기
    const flips = new Set<string>();

    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] && board[i][j] !== newBoard[i][j]) {
          flips.add(`${i}-${j}`);
        }
      }
    }
    setFlippingCells(flips);
    // **애니메이션 끝난 후 displayBoard 업데이트**
    setTimeout(() => {
      setDisplayBoard(newBoard);
      setFlippingCells(new Set());
      setTurn(opponent(turn));
    }, 700); // transition duration과 동일하게
  };

  // ===========================
  // 턴 & 패스 & 종료 처리
  // ===========================

  useEffect(() => {
    if (gameOver) return;

    const currentMoves = getValidMoves(board, turn);
    const opponentMoves = getValidMoves(board, opponent(turn));

    if (currentMoves.length === 0) {
      if (opponentMoves.length === 0) {
        setGameOver(true);
      } else {
        setTurn(opponent(turn)); // 패스
      }
    }
  }, [board, turn]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (!gameOver && turn === AI_PLAYER) {
      setIsThinking(true);
      timer = setTimeout(() => {
        makeAIMove();
        setIsThinking(false);
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [turn]);

  const handleClick = (row: number, col: number) => {
    if (turn === AI_PLAYER || gameOver || isThinking) return;
    if (!isValidMove(board, row, col, turn)) return;

    setIsThinking(true);
    
    const newBoard = applyMove(board, row, col, turn);
    setBoard(newBoard);

    // 🔥 바뀐 셀 찾기
    const flips = new Set<string>();

    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] && board[i][j] !== newBoard[i][j]) {
          flips.add(`${i}-${j}`);
        }
      }
    }
    setFlippingCells(flips);
    // **애니메이션 끝난 후 displayBoard 업데이트**
    setTimeout(() => {
      setDisplayBoard(newBoard);
      setFlippingCells(new Set());
      setTurn(opponent(turn));
    }, 700); // transition duration과 동일하게
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setDisplayBoard(createInitialBoard());
    setTurn("B");
    setGameOver(false);
  };

  const [isThinking, setIsThinking] = useState(false);
  const validMoves =
    turn === AI_PLAYER || isThinking ? [] : getValidMoves(board, turn);
  const [flippingCells, setFlippingCells] = useState<Set<string>>(new Set());

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Othello Game (vs AI)</h1>

      {gameOver ? (
        <h2>
          Game Over —{scores.black > scores.white && " Black Wins"}
          {scores.white > scores.black && " White Wins"}
          {scores.white === scores.black && " Draw"}
        </h2>
      ) : (
        <p>Turn: {turn === "B" ? "Black ⚫" : "White ⚪ (AI)"}</p>
      )}

      <p>
        ⚫ {scores.black} : ⚪ {scores.white}
      </p>

      <div
        style={{
          opacity: isThinking ? 0.6 : 1,
          pointerEvents: isThinking ? "none" : "auto",
          display: "grid",
          gridTemplateColumns: `repeat(${SIZE}, 50px)`,
          gap: 2,
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {displayBoard.map((row, i) =>
          row.map((cell, j) => {
            const highlight = validMoves.some(([r, c]) => r === i && c === j);

            return (
              <div
                key={`${i}-${j}`}
                onClick={() => handleClick(i, j)}
                style={{
                  width: 50,
                  height: 50,
                  background: !isThinking && highlight ? "#66bb6a" : "#2e7d32",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !isThinking && highlight ? "pointer" : "default",
                }}
              >
                <Disc value={cell} flipping={flippingCells.has(`${i}-${j}`)} />
              </div>
            );
          }),
        )}
      </div>

      <button
        onClick={resetGame}
        style={{ marginTop: 20, padding: "8px 16px", cursor: "pointer" }}
      >
        Reset Game
      </button>
    </div>
  );
}
