/**
 * Socket Context - Global WebSocket connection manager
 * Best practice 2025: Single connection shared via Context + Hook pattern
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';

// Socket event types for type safety
export type SocketEvent =
    | 'incident_created'
    | 'incident_updated'
    | 'idea_created'
    | 'idea_updated'
    | 'idea_response'
    | 'news_created'
    | 'news_updated'
    | 'news_deleted'
    | 'notification'
    | 'connected';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    subscribe: (channel: string) => void;
    on: (event: SocketEvent, callback: (data: any) => void) => void;
    off: (event: SocketEvent, callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize socket connection once on mount
    useEffect(() => {
        const initSocket = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const { io } = await import('socket.io-client');
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

                const newSocket = io(backendUrl, {
                    auth: { token },
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                newSocket.on('connect', () => {
                    console.log('🔌 Global WebSocket connected');
                    setIsConnected(true);
                });

                newSocket.on('disconnect', () => {
                    console.log('🔌 WebSocket disconnected');
                    setIsConnected(false);
                });

                newSocket.on('connect_error', (error) => {
                    console.error('WebSocket connection error:', error.message);
                });

                setSocket(newSocket);
            } catch (error) {
                console.error('Failed to initialize socket:', error);
            }
        };

        initSocket();

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        };
    }, []);

    // Re-initialize when token changes (login/logout)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token') {
                if (!e.newValue && socket) {
                    socket.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [socket]);

    // Subscribe to a channel
    const subscribe = useCallback((channel: string) => {
        if (socket && isConnected) {
            socket.emit(`subscribe_${channel}`);
            console.log(`📡 Subscribed to ${channel}`);
        }
    }, [socket, isConnected]);

    // Add event listener
    const on = useCallback((event: SocketEvent, callback: (data: any) => void) => {
        if (socket) {
            socket.on(event, callback);
        }
    }, [socket]);

    // Remove event listener
    const off = useCallback((event: SocketEvent, callback: (data: any) => void) => {
        if (socket) {
            socket.off(event, callback);
        }
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, subscribe, on, off }}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * Hook to access global socket instance
 */
export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
};
