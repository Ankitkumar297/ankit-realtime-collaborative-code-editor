import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const hasJoined = useRef(false);
  const codeRef = useRef(null);

  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  // ✅ Leave button handler
  const handleLeave = () => {
    socketRef.current.emit(ACTIONS.LEAVE, {
      roomId,
      username: location.state?.username,
    });

    socketRef.current.disconnect();
    reactNavigator("/");
  };

  useEffect(() => {
    if (hasJoined.current) return;
    hasJoined.current = true;

    function handleErrors(e) {
      console.log("socket error", e);
      toast.error("Socket connection failed");
      reactNavigator("/");
    }

    const init = async () => {
      socketRef.current = await initSocket();

      if (!socketRef.current) return;

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      // ✅ FIXED JOINED EVENT
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        // toast only for others
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room.`);
        }

        setClients(clients);

        // ✅ MOST IMPORTANT LINE (SYNC CODE)
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          socketId,
          code: codeRef.current,
        });
      });

      // JOIN
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // DISCONNECT
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId)
        );
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.SYNC_CODE); // ✅ added
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.log(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <h3>Connected</h3>
          <div className="clientList">
            {clients.map((client) => (
              <Client
                key={client.socketId}
                username={client.username}
              />
            ))}
          </div>
        </div>

        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>

        <button className="btn leaveBtn" onClick={handleLeave}>
          Leave
        </button>
      </div>

      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code; // ✅ already correct
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;