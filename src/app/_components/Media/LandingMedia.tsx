import {roomValueState} from "@/utils/atom";
import {ChangeEvent, Dispatch, FormEvent} from "react";
import {useRecoilState} from "recoil";
import {Socket} from "socket.io-client";

function LandingMedia({
  socket,
  makeConnection,
  setStartMedia,
}: {
  socket: Socket;
  makeConnection: () => void;
  setStartMedia: Dispatch<boolean>;
}) {
  const [roomName, setRoomName] = useRecoilState(roomValueState);
  const onStart = async () => {
    setStartMedia(true);
  };
  const onChangeRoomName = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.currentTarget.value);
  };
  const onSubmitRoom = (e: FormEvent) => {
    e.preventDefault();
    socket.emit("join_room", roomName, onStart);
  };

  return (
    <form onSubmit={onSubmitRoom}>
      <input value={roomName} onChange={onChangeRoomName} />
    </form>
  );
}

export default LandingMedia;
