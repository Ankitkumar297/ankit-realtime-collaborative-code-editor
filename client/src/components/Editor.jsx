import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/scroll/scrollpastend';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/hint/anyword-hint';
import ACTIONS from '../Actions';

const getMode = (language) => {
  switch (language) {
    case 'python': return 'python';
    case 'c': return 'text/x-csrc';
    case 'cpp':
    case 'c++': return 'text/x-c++src';
    case 'java': return 'text/x-java';
    case 'typescript': return 'application/typescript';
    case 'csharp': return 'text/x-csharp';
    case 'node':
    case 'javascript': return 'javascript';
    default: return 'javascript';
  }
};

const Editor = ({ socket, roomId, activeFile, onCodeChange, canEdit }) => {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const propsRef = useRef({});
  const remoteCursorsRef = useRef(new Map());
  const cursorMarksRef = useRef([]);
  const redrawRemoteCursorsRef = useRef(() => {});
  propsRef.current = { socket, roomId, activeFile, onCodeChange, canEdit };

  useEffect(() => {
    if (!textareaRef.current) return undefined;

    const editor = Codemirror.fromTextArea(textareaRef.current, {
      mode: getMode(propsRef.current.activeFile?.language),
      theme: 'dracula',
      autoCloseBrackets: true,
      matchBrackets: true,
      lineNumbers: true,
      styleActiveLine: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
      },
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      smartIndent: true,
      lineWrapping: true,
      scrollPastEnd: true,
      readOnly: !propsRef.current.canEdit,
    });
    editorRef.current = editor;

    const clearCursorMarks = () => {
      cursorMarksRef.current.forEach((mark) => mark.clear());
      cursorMarksRef.current = [];
    };

    const drawRemoteCursors = () => {
      clearCursorMarks();
      const fileId = propsRef.current.activeFile?.id;
      if (!fileId) return;

      remoteCursorsRef.current.forEach((cursor) => {
        if (cursor.fileId !== fileId) return;
        const color = cursor.color || '#8be9fd';
        const anchor = editor.clipPos(cursor.anchor);
        const head = editor.clipPos(cursor.head);
        if (editor.comparePos(anchor, head) !== 0) {
          const from = editor.comparePos(anchor, head) < 0 ? anchor : head;
          const to = editor.comparePos(anchor, head) < 0 ? head : anchor;
          cursorMarksRef.current.push(editor.markText(from, to, {
            className: 'remote-selection',
            css: `background-color: ${color}; opacity: 0.24;`,
          }));
        }

        const caret = document.createElement('span');
        caret.className = 'remote-cursor-caret';
        caret.style.borderColor = color;
        caret.setAttribute('aria-label', `${cursor.username || 'Collaborator'} cursor`);
        const label = document.createElement('span');
        label.className = 'remote-cursor-label';
        label.style.backgroundColor = color;
        label.textContent = cursor.username || 'Collaborator';
        caret.appendChild(label);
        cursorMarksRef.current.push(editor.setBookmark(head, {
          widget: caret,
          insertLeft: true,
        }));
      });
    };
    redrawRemoteCursorsRef.current = drawRemoteCursors;

    const updateCursor = () => {
      const { socket: currentSocket, roomId: currentRoomId, activeFile: file } = propsRef.current;
      if (!currentSocket?.connected || !file) return;
      const selection = editor.listSelections()[0];
      currentSocket.emit(ACTIONS.CURSOR_CHANGE, {
        roomId: currentRoomId,
        fileId: file.id,
        anchor: selection.anchor,
        head: selection.head,
      });
    };

    const handleCursorChange = (cursor) => {
      if (cursor.socketId === propsRef.current.socket?.id) return;
      if (!cursor.fileId) remoteCursorsRef.current.delete(cursor.socketId);
      else remoteCursorsRef.current.set(cursor.socketId, cursor);
      drawRemoteCursors();
    };

    const handleJoined = ({ socketId, room }) => {
      if (socketId !== propsRef.current.socket?.id) return;
      remoteCursorsRef.current = new Map(
        (room?.cursors || []).map((cursor) => [cursor.socketId, cursor]),
      );
      drawRemoteCursors();
    };

    const handleDisconnected = ({ socketId }) => {
      remoteCursorsRef.current.delete(socketId);
      drawRemoteCursors();
    };

    const handleCodeChange = ({ fileId, code }) => {
      if (fileId !== propsRef.current.activeFile?.id || typeof code !== 'string') return;
      if (editor.getValue() !== code) editor.setValue(code);
    };

    const changeHandler = (instance, change) => {
      const current = propsRef.current;
      const code = instance.getValue();
      current.onCodeChange?.(current.activeFile?.id, code);
      if (change.origin !== 'setValue' && current.canEdit && current.activeFile) {
        current.socket?.emit(ACTIONS.CODE_CHANGE, {
          roomId: current.roomId,
          fileId: current.activeFile.id,
          code,
        });
      }
    };

    editor.on('change', changeHandler);
    editor.on('cursorActivity', updateCursor);
    if (socket) {
      socket.on(ACTIONS.CURSOR_CHANGE, handleCursorChange);
      socket.on(ACTIONS.JOINED, handleJoined);
      socket.on(ACTIONS.DISCONNECTED, handleDisconnected);
      socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    }

    return () => {
      editor.off('change', changeHandler);
      editor.off('cursorActivity', updateCursor);
      socket?.off(ACTIONS.CURSOR_CHANGE, handleCursorChange);
      socket?.off(ACTIONS.JOINED, handleJoined);
      socket?.off(ACTIONS.DISCONNECTED, handleDisconnected);
      socket?.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      clearCursorMarks();
      remoteCursorsRef.current.clear();
      redrawRemoteCursorsRef.current = () => {};
      editor.toTextArea();
      editorRef.current = null;
    };
  }, [socket]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setOption('readOnly', !canEdit);
    editor.setOption('mode', getMode(activeFile?.language));
  }, [activeFile?.language, canEdit]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const code = activeFile?.code || '';
    if (editor.getValue() !== code) editor.setValue(code);
    redrawRemoteCursorsRef.current();
  }, [activeFile?.id, activeFile?.code]);

  return <textarea id="realtimeEditor" ref={textareaRef} />;
};

export default Editor;
