import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import communicationService from "../../services/communicationService";
import "../student/Communication.css";

const SOCKET_URL = "http://localhost:5000";

function StudentMessages() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Initialize Socket.io
    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ["websocket", "polling"]
        });

        // Join user's personal room
        const userId = user.id || user.entity_id;
        if (userId) {
            socketRef.current.emit("join-user", userId);
        }

        // Listen for online status
        socketRef.current.on("user-status", ({ userId, status }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (status === "online") {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        // Listen for new messages in real-time
        socketRef.current.on("new-message", ({ conversation_id, message }) => {
            console.log('[Doctor] Received new message:', conversation_id, message);

            // If this is the active conversation, add the message
            if (selectedConversation?.conversation_id === conversation_id) {
                setMessages(prev => {
                    // Avoid duplicates
                    const exists = prev.some(m => m.message_id === message.message_id);
                    if (exists) return prev;
                    return [...prev, message];
                });

                // Send delivered acknowledgment
                socketRef.current.emit("message-delivered", {
                    messageId: message.message_id,
                    conversationId: conversation_id
                });
            }

            // Refresh conversations list to update unread count
            loadConversations();
        });

        // Listen for message notifications (when not in the conversation)
        socketRef.current.on("message-notification", ({ conversation_id }) => {
            loadConversations();
        });

        // Listen for typing indicators
        socketRef.current.on("user-typing", ({ conversationId, userName }) => {
            if (selectedConversation?.conversation_id === conversationId) {
                setTypingUser(userName);
            }
        });

        socketRef.current.on("user-stop-typing", ({ conversationId }) => {
            if (selectedConversation?.conversation_id === conversationId) {
                setTypingUser(null);
            }
        });

        // Listen for message status updates (delivered/read)
        socketRef.current.on("message-status-update", ({ messageId, status }) => {
            setMessages(prev => prev.map(msg =>
                msg.message_id === messageId ? { ...msg, status } : msg
            ));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user.id, user.entity_id]);

    // Join/leave conversation room when selected conversation changes
    useEffect(() => {
        if (selectedConversation && socketRef.current) {
            const convId = selectedConversation.conversation_id;
            socketRef.current.emit("join-conversation", convId);

            return () => {
                socketRef.current.emit("leave-conversation", convId);
            };
        }
    }, [selectedConversation?.conversation_id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const response = await communicationService.getConversations();
            setConversations(response.data || []);
        } catch (error) {
            console.error("Error loading conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        setTypingUser(null);
        setMessagesLoading(true);
        setMessages([]); // Clear messages while loading

        try {
            const response = await communicationService.getMessages(conversation.conversation_id);
            const loadedMessages = response.data || [];
            setMessages(loadedMessages);

            // Mark all student messages as read and emit read status
            if (socketRef.current) {
                loadedMessages.forEach(msg => {
                    if (msg.sender_type === 'student' && !msg.is_read) {
                        socketRef.current.emit("message-read", {
                            messageId: msg.message_id,
                            conversationId: conversation.conversation_id
                        });
                    }
                });
            }

            // Update conversations list to clear unread badge
            loadConversations();
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleTyping = () => {
        if (selectedConversation && socketRef.current) {
            const userId = user.id || user.entity_id;
            socketRef.current.emit("typing", {
                conversationId: selectedConversation.conversation_id,
                userId: userId,
                userName: user.username || user.fullName || "Doctor"
            });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit("stop-typing", {
                    conversationId: selectedConversation.conversation_id,
                    userId: userId
                });
            }, 2000);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const userId = user.id || user.entity_id;

        // Stop typing indicator
        if (socketRef.current) {
            socketRef.current.emit("stop-typing", {
                conversationId: selectedConversation.conversation_id,
                userId: userId
            });
        }

        try {
            const response = await communicationService.sendMessage(
                selectedConversation.conversation_id,
                newMessage
            );
            setNewMessage("");

            // Add message immediately (optimistic update)
            if (response.data?.message) {
                setMessages(prev => {
                    const exists = prev.some(m => m.message_id === response.data.message.message_id);
                    if (exists) return prev;
                    return [...prev, response.data.message];
                });
            }

            loadConversations();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '○';
        }
    };

    const getStatusClass = (status) => {
        return status === 'read' ? 'status-read' : 'status-default';
    };

    if (loading) {
        return <div className="comm-loading">Loading student messages...</div>;
    }

    return (
        <div className="comm-container">
            <div className="comm-header">
                <h1>Student Messages</h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
                    View and respond to messages from students
                </p>
            </div>

            <div className="comm-content">
                {/* Conversations List */}
                <div className="comm-sidebar">
                    <h3>Inbox ({conversations.length})</h3>
                    {conversations.length === 0 ? (
                        <p className="comm-empty">No messages from students yet</p>
                    ) : (
                        <ul className="comm-list">
                            {conversations.map((conv) => (
                                <li
                                    key={conv.conversation_id}
                                    className={`comm-item ${selectedConversation?.conversation_id === conv.conversation_id ? 'active' : ''}`}
                                    onClick={() => selectConversation(conv)}
                                >
                                    <div className="comm-item-header">
                                        <span className="comm-item-name">
                                            {onlineUsers.has(conv.student_id) && (
                                                <span className="online-dot" title="Online"></span>
                                            )}
                                            {conv.other_name || 'Student'}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span className="comm-unread">{conv.unread_count}</span>
                                        )}
                                    </div>
                                    <div className="comm-item-subject">{conv.subject || 'No subject'}</div>
                                    {conv.last_message && (
                                        <div className="comm-item-preview">
                                            {conv.last_message.substring(0, 40)}...
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Messages Panel */}
                <div className="comm-messages">
                    {selectedConversation ? (
                        <>
                            <div className="comm-messages-header">
                                <h3>
                                    {onlineUsers.has(selectedConversation.student_id) && (
                                        <span className="online-dot" title="Online"></span>
                                    )}
                                    {selectedConversation.other_name || selectedConversation.student_name || 'Student'}
                                </h3>
                                <span className="comm-subject">{selectedConversation.subject || 'Conversation'}</span>
                            </div>

                            <div className="comm-messages-list">
                                {messagesLoading ? (
                                    <div className="comm-loading" style={{ padding: '20px' }}>Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div className="comm-empty-state" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                                        <p>No messages yet. The student hasn't sent any messages.</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.message_id}
                                            className={`comm-message ${msg.sender_type === 'staff' ? 'sent' : 'received'}`}
                                        >
                                            <div className="comm-message-content">{msg.message_text}</div>
                                            <div className="comm-message-footer">
                                                <span className="comm-message-time">{formatTime(msg.created_at)}</span>
                                                {msg.sender_type === 'staff' && (
                                                    <span className={`comm-message-status ${getStatusClass(msg.status)}`}>
                                                        {getStatusIcon(msg.status)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {typingUser && (
                                    <div className="typing-indicator">
                                        <span>{typingUser} is typing</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="comm-input-form" onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    placeholder="Type your reply..."
                                    className="comm-input"
                                />
                                <button type="submit" className="comm-btn primary" disabled={!newMessage.trim()}>
                                    Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="comm-empty-state">
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                                <p>Select a conversation to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentMessages;
