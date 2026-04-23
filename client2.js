const { io } = require("socket.io-client");

const socket = io("https://callingapp-aq0p.onrender.com", {
  transports: ["websocket"],
  reconnection: true,
});

const userId = "69ea80b051be6dfc1851636f"; // raam

socket.on("connect", () => {
  console.log("User2 Connected:", socket.id);

  socket.emit("register-socket", userId);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection Error:", err.message);
});

// incoming call
socket.on("incoming-call", (data) => {
  console.log("📞 Incoming Call:", data);

  socket.emit("accept-call", {
    to: data.from,
    from: userId,
  });
});