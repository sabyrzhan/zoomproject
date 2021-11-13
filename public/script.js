let socket = io('/')
let videoGrid = document.getElementById('video-grid')
let myVideo = document.createElement('video')
myVideo.id = USER_ID
let peer = new Peer(USER_ID, {
    path: '/peerjs',
    host: '/',
    port: '80'
});

myVideo.muted = true
let videoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
}).then(stream => {
    videoStream = stream
    addVideoStream(myVideo, stream)

    for (let i = 0; i < 10; i++) {
        let tmpVideo = document.createElement('video')
        addVideoStream(tmpVideo, stream);
    }
});
peer.on('open', id => {
   console.log(`This is the id: ${id}`)
    socket.emit('join-room', ROOM_ID, id)
});

peer.on('call', call => {
    let peerId = call.peer
    console.log('Peer id: ' + peerId)
    let videoList = $('video')
    console.log(videoList)
    videoList.each((index, element) => {
        if (element.id == peerId) {
            console.log('Existing peer video element found')
            $(element).remove()
        }
    })
    console.log('adding video')
    call.answer(videoStream)
    const video = document.createElement('video')
    video.id = peerId
    call.on('stream', userVideoStream => {
        console.log('Receiving remote user stream')
        addVideoStream(video, userVideoStream)
    })
})

socket.on('user-connected', (userId) => {
    console.log('New user connected userId: ' + userId)
    connectNewUser(userId)
});

socket.on('createMessage', message => {
    console.log($('ul'));
    $('ul').append(`<li class="message"><b>user</b><br>${message}</li>`)
    scrollToBottom();
})

const connectNewUser = (userId) => {
    let videoList = $('video')
    console.log(videoList)
    videoList.each((index, element) => {
        if (element.id == userId) {
            console.log('Existing video element found')
            $(element).remove()
        }
    })

    console.log('adding new user')
    const call = peer.call(userId, videoStream)
    const video = document.createElement('video')
    video.id = userId
    call.on('stream', userVideoStream => {
        console.log('Adding new user stresam')
        addVideoStream(video, userVideoStream)
    })
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
       video.play()
    });
    videoGrid.append(video);
};

let msg = $('input')
$('html').keydown((e) => {
    if (e.which == 13 && msg.val().length !== 0) {
        console.log(msg.val())
        socket.emit('message', msg.val());
        msg.val('')
    }
})

const scrollToBottom = () => {
    let d = $('.main__chat_window')
    d.scrollTop(d.prop('scrollHeight'))
}

// Mute or unmute audio
const muteUnmuteAudio = () => {
    const enabled = videoStream.getAudioTracks()[0].enabled;
    console.log(videoStream.getAudioTracks()[0])
    console.log(enabled)
    if (enabled) {
        videoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        videoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}

const setMuteButton = () => {
    const html = `
            <i class="fas fa-microphone"></i>
            <span>Mute</span>
        `
    $('.main__mute_button').html(html)
}

const setUnmuteButton = () => {
    const html = `
            <i class="unmute fas fa-microphone-slash"></i>
            <span>Unmute</span>
        `
    $('.main__mute_button').html(html)
}

$('.main__mute_button').on('click', () => {
    muteUnmuteAudio()
})

// Stop video
const muteUnmuteVideo = () => {
    let enabled = videoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        videoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        videoStream.getVideoTracks()[0].enabled = true;
        setStopVideo()
    }
}

const setPlayVideo = () => {
    const html = `
        <i class="stop fas fa-video-slash"></i>
        <span>Play</span>
    `

    $('.main__video_button').html(html)
}

const setStopVideo = () => {
    const html = `
        <i class="fas fa-video"></i>
        <span>Stop video</span>
    `

    $('.main__video_button').html(html)
}

$('.main__video_button').on('click', () => {
    muteUnmuteVideo();
})

$(window).on("beforeunload", function() {
    console.log('1111');
    return "Do you really want to close?";
})