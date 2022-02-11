const socket = io("localhost:3000");

let isAlreadyCalling = false;
let getCalled = false;

const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    socket.emit("call-user", {
        offer,
        to: socketId
    });
} 

function unselectedUser() {
    const alreadySelectedUser = document.querySelectorAll(".active-user.active-user--selected");

    alreadySelectedUser.forEach(element => {
        element.setAttribute("class", "active-user");
    });
}

function createUserItems(socketId) {
    const userContainer = document.createElement("div");
            const username = document.createElement("p");

            userContainer.setAttribute("class", "active-user");
            userContainer.setAttribute("id", socketId);

            username.setAttribute("class", "username");
            username.innerHTML = `کاربر: ${socketId}`;

            userContainer.appendChild(username);
            userContainer.addEventListener("click", () => {
                unselectedUser();
                userContainer.setAttribute(
                    "class",
                    "active-user active-user--selected");
                const talkingWithInfo =
                    document.getElementById("talking-with-info");
                talkingWithInfo.innerHTML = `تماس با: ${socketId}`;
                callUser(socketId);
            });
            return userContainer;
        }

function updateUserList(users) {
    const activeUserContainer = document.getElementById("active-user-container");

    users.forEach( (socketId) => {
        const userExist = document.getElementById(socketId);

        if(!userExist) {
            const userContainer = createUserItems(socketId);
            activeUserContainer.appendChild(userContainer);           
        }
    });
}

socket.on("update-user-list", ( { users }) => {
   updateUserList(users);
});
socket.on("remove-user", ( {socketId }) => {
    const user= document.getElementById(socketId);
    if(user) {
        user.remove();
    }
});

socket.on("call-made", async (data) => {
    if(getCalled){
    const confirmed = confirm(`تماس از طرف ${data.socket} 
    آیا قبول میکنید؟`);
    if (!confirmed) {
        //Reject
        socket.emit("reject-call", {
            from: data.socket
        });
        return;
    }
}
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
    socket.emit("make-answer", {
        answer,
        to: data.socket,
    });
    getCalled = true;
});

socket.on("answer-made", async(data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

    if(!isAlreadyCalling){
    callUser(data.socket);
    isAlreadyCalling = true;
    }
});


socket.on("call-rejected", (data) => {
    alert(` کاربر ${data.socket} تماس شما را رد کرد! `);
    unselectedUser();
});

peerConnection.ontrack = function ( {streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
}

navigator.getUserMedia( {video: true, audio: true}, (stream) => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
        localVideo.srcObject = stream;
    }
    stream.getTracks().forEach((track) => 
        peerConnection.addTrack(track, stream));
},
(error) => {
    console.log(error.message);
});