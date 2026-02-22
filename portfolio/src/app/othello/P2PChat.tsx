'use client';

import { useState, useEffect, useRef } from "react";
import { usePeerConnection } from "./usePeerConnection";

type ChatMessage = { sender: 'me' | 'opponent'; text: string };

export function ChatComponent(props: ReturnType<typeof usePeerConnection>) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!props.connRef.current) return;
    const conn = props.connRef.current;

    const dataHandler = (data: any) => {
      if (data.text) {
        setMessages(prev => [...prev, { sender: 'opponent', text: data.text }]);
      }
    };

    conn.on("data", dataHandler);
    return () => {
      conn.off("data", dataHandler);
    }
  }, [props.connRef.current]);

  const sendMessage = () => {
    console.log('what the message', input);
    if (!props.connRef.current || !input) return;
    console.log('what the message passed', input);

    props.connRef.current.send({ text: input });
    setMessages(prev => [...prev, { sender: 'me', text: input }]);
    setInput("");
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 10, width: 250, height: 400, overflowY: "auto" }}>
      <div style={{ marginTop: 10, height: 300, overflowY: "auto", border: "1px solid #eee", padding: 5 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'me' ? 'right' : 'left' }}>
            <span style={{ background: m.sender === 'me' ? "#66bb6a" : "#eee", padding: "2px 6px", borderRadius: 4 }}>
              {m.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}