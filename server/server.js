import express from "express";
import "dotenv/config";
import cors from "cors";
import http from  "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";

// create express App and http server
const app=express();
const server=http.createServer(app)

//initialize socket.io server
      export const io=new Server(server,{
        cors:{origin:"https://triochat.netlify.app"}
      })

// store online users
    export const userSocketMap = {}; // {userId:socketId}

    // socket.io connection handler
       io.on("connection",(socket)=>{
           const userId=socket.handshake.query.userId;
           console.log("User connected",userId);
           if(userId){
             userSocketMap[userId]=socket.id;
             //emit users to all connected clients
                io.emit("getOnlineUsers",Object.keys(userSocketMap));
                socket.on("disconnect",()=>{
                    console.log("User Disconnected",userId);
                    delete userSocketMap[userId];
                    io.emit("getOnlineUsers", Object.keys(userSocketMap))
                })
           }
       })

// middleware setup

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors({
  origin: 'https://triochat.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));



app.use("/api/status",(req,res)=> res.send("Server is Live"));
// Routes setup
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter)


await connectDB();

// --- MODIFIED SECTION ---
const PORT = process.env.PORT || 5000; // Use Render's PORT environment variable
server.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log("Running in Production Mode");
  } else {
    console.log("Running in Development Mode");
  }
});

// Remove `export default server;` if not explicitly needed for other deploy targets
// For Render, you just need to start the server listening.
// export default server;