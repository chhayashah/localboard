import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

let socket: Socket | null = null;

export const connectSocket = (userId: string, ward: string): Socket => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
  socket.on('connect', () => {
    console.log('🔌 Connected');
    socket?.emit('join', { userId, ward });
  });
  return socket;
};

export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
export const getSocket = () => socket;