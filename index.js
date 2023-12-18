const express = require("express");
const { Server } = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/chatApp").then(() => {
  console.log("Connected");
});

const app = express();

const userSchema = new mongoose.Schema({
  name: String,
  socketid: String,
});

const User = mongoose.model("User", userSchema);

app.use(express.static(path.join(__dirname, "public")));

// app.get('/', (req,res) => {

// })

const expressServer = app.listen(3000, async () => {
  await User.deleteMany({});
  console.log(`listening on port 3000`);
});

const io = new Server(expressServer, {
  cors: true,
});

io.on("connection", (socket) => {
  // console.log(`${socket.id} has entered the chat`);
  socket.on("joinRoom", async (name) => {
    const existingname = await User.findOne({ name: name });
    if (!existingname) {
      const finduser = await User.findOne({ socketid: socket.id });
      if (finduser) {
        finduser.name = name;
        await finduser.save();
      } else {
        const user = new User({ name: name, socketid: socket.id });
        await user.save();
      }
    }
  });

  // Upon connection - only to user
  socket.emit("message", { message: "Welcome to chat app!", isAdmin: true });

  // Upon connection - to all others
  socket.broadcast.emit("message", {
    message: "Someone has joined the chat!",
    isAdmin: true,
  });

  // Listening for a message event
  socket.on("message", async (data) => {
    let { message } = data;
    let name = "Anonymous";
    const user = await User.findOne({ socketid: socket.id });
    if (user) {
      name = user.name;
    }
    console.log(data);
    io.emit("message", { message: `${name}: ${message}`, socketid: socket.id });
  });

  // When user disconnects - to all others
  socket.on("disconnect", async () => {
    const user = await User.findOneAndDelete({ socketid: socket.id });
    let name = user ? user.name : "Anonymous";
    socket.broadcast.emit("message", {
      message: `${name} has left the chat!`,
      isAdmin: true,
    });
  });

  // Listen for activity
  socket.on("activity", async (data) => {
    const user = await User.findOne({ socketid: data });
    let name = user ? user.name : "Anonymous";
    socket.broadcast.emit("activity", name);
  });
});
