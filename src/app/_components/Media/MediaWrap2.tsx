"use client";

import {roomValueState} from "@/utils/atom";
import {ChangeEvent, FormEvent, useEffect, useRef, useState} from "react";
import {useRecoilState} from "recoil";
import {connect} from "socket.io-client";
import styled from "styled-components";
import {v4 as uuidv4} from "uuid";
import DownloadMedia from "./DownloadMedia";

function MediaWrap() {
  const [myPeerConnection, setMyPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  // let myPeerConnection: RTCPeerConnection | null = null;
  // let myStream: MediaStream;
  const [myStream, setMyStream] = useState<MediaStream>();

  const mediaRef = useRef<HTMLVideoElement>(null);
  const otherMediaRef = useRef<HTMLVideoElement>(null);

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
    socket?.emit("join_room", roomName);
    await getMedia("");
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
      const myStreamData = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstrains
      );

      setMyStream(myStreamData);

      if (myStream && mediaRef?.current) {
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
    const myPeerConnectionData = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    });
    setMyPeerConnection(myPeerConnectionData);

    if (myPeerConnection) {
      myPeerConnection.addEventListener("icecandidate", handleIce);
      myPeerConnection.addEventListener("addstream", handleAddStream);
    }

    if (myStream) {
      myStream.getTracks().forEach((track) => {
        if (myPeerConnection) {
          myPeerConnection.addTrack(track, myStream);
        }
      });
    }
  };

  const handleIce = (event: any) => {
    // if (event.candidate) {
    socket.emit("ice", event.candidate, roomName);
    // }
  };

  const handleAddStream = async (event: any) => {
    console.log("event : ", event);
    if (otherMediaRef?.current) {
      otherMediaRef.current.srcObject = event.stream;
    }
  };
  // RTC 코드 END

  // socket 코드 START
  useEffect(() => {
    // 누군가 내가 있는 방에 들어올 때의 이벤트
    socket.on("welcome", async () => {
      console.log("welcome");
      if (!myPeerConnection) {
        await makeConnection();
      }
      const offer = await myPeerConnection?.createOffer();
      await myPeerConnection?.setLocalDescription(offer);
      socket.emit("offer", offer, roomName);
    });

    // 상대방 브라우저 이벤트
    socket.on("offer", async (offer) => {
      console.log("offer");
      if (!myPeerConnection) {
        await makeConnection();
      }
      await myPeerConnection?.setRemoteDescription(offer);
      const answer = await myPeerConnection?.createAnswer();
      await myPeerConnection?.setLocalDescription(answer);
      socket.emit("answer", answer, roomName);
    });

    // 내 브라우저 이벤트
    socket.on("answer", async (answer) => {
      console.log("answer");
      await myPeerConnection?.setRemoteDescription(answer);
    });

    // ice(Interactive Connectivity Establishment) 이벤트
    // ice : 브라우저가 peer를 통한 연결이 가능하도록 하게 해주는 프레임워크
    socket.on("ice", async (ice) => {
      console.log("ice");
      await myPeerConnection?.addIceCandidate(ice);
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
      {!isJoin ? (
        <FormWrap>
          <form onSubmit={onSubmitRoom}>
            <input value={roomName} onChange={onChangeRoomName} />
          </form>
          <button>입장</button>
        </FormWrap>
      ) : (
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
      )}
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
