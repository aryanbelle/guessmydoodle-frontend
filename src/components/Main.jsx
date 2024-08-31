import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

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
  const [message, setMessage] = useState(null);

  useEffect(() => {

    socket.on("roomCreated", (room) => {
      // console.log("Room created:", room);
      navigate(`/room/${room.id}`);
    });

    socket.on("roomJoined", (room) => {
      // console.log("Joined room:", room);
      navigate(`/room/${room.id}`);
    });

    socket.on("roomJoinError", (data) => {
      // alert(data.message);
    });

    socket.on("disconnect", (reason) => {
      if (socket.active) {
        // alert('temparory disconnected')
      } else {
        // alert('main disconnected')
      }
    })

    // Cleanup event listeners on component unmount
    return () => {
      // socket.off("userJoined");
      socket.off("roomJoinError");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.disconnect();
    };
  }, [navigate]);

  const handleCreateRoom = async () => {
    const userIdToken = localStorage.getItem("authToken");
    const roomData = {
      userIdToken,
      roomName,
      isPrivate,
      password: isPrivate ? password : null,
    };

    socket.connect();
    socket.emit("createRoom", roomData);
    setIsModalOpen(false);
  };

  const handleJoinRoom = async () => {
    const userIdToken = localStorage.getItem("authToken");
    alert(userIdToken, "hello");
    const joinData = {
      roomId: joinRoomId,
      password: joinPassword,
      userIdToken,
    };
    socket.connect();
    socket.emit("joinRoom", joinData);
    setIsJoinModalOpen(false);
  };

  return (
    <div
      className="bg-[#0a0a0a] w-screen h-screen text-white flex justify-center items-center p-4"
      style={{ fontFamily: "Orbitron" }}
    >
      {/* Main container */}
      <div
        className="w-[80vw] h-[90vh] grid grid-cols-1 md:grid-cols-[70%,30%] gap-6 border border-gray-700 p-6 rounded-lg bg-[#1a1a1a]"
        style={{
          background: "linear-gradient(145deg, #1b1b1b, #0e0e0e)",
          boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex flex-col p-4">
          <h2 className="text-2xl font-semibold mb-4">ROOMS</h2>
          {/* Room list can be added here */}
        </div>

        <div className="flex flex-col justify-between h-full p-4">
          <div className="flex flex-col justify-center flex-1 items-center space-y-4">
            <button
              className="w-[70%] p-4 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
              onClick={() => setIsModalOpen(true)}
            >
              Create Room
            </button>
            <button
              className="w-[70%] p-4 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join Room
            </button>
          </div>

          <div className="flex flex-col space-y-4 items-center">
            <button className="w-[70%] p-4 flex justify-center bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300">
              View Profile
            </button>
            <button className="w-[70%] p-4 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300">
              Settings
            </button>
            <button className="w-[70%] p-4 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Creating a Room */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className="bg-[#1a1a1a] p-6 rounded-lg w-[90vw] md:w-[40vw] text-center"
            style={{
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
              transform: "scale(0.95)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">Create a New Room</h2>
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-2 mb-4 bg-[#2b2b2b] border border-gray-600 rounded-md"
            />
            <div className="flex items-center justify-center mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(!isPrivate)}
                  className="mr-2"
                />
                Private Room
              </label>
            </div>
            {isPrivate && (
              <input
                type="password"
                placeholder="Room Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 mb-4 bg-[#2b2b2b] border border-gray-600 rounded-md"
              />
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCreateRoom}
                className="p-2 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
              >
                Create Room
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
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
            className="bg-[#1a1a1a] p-6 rounded-lg w-[90vw] md:w-[40vw] text-center"
            style={{
              boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
              transform: "scale(0.95)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">
              Join an Existing Room
            </h2>
            <input
              type="text"
              placeholder="Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full p-2 mb-4 bg-[#2b2b2b] border border-gray-600 rounded-md"
            />
            <input
              type="password"
              placeholder="Room Password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              className="w-full p-2 mb-4 bg-[#2b2b2b] border border-gray-600 rounded-md"
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleJoinRoom}
                className="p-2 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
              >
                Join Room
              </button>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="p-2 bg-[#2b2b2b] rounded-md hover:bg-[#3a3a3a] transition duration-300"
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