import { io } from 'socket.io-client';

export const initSocket = () => {
  const options = {
    forceNew: true,
    autoConnect: false,
    reconnectionAttempts: Infinity,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['polling', 'websocket'],
  };

  const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const backendUrl = import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.PROD
      ? 'https://collaborative-code-editor-backend-s5vg.onrender.com'
      : isLocalDevelopment ? 'http://localhost:5000' : '');
  return io(backendUrl, options);
};
