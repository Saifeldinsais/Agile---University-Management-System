import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import parentService from "../../services/parentService";
import "./ParentPages.css";

function Messages() {
    const [searchParams] = useSearchParams();
    const [threads, setThreads] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // New message modal state
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(searchParams.get("student") || "");
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [subject, setSubject] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedThread) {
            loadMessages(selectedThread.teacher_id);
        }
    }, [selectedThread]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [threadsRes, studentsRes, teachersRes] = await Promise.all([
                parentService.getMessageThreads(),
                parentService.getStudents(),
                parentService.getAvailableTeachers(),
            ]);
            setThreads(threadsRes.data);
            setStudents(studentsRes.data);
            setTeachers(teachersRes.data);
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (teacherId) => {
        try {
            const response = await parentService.getMessages(teacherId);
            setMessages(response.data);
        } catch (err) {
            console.error("Failed to load messages:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedThread) return;

        try {
            setSending(true);
            await parentService.sendMessage(
                selectedThread.teacher_id,
                selectedThread.student_id,
                "Reply",
                newMessage
            );
            setNewMessage("");
            await loadMessages(selectedThread.teacher_id);
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setSending(false);
        }
    };

    const handleStartNewConversation = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !selectedTeacher || !newMessage.trim()) return;

        try {
            setSending(true);
            await parentService.sendMessage(
                selectedTeacher,
                selectedStudent,
                subject || "No Subject",
                newMessage
            );
            setShowNewModal(false);
            setNewMessage("");
            setSubject("");
            await loadData();
        } catch (err) {
            console.error("Failed to start conversation:", err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="parent-page loading">
                <div className="spinner"></div>
                <p>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="parent-page messages-page">
            {/* Threads List */}
            <div className="threads-panel">
                <div className="threads-header">
                    <h3>Conversations</h3>
                    <button className="new-message-btn" onClick={() => setShowNewModal(true)}>
                        ✉️ New
                    </button>
                </div>
                <div className="threads-list">
                    {threads.length > 0 ? (
                        threads.map((thread) => (
                            <div
                                key={`${thread.teacher_id}-${thread.student_id}`}
                                className={`thread-item ${selectedThread?.teacher_id === thread.teacher_id ? "active" : ""}`}
                                onClick={() => setSelectedThread(thread)}
                            >
                                <div className="thread-avatar">
                                    {thread.teacher_name?.charAt(0) || "T"}
                                </div>
                                <div className="thread-info">
                                    <div className="thread-name">{thread.teacher_name}</div>
                                    <div className="thread-student">About: {thread.student_name}</div>
                                </div>
                                {thread.unread_count > 0 && (
                                    <span className="unread-badge">{thread.unread_count}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state small">
                            <p>No conversations yet</p>
                            <button onClick={() => setShowNewModal(true)}>
                                Start a conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Area */}
            <div className="message-area">
                {selectedThread ? (
                    <>
                        <div className="message-header">
                            <h3>{selectedThread.teacher_name}</h3>
                            <span className="regarding">
                                Regarding: {selectedThread.student_name}
                            </span>
                        </div>
                        <div className="messages-container">
                            {messages.map((msg) => (
                                <div
                                    key={msg.message_id}
                                    className={`message-bubble ${msg.sender_type === "parent" ? "sent" : "received"}`}
                                >
                                    <div className="message-content">{msg.message_body}</div>
                                    <div className="message-time">
                                        {new Date(msg.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="message-input" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                            />
                            <button type="submit" disabled={sending || !newMessage.trim()}>
                                {sending ? "..." : "Send"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-thread-selected">
                        <span className="icon">💬</span>
                        <p>Select a conversation or start a new one</p>
                    </div>
                )}
            </div>

            {/* New Message Modal */}
            {showNewModal && (
                <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Message</h3>
                            <button className="close-btn" onClick={() => setShowNewModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleStartNewConversation}>
                            <div className="form-group">
                                <label>Student</label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    required
                                >
                                    <option value="">Select a student...</option>
                                    {students.map((s) => (
                                        <option key={s.student_id} value={s.student_id}>
                                            {s.student_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Teacher</label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    required
                                >
                                    <option value="">Select a teacher...</option>
                                    {teachers.map((t) => (
                                        <option key={t.teacher_id} value={t.teacher_id}>
                                            {t.teacher_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Message subject..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Write your message..."
                                    rows={4}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={sending}>
                                {sending ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Messages;
