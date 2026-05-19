/**
 * Socket.io Client
 *
 * Connects to backend Socket.io server for realtime updates
 */

import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3011'

let socket: Socket | null = null

export function connectSocket(): Socket {
	if (socket?.connected) {
		return socket
	}

	const token = localStorage.getItem('scalechat_token')
	const appId = localStorage.getItem('scalechat_app_id')

	socket = io(SOCKET_URL, {
		autoConnect: true,
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionAttempts: 5,
		transports: ['websocket'],
		auth: {
			token,
			appId,
		},
	})

	socket.on('connect', () => {
		console.log('[Socket.io] Connected:', socket?.id)
	})

	socket.on('disconnect', () => {
		console.log('[Socket.io] Disconnected')
	})

	socket.on('connect_error', (error) => {
		console.error('[Socket.io] Connection error:', error)
	})

	return socket
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect()
		socket = null
	}
}

export function getSocket(): Socket | null {
	return socket
}

// Event listeners
export function onConversationCreated(callback: (conversation: any) => void) {
	socket?.on('conversation:created', callback)
}

export function onMessageCreated(
	callback: (data: { message: any; conversation: any }) => void,
) {
	socket?.on('message:created', callback)
}

export function onConversationStatusChanged(
	callback: (conversation: any) => void,
) {
	socket?.on('conversation:status_changed', callback)
}

export function onConversationUpdated(callback: (conversation: any) => void) {
	socket?.on('conversation:updated', callback)
}

export function onAISuggestion(
	callback: (data: {
		conversationId: string
		messageId: string
		suggestion: string
		analysis: any
	}) => void,
) {
	socket?.on('ai:suggestion', callback)
}

export function onAgentPresence(
	callback: (data: { userId: string; status: 'online' | 'offline' }) => void,
) {
	socket?.on('agent:presence', callback)
}

// Room management
export function joinConversation(conversationId: string) {
	socket?.emit('join:conversation', conversationId)
}

export function leaveConversation(conversationId: string) {
	socket?.emit('leave:conversation', conversationId)
}

// Cleanup
export function removeAllListeners() {
	socket?.removeAllListeners('conversation:created')
	socket?.removeAllListeners('message:created')
	socket?.removeAllListeners('conversation:status_changed')
	socket?.removeAllListeners('conversation:updated')
	socket?.removeAllListeners('ai:suggestion')
	socket?.removeAllListeners('agent:presence')
}
