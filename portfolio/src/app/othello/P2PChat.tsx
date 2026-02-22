import { useState, useEffect } from "react";
import { usePeerConnection } from "./usePeerConnection";

export default function ChatComponent() {
  const { peerId, connected, connRef, peerRef, connectToPeer } = usePeerConnection();
  const [input, setInput] = useState("");

  useEffect(() => {
    if(connRef.current) {
      const conn = connRef.current;
      const dataHandler = (data: any) => {
          if(data.message) {
              console.log('message:', data.message);
          }
      }
      conn.on("data", dataHandler);
      return () => {
          conn.off("data", dataHandler);
      }
    }
  }, [connRef.current]);  

  const sendMessage = () => {
    if (!connRef.current || !input) return;
    connRef.current.send({ text: input });
    setInput("");
  };

  return (
    <div>
      <p>My Peer ID: {peerId}</p>
      <p>Status: {connected ? "Connected" : "Not connected"}</p>
      <input
        type="text"
        placeholder="Peer ID"
        onBlur={(e) => connectToPeer(e.target.value)}
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}