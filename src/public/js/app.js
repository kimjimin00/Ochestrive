const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

// 카메라 id를 가져옵니다
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

// device ID : camera ID임
// data stream 초기화 및 설정
// stream의 핵심은 track을 제공해준다는 점이다!
async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" }, //facing mode로 처음 시작시 어느 스트림부터 보낼지 정해 줄 수 있음
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } }, //exact 썼는데 디바이스 없으면 아예 스트림 출력 안함
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;

    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  console.log(myStream.getVideoTracks());
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  // cameraSelect로 카메라 ID를 가져오면, getMedia에서 비디오 스트림을 전환해준다.
  await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);

cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

//welcome Form(join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function startMedia() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

// form에 담긴 데이터를 소켓을 통해 보낸다
// 여기에는 방 이름과 start Media가 담겨 있다
function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  socket.emit("join_room", input.value, startMedia); //socket으로 input과 data를 전달한다.
  roomName = input.value;
  input.value = "";
}

// 정확히 여기서 코드 흐름이 시작되는거임
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket Code
// 상대방이 offer에게 보내는 코드임
// socket을 통해 offer를 방 만든 사람에게 보냄
socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", (offer) => {
  console.log(offer);
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream
  .getTracks()
  .forEach((track) => myPeerConnection.addTrack(track, myStream));
}