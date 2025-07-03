import express from "express";
import { createServer } from "node:http";
import cors from "cors";

import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoute from "./src/routes/userRoute.js";
import { admin } from "./src/firebase.js";

const app = express();
const server = createServer(app);

// ✅ Set up Socket.IO with Firestore
connectToSocket(server);

app.set("port", process.env.PORT || 8000);

// ✅ Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["*"],
  credentials: true,
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ✅ Routes
app.use("/api/v1/users", userRoute);

// ✅ Start Server
server.listen(app.get("port"), () => {
  console.log(`🚀 Server listening on port ${app.get("port")}`);
});
