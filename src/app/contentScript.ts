import browser from "webextension-polyfill";

browser.runtime.onMessage.addListener(async (request) => {
  const elements = Array.from(document.querySelectorAll("audio, video") as NodeListOf<HTMLMediaElement>).filter(
    (media) => !media.paused
  );

  const promises = elements.map((elem) => {
    const stream = createStream(elem);
    const audioStream = new MediaStream(stream.getAudioTracks());
    return recordStream(audioStream, Number(request.time)).then((data) => Array.from(data));
  });

  const results = await Promise.allSettled(promises);
  return results.map((r) => (r.status === "fulfilled" ? r.value : []));
});

function recordStream(stream: MediaStream, duration: number): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      chunks[0].arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)));
    };

    recorder.start();
    setTimeout(() => recorder.stop(), duration);
  });
}

function createStream(elem: HTMLMediaElement): MediaStream {
  const stream = (elem as any).captureStream?.() ?? (elem as any).mozCaptureStream?.();

  // Fallback for older Firefox versions
  if (!(elem as any).audioCtx && !(elem as any).captureStream) {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(elem);
    source.connect(audioCtx.destination);
    (elem as any).audioCtx = audioCtx;
  }

  return stream;
}
