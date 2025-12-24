import { useState } from "react";
import styles from "./Communication.module.css";

function DoctorCommunication() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reply, setReply] = useState("");
  const [view, setView] = useState("list");

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, read: true } : m))
    );
    setView("detail");
  };

  const handleSendReply = () => {
    if (reply.trim()) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, replied: true } : m
        )
      );
      setReply("");
      setSelectedMessage(null);
      setView("list");
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className={styles.container}>
      <h1>Communication & Messaging</h1>

      {view === "list" ? (
        <div className={styles.messagesList}>
          <div className={styles.header}>
            <h2>Messages</h2>
            <span className={styles.unreadBadge}>{unreadCount} Unread</span>
          </div>

          {messages.length === 0 ? (
            <p className={styles.empty}>No messages</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageItem} ${!message.read ? styles.unread : ""}`}
                onClick={() => handleSelectMessage(message)}
              >
                <div className={styles.messageContent}>
                  <div className={styles.from}>{message.studentName}</div>
                  <div className={styles.subject}>{message.subject}</div>
                  <div className={styles.preview}>{message.preview}</div>
                </div>
                <div className={styles.messageTime}>{message.timestamp}</div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.detailView}>
          <button className={styles.backBtn} onClick={() => setView("list")}>
            ← Back to Messages
          </button>

          {selectedMessage && (
            <div className={styles.messageDetail}>
              <div className={styles.messageHeader}>
                <h2>{selectedMessage.subject}</h2>
                <span className={styles.time}>{selectedMessage.timestamp}</span>
              </div>

              <div className={styles.from}>From: {selectedMessage.studentName}</div>

              <div className={styles.messageBody}>{selectedMessage.preview}</div>

              <div className={styles.replySection}>
                <label className={styles.label}>Your Reply</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className={styles.textarea}
                  placeholder="Type your response here..."
                  rows="6"
                />
                <div className={styles.actions}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => setView("list")}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.sendBtn}
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorCommunication;
