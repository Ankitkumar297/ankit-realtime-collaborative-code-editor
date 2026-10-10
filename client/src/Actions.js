const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  SYNC_CODE: 'sync-code',
  LEAVE: 'leave',
  LANGUAGE_CHANGE: 'language-change',
  CODE_RUN: 'code-run',
  CODE_OUTPUT: 'code-output',
  TERMINAL_INPUT: 'terminal-input',
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  CURSOR_CHANGE: 'cursor-change',
  FILES_UPDATE: 'files-update',
  FILES_UPDATED: 'files-updated',
  PERMISSION_CHANGE: 'permission-change',
  PERMISSIONS_UPDATED: 'permissions-updated',
  ROOM_STATE: 'room-state',
  PERMISSION_DENIED: 'permission-denied',
};

export default ACTIONS;
