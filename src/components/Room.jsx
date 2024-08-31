import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Line } from "react-konva";
import { ReactComponent as PencilIcon } from "../assets/icons/pencil.svg";
import { ReactComponent as EraserIcon } from "../assets/icons/eraser.svg";
import io from "socket.io-client";
import { auth } from '../lib/firebaseConfig';

const socket = io("http://localhost:5000");

function Room() {
  const { roomId } = useParams();
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState([]);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [myNickname, setMyNickname] = useState(null);
  const [isMsgFromMe, setIsMsgFromMe] = useState(false);
  const [authKey, setAuthKey] = useState(null);
  const isDrawing = useRef(false);

  useEffect(() => {

    if (roomId) {
      socket.connect();

      const userIdToken = localStorage.getItem("authToken");

      socket.emit("joinRoom", { userIdToken, roomId });
      socket.on("userJoined", (data) => {

      });

      socket.on("roomJoined", ({ roomId: rId, userAuthkey, nickname }) => {
        setMyNickname(nickname);
        setAuthKey(userAuthkey);
      })

      socket.on("recieve-message", ({ roomId, ...msg }) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      })

      socket.on("draw", ({ roomId: rId, line }) => {
        if (rId === roomId) {
          setLines((prevLines) => [...prevLines, line]);
        }
      });

      socket.on("undo", ({ roomId: rId, updatedLines }) => {
        if (rId === roomId) {
          setLines(updatedLines);
        }
      });

      socket.on("redo", ({ roomId: rId, updatedLines }) => {
        if (rId === roomId) {
          setLines(updatedLines);
        }
      });

      socket.on("start-game", ({ roomId, message }) => {

        // 


      });

      socket.on("disconnect", (reason) => {
        if (socket.active) {
          socket.connect();
        } else {
          // alert("room disconnected");
        }
      });

      return () => {
        socket.off("start-game");
        socket.off("draw");
        socket.off("undo");
        socket.off("redo");
        socket.off("message");
        socket.off("userJoined");
        socket.disconnect();
      };
    }
  }, [roomId]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      const newLine = {
        tool,
        points: [pos.x, pos.y],
        color: tool === "eraser" ? "#0a0a0a" : brushColor,
        size: brushSize,
      };
      setLines([...lines, newLine]);
      setUndoStack([...undoStack, lines]);
      setRedoStack([]);
      socket.emit("draw", { roomId, line: newLine });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      const newLines = prevLines
        .slice(0, prevLines.length - 1)
        .concat(lastLine);
      socket.emit("draw", { roomId, line: lastLine });
      return newLines;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();
    setRedoStack([lines, ...redoStack]);
    setLines(previousState);
    socket.emit("undo", { roomId, updatedLines: previousState });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.shift();
    setUndoStack([...undoStack, lines]);
    setLines(nextState);
    socket.emit("redo", { roomId, updatedLines: nextState });
  };

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      roomId,
      message,
      userAuthkey: authKey
    };
    // alert(myNickname)
    // console.log(messages);


    socket.emit("message", messageData);
    setMessage("");
  };


  return (
    <div className="bg-[#0a0a0a] h-screen flex">
      <div className="flex flex-col w-3/4 h-full p-4">
        <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-lg mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setTool("pen")}
              className={`px-4 py-2 flex rounded-md text-white ${tool === "pen" ? "bg-[#3a3a3a]" : "bg-[#2b2b2b]"
                } hover:bg-[#3a3a3a] transition duration-200`}
            >
              <PencilIcon className="w-6 h-6 mr-4" />
              Pencil
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-4 py-2 flex rounded-md text-white ${tool === "eraser" ? "bg-[#3a3a3a]" : "bg-[#2b2b2b]"
                } hover:bg-[#3a3a3a] transition duration-200`}
            >
              <EraserIcon className="w-6 h-6 mr-4" />
              Eraser
            </button>
          </div>
          <div className="flex space-x-4">
            <label className="flex items-center text-gray-300">
              Brush Color:
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="ml-2"
              />
            </label>
            <label className="flex items-center text-gray-300">
              Brush Size:
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="ml-2"
              />
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={undo}
              className="px-4 py-2 rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="px-4 py-2 rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200"
            >
              Redo
            </button>
          </div>
        </div>
        <Stage
          width={window.innerWidth * 0.75} // 75% of the screen width
          height={window.innerHeight * 0.75} // Adjust height accordingly
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-[#0a0a0a] rounded-lg"
        >
          <Layer>
            {lines.map((line, index) => (
              <Line
                key={index}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="w-1/4 h-full bg-[#1e1e1e] p-4 flex flex-col">
        <div className="flex-grow overflow-y-auto mb-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.nickname === myNickname ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${msg.nickname === myNickname
                  ? "bg-violet-800 text-white text-right"
                  : "bg-[#4b4b4b] text-white font-medium"
                  } min-w-25 max-w-sm rounded-lg p-2`}
              >
                <div>
                  <div className="text-xs">
                    {msg.nickname.length > 15 ? msg.nickname.substring(0, 15) + '...' : msg.nickname}
                  </div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs mb-1">
                    {msg.timeStamp}
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>
        <div className="flex items-center">
          <input
            className="flex-grow bg-[#2b2b2b] text-white rounded-lg rounded-r-none p-2 focus:outline-none"
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-lg rounded-l-none bg-indigo-600 text-white hover:bg-indigo-800 transition duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Room;
