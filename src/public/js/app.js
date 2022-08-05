//프론트엔드(Front-end)
const socket = io(); //백엔드 소켓io와 연결

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute"); //음소거 버튼
const cameraBtn = document.getElementById("camera"); //카메라 버튼
const camerasSelect = document.getElementById("cameras"); //카메라 버튼
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false; //초기상태
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  //카메라 리스트로 보여줌
  try {
    const devices = await navigator.mediaDevices.enumerateDevices(); //연결 장치 가져오기
    const cameras = devices.filter((device) => device.kind === "videoinput"); //videoinput만
    const currentCamera = myStream.getVideoTracks()[0]; //현재 카메라 알 수 있음
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label; //이름
      if (currentCamera.label === camera.label) {
        //현재 카메라로 보여줌
        option.selected = true;
      }
      camerasSelect.appendChild(option); //카메라를 리스트에 추가
    });
  } catch (e) {
    console.log(e);
  }
}
//카메라, 오디오 가져오기
async function getMedia(deviceId) {
  const initialConstrains = {
    //초기 설정, 셀카 모드
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    //카메라 선택 설정
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    //스트림 가져오기(권한 허용)
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains //deviceId있으면 카메라선택한거 아니면 초기
    );
    myFace.srcObject = myStream; //비디오 홈페이지에 표시하기
    if (!deviceId) {
      await getCameras(); //모든 장치 가져오기
    }
  } catch (e) {
    //에러발생시
    console.log(e);
  }
}

// getMedia();

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled)); //값 반전시키기
  if (!muted) {
    //음소거 아니면
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled)); //값 반전시키기
  if (cameraOff) {
    //카메라 켜져있으면
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}
async function handleCameraChange() {
  await getMedia(camerasSelect.value); //stream 새로 받음
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack); //새로운 카메라로 바꿔주기
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// const welcome = document.getElementById("welcome");
// const form = welcome.querySelector("form");
// const room = document.getElementById("room");

// room.hidden = true; //처음에는 방 숨겨주기
// let roomName;

// function addMessage(message) {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerText = message;
//   ul.appendChild(li);
// }
// function handleMessageSubmit(event) {
//   event.preventDefault();
//   const input = room.querySelector("#msg input");
//   const value = input.value;
//   socket.emit("new_message", input.value, roomName, () => {
//     addMessage(`You: ${value}`);
//   });
//   input.value = "";
// }

// function showRoom() {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName}`; //방 이름 바뀔수도있으므로
//   const msgForm = room.querySelector("#msg");
//   msgForm.addEventListener("submit", handleMessageSubmit);
// }

// function handleRoomSubmit(event) {
//   event.preventDefault();
//   const roomInput = form.querySelector("input");
//   const nameInput = form.querySelector("#name"); //닉네임
//   socket.emit("enter_room", roomInput.value, nameInput.value, showRoom); //이벤트와 인자(객체도 가능), 콜백함수
//   roomName = roomInput.value;
//   input.value = "";
// }

// form.addEventListener("submit", handleRoomSubmit);

// // function handleNicknameSubmit(event) {
// //   event.preventDefault();
// //   const input = welcome.querySelector("#name input");
// //   socket.emit("nickname", input.value);
// // }
// // const nameForm = welcome.querySelector("#name");
// // nameForm.addEventListener("submit", handleNicknameSubmit);

// socket.on("welcome", (user) => {
//   addMessage(`${user} arrived!`);
// });
// socket.on("bye", (left) => {
//   addMessage(`${left} left ㅠㅠ`);
// });
// socket.on("new_message", (msg) => addMessage(msg));

///Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true; //방 입력 창 숨김
  call.hidden = false; //call 보여줌
  await getMedia(); //카메라,오디오 가져오기
  makeConnection(); //연결 만들기
}

async function handleWelcomeSubmit(event) {
  //제출 버튼 누를때
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value); //소켓 보내기
  roomName = input.value; //방 이름
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
//A -> B
//Socket Code, Peer A(송신자)
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat"); //data channel
  myDataChannel.addEventListener("message", console.log);
  console.log("made data channel");
  //다른 브라우저가 방 들어왔을때
  const offer = await myPeerConnection.createOffer(); //초대장 만들기
  myPeerConnection.setLocalDescription(offer); //offer로 연결 구성
  console.log("sent the offer");
  socket.emit("offer", offer, roomName); //초대장 보내기
});
//Peer B(수신자)
socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
  });
  console.log("recieved the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer(); //answer만들기
  myPeerConnection.setLocalDescription(answer); //answer로 연결 구성
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});
socket.on("answer", (answer) => {
  console.log("recieved the answer");
  myPeerConnection.setRemoteDescription(answer);
});
socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

//RTC Code,
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      //STUN 서버: 공용주소 알려줌, 나중에 직점 만들기
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  }); //연결만들기
  myPeerConnection.addEventListener("icecandidate", handleIce); //인터넷 연결 생성
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream)); //카메라,마이크 데이터 stream 연결
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName); //candidate 보내기
}
function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  // console.log("Peer's Stream", data.stream); //stream 전달받음
  peerFace.srcObject = data.stream; //비디오 표시하기
}
