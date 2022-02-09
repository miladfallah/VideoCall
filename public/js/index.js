const socket = io();

const { RTCPeerConnection, RTCSessionConnection } = window;

const peerConnection = new RTCPeerConnection();

navigator.getUserMedia( {video: true, audio: true}, (stream) => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
        localVideo.srcObject = stream;
    }
},
(error) => {
    console.log(error.message);
});