import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Line } from "react-konva";
import { ReactComponent as PencilIcon } from "../assets/icons/pencil.svg";
import { ReactComponent as EraserIcon } from "../assets/icons/eraser.svg";
import { ReactComponent as SendIcon } from "../assets/icons/sendmsg.svg";
import io from "socket.io-client";
import { auth } from '../lib/firebaseConfig';
import { useTheme } from "../ThemeContext";
import { SnackbarProvider, enqueueSnackbar } from "notistack";

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
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [counter, setCounter] = useState(0);
  const { theme, changeTheme } = useTheme();

  const [usersPhotoUrl, setUsersPhotoUrl] = useState([]);

  useEffect(() => {

    socket.connect();
    if (roomId) {
      enqueueSnackbar('Welcome', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' }, autoHideDuration: 2000 });


      const userIdToken = localStorage.getItem("authToken");
      console.log(userIdToken)

      socket.emit("joinRoom", { userIdToken, roomId });

      socket.on("userJoined", (data) => {
        enqueueSnackbar(data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' }, autoHideDuration: 2000 });
      });

      socket.on("roomJoined", ({ roomId: rId, userAuthkey, nickname }) => {
        setMyNickname(nickname);
        localStorage.setItem("nickname", nickname);
        setAuthKey(userAuthkey);
        localStorage.setItem("myauthkey", userAuthkey);
      })


      socket.on("recieve-message", ({ roomId, ...msg }) => {

        setMessages((prevMessages) => [...prevMessages, msg]);
      });

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

      socket.on("start-game", ({ roomId, message, currentPlayerIndex, isTurnOver }) => {
        enqueueSnackbar(message, { variant: 'default', anchorOrigin: { vertical: 'top', horizontal: 'center' }, autoHideDuration: 2000 });
        if (isTurnOver) {
          setIsMyTurn(false);
        }
        socket.emit("game-started", { roomId, userAuthkey: authKey, _currentPlayerIndex: currentPlayerIndex, isTurnOver });

      });

      socket.on("game-ended", ({ roomId, winner, score, message }) => {
        enqueueSnackbar(`${winner} won the game with ${score} points`, { variant: 'default', anchorOrigin: { vertical: 'default', horizontal: 'center' }, autoHideDuration: 2000 });
      })

      socket.on("set-counter", (timer) => {
        setCounter(timer);
      })

      socket.on('request-player-authKey', () => {

        const myAuthKey = localStorage.getItem("myauthkey");
        socket.emit("client-auth-key", myAuthKey);
      });

      socket.on("start-drawing", ({ word, roomId }) => {
        setIsMyTurn(true);
        enqueueSnackbar(`You have to draw: ${word}`, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' }, autoHideDuration: 2000 });
      })
      socket.on("drawing-started", ({ roomId, currentPlayer }) => {
        // alert(`${currentPlayer}'s turn`)
      })

      socket.on("switch-turn", ({ roomId, scores, _currentPlayerIndex }) => {
        // alert(roomId + "   this is room id");
        // alert(_currentPlayerIndex);
        console.log(scores);
        setIsMyTurn(false);
        socket.emit("switch-turn-client", { roomId, scores, _currentPlayerIndex });
      })

      socket.on("request-nickname", ((roomid) => {
        console.log('this is printed -- times')
        const sendNickname = localStorage.getItem("nickname");
        socket.emit("send-nickname", { roomId, sendNickname });
      }))

      socket.on("disconnect", (reason) => {
        socket.connect();
        const myAuthKey = localStorage.getItem("myauthkey");
        socket.emit("roomDisconnected", { roomId, myAuthKey });
        socket.emit("joinRoom", { userIdToken, roomId });
      });
      return () => {
        socket.off("roomJoined");
        socket.off("recieve-message");
        socket.off("request-nickname")
        socket.off("request-player-authKey");
        socket.off("drawing-started");
        socket.off("start-drawing");
        socket.off("start-game");
        socket.off("switch-turn");
        socket.off("request-nickname")
        socket.off("draw");
        socket.off("undo");
        socket.off("redo");
        socket.off("userJoined");
        socket.disconnect();
      };
    }
  }, [roomId]);

  const handleMouseDown = (e) => {
    if (!isMyTurn) {
      return;
    }
    else {
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
    }
  };

  const handleMouseMove = (e) => {
    if (!isMyTurn || !isDrawing.current) {
      return;
    }
    else {
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
    }
  };

  const handleMouseUp = () => {
    if (!isMyTurn) { return; }
    else { isDrawing.current = false; }
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
    socket.emit("message", messageData);
    setMessage("");
  };



  return (
    <div className={`${theme === 'light' ? 'bg-[#e6e6e6] text-black' : 'bg-black text-white'} h-screen flex`}>
      <SnackbarProvider />
      <div className="flex flex-col w-3/4 h-full p-4 ">
        <div className={`${theme === 'light' ? 'bg-[#e6e6e6] text-black' : 'bg-[#1e1e1e]'} p-4 rounded-lg shadow-lg mb-4 flex justify-between items-center`}>
          <div className="flex space-x-2">
            <button
              onClick={() => setTool("pen")}
              className={`px-4 py-2 flex rounded-md ${theme === 'light' ? 'bg-white hover:bg-[#c4c4c4]' : 'bg-[#2b2b2b] hover:bg-[#3a3a3a]'} ${tool === "pen" ? "bg-[#3a3a3a]" : "bg-[#2b2b2b]"
                } hover:bg-[#3a3a3a] transition duration-200`}
            >
              <PencilIcon className="w-6 h-6 mr-4" />
              Pencil
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-4 py-2 flex rounded-md ${theme === 'light' ? 'bg-white hover:bg-[#c4c4c4]' : 'bg-[#2b2b2b] hover:bg-[#3a3a3a]'} ${tool === "eraser" ? "bg-[#3a3a3a]" : "bg-[#2b2b2b]"
                } hover:bg-[#3a3a3a] transition duration-200`}
            >
              <EraserIcon className="w-6 h-6 mr-4" />
              Eraser
            </button>
          </div>
          <div className="flex space-x-4">
            <label className="flex items-center">
              Brush Color:
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="ml-2 border-none w-20 h-10"
              />
            </label>
            <label className="flex items-center">
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

            <div className="flex items-center font-bold">{`time: ${counter}`}</div>

          </div>
          <div className="flex space-x-2">
            <button
              onClick={undo}
              className={`px-4 py-2 rounded-md ${theme === 'light' ? 'bg-white hover:bg-[#c4c4c4]' : 'bg-[#2b2b2b] hover:bg-[#3a3a3a]'} transition duration-200`}
            >
              Undo
            </button>
            <button
              onClick={redo}
              className={`px-4 py-2 rounded-md ${theme === 'light' ? 'bg-white hover:bg-[#c4c4c4]' : 'bg-[#2b2b2b] hover:bg-[#3a3a3a]'} transition duration-200`}
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

          className='bg-white rounded-lg'
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

        <div className="flex items-center">
          <img src={usersPhotoUrl[0]} />
        </div>
      </div>
      <div className={`w-1/4 h-full ${theme === 'light' ? 'bg-white' : 'bg-[#1e1e1e]'} p-4 flex flex-col`}>
        <div className="flex-grow overflow-y-auto mb-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.nickname === myNickname ? "justify-end" : "justify-start"}`}
            >
              <div className="flex-col">
                <div className={`${msg.nickname === myNickname ? "text-right" : "text-left"} text-xs ${theme==='light'?'text-black':'text-white'}`}>
                  {msg.nickname.length > 15 ? msg.nickname.substring(0, 15) + '...' : msg.nickname}
                </div>
                <div
                  className={`${msg.nickname === myNickname
                    ? "bg-indigo-600 text-white text-right rounded-tr-none"
                    : "bg-indigo-200 text-black rounded-tl-none"
                    } min-w-36 max-w-lg shadow-lg rounded-lg p-3`}
                >
                  <div>
                    <div className="text-sm">{msg.message}</div>
                    <div className="mb-1" style={{fontSize: '10px'}}>
                      {msg.timeStamp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>
        <div className="flex items-center">
          <input
            className={`flex-grow px-5 py-3 ${theme === 'light' ? 'bg-[#e6e6e6] text-black' : 'bg-[#2b2b2b] text-white'} rounded-lg rounded-r-none p-2 focus:outline-none`}
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            disabled={isMyTurn ? true : false}
          />
          <button
            onClick={sendMessage}
            className="px-5 py-3 flex rounded-lg rounded-l-none bg-indigo-600 text-white hover:bg-indigo-800 transition duration-200"
          >
            Send
            <SendIcon className="ml-2 items-center w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Room;
