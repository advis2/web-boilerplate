'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Player, SIZE, directions, createInitialBoard } from './shared';
import { Disc } from './Disc';
import { usePeerConnection } from './usePeerConnection';
import { ChatComponent } from './P2PChat';

type Cell = Player;

export function OthelloPageP2P() {
  const [board, setBoard] = useState<Cell[][]>(createInitialBoard());
  const [displayBoard, setDisplayBoard] =
    useState<Cell[][]>(createInitialBoard());
  const [turn, setTurn] = useState<Cell>('B');
  const [gameOver, setGameOver] = useState(false);
  const { peerId, connected, connRef, peerRef, connectToPeer } =
    usePeerConnection();
  const [myTurn, setMyTurn] = useState<Cell>('B');
  const opponent = (p: Player) => (p === 'B' ? 'W' : 'B');
  const [isAnimating, setIsAnimating] = useState(false);

  const isValidMove = (
    b: Player[][],
    row: number,
    col: number,
    player: Player
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
        if (isValidMove(b, i, j, player)) moves.push([i, j]);
      }
    }
    return moves;
  };

  const applyMove = (
    b: Player[][],
    row: number,
    col: number,
    player: Player
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
        toFlip.forEach(([fx, fy]) => (newBoard[fx][fy] = player));
      }
    });

    return newBoard;
  };

  const scores = useMemo(() => {
    let black = 0,
      white = 0;
    board.forEach((row) =>
      row.forEach((c) => {
        if (c === 'B') black++;
        if (c === 'W') white++;
      })
    );
    return { black, white };
  }, [board]);

  // -----------------------------
  // PeerJS 초기화
  // -----------------------------

  // 상대방에 연결
  useEffect(() => {
    if (connRef.current) {
      const conn = connRef.current;
      const openHandler = () => {
        setMyTurn('B'); // connect를 시도한 사람은 B
        setTurn('B'); // 게임 시작은 흑
        conn.send({ role: 'B' }); // 나는 흑
      };
      const closeHandler = handleDisconnect;
      const dataHandler = (data: any) => {
        if (data.board && data.turn) {
          const newBoard = data.board;
          // 🔥 이전 board 대신 setBoard callback으로 접근
          setBoard((prevBoard) => {
            setIsAnimating(true);
            const flips = new Set<string>();
            for (let i = 0; i < SIZE; i++) {
              for (let j = 0; j < SIZE; j++) {
                if (prevBoard[i][j] && prevBoard[i][j] !== newBoard[i][j]) {
                  flips.add(`${i}-${j}`);
                }
              }
            }
            setFlippingCells(flips);
          
            setTimeout(() => {
              setDisplayBoard(newBoard);
              setFlippingCells(new Set());
              setTurn(data.turn);
              setIsAnimating(false);
            }, 700);
          
            return newBoard;
          });
        }
      };
      conn.on('data', dataHandler);
      conn.on('open', openHandler);
      conn.on('close', closeHandler);
      return () => {
        conn.off('data', dataHandler);
        conn.off('open', openHandler);
        conn.off('close', closeHandler);
      };
    }
    return undefined;
  }, [connRef.current]);

  // 상대방에 연결
  useEffect(() => {
    if (peerRef.current) {
      const conn = peerRef.current;
      const openHandler = () => {
        // 내 역할을 흑/백 반대로 설정
        setMyTurn('W'); // 연결된 쪽은 백
      };
      const closeHandler = handleDisconnect;
      const dataHandler = (data: any) => {
        if (data.board && data.turn) {
          setIsAnimating(true);
          const newBoard = data.board;
          // 🔥 이전 board 대신 setBoard callback으로 접근
          setBoard((prevBoard) => {
            const flips = new Set<string>();
            for (let i = 0; i < SIZE; i++) {
              for (let j = 0; j < SIZE; j++) {
                if (prevBoard[i][j] && prevBoard[i][j] !== newBoard[i][j]) {
                  flips.add(`${i}-${j}`);
                }
              }
            }
            setFlippingCells(flips);
          
            setTimeout(() => {
              setDisplayBoard(newBoard);
              setFlippingCells(new Set());
              setTurn(data.turn);
              setIsAnimating(false);
            }, 700);
          
            return newBoard;
          });
        }
        if (data.role) {
          setMyTurn(data.role === 'B' ? 'W' : 'B'); // 상대 역할 보고 내 역할 결정
        }
      };
      conn.on('connection', dataHandler);
      conn.on('open', openHandler);
      conn.on('close', closeHandler);
      return () => {
        conn.off('connection', dataHandler);
        conn.off('open', openHandler);
        conn.off('close', closeHandler);
      };
    }
    return undefined;
  }, [connRef.current]);

  const [flippingCells, setFlippingCells] = useState<Set<string>>(new Set());

  // -----------------------------
  // 클릭 처리
  // -----------------------------
  const handleClick = (row: number, col: number) => {
    if (gameOver || turn !== myTurn || isAnimating) return;
    if (!isValidMove(board, row, col, turn)) return;

    const newBoard = applyMove(board, row, col, turn);
    const nextTurn = opponent(turn);
    
    // P2P 전송
    if (connRef.current && connected) {
      connRef.current.send({ board: newBoard, turn: opponent(turn) });
    }
    // 🔥 이전 board 대신 setBoard callback으로 접근
    setBoard((prevBoard) => {
      setIsAnimating(true);
      const flips = new Set<string>();
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
          if (prevBoard[i][j] && prevBoard[i][j] !== newBoard[i][j]) {
            flips.add(`${i}-${j}`);
          }
        }
      }
      setFlippingCells(flips);
    
      setTimeout(() => {
        setDisplayBoard(newBoard);
        setFlippingCells(new Set());
        setTurn(nextTurn);
        setIsAnimating(false);
      }, 700);
    
      return newBoard;
    });
  };

  const resetGame = () => {
    const empty = createInitialBoard();
    setBoard(empty);
    setDisplayBoard(empty);
    setTurn('B');
    setGameOver(false);

    if (connRef.current && connected) {
      connRef.current.send({ board: empty, turn: 'B' });
    }
  };

  const validMoves = getValidMoves(board, turn);

  // -----------------------------
  // 브라우저 닫기 / 언마운트 처리
  // -----------------------------
  useEffect(() => {
    const handleUnload = () => {
      if (connRef.current) {
        connRef.current.close(); // 연결 종료
      }
      if (peerRef.current) {
        peerRef.current.destroy(); // Peer 종료
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload(); // 언마운트 시에도 안전하게 종료
    };
  }, []);

  // 연결 끊김 처리
  const handleDisconnect = () => {
    connRef.current = null;
    setBoard(createInitialBoard());
    setDisplayBoard(createInitialBoard());
    setTurn('B');
    setGameOver(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Othello P2P</h1>
      <p>My Peer ID: {peerId}</p>
      <p>Status: {connected ? 'Connected ✅' : 'Not connected ❌'}</p>

      {!connected && (
        <div>
          <input
            type="text"
            placeholder="Peer ID to connect"
            id="peer-id-input"
          />
          <button
            onClick={() => {
              const val = (
                document.getElementById('peer-id-input') as HTMLInputElement
              ).value;
              connectToPeer(val);
            }}
          >
            Connect
          </button>
        </div>
      )}

      {gameOver ? (
        <h2>
          Game Over —{scores.black > scores.white && ' Black Wins'}
          {scores.white > scores.black && ' White Wins'}
          {scores.white === scores.black && ' Draw'}
        </h2>
      ) : (
        <p>Turn: {turn === 'B' ? 'Black ⚫' : 'White ⚪ (AI)'}</p>
      )}

      <p>
        ⚫ {scores.black} : ⚪ {scores.white}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SIZE}, 50px)`,
          gap: 2,
          justifyContent: 'center',
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
                  background:
                    (turn === myTurn && highlight && !isAnimating) ? '#66bb6a' : '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (turn === myTurn && highlight && !isAnimating) ? 'pointer' : 'default',
                }}
              >
                <Disc value={cell} flipping={flippingCells.has(`${i}-${j}`)} />
              </div>
            );
          })
        )}
      </div>
      <ChatComponent 
        peerId={peerId}
        connected={connected}
        connRef={connRef}
        peerRef={peerRef}
        connectToPeer={connectToPeer}
      />
      <button onClick={resetGame} style={{ marginTop: 20 }}>
        Reset Game
      </button>
    </div>
  );
}
