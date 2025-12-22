import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinRoom(room) {
        if (this.socket) {
            this.socket.emit('join-room', room);
            console.log('Joining room:', room);
        }
    }

    leaveRoom(room) {
        if (this.socket) {
            this.socket.emit('leave-room', room);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
            // Store listener for cleanup
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.socket?.connected ?? false;
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
