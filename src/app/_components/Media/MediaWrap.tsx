"use client";

import {roomValueState} from "@/utils/atom";
import {ChangeEvent, FormEvent, useEffect, useRef, useState} from "react";
import {useRecoilState} from "recoil";
import {connect} from "socket.io-client";
import styled from "styled-components";
import {v4 as uuidv4} from "uuid";
import DownloadMedia from "./DownloadMedia";

function MediaWrap() {
  let myPeerConnection: RTCPeerConnection;
  let myStream: MediaStream;
  let myDataChannel;

  const mediaRef = useRef<HTMLVideoElement>(null);
  const otherMediaRef = useRef<HTMLVideoElement>(null);

  const [isOtherMedia, setIsOtherMedia] = useState(false);

  const [isJoin, setIsJoin] = useState(false);
  const [roomName, setRoomName] = useRecoilState(roomValueState);
  const [videoInput, setVideoInput] = useState<MediaDeviceInfo[]>([]);

  const [onMute, setOnMute] = useState(false);
  const [onVideo, setOnVideo] = useState(false);

  const socket = connect("localhost:4000");

  const onChangeRoomName = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.currentTarget.value);
  };

  const onSubmitRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName) {
      return alert("방 이름을 입력해주세요.");
    }
    setIsJoin(true);
    await getMedia("");
    makeConnection();
    socket?.emit("join_room", roomName);
  };

  // 카메가 정보 가져오기
  const getCamera = async () => {
    try {
      const myCameras = await navigator.mediaDevices.enumerateDevices();
      const videoInputData = myCameras.filter(
        (item) => item.kind === "videoinput"
      );
      const currentCamera = myStream?.getVideoTracks()[0];
      setVideoInput(videoInputData);
    } catch (e) {
      console.log("e : ", e);
    }
  };

  // 미디어 가져오기
  const getMedia = async (deviceId: string | undefined) => {
    const initialConstrains = {
      audio: true,
      video: {facingMode: "user"},
    };
    const cameraConstraints = {
      audio: true,
      video: {deviceId: {exact: deviceId}},
    };

    try {
      myStream = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstrains
      );

      if (mediaRef?.current) {
        mediaRef.current.srcObject = myStream;
      }
      if (!deviceId) {
        await getCamera();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const muteClick = () => {
    if (mediaRef.current) {
      const audioTracks = mediaRef.current.srcObject as MediaStream;
      audioTracks.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setOnMute(!onMute);
    }
  };

  const videoClick = () => {
    if (mediaRef.current) {
      const videoTracks = mediaRef.current.srcObject as MediaStream;
      videoTracks.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
      setOnVideo(!onVideo);
    }
  };

  const changeCamera = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    getMedia(value);
  };

  // RTC 코드 START
  const makeConnection = async () => {
    myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    });
    myPeerConnection?.addEventListener("icecandidate", handleIce);
    myPeerConnection?.addEventListener("addstream", handleAddStream);

    myStream.getTracks().forEach((track) => {
      if (myPeerConnection) {
        myPeerConnection.addTrack(track, myStream);
      }
    });
  };

  const handleIce = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socket.emit("ice", event.candidate, roomName);
    }
  };

  const handleAddStream = (event: any) => {
    if (otherMediaRef?.current) {
      otherMediaRef.current.srcObject = event.stream;
    }
  };
  // RTC 코드 END

  // socket 코드 START
  useEffect(() => {
    socket.on("welcome", async () => {
      myDataChannel = myPeerConnection.createDataChannel("chat");
      myDataChannel.addEventListener("message", (event) =>
        console.log(event.data)
      );
      const offer = await myPeerConnection.createOffer();
      myPeerConnection.setLocalDescription(offer);
      socket.emit("offer", offer, roomName);
    });

    socket.on("offer", async (offer) => {
      myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) =>
          console.log("myDataChannel message :", event.data)
        );
      });
      myPeerConnection.setRemoteDescription(offer);
      const answer = await myPeerConnection.createAnswer();
      myPeerConnection.setLocalDescription(answer);
      socket.emit("answer", answer, roomName);
    });

    socket.on("answer", (answer) => {
      myPeerConnection.setRemoteDescription(answer);
    });

    socket.on("ice", (ice) => {
      myPeerConnection.addIceCandidate(ice);
    });

    return () => {
      socket.off("welcome");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice");
    };
  }, [roomName]);
  // socket 코드 END

  return (
    <Wrap>
      <FormWrap>
        <form onSubmit={onSubmitRoom}>
          <input value={roomName} onChange={onChangeRoomName} />
        </form>
        <button>입장</button>
      </FormWrap>
      <div>
        <div>
          <div>{roomName}</div>
          <div>
            <video ref={mediaRef} autoPlay playsInline />
            <video ref={otherMediaRef} autoPlay playsInline />
          </div>
          <div>
            <button onClick={muteClick}>{onMute ? "Unmute" : "Mute"}</button>
            <button onClick={videoClick}>
              {onVideo ? "Stop Video" : "Start Video"}
            </button>
          </div>
          <select onChange={changeCamera}>
            <option value="">Default Camera</option>
            {videoInput.map((item: any) => (
              <option key={uuidv4()} value={item.deviceId}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <DownloadMedia mediaRef={mediaRef} />
      </div>
    </Wrap>
  );
}

export default MediaWrap;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const FormWrap = styled.div`
  display: flex;
  flex-direction: row;
`;
