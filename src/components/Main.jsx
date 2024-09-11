import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { SnackbarProvider, enqueueSnackbar } from 'notistack'

const socket = io("http://localhost:5000");

function Main() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { theme, changeTheme } = useTheme();

  useEffect(() => {
    socket.connect();
    socket.on("fetchRooms", (rooms) => {
      const activeRooms = Object.values(rooms).filter(
        (room) => room.creator && room.users.length > 0
      );
      setRooms(activeRooms);
    });

    socket.on("deleteRoom", (roomId) => {
      setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
    });

    socket.on("roomCreated", (room) => {
      setRooms((prevRooms) => [...prevRooms, room]);
      
      navigate(`/room/${room.id}`);
    });

    socket.on("roomJoined", (room) => {
      navigate(`/room/${room.id}`);
    });

    socket.on('roomCreateError',(data)=>{
      enqueueSnackbar(data.message, {variant:'error', anchorOrigin: {vertical: 'top', horizontal: 'center'}, autoHideDuration: 2000});
    })

    socket.on('roomJoinError',(data)=>{
      enqueueSnackbar(data.message, {variant:'error', anchorOrigin: {vertical: 'top', horizontal: 'center'}, autoHideDuration: 2000});
    })

    socket.on("disconnect",()=>{
      socket.connect();
    })

    return () => {
      socket.off("fetchRooms");
      socket.off("deleteRoom");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.disconnect();
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    const userIdToken = localStorage.getItem("authToken");
    const roomData = {
      userIdToken,
      roomName,
      isPrivate,
      password: isPrivate ? password : null,
    };
    socket.emit("createRoom", roomData);
    setIsModalOpen(false);
  };

  const handleJoinRoom = () => {
    const userIdToken = localStorage.getItem("authToken");
    const joinData = {
      roomId: joinRoomId,
      password: joinPassword,
      userIdToken,
    };
    socket.emit("joinRoom", joinData);
    setIsJoinModalOpen(false);
  };

  return (
    <div
      className={`${theme === "light" ? "bg-[#e6e6e6] text-black" : "bg-black text-white"
        } h-screen flex justify-center items-center p-4`}
      style={{ fontFamily: "Orbitron" }}
      >
      <SnackbarProvider/>
      {/* Main container */}
      <div
        className={`${theme === "light" ? "bg-[#f4f4f4] shadow-md" : "bg-[#1a1a1a] border-gray-700"
          } w-[80vw] h-[90vh] grid grid-cols-1 md:grid-cols-[70%,30%] gap-6 border p-6 rounded-lg`}
        style={{
          background: `${theme === "light" ? "#f4f4f4" : "linear-gradient(145deg, #1b1b1b, #0e0e0e)"
            }`,
        }}
      >
        <div className="flex flex-col p-4">
          <h2
            className={`text-2xl font-semibold mb-4 ${theme === "light" ? "text-black" : "text-[#f4f4f4]"
              }`}
          >
            ROOMS
          </h2>
          <div className="space-y-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`${theme === "light" ? "bg-white" : "bg-[#2b2b2b]"
                  } p-4 rounded-md shadow-md`}
              >
                <a href={`/room/${room.id}`}>
                  <div>
                    <p>
                      <strong>Room ID:</strong> {room.id}
                    </p>
                    <p>
                      <strong>Creator:</strong> {room.creator}
                    </p>
                    <p>
                      <strong>Number of Users:</strong> {room.users.length}
                    </p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between h-full p-4">
          <div className="flex flex-col justify-center flex-1 items-center space-y-4">
            <button
              className={`w-[70%] p-4 ${theme === "light" ? "bg-indigo-600 hover:bg-indigo-800 text-white" : "bg-indigo-600 hover:bg-indigo-800 text-white"
                } rounded-md transition duration-300`}
              onClick={() => setIsModalOpen(true)}
            >
              Create Room
            </button>
            <button
              className={`w-[70%] p-4 ${theme === "light" ? "bg-white border-2 border-indigo-600" : "bg-[#2b2b2b] hover:bg-[#3a3a3a]"
                } rounded-md transition duration-300`}
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join Room
            </button>
          </div>

          <div className="flex flex-col space-y-4 items-center">
            <button
              className={`w-[70%] p-4 ${theme === "light" ? "bg-[#e0e0e0] hover:bg-[#b5b5b5]" : "bg-[#2b2b2b] hover:bg-[#3a3a3a]"
                } rounded-md transition duration-300`}
            >
              View Profile
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={`w-[70%] p-4 ${theme === "light" ? "bg-[#e0e0e0] hover:bg-[#b5b5b5]" : "bg-[#2b2b2b] hover:bg-[#3a3a3a]"
                } rounded-md transition duration-300`}
            >
              Settings
            </button>
            <button
              className={`w-[70%] p-4 ${theme === "light" ? "bg-[#e0e0e0] hover:bg-[#b5b5b5]" : "bg-[#2b2b2b] hover:bg-[#3a3a3a]"
                } rounded-md transition duration-300`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`${theme === "light" ? "bg-[#f4f4f4] text-black" : "bg-[#1a1a1a] text-white"
              } p-6 rounded-lg w-[90vw] md:w-[40vw] text-center`}
            style={{
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
              transform: "scale(0.95)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">Settings</h2>
            <div className="mt-20 mb-20 flex items-center justify-center">
              <div className="text-xl mr-4">Set theme:</div>
              <select
                id="theme"
                value={theme}
                className={`p-3 ${theme === "light"
                  ? "bg-white border-gray-400 text-black"
                  : "bg-[#2b2b2b] border-gray-600 text-white"
                  } rounded focus:outline-none border-gray-600 shadow-md transition duration-300 border`}
                onChange={(e) => changeTheme(e.target.value)}
              >
                <option value="" disabled>
                  Select theme
                </option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                className={`p-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-800 transition duration-300 w-40`}
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating a Room */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`${theme === "light" ? "bg-[#f4f4f4] text-black" : "bg-[#1a1a1a] text-white"
              } p-6 rounded-lg w-[90vw] md:w-[40vw]`}
            style={{
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
              transform: "scale(0.95)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">Create a Room</h2>
            <input
              className={`w-full p-3 mb-4 rounded ${theme === "light"
                ? "bg-white border border-gray-400 text-black"
                : "bg-[#2b2b2b] border border-gray-600 text-white"
                } focus:outline-none focus:border-gray-600 transition duration-300`}
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                className="mr-2"
                checked={isPrivate}
                onChange={() => setIsPrivate((prev) => !prev)}
              />
              <label htmlFor="isPrivate" className="cursor-pointer">
                Private Room
              </label>
            </div>
            {isPrivate && (
              <input
                className={`w-full p-3 mb-4 rounded ${theme === "light"
                  ? "bg-white border border-gray-400 text-black"
                  : "bg-[#2b2b2b] border border-gray-600 text-white"
                  } focus:outline-none focus:border-gray-600 transition duration-300`}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
            <div className="flex justify-center space-x-4">
              <button
                className={`p-2 ${theme === "light" ? "bg-gray-200" : "bg-[#2b2b2b]"
                  } rounded-md hover:bg-gray-300 transition duration-300`}
                onClick={handleCreateRoom}
              >
                Create
              </button>
              <button
                className={`p-2 ${theme === "light" ? "bg-gray-200" : "bg-[#2b2b2b]"
                  } rounded-md hover:bg-gray-300 transition duration-300`}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Joining a Room */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`${theme === "light" ? "bg-[#f4f4f4] text-black" : "bg-[#1a1a1a] text-white"
              } p-6 rounded-lg w-[90vw] md:w-[40vw]`}
            style={{
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
              transform: "scale(0.95)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">Join a Room</h2>
            <input
              className={`w-full p-3 mb-4 rounded ${theme === "light"
                ? "bg-white border border-gray-400 text-black"
                : "bg-[#2b2b2b] border border-gray-600 text-white"
                } focus:outline-none focus:border-gray-600 transition duration-300`}
              type="text"
              placeholder="Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <input
              className={`w-full p-3 mb-4 rounded ${theme === "light"
                ? "bg-white border border-gray-400 text-black"
                : "bg-[#2b2b2b] border border-gray-600 text-white"
                } focus:outline-none focus:border-gray-600 transition duration-300`}
              type="password"
              placeholder="Password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
            />
            <div className="flex justify-center space-x-4">
              <button
                className={`p-2 ${theme === "light" ? "bg-gray-200" : "bg-[#2b2b2b]"
                  } rounded-md hover:bg-gray-300 transition duration-300`}
                onClick={handleJoinRoom}
              >
                Join
              </button>
              <button
                className={`p-2 ${theme === "light" ? "bg-gray-200" : "bg-[#2b2b2b]"
                  } rounded-md hover:bg-gray-300 transition duration-300`}
                onClick={() => setIsJoinModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Main;
