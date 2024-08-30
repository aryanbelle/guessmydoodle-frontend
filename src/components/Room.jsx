import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Line } from 'react-konva';
import { ReactComponent as PencilIcon } from '../assets/icons/pencil.svg';
import { ReactComponent as EraserIcon } from '../assets/icons/eraser.svg';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function Room() {
  const { roomId } = useParams();
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (roomId) {
      const userIdToken = localStorage.getItem("authToken");
      socket.emit('joinRoom', { userIdToken, roomId });

      socket.on('userJoined', (data) => {
        alert(data.message);
      });

      socket.on('draw', ({ roomId: rId, line }) => {
        if (rId === roomId) {
          setLines((prevLines) => [...prevLines, line]);
        }
      });

      socket.on('undo', ({ roomId: rId, updatedLines }) => {
        if (rId === roomId) {
          setLines(updatedLines);
        }
      });

      socket.on('redo', ({ roomId: rId, updatedLines }) => {
        if (rId === roomId) {
          setLines(updatedLines);
        }
      });

      return () => {
        socket.off('draw');
        socket.off('undo');
        socket.off('redo');
        socket.off('userJoined');
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
        color: tool === 'eraser' ? '#0a0a0a' : brushColor, // Set the color to background color when using eraser
        size: brushSize,
      };
      setLines([...lines, newLine]);
      setUndoStack([...undoStack, lines]);
      setRedoStack([]);
      socket.emit('draw', { roomId, line: newLine });
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

      const newLines = prevLines.slice(0, prevLines.length - 1).concat(lastLine);
      socket.emit('draw', { roomId, line: lastLine });
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
    socket.emit('undo', { roomId, updatedLines: previousState });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.shift();
    setUndoStack([...undoStack, lines]);
    setLines(nextState);
    socket.emit('redo', { roomId, updatedLines: nextState });
  };

  return (
    <div className='bg-[#0a0a0a] h-screen flex'>
      <div className='flex flex-col h-[25vh] flex-grow p-4'>
        <div className='bg-[#1e1e1e] p-4 rounded-lg shadow-lg mb-4 flex justify-between items-center'>
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
          width={window.innerWidth}
          height={window.innerHeight}
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
    </div>
  );
}

export default Room;
