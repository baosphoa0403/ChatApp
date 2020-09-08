const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = express();
const { generateMessage, generateLoaction } = require("../src/utils/messages");
const server = http.createServer(app);
const io = socketio(server);
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("../src/utils/users");
// sever (emit) -> client (receive) -> countUpdated
// client (emit) -> sever (receive) -> increment

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  // socket.emit("message", generateMessage("welcome!"))
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id)


    console.log(message);

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    // log ở client
    io.emit("message", generateMessage(user.username ,message));
    callback();
  });
  socket.broadcast.emit("message", generateMessage("A new user join"));
  socket.on("disconnect", () => {
     const user = removeUser(socket.id)
     if (user) {
        io.to(user.room).emit("message", generateMessage("Admin",`${user.username} has lefted!`));
        io.to(user.room).emit("roomData", {
            room: user.room,
            user: getUsersInRoom(user.room)
        })
     }
   
  });

  socket.on("sendLocation", (coords, callback) => {
   const user = getUser(socket.id)
   console.log(user);
   
    io.to(user.room).emit(
      "sendLocation",
      generateLoaction(user.username,
        `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("join", (options, callback) => {
    const {user, error} = addUser({id: socket.id,  ...options})
  
    if (error) {
        return callback(error)
    }
    socket.join(user.room);
    socket.emit("message", generateMessage("admin", "welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("admin",`${user.username} has joined`));
    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit , socket.broadcast.to.emit

    io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
    callback()
  });
});

server.listen(port, () => {
  console.log(`Sever is running port ${port}`);
});
