import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//CREATE EXPRESS APP AND HTTP SERVER 
const app = express();
const server = http.createServer(app)

//INITILAIZE SOCKET.IO  
export const io = new Server(server, {
    cors: {origin: "*"}
})

//STORE ONLINE USERS 
export const userSocketMap = {}; 

//SOCKET.IO CONNECTION HANDLER 
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;
    
    //EMIT ONLINE USERS 
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

//MIDDLEWARE SETUP 
app.use(express.json({limit: "4mb"}));

app.use(cors({
    origin: "*"
}));


//ROUTES SETUP 
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("Database Connected");

    server.listen(PORT, () => {
      console.log("Server is running on PORT: " + PORT);
    });
  })
  .catch((err) => {
    console.error("DB Connection Failed:", err);
  });


//EXPORT SERVER
export default server;
