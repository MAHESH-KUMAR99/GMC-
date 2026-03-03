import express from "express";
const app = express();
import cors from "cors";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import { Server } from "socket.io";
import router from "./routes/userRoutes.js";
import pool from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTTP SERVER FOR SOCKET.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    // origin:['https://findpath.co.in','https://www.findpath.co.in'],// Replace with your frontend URL
    // origin: 'http://192.168.1.11:5173', // Allow your frontend URL
    // origin: ["http://localhost:5173"], // Allow your frontend URL
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware Setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CORS SETUP
const corsOptions = {
  // origin:['https://findpath.co.in','https://www.findpath.co.in'],// Replace with your frontend URL
  // origin: ['http://localhost:8081','exp://192.168.1.8:8081'],// Replace with your frontend URL
  // origin:'http://192.168.1.11:5173',// Replace with your frontend URL
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

// Environment Variables Setup
dotenv.config({ path: "./.env" });

// Template and Urls Setup
app.use("/req", router);
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "Public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./Public", "index.html"));
});

// Database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.log("Error connecting to Neon:", err.stack);
  }
  console.log("Connected to Neon PostgreSQL");
  release();
});

// Start the server
server.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
