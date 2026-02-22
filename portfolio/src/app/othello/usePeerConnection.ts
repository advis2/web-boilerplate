import { useState, useRef, useEffect } from "react";
import * as Peer from "peerjs";

export type UsePeerConnectionReturn = {
  peerId: string;
  connected: boolean;
  connRef: React.MutableRefObject<Peer.DataConnection | null>;
  peerRef: React.MutableRefObject<Peer.Peer | null>;
  connectToPeer: (id: string) => void;
};

/**
 * PeerJS P2P 연결 관리 훅
 */
export function usePeerConnection(): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState("");
  const [connected, setConnected] = useState(false);

  const connRef = useRef<Peer.DataConnection | null>(null);
  const peerRef = useRef<Peer.Peer | null>(null);

  // Peer 초기화
  useEffect(() => {
    const peer = new Peer.Peer("", {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
    });
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("My Peer ID:", id);
    });

    // 상대방이 연결 시도
    peer.on("connection", (conn) => {
      connRef.current = conn;
      setConnected(true);

      conn.on("data", (data) => {
        console.log("Received:", data);
      });

      conn.on("close", () => setConnected(false));
    });

    // 브라우저 종료/언마운트 시 cleanup
    const handleUnload = () => {
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // 다른 Peer에 연결
  const connectToPeer = (id: string) => {
    if (!peerRef.current) return;
    if (peerId === id) return; // 자기 자신 제외

    const conn = peerRef.current.connect(id);
    connRef.current = conn;

    conn.on("open", () => setConnected(true));
    conn.on("data", (data) => {
      console.log("Received:", data);
    });
    conn.on("close", () => setConnected(false));
  };

  return { peerId, connected, connRef, peerRef, connectToPeer };
}
