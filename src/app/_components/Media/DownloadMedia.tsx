import {useState} from "react";

function DownloadMedia({mediaRef}: any) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);

  const startRecording = async () => {
    const recorder = new MediaRecorder(mediaRef?.current.srcObject);
    const chunks = [] as any;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, {type: "video/mp4"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = "recorded-video.mp4";
      a.click();
      window.URL.revokeObjectURL(url);
    };

    setMediaRecorder(recorder);
    setRecording(true);
    recorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };
  return (
    <div>
      {recording ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
    </div>
  );
}

export default DownloadMedia;
