import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  RefObject,
  SetStateAction,
  useState,
} from "react";
import {v4 as uuidv4} from "uuid";

function CallMedia({
  mediaRef,
  otherMediaRef,
  socket,
  roomName,
  setRoomName,
  videoInput,
  getMedia,
}: {
  mediaRef: RefObject<HTMLVideoElement>;
  otherMediaRef: RefObject<HTMLVideoElement>;
  socket: any;
  roomName: string;
  setRoomName: Dispatch<SetStateAction<string>>;
  videoInput: MediaDeviceInfo[];
  getMedia: (value: string) => void;
}) {
  const [onMute, setOnMute] = useState(false);
  const [onVideo, setOnVideo] = useState(false);

  const onSubmitRoom = async (e: FormEvent) => {
    e.preventDefault();
    socket?.emit("join_room", roomName);
    getMedia("");
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

  const onChangeRoomName = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.currentTarget.value);
  };

  return (
    <div>
      <form onSubmit={onSubmitRoom}>
        <input value={roomName} onChange={onChangeRoomName} />
      </form>
      <div>
        <video ref={mediaRef} autoPlay playsInline />
        <video ref={otherMediaRef} autoPlay playsInline />
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
    </div>
  );
}

export default CallMedia;
