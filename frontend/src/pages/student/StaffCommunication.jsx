import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import communicationService from "../../services/communicationService";
import "./Communication.css";

const SOCKET_URL = "http://localhost:5000";

function StaffCommunication() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newConversationData, setNewConversationData] = useState({
        staffId: "",
        staffType: "doctor",
        subject: ""
    });
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
        if (user.entity_id || user.id) {
            socketRef.current.emit("join-user", user.entity_id || user.id);
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

        // Listen for new messages
        socketRef.current.on("new-message", ({ conversation_id, message }) => {
            console.log('[Student] Received new message:', conversation_id, message);

            if (selectedConversation?.conversation_id === conversation_id) {
                setMessages(prev => {
                    // Avoid duplicates
                    const exists = prev.some(m => m.message_id === message.message_id);
                    if (exists) return prev;
                    return [...prev, message];
                });

                // Mark as delivered
                socketRef.current.emit("message-delivered", {
                    messageId: message.message_id,
                    conversationId: conversation_id
                });
            }
            // Refresh conversations list
            loadConversations();
        });

        // Listen for message notifications
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

        // Listen for message status updates
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
    }, [user.entity_id, user.id]);

    // Join conversation room when selected
    useEffect(() => {
        if (selectedConversation && socketRef.current) {
            socketRef.current.emit("join-conversation", selectedConversation.conversation_id);

            return () => {
                socketRef.current.emit("leave-conversation", selectedConversation.conversation_id);
            };
        }
    }, [selectedConversation?.conversation_id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        loadConversations();
        loadStaff();
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

    const loadStaff = async () => {
        try {
            const response = await communicationService.getAvailableStaff();
            setStaffList(response.data || []);
        } catch (error) {
            console.error("Error loading staff:", error);
        }
    };

    const selectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        setTypingUser(null);
        setMessages([]); // Clear messages immediately while loading

        try {
            const response = await communicationService.getMessages(conversation.conversation_id);
            const loadedMessages = response.data || [];
            setMessages(loadedMessages);

            // Mark all messages as read
            if (socketRef.current) {
                loadedMessages.forEach(msg => {
                    if (msg.sender_type !== 'student' && !msg.is_read) {
                        socketRef.current.emit("message-read", {
                            messageId: msg.message_id,
                            conversationId: conversation.conversation_id
                        });
                    }
                });
            }

            // Refresh conversations to update unread count
            loadConversations();
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleTyping = () => {
        if (selectedConversation && socketRef.current) {
            socketRef.current.emit("typing", {
                conversationId: selectedConversation.conversation_id,
                userId: user.entity_id || user.id,
                userName: user.name || "Student"
            });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit("stop-typing", {
                    conversationId: selectedConversation.conversation_id,
                    userId: user.entity_id || user.id
                });
            }, 2000);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        // Stop typing indicator
        if (socketRef.current) {
            socketRef.current.emit("stop-typing", {
                conversationId: selectedConversation.conversation_id,
                userId: user.entity_id || user.id
            });
        }

        try {
            const response = await communicationService.sendMessage(
                selectedConversation.conversation_id,
                newMessage
            );
            setNewMessage("");

            // Add message optimistically (avoid duplicates)
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

    const startNewConversation = async (e) => {
        e.preventDefault();
        if (!newConversationData.staffId) return;

        try {
            const response = await communicationService.createConversation(
                parseInt(newConversationData.staffId),
                newConversationData.staffType,
                newConversationData.subject || "New Conversation"
            );
            setShowNewConversation(false);
            setNewConversationData({ staffId: "", staffType: "doctor", subject: "" });
            loadConversations();
            if (response.data) {
                selectConversation(response.data);
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
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
        return <div className="comm-loading">Loading conversations...</div>;
    }

    return (
        <div className="comm-container">
            <div className="comm-header">
                <h1>Staff Communication</h1>
                <button
                    className="comm-btn primary"
                    onClick={() => setShowNewConversation(true)}
                >
                    + New Conversation
                </button>
            </div>

            <div className="comm-content">
                {/* Conversations List */}
                <div className="comm-sidebar">
                    <h3>Conversations</h3>
                    {conversations.length === 0 ? (
                        <p className="comm-empty">No conversations yet</p>
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
                                            {onlineUsers.has(conv.staff_id) && (
                                                <span className="online-dot" title="Online"></span>
                                            )}
                                            {conv.other_name}
                                        </span>
                                        <span className={`comm-badge ${conv.staff_type}`}>{conv.staff_type}</span>
                                    </div>
                                    <div className="comm-item-subject">{conv.subject}</div>
                                    {conv.last_message && (
                                        <div className="comm-item-preview">{conv.last_message.substring(0, 50)}...</div>
                                    )}
                                    {conv.unread_count > 0 && (
                                        <span className="comm-unread">{conv.unread_count}</span>
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
                                    {onlineUsers.has(selectedConversation.staff_id) && (
                                        <span className="online-dot" title="Online"></span>
                                    )}
                                    {selectedConversation.other_name || selectedConversation.staff_name}
                                </h3>
                                <span className="comm-subject">{selectedConversation.subject}</span>
                            </div>
                            <div className="comm-messages-list">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.message_id}
                                        className={`comm-message ${msg.sender_type === 'student' ? 'sent' : 'received'}`}
                                    >
                                        <div className="comm-message-content">{msg.message_text}</div>
                                        <div className="comm-message-footer">
                                            <span className="comm-message-time">{formatTime(msg.created_at)}</span>
                                            {msg.sender_type === 'student' && (
                                                <span className={`comm-message-status ${getStatusClass(msg.status)}`}>
                                                    {getStatusIcon(msg.status)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {typingUser && (
                                    <div className="typing-indicator">
                                        <span>{typingUser} is typing...</span>
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
                                    placeholder="Type your message..."
                                    className="comm-input"
                                />
                                <button type="submit" className="comm-btn primary">Send</button>
                            </form>
                        </>
                    ) : (
                        <div className="comm-empty-state">
                            <p>Select a conversation or start a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="comm-modal-overlay" onClick={() => setShowNewConversation(false)}>
                    <div className="comm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Start New Conversation</h2>
                        <form onSubmit={startNewConversation}>
                            <div className="comm-form-group">
                                <label>Staff Type</label>
                                <select
                                    value={newConversationData.staffType}
                                    onChange={(e) => setNewConversationData(prev => ({ ...prev, staffType: e.target.value }))}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="ta">Teaching Assistant</option>
                                    <option value="advisor">Advisor</option>
                                </select>
                            </div>
                            <div className="comm-form-group">
                                <label>Select Staff Member</label>
                                <select
                                    value={newConversationData.staffId}
                                    onChange={(e) => setNewConversationData(prev => ({ ...prev, staffId: e.target.value }))}
                                    required
                                >
                                    <option value="">Choose...</option>
                                    {staffList
                                        .filter(s => s.staff_type === newConversationData.staffType)
                                        .map(staff => (
                                            <option key={staff.entity_id} value={staff.entity_id}>
                                                {staff.entity_name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="comm-form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    value={newConversationData.subject}
                                    onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="What is this about?"
                                />
                            </div>
                            <div className="comm-modal-actions">
                                <button type="button" className="comm-btn secondary" onClick={() => setShowNewConversation(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="comm-btn primary">Start Conversation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffCommunication;
