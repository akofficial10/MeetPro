import { Server } from "socket.io";
import { db } from "../firebase.js"; // Firebase admin

let connections = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-call", async (path) => {
      if (!path) {
        console.error("No path provided for join-call");
        return;
      }

      // Clean the path to remove any invalid characters
      const cleanPath = path.replace(/[^a-zA-Z0-9-]/g, "");

      if (!connections[cleanPath]) {
        connections[cleanPath] = [];
      }
      connections[cleanPath].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify others in room
      for (const connId of connections[cleanPath]) {
        io.to(connId).emit("user-joined", socket.id, connections[cleanPath]);
      }

      // Send previous messages from Firestore
      try {
        const chatSnapshot = await db
          .collection("meetings")
          .doc(cleanPath)
          .collection("messages")
          .orderBy("timestamp")
          .get();

        const messages = [];
        chatSnapshot.forEach((doc) => {
          messages.push(doc.data());
        });

        // Send all messages at once
        io.to(socket.id).emit("chat-history", messages);
      } catch (e) {
        console.error("Error fetching messages:", e);
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", async (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );

      if (found && matchingRoom) {
        console.log("Storing message in Firestore for room:", matchingRoom);

        try {
          await db
            .collection("meetings")
            .doc(matchingRoom)
            .collection("messages")
            .add({
              sender: sender,
              data: data,
              socketIdSender: socket.id,
              timestamp: new Date(),
            });

          connections[matchingRoom].forEach((elem) => {
            io.to(elem).emit("chat-message", data, sender, socket.id);
          });
        } catch (e) {
          console.error("Error saving message:", e);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);

      for (const [room, clients] of Object.entries(connections)) {
        const index = clients.indexOf(socket.id);
        if (index !== -1) {
          clients.splice(index, 1);

          clients.forEach((clientId) =>
            io.to(clientId).emit("user-left", socket.id)
          );

          if (clients.length === 0) {
            delete connections[room];
          }
        }
      }
      delete timeOnline[socket.id];
    });
  });

  return io;
};
