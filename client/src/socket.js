import { io } from 'socket.io-client';

export const initSocket = async () => {
  const options = {
    'force new connection': true,
    reconnectionAttempts: Infinity,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  };

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.PROD
      ? 'https://collaborative-code-editor-backend-s5vg.onrender.com'
      : '');
  return io(backendUrl, options);
};
