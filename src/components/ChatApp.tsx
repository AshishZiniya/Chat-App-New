'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import Sidebar from './Chat/Sidebar';
import ChatWindow from './Chat/ChatWindow';
import { createSocketClient } from '../lib/socket';
import type {
    User,
    Message,
    TypingPayload,
    MessageType,
    ChatState,
} from '../types';
import { LocalStorageKeys, ApiEndpoints } from '../types';
import { MessageType as MessageTypeEnum } from '../types';

interface ChatAppProps {
    token: string;
    onLogout: () => void;
}

export default function ChatApp({ token, onLogout }: ChatAppProps) {
    const socketRef = React.useRef<ReturnType<typeof createSocketClient> | null>(null);
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        activeUser: null,
        users: [],
        typingUsers: [],
        isConnected: false,
        error: null,
        isLoadingMore: false,
        hasMoreMessages: true,
        searchQuery: '',
        searchResults: [],
        isSearching: false,
    });

    // Load persisted data from localStorage on mount
    useEffect(() => {
        const loadPersistedData = () => {
            try {
                const savedActiveUser = localStorage.getItem(LocalStorageKeys.ACTIVE_USER);
                const savedMessages = localStorage.getItem(LocalStorageKeys.CHAT_MESSAGES);

                if (savedActiveUser) {
                    const user = JSON.parse(savedActiveUser);
                    setChatState((prev) => ({ ...prev, activeUser: user }));
                }

                if (savedMessages) {
                    const messages = JSON.parse(savedMessages);
                    setChatState((prev) => ({ ...prev, messages }));
                }
            } catch (error) {
                console.error('Error loading persisted data:', error);
                // Clear corrupted data
                localStorage.removeItem(LocalStorageKeys.ACTIVE_USER);
                localStorage.removeItem(LocalStorageKeys.CHAT_MESSAGES);
            }
        };

        loadPersistedData();
    }, []);

    const decoded = useMemo(() => {
        if (!token || typeof token !== 'string') {
            return { username: '', sub: '' };
        }
        try {
            return jwtDecode(token) as { username?: string; sub?: string };
        } catch (error) {
            console.error('Error decoding token:', error);
            return { username: '', sub: '' };
        }
    }, [token]);
    const me = decoded?.username ?? '';
    const myId = decoded?.sub ?? '';

    useEffect(() => {
        if (!token || token.trim() === '') {
            console.warn('ChatApp: No token provided, skipping socket connection');
            return;
        }

        const s = createSocketClient(process.env.NEXT_PUBLIC_API_URL || '', token, myId);
        socketRef.current = s;
        s.connect();

        // Set up periodic heartbeat to maintain online status
        const heartbeatInterval = setInterval(() => {
            if (s.connected) {
                console.log('Sending heartbeat to maintain online status');
                s.emit('user:heartbeat', { userId: myId });
            }
        }, 30000); // Send heartbeat every 30 seconds

        // WebSocket event handlers
        const handleConnect = () => {
            console.log('Socket connected successfully');
            setChatState((prev) => ({ ...prev, isConnected: true, error: null }));
            // Emit user online status
            s.userOnline();
        };

        const handleReconnect = (data: unknown) => {
            const attemptNumber = data as number;
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setChatState((prev) => ({ ...prev, isConnected: true, error: null }));
            // Emit user online status after reconnection
            s.userOnline();
            // Refresh user list after reconnection
            setTimeout(() => {
                if (s.connected) {
                    // The users:updated event will be triggered automatically when user comes online
                    // But we can also request a fresh list if needed
                }
            }, 1000);
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setChatState((prev) => ({ ...prev, isConnected: false }));
        };

        const handleError = (error: { message: string }) => {
            if (!error || !error.message) return;
            console.error('Socket error:', error.message);
            setChatState((prev) => ({ ...prev, error: error.message, isConnected: false }));
        };

        const handleReconnectError = (error: unknown) => {
            console.error('Socket reconnection error:', error);
            setChatState((prev) => ({ ...prev, error: 'Reconnection failed. Please refresh the page.', isConnected: false }));
        };

        const handleReconnectFailed = () => {
            console.error('Socket reconnection failed permanently');
            setChatState((prev) => ({ ...prev, error: 'Connection lost. Please refresh the page.', isConnected: false }));
        };

        const handleUsersUpdated = (list: User[]) => {
            if (!list || !Array.isArray(list)) {
                console.warn('Invalid users list received:', list);
                return;
            }
            console.log('Users updated:', list.length, 'users');
            setChatState((prev) => ({ ...prev, users: list }));
        };

        const handleMessage = (m: Message) => {
            if (!m || !m._id) {
                console.warn('Invalid message received:', m);
                return;
            }
            console.log('New message received:', m._id, 'from:', m.from);
            setChatState((prev) => {
                // Check for duplicates
                if (prev.messages.find((p: Message) => String(p._id) === String(m._id))) {
                    console.log('Duplicate message ignored:', m._id);
                    return prev;
                }

                const newMessages = [...prev.messages, m];
                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(newMessages));
                return { ...prev, messages: newMessages };
            });
        };

        const handleConversation = (conv: Message[]) => {
            if (!conv || !Array.isArray(conv)) return;
            setChatState((prev) => {
                // Merge with existing messages to avoid duplicates
                const existingIds = new Set(prev.messages.map(m => String(m._id)));
                const newMessages = conv.filter(m => !existingIds.has(String(m._id)));
                const allMessages = [...prev.messages, ...newMessages];
                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(allMessages));
                return { ...prev, messages: allMessages };
            });
        };

        const handleMessagesPending = (pending: Message[]) => {
            if (!pending || !Array.isArray(pending)) return;
            setChatState((prev) => {
                // Filter out duplicates
                const existingIds = new Set(prev.messages.map(m => String(m._id)));
                const newPendingMessages = pending.filter(m => !existingIds.has(String(m._id)));
                const allMessages = [...prev.messages, ...newPendingMessages];
                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(allMessages));
                return { ...prev, messages: allMessages };
            });
        };

        const handleMessageDeleted = (p: { id: string; deletedBy: string; conversationId?: string }) => {
            if (!p || !p.id) return;
            setChatState((prev) => {
                // Remove the deleted message from state and localStorage
                const updatedMessages = prev.messages.filter((m) => String(m._id) !== String(p.id));

                // Also remove from search results if present
                const updatedSearchResults = prev.searchResults.filter((m) => String(m._id) !== String(p.id));

                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(updatedMessages));

                return {
                    ...prev,
                    messages: updatedMessages,
                    searchResults: updatedSearchResults,
                };
            });
        };

        const handleTyping = (p: TypingPayload) => {
            if (!p) {
                console.warn('Invalid typing payload received');
                return;
            }
            console.log('Typing indicator:', p.from, p.username);
            setChatState((prev) => ({ ...prev, typingUsers: [p] }));
            setTimeout(() => {
                setChatState((prev) => ({ ...prev, typingUsers: [] }));
            }, 2000);
        };

        // Register event handlers
        s.onUsersUpdated((data) => handleUsersUpdated(data.users as unknown as User[]));
        s.onMessage((data) => handleMessage(data as unknown as Message));
        s.onConversation((data) => handleConversation(data.messages as unknown as Message[]));
        s.onMessagesPending((data) => handleMessagesPending(data.messages as unknown as Message[]));
        s.onMessageDeleted(handleMessageDeleted);
        s.onTyping(handleTyping);
        s.onError(handleError);
        s.on('connect', handleConnect);
        s.on('disconnect', handleDisconnect);
        s.on('reconnect', handleReconnect);
        s.on('reconnect_error', handleReconnectError);
        s.on('reconnect_failed', handleReconnectFailed);

        // Listen for user status updates
        s.onUserStatusUpdate((statusData) => {
            if (!statusData || !statusData.userId) {
                console.warn('Invalid user status data received:', statusData);
                return;
            }
            console.log('User status updated:', statusData);
            setChatState((prev) => ({
                ...prev,
                users: prev.users.map((user) =>
                    user._id === statusData.userId ? { ...user, online: statusData.online } : user
                ),
            }));
        });

        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (s) {
                s.disconnect();
            }
        };
    }, [token]);

    const selectUser = useCallback((user: User) => {
        console.log('Selecting user:', user.username, user._id, 'online:', user.online);
        setChatState((prev) => ({
            ...prev,
            activeUser: user,
            // Keep existing messages when switching users
            hasMoreMessages: true,
            searchQuery: '',
            searchResults: [],
        }));
        // Persist active user to localStorage
        localStorage.setItem(LocalStorageKeys.ACTIVE_USER, JSON.stringify(user));

        // Always try to request conversation from database, regardless of online status
        // The backend will handle loading historical messages
        if (socketRef.current?.connected) {
            socketRef.current?.getConversation({ withUserId: user._id });
        } else {
            // If socket not connected, try to load via HTTP API as fallback
            loadConversationViaHttp(user._id);
        }
    }, []);

    const loadConversationViaHttp = useCallback(async (userId: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${ApiEndpoints.MESSAGES_CONVERSATION}?userA=${myId}&userB=${userId}&limit=50`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load conversation');
            }

            const result = await response.json();
            const messages = result.messages || [];

            setChatState((prev) => {
                // Merge with existing messages to avoid duplicates
                const existingIds = new Set(prev.messages.map(m => String(m._id)));
                const newMessages = messages.filter((m: Message) => !existingIds.has(String(m._id)));
                const allMessages = [...prev.messages, ...newMessages];
                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(allMessages));
                return {
                    ...prev,
                    messages: allMessages,
                    hasMoreMessages: messages.length === 50,
                };
            });
        } catch (error) {
            console.error('HTTP conversation load error:', error);
            setChatState((prev) => ({
                ...prev,
                error: 'Failed to load conversation. Please check your connection.',
            }));
        }
    }, [myId, token]);

    const handleLogout = useCallback(async () => {
        // Emit user offline status before disconnecting
        if (socketRef.current?.connected) {
            socketRef.current.userOffline();
        }

        // Clear localStorage
        localStorage.removeItem(LocalStorageKeys.ACTIVE_USER);
        localStorage.removeItem(LocalStorageKeys.CHAT_MESSAGES);
        localStorage.removeItem('next-auth.session-token');
        localStorage.removeItem('next-auth.callback-url');

        // Sign out from NextAuth
        await fetch('/api/auth/signout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the onLogout prop to handle routing
        onLogout();
    }, [onLogout]);

    const sendMessage = useCallback(
        (to: string, text: string, type: MessageType = MessageTypeEnum.TEXT) => {
            if (!socketRef.current?.connected) {
                console.warn('Cannot send message: Socket not connected');
                setChatState((prev) => ({ ...prev, error: 'Connection lost. Please refresh the page.' }));
                return;
            }

            // Allow sending messages to offline users - they will be delivered when they come online
            // The backend handles offline message queuing

            console.log('Sending message to:', to, 'type:', type);
            socketRef.current?.sendMessage({ to, text, type });
        },
        [chatState.users]
    );

    const sendTyping = useCallback((to: string, typing: boolean) => {
        if (!socketRef.current?.connected) {
            return; // Silently fail for typing indicators
        }
        socketRef.current?.sendTyping({ to, typing });
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (!socketRef.current?.connected) {
            console.warn('Cannot delete message: Socket not connected');
            setChatState((prev) => ({ ...prev, error: 'Connection lost. Please refresh the page.' }));
            return;
        }
        console.log('Deleting message:', id);
        socketRef.current?.deleteMessage({ id });
        // Optimistic UI update: remove immediately from state and localStorage
        setChatState((prev) => {
            const updatedMessages = prev.messages.filter((m) => String(m._id) !== String(id));
            localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(updatedMessages));
            return { ...prev, messages: updatedMessages };
        });
    }, []);

    const loadMoreMessages = useCallback(async () => {
        if (!chatState.activeUser || !chatState.hasMoreMessages || chatState.isLoadingMore) return;

        setChatState((prev) => ({ ...prev, isLoadingMore: true }));

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${ApiEndpoints.MESSAGES_CONVERSATION}?userA=${myId}&userB=${chatState.activeUser._id}&limit=50&skip=${chatState.messages.length}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load more messages');
            }

            const result = await response.json();
            const newMessages = result.messages;

            setChatState((prev) => {
                const updatedMessages = [...newMessages, ...prev.messages];
                localStorage.setItem(LocalStorageKeys.CHAT_MESSAGES, JSON.stringify(updatedMessages));
                return {
                    ...prev,
                    messages: updatedMessages,
                    hasMoreMessages: newMessages.length === 50,
                    isLoadingMore: false,
                };
            });
        } catch (error) {
            console.error('Load more messages error:', error);
            setChatState((prev) => ({
                ...prev,
                error: 'Failed to load more messages',
                isLoadingMore: false,
            }));
        }
    }, [chatState.activeUser, chatState.hasMoreMessages, chatState.isLoadingMore, chatState.messages.length, myId, token]);

    const searchMessages = useCallback(async (query: string) => {
        if (!chatState.activeUser || !query.trim()) {
            setChatState((prev) => ({ ...prev, searchQuery: '', searchResults: [] }));
            return;
        }

        setChatState((prev) => ({ ...prev, isSearching: true }));

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${ApiEndpoints.MESSAGES_SEARCH}?userA=${myId}&userB=${chatState.activeUser._id}&query=${encodeURIComponent(query)}&limit=100`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const result = await response.json();

            // Filter out any messages that have been deleted locally
            const localMessageIds = new Set(chatState.messages.map(m => String(m._id)));
            const filteredResults = result.messages.filter((msg: Message) =>
                localMessageIds.has(String(msg._id))
            );

            setChatState((prev) => ({
                ...prev,
                searchQuery: query,
                searchResults: filteredResults,
                isSearching: false,
            }));
        } catch (error) {
            console.error('Search error:', error);
            setChatState((prev) => ({
                ...prev,
                error: 'Failed to search messages',
                isSearching: false,
            }));
        }
    }, [chatState.activeUser, chatState.messages, myId, token]);

    const handleFileUpload = useCallback(
        async (file: File, to: string) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('from', myId);
            formData.append('to', to);

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}${ApiEndpoints.MESSAGES_UPLOAD}`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                // Emit the file message via socket
                socketRef.current?.sendMessage({
                    to,
                    text: result.message.fileUrl,
                    type: 'file',
                    fileName: result.message.fileName,
                    fileSize: result.message.fileSize,
                    fileType: result.message.fileType,
                });
            } catch (error) {
                console.error('File upload error:', error);
                setChatState((prev) => ({
                    ...prev,
                    error: 'Failed to upload file',
                }));
            }
        },
        [myId, token]
    );

    return (
        <div className="flex-1 flex flex-col lg:flex-row bg-transparent relative h-[calc(90vh-4px)] ">
            <div className="chat-sidebar">
                <Sidebar
                    users={chatState.users}
                    meUsername={me}
                    meId={myId}
                    onSelect={selectUser}
                    activeUser={chatState.activeUser}
                    onLogout={handleLogout}
                />
            </div>
            <div className="chat-window flex-1">
                <ChatWindow
                    messages={chatState.messages}
                    activeUser={chatState.activeUser}
                    myId={myId}
                    onSend={sendMessage}
                    onTyping={sendTyping}
                    typingFrom={chatState.typingUsers[0] || null}
                    onDelete={handleDelete}
                    onFileUpload={handleFileUpload}
                    users={chatState.users}
                    onLoadMore={loadMoreMessages}
                    isLoadingMore={chatState.isLoadingMore}
                    hasMoreMessages={chatState.hasMoreMessages}
                    onSearch={searchMessages}
                    searchQuery={chatState.searchQuery}
                    searchResults={chatState.searchResults}
                    isSearching={chatState.isSearching}
                />
            </div>
        </div>
    );
}