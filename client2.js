const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const userId = "69ea40c182f27c496188d136"; // raam

socket.on("connect", () => {
  console.log("User2 Connected:", socket.id);

  socket.emit("register-socket", userId);
});

// incoming call
socket.on("incoming-call", (data) => {
  console.log("📞 Incoming Call:", data);

  // 🔥 auto accept
  socket.emit("accept-call", {
    to: data.from,
    from: userId,
  });
});