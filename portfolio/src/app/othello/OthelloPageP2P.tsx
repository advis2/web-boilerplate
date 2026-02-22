"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Player, SIZE, directions, createInitialBoard } from "./shared";
import { Disc } from "./Disc";
import * as Peer from 'peerjs'

type Cell = Player;

export function OthelloPageP2P() {
  const [board, setBoard] = useState<Cell[][]>(createInitialBoard());
  const [displayBoard, setDisplayBoard] = useState<Cell[][]>(createInitialBoard());
  const [turn, setTurn] = useState<Cell>("B");
  const [gameOver, setGameOver] = useState(false);

  const [peerId, setPeerId] = useState("");
  const [myTurn, setMyTurn] = useState<Cell>("B");
  const [connected, setConnected] = useState(false);  
  const connRef = useRef<Peer.DataConnection | null>(null);
  const peerRef = useRef<Peer.Peer | null>(null);

  const opponent = (p: Player) => (p === "B" ? "W" : "B");

  const isValidMove = (b: Player[][], row: number, col: number, player: Player) => {
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
      return hasOpp && x >= 0 && x < SIZE && y >= 0 && y < SIZE && b[x][y] === player;
    });
  };

  const getValidMoves = (b: Player[][], player: Player) => {
    const moves: [number, number][] = [];
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (isValidMove(b, i, j, player)) moves.push([i, j]);
      }
    }
    return moves;
  };

  const applyMove = (b: Player[][], row: number, col: number, player: Player) => {
    const newBoard = b.map(r => [...r]);
    newBoard[row][col] = player;
    const opp = opponent(player);

    directions.forEach(([dx, dy]) => {
      let x = row + dx;
      let y = col + dy;
      const toFlip: [number, number][] = [];

      while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && newBoard[x][y] === opp) {
        toFlip.push([x, y]);
        x += dx;
        y += dy;
      }

      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && newBoard[x][y] === player) {
        toFlip.forEach(([fx, fy]) => (newBoard[fx][fy] = player));
      }
    });

    return newBoard;
  };

  const scores = useMemo(() => {
    let black = 0, white = 0;
    board.forEach(row => row.forEach(c => { if (c === "B") black++; if (c === "W") white++; }));
    return { black, white };
  }, [board]);

  // -----------------------------
  // PeerJS 초기화
  // -----------------------------
  useEffect(() => {
    import("peerjs").then(({ Peer }) => {
      const peer = new Peer("", {
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        secure: true,
      });
      peerRef.current = peer;

      peer.on("open", (id: string) => {
        setPeerId(id);
        console.log("My Peer ID:", id);
      });

      // 연결을 수락한 쪽(peer.on("connection"))
      peer.on("connection", (conn: any) => {
        connRef.current = conn;
        setConnected(true);

        // 내 역할을 흑/백 반대로 설정
        setMyTurn("W");      // 연결된 쪽은 백

        conn.on("data", (data: any) => {
          if (data.board && data.turn) {
            setBoard(data.board);
            setDisplayBoard(data.board);
            setTurn(data.turn);
          }
          if (data.role) {
            setMyTurn(data.role === "B" ? "W" : "B"); // 상대 역할 보고 내 역할 결정
          }          
        });

        conn.on("close", () => {
          setConnected(false);
        });
      });
    });
  }, []);

  // 상대방에 연결
  const connectToPeer = (id: string) => {
    if (!peerRef.current) return;
    if(peerId === id) return;

    const conn = peerRef.current.connect(id);
    connRef.current = conn;

    // 연결되면 내가 흑, 상대는 백
    setMyTurn("B");          // connect를 시도한 사람은 B
    setTurn("B");            // 게임 시작은 흑

    conn.on("open", () => setConnected(true));
    // 역할을 상대에게 전송
    conn.on("open", () => {
      conn.send({ role: "B" }); // 나는 흑
    });    
    conn.on("data", (data: any) => {
      if (data.board && data.turn) {
        setBoard(data.board);
        setDisplayBoard(data.board);
        setTurn(data.turn);
      }
    });
    conn.on("close", () => setConnected(false));
  };
  const [flippingCells, setFlippingCells] = useState<Set<string>>(new Set());

  // -----------------------------
  // 클릭 처리
  // -----------------------------
  const handleClick = (row: number, col: number) => {
    if (gameOver || turn !== myTurn) return;
    if (!isValidMove(board, row, col, turn)) return;

    const newBoard = applyMove(board, row, col, turn);
    setBoard(newBoard);
    // P2P 전송
    if (connRef.current && connected) {
      connRef.current.send({ board: newBoard, turn: opponent(turn) });
    }

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
    const empty = createInitialBoard();
    setBoard(empty);
    setDisplayBoard(empty);
    setTurn("B");
    setGameOver(false);

    if (connRef.current && connected) {
      connRef.current.send({ board: empty, turn: "B" });
    }
  };

  const validMoves = getValidMoves(board, turn);

  return (
    <div style={{ padding: 20 }}>
      <h1>Othello P2P</h1>
      <p>My Peer ID: {peerId}</p>
      <p>Status: {connected ? "Connected ✅" : "Not connected ❌"}</p>

      {!connected && (
        <div>
          <input type="text" placeholder="Peer ID to connect" id="peer-id-input" />
          <button onClick={() => {
            const val = (document.getElementById("peer-id-input") as HTMLInputElement).value;
            connectToPeer(val);
          }}>Connect</button>
        </div>
      )}


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
                  background: (turn === myTurn) && highlight ? "#66bb6a" : "#2e7d32",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (turn === myTurn) && highlight ? "pointer" : "default",
                }}
              >
                <Disc value={cell} flipping={flippingCells.has(`${i}-${j}`)} />
              </div>
            );
          })
        )}
      </div>

      <button onClick={resetGame} style={{ marginTop: 20 }}>
        Reset Game
      </button>
    </div>
  );
}