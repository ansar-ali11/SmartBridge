import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import api from "../Api/axios";
import { useGeneral } from "../context/GeneralContext";
import "./chat.css";

const ChatBox = ({ clientId, freelancerId }) => {
  const { user } = useGeneral();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState(""); // Make sure this is defined
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------- FETCH OLD MESSAGES ---------- */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/messages/${clientId}/${freelancerId}`
        );
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (clientId && freelancerId) {
      fetchMessages();
    }
  }, [clientId, freelancerId]);

  /* ---------- SOCKET SETUP ---------- */
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("joinRoom", {
      clientId,
      freelancerId
    });

    socketRef.current.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [clientId, freelancerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = () => {
    if (!text.trim()) return;

    const messageData = {
      clientId,
      freelancerId,
      senderId: user.id,
      message: text
    };

    socketRef.current.emit("sendMessage", messageData);
    setText(""); // Clear input after sending
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-box">
      {/* Optional Chat Header */}
      <div className="chat-header">
        <span className="chat-status">Online</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💬</div>
            <h4>No messages yet</h4>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId._id === user.id;
            return (
              <div
                key={m._id}
                className={`message ${isMe ? "sent" : "received"}`}
              >
                <div className="sender-name">
                  {m.senderId.name}
                </div>
                <div className="message-content">{m.message}</div>
                <div className="message-time">
                  {new Date(m.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          autoFocus
        />
        <button 
          onClick={sendMessage}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;