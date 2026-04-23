
const User = require("../models/User");
const { AccessToken } = require("livekit-server-sdk");

async function createToken(identity, room) {
  try {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      console.log(" LIVEKIT ENV missing");
      return null;
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: identity,
      }
    );

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = at.toJwt();

    console.log("✅ TOKEN GENERATED:", token);

    return token;
  } catch (err) {
    console.log("❌ TOKEN ERROR:", err);
    return null;
  }
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    //  Register socket
    socket.on("register-socket", async (userId) => {
      try {
        if (!userId) return;

        await User.findByIdAndUpdate(userId, {
          socketId: socket.id,
        });

        console.log("🔗 Socket registered for:", userId);
      } catch (err) {
        console.log("❌ register-socket error:", err);
      }
    });

    //  Call user
    socket.on("call-user", async ({ to, from }) => {
      try {
        const receiver = await User.findById(to);
        const caller = await User.findById(from);

        if (!receiver || !caller) {
          console.log("❌ CALL USER NOT FOUND");
          return;
        }

        if (receiver.socketId) {
          io.to(receiver.socketId).emit("incoming-call", {
            from,
            name: caller.name,
          });
        }
      } catch (err) {
        console.log("❌ call-user error:", err);
      }
    });

    //  ACCEPT CALL
    socket.on("accept-call", async ({ to, from }) => {
      try {
        const room = `room_${Date.now()}`;

        const caller = await User.findById(to);
        const receiver = await User.findById(from);

        if (!caller || !receiver) {
          console.log("❌ USERS NOT FOUND IN ACCEPT CALL");
          return;
        }

        const callerToken = await createToken(caller._id.toString(), room);
        const receiverToken = await createToken(receiver._id.toString(), room);

        if (!callerToken || !receiverToken) {
          console.log("❌ TOKEN GENERATION FAILED");
          return;
        }

        console.log("🔥 CALLER TOKEN:", callerToken);
        console.log("🔥 RECEIVER TOKEN:", receiverToken);

        // send to caller
        if (caller.socketId) {
          io.to(caller.socketId).emit("call-accepted", {
            room,
            token: callerToken,
          });
        }

        // send to receiver
        if (receiver.socketId) {
          io.to(receiver.socketId).emit("call-accepted", {
            room,
            token: receiverToken,
          });
        }
      } catch (err) {
        console.log("❌ accept-call error:", err);
      }
    });

    //  REJECT CALL (FIXED)
    socket.on("reject-call", async ({ to, from }) => {
      try {
        const caller = await User.findById(to);

        if (!caller) {
          console.log("❌ CALLER NOT FOUND");
          return;
        }

        if (caller.socketId) {
          io.to(caller.socketId).emit("call-rejected", {
            from,
          });
        }

        console.log("📴 Call rejected sent to:", to);
      } catch (err) {
        console.log("❌ reject-call error:", err);
      }
    });

    // END CALL (FIXED)
    socket.on("end-call", async ({ to, from }) => {
      try {
        const user = await User.findById(to);

        if (!user) {
          console.log("❌ USER NOT FOUND");
          return;
        }

        if (user.socketId) {
          io.to(user.socketId).emit("call-ended", {
            from,
          });
        }

        console.log("📴 Call ended sent to:", to);
      } catch (err) {
        console.log("❌ end-call error:", err);
      }
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null }
        );

        console.log("User disconnected:", socket.id);
      } catch (err) {
        console.log("❌ disconnect error:", err);
      }
    });
  });
};