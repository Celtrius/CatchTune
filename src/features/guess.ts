import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import browser from "webextension-polyfill";

// Assume shazam-api.min.js exposes window.Shazam
declare const Shazam: any;

// Entry point
export async function runGuess(): Promise<any> {
  console.log("[Librezam] Starting recognition process...");
  console.log("[Librezam] Reserving FFmpeg...");
  const reservedFFmpeg = await reserveFFmpeg();
  console.log("[Librezam] FFmpeg loaded:", reservedFFmpeg);
  const audios = (await getAudiosInTab()).filter((a) => a.length);

  for (const audio of audios) {
    const pcm = await convertToPCM(audio, reservedFFmpeg);
    const result = await shazamGuess(pcm);
    writeResult(result);
    return result; // Return the first recognized result
  }

  return null;
}

// Initializes FFmpeg with wasm backend
async function reserveFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  console.log("[Librezam] Loading FFmpeg...");
  await ffmpeg.load({
    coreURL: browser.runtime.getURL("libs/ffmpeg-core/ffmpeg-core.js"),
  });
  console.log("[Librezam] FFmpeg loaded.");

  return ffmpeg;
}

// Sends message to all frames in the current tab to capture audio
async function getAudiosInTab(): Promise<Uint8Array[]> {
  console.log("[Rocket] Getting audio from active tab...");
  const tabs = await browser.tabs.query({ lastFocusedWindow: true });
  const tab = tabs.find((t) => t.active && t.url?.startsWith("http"));

  if (!tab || !tab.id) {
    console.warn("[Rocket] No valid active webpage tab found.");
    return [];
  }
  console.log("[Rocket] Attempting to capture audio from active tab:", tab);

  const time = 3200;

  const frames = (await browser.webNavigation.getAllFrames({ tabId: tab.id })) ?? [];
  const responses = await Promise.allSettled(
    frames.map((f) => browser.tabs.sendMessage(tab.id!, { action: "record", time }, { frameId: f.frameId }))
  );

  return responses
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .flatMap((r) => r.value.map((arr: number[]) => new Uint8Array(arr)));
}

// Converts audio from WebM to raw PCM with FFmpeg
async function convertToPCM(audio: Uint8Array, ffmpeg: FFmpeg): Promise<Uint8Array> {
  const blob = new Blob([audio], { type: "audio/webm" });
  await ffmpeg.writeFile("audio.webm", audio);
  await ffmpeg.exec(["-i", "audio.webm", "-ar", "16000", "-ac", "1", "-f", "s16le", "-y", "out.pcm"]);
  const result = await ffmpeg.readFile("out.pcm");
  if (result instanceof Uint8Array) return result;
  if (typeof result === "string") return new TextEncoder().encode(result); // fallback
  return new Uint8Array(result as ArrayBuffer); // trusted fallback
}

// Calls Shazam API (through local clone) with PCM samples
async function shazamGuess(pcm: Uint8Array): Promise<any> {
  const shazam = new Shazam.Shazam();
  const samples = Shazam.s16LEToSamplesArray(pcm);
  return await shazam.fullRecognizeSong(samples);
}

// Updates the UI with the latest recognition result
function writeResult(result: any) {
  const circler = document.getElementById("circler");
  const resultTable = document.getElementById("resultTable");
  const streamProviders = document.getElementById("streamProviders");
  const titleResult = document.getElementById("titleResult");
  const artistResult = document.getElementById("artistResult");
  const yearResult = document.getElementById("yearResult");

  if (circler) circler.style.display = "none";
  if (resultTable) resultTable.style.display = "table";
  if (streamProviders) streamProviders.style.display = "flex";

  if (titleResult) titleResult.textContent = result.track.title;
  if (artistResult) artistResult.textContent = result.track.subtitle;
  if (yearResult) yearResult.textContent = result.track.sections[0]?.metadata?.[2]?.text || "";

  const appleMusicLink = document.getElementById("appleMusicLink") as HTMLAnchorElement;
  const deezerLink = document.getElementById("deezerLink") as HTMLAnchorElement;
  const spotifyLink = document.getElementById("spotifyLink") as HTMLAnchorElement;
  const youtubeLink = document.getElementById("youtubeLink") as HTMLAnchorElement;

  if (appleMusicLink) {
    appleMusicLink.href = result.track.hub.options?.[0]?.actions?.[0]?.uri || "#";
  }
  if (deezerLink) {
    deezerLink.href = (result.track.hub.providers?.[1]?.actions?.[0]?.uri || "#").replace(
      "deezer-query://",
      "https://"
    );
  }
  if (spotifyLink) {
    spotifyLink.href =
      "https://open.spotify.com/search/" + (result.track.hub.providers?.[0]?.actions?.[0]?.uri?.slice(15) || "");
  }
  if (youtubeLink) {
    youtubeLink.href =
      "https://www.youtube.com/results?search_query=" +
      (result.track.hub.providers?.[0]?.actions?.[0]?.uri?.slice(15) || "");
  }
}
