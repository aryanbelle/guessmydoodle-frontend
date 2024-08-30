import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Line } from 'react-konva';
import { ReactComponent as PencilIcon } from '../assets/icons/pencil.svg';
import { ReactComponent as EraserIcon } from '../assets/icons/eraser.svg';
import io from "socket.io-client";
import { auth } from '../lib/firebaseConfig';

function Room() {
  const socket = useRef(null);
  const { roomId } = useParams();
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const isDrawing = useRef(false);

  useEffect(() => {
    const getIdToken = async () => {
      socket.current = io('http://localhost:5000');
      const userIdToken = await auth.currentUser.getIdToken();

      const joinData = { userIdToken, roomId };
      if (roomId) {
        socket.current.emit('joinRoom', joinData);

        socket.current.on('userJoined', (data) => {
          alert(data.message);
        });

        socket.current.on('draw', ({ roomId: rId, line }) => {
          if (rId === roomId) {
            setLines((prevLines) => [...prevLines, line]);
          }
        });

        socket.current.on('undo', ({ roomId: rId, updatedLines }) => {
          if (rId === roomId) {
            setLines(updatedLines);
          }
        });

        socket.current.on('redo', ({ roomId: rId, updatedLines }) => {
          if (rId === roomId) {
            setLines(updatedLines);
          }
        });

        socket.current.on('message', (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
          socket.current.off('draw');
          socket.current.off('undo');
          socket.current.off('redo');
          socket.current.off('userJoined');
          socket.current.off('message');
          socket.current.disconnect();
        };
      }
    }
    getIdToken();
  }, [roomId]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      const newLine = {
        tool,
        points: [pos.x, pos.y],
        color: tool === 'eraser' ? '#0a0a0a' : brushColor,
        size: brushSize,
      };
      setLines([...lines, newLine]);
      setUndoStack([...undoStack, lines]);
      setRedoStack([]);
      socket.current.emit('draw', { roomId, line: newLine });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || lines.length === 0) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      const newLines = prevLines.slice(0, prevLines.length - 1).concat(lastLine);
      socket.current.emit('draw', { roomId, line: lastLine });
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
    socket.current.emit('undo', { roomId, updatedLines: previousState });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.shift();
    setUndoStack([...undoStack, lines]);
    setLines(nextState);
    socket.current.emit('redo', { roomId, updatedLines: nextState });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.current.emit('message', { roomId, message: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div className='bg-[#0a0a0a] h-screen flex'>
      {/* Drawing Area */}
      <div className='flex-grow w-[70%] flex flex-col'>
        <div className='bg-[#1e1e1e] p-4 shadow-lg flex justify-between items-center'>
          <div className='flex space-x-2'>
            <button
              onClick={() => setTool('pen')}
              className='px-4 py-2 flex rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200'
            >
              <PencilIcon className="w-6 h-6 mr-4" />
              Pencil
            </button>
            <button
              onClick={() => setTool('eraser')}
              className='px-4 py-2 flex rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200'
            >
              <EraserIcon className="w-6 h-6 mr-4" />
              Eraser
            </button>
          </div>
          <div className='flex space-x-4'>
            <label className='flex items-center text-gray-300'>
              Brush Color:
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className='ml-2'
              />
            </label>
            <label className='flex items-center text-gray-300'>
              Brush Size:
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className='ml-2'
              />
            </label>
          </div>
          <div className='flex space-x-2 mt-4'>
            <button
              onClick={undo}
              className='px-4 py-2 rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200'
            >
              Undo
            </button>
            <button
              onClick={redo}
              className='px-4 py-2 rounded-md text-white bg-[#2b2b2b] hover:bg-[#3a3a3a] transition duration-200'
            >
              Redo
            </button>
          </div>
        </div>
        <Stage
          width={window.innerWidth - 462} // Adjust width based on the chat panel width
          height={window.innerHeight - 120} // Adjust height based on the tools panel height
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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

      {/* Chat Panel */}
      <div className='w-[30%] bg-[#1e1e1e] p-6 flex flex-col'>
        <h2 className='text-xl font-bold mb-4 text-gray-300'>Chat</h2>
        <hr />
        <div className='flex-1 overflow-y-auto mb-4'>
          {/* Display messages */}
          <div className='space-y-2'>
            {messages.map((msg, index) => (
              <div key={index} className='bg-[#2b2b2b] p-2 rounded-md'>
                <p className='text-gray-300'>{msg}</p>
              </div>
            ))}
          </div>
        </div>
        <div className='flex'>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className='bg-[#3a3a3a] text-white flex-grow p-2 rounded-l-md border-none outline-none'
          />
          <button
            onClick={sendMessage}
            className='bg-[#2b2b2b] p-2 rounded-r-md text-white hover:bg-[#1b1b1b] transition duration-200'
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Room;
