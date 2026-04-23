const { io } = require("socket.io-client");

// 🔥 LIVE SERVER
const socket = io("https://callingapp-aq0p.onrender.com");

const userId = "69ea80a351be6dfc1851636e"; 

socket.on("connect", () => {
  console.log("User1 Connected:", socket.id);

  socket.emit("register-socket", userId);

  setTimeout(() => {
    socket.emit("call-user", {
      to: "69ea80b051be6dfc1851636f",
      from: userId
    });
  }, 3000);
});

socket.on("call-accepted", (data) => {
  console.log("✅ Call Accepted:", data);
});

socket.on("call-rejected", () => {
  console.log("❌ Call Rejected");
});

socket.on("call-ended", () => {
  console.log("📴 Call Ended");
});