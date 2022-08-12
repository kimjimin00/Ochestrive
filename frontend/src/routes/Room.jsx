import React from "react";
//import VideoRayoutContainer from "../../components/VideoContainer";


function Room() {
  //console.log(props);
  const myVideo = {
    id: 0,
    name: "mine"
  }
  const peerVideos = [
    {
        id: 1,
        name: "SSam"
    },
    {
        id: 2,
        name: "SSong"
    }
  ];
  return (
    <div>
      <h1>OrchestLive!</h1>
      <div className="call">
        <h1>Room Name : </h1>
        <h3>Client : </h3>
        
        <div className="Streams">
          <video 
            key = {myVideo.id}
            className={myVideo.name}
            autoPlay
            playsInline
            width="400" 
            height="400"/>
          {peerVideos.map(peer => (
            <video 
              key = {peer.id}
              className={peer.name}
              autoPlay
              playsInline
              width="400" 
              height="400"/>
          ))}
        </div>
        <button className="mute">Mute</button>
        <button className="camera">Turn Camera Off</button>
        <select className="cameras"/>
        <div>
        <button className="out">Remove</button>
        </div>
      </div>
    </div>
  );
  
  
}

export default Room;