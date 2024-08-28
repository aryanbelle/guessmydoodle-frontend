import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { ReactComponent as PencilIcon } from '../assets/icons/pencil.svg';
import {ReactComponent as EraserIcon} from "../assets/icons/eraser.svg";
function Room() {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [brushColor, setBrushColor] = useState('#ffffff'); // Default brush color to white
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setUndoStack([...undoStack, lines]); // Save current state to undo stack
    setRedoStack([]); // Clear redo stack on new drawing
    setLines([...lines, { tool, points: [pos.x, pos.y], color: brushColor, size: brushSize }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack([lines, ...redoStack]); // Save current state to redo stack
    setLines(previousState);
    setUndoStack(undoStack.slice(0, -1)); // Remove last state from undo stack
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setUndoStack([...undoStack, lines]); // Save current state to undo stack
    setLines(nextState);
    setRedoStack(redoStack.slice(1)); // Remove first state from redo stack
  };

  return (
    <div className='bg-[#0a0a0a] h-screen flex'>
      {/* Drawing Area */}
      <div className='flex flex-col h-[25vh] flex-grow p-4'>
        {/* Drawing Tools */}
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

        {/* Canvas */}
        <div className='flex-grow h-[60vh]'>
          <Stage
            width={window.innerWidth * 2 / 3} // Adjust width based on window size
            height={window.innerHeight - 145} // Adjust height based on window size and control area height
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            style={{ border: '2px solid #333', backgroundColor: '#1e1e1e', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)' }}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.tool === 'eraser' ? '#1e1e1e' : line.color}
                  strokeWidth={line.size}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Chat Area */}
      <div className='w-full md:w-1/3 h-full bg-[#1e1e1e] p-6 text-gray-300'>
        <h2 className='text-xl font-bold mb-4'>Chat</h2>
        {/* Placeholder for chat functionality */}
        <div className='border-t border-gray-600 pt-4'>
          <p>No chat functionality implemented yet.</p>
        </div>
      </div>
    </div>
  );
}

export default Room;
