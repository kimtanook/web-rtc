"use client";

import {roomValueState} from "@/utils/atom";
import {useEffect, useRef, useState} from "react";
import {useRecoilState} from "recoil";
import {connect} from "socket.io-client";
import CallMedia from "./CallMedia";
import DownloadMedia from "./DownloadMedia";

function MediaWrap() {
  let myPeerConnection: RTCPeerConnection | null = null;
  let myStream: MediaStream;

  const mediaRef = useRef<HTMLVideoElement>(null);
  const otherMediaRef = useRef<HTMLVideoElement>(null);

  const [roomName, setRoomName] = useRecoilState(roomValueState);
  const [videoInput, setVideoInput] = useState<MediaDeviceInfo[]>([]);

  const socket = connect("localhost:4000");

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

  const makeConnection = async () => {
    myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);

    if (myStream) {
      myStream.getTracks().forEach((track) => {
        if (myPeerConnection) {
          myPeerConnection.addTrack(track, myStream);
        }
      });
    }
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

  return (
    <div>
      <CallMedia
        mediaRef={mediaRef}
        otherMediaRef={otherMediaRef}
        socket={socket}
        roomName={roomName}
        setRoomName={setRoomName}
        videoInput={videoInput}
        getMedia={getMedia}
      />
      <DownloadMedia mediaRef={mediaRef} />
    </div>
  );
}

export default MediaWrap;
