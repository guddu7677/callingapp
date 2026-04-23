const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const userId = "69ea40ac82f27c496188d135"; // nawal

socket.on("connect", () => {
  console.log("User1 Connected:", socket.id);

  socket.emit("register-socket", userId);

  // 🔥 call trigger after 3 sec
  setTimeout(() => {
    socket.emit("call-user", {
      to: "69ea40c182f27c496188d136", // raam
      from: userId
    });
  }, 3000);
});

// listen events
socket.on("call-accepted", (data) => {
  console.log("✅ Call Accepted:", data);
});

socket.on("call-rejected", () => {
  console.log("❌ Call Rejected");
});

socket.on("call-ended", () => {
  console.log("📴 Call Ended");
});