export enum MessageType {
    TEXT = 'text',
    EMOJI = 'emoji',
    GIF = 'gif',
    STICKER = 'sticker',
    FILE = 'file',
    LOCATION = 'location',
    WEBVIEW = 'webview',
}

export interface User {
    _id: string;
    username: string;
    avatar?: string;
    online: boolean;
    lastSeen: Date;
    createdAt?: Date;
    updatedAt?: Date;
    lastMessage?: Message;
    unreadCount?: number;
    passwordHash?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface Message {
    _id: string;
    from: string | User;
    to: string | User;
    type: MessageType;
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    latitude?: number;
    longitude?: number;
    isLive?: boolean;
    webUrl?: string;
    webTitle?: string;
    webDescription?: string;
    webImageUrl?: string;
    createdAt: Date;
    updatedAt?: Date;
    delivered: boolean;
    seen: boolean;
    deletedBy?: string[];
    replyTo?: string | Message;
    replyText?: string;
    groupId?: string;
    encryptedContent?: string;
    encryptionKey?: string;
    iv?: string;
    tag?: string;
    readBy?: Map<string, boolean>;
}

export interface TypingPayload {
    from: string;
    username: string;
    typing?: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

export interface ChatState {
  messages: Message[];
  activeUser: User | null;
  users: User[];
  typingUsers: TypingPayload[];
  isConnected: boolean;
  error: string | null;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  searchQuery: string;
  searchResults: Message[];
  isSearching: boolean;
}

export const LocalStorageKeys = {
  ACTIVE_USER: 'activeUser',
  CHAT_MESSAGES: 'chatMessages',
} as const;

export const WebSocketEvents = {
  USERS_UPDATED: 'users:updated',
  MESSAGE: 'message',
  CONVERSATION: 'conversation',
  GROUP_CONVERSATION: 'group:conversation',
  MESSAGES_PENDING: 'messages:pending',
  MESSAGE_DELETED: 'message:deleted',
  TYPING: 'typing',
  GET_CONVERSATION: 'get:conversation',
  GET_GROUP_CONVERSATION: 'get:group:conversation',
  DELETE_MESSAGE: 'delete:message',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  USER_HEARTBEAT: 'user:heartbeat',
  USER_STATUS_UPDATE: 'userStatusUpdate',
  LOCATION: 'location',
  WEBVIEW: 'webview',
  ERROR: 'error',
} as const;

export const ApiEndpoints = {
  MESSAGES_CONVERSATION: '/messages/conversation',
  MESSAGES_SEARCH: '/messages/conversation/search',
  MESSAGES_UPLOAD: '/messages/upload',
} as const;

export interface MessageInput {
    to: string;
    text: string;
    type?: MessageType;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    groupId?: string;
}

export interface LocationInput {
    to: string;
    latitude: number;
    longitude: number;
    isLive?: boolean;
}

export interface WebViewInput {
    to: string;
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
}

export interface TypingInput {
    to: string;
    typing: boolean;
}

export interface DeleteMessageInput {
    id: string;
}

export interface GetConversationInput {
    withUserId: string;
}

export interface GetGroupConversationInput {
    groupId: string;
}

export interface FileUploadResponse {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}