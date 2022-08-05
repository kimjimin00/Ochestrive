//백엔드(Back-end)
import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug"); //pug 사용
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public")); //public 연결하기
app.get("/", (req, res) => res.render("home")); //렌더링
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app); //express server
const wsServer = SocketIO(httpServer); //socket.io server

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    //방 참여
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer); //모든 방 인원에게 offer 보내기
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

// function publicRooms() {
//   const {
//     socket: {
//       adapter: { sids, rooms },
//     },
//   } = wsServer;
//   const publicRooms = [];
//   rooms.forEach((_, key) => {
//     if (sids.get(key) === undefined) {
//       //room이 sid에 없으면 public room
//       publicRooms.push(key);
//     }
//   });
// }
// wsServer.on("connection", (socket) => {
//   socket.onAny((event) => {
//     console.log(`Socket event:${event}`);
//   });
//   socket.on("enter_room", (roomName, nickname, done) => {
//     //인자, done함수
//     socket.join(roomName); //방 만들기-이름 붙여짐
//     done();
//     socket.to(roomName).emit("welcome", nickname); //그 방에 있는 모든 사람에게(나 제외) event
//     socket.on("disconnecting", () => {
//       console.log(socket.rooms);
//       socket.rooms.forEach(
//         (room) => socket.to(room).emit("bye", nickname) //닉네임추가
//       ); //참여하고있던 모든 방에
//     });
//     socket.on("new_message", (msg, room, done) => {
//       socket.to(room).emit("new_message", `${nickname}: ${msg}`);
//       done();
//     });
//   });
// });
// const sockets = []; //fake db

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";
//   console.log("Connected to Browser ✅");
//   socket.on("close", () => {
//     console.log("Disconnected from the Browser ❌");
//   });
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}:${message.payload}`)
//         );
//         break;
//       case "nickname":
//         socket["nickname"] = message.payload;
//         break;
//     }
//   });
// }); //연결시 함수 실행
httpServer.listen(3000, handleListen);
