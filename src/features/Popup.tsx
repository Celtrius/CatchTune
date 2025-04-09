import { useState } from "react";
import { runGuess } from "./guess.js";
import "./Popup.css";

type SongResult = {
  title: string;
  artist: string;
  year: string;
  genre?: string;
  cover?: string;
};

export default function Popup() {
  const [view, setView] = useState<"start" | "loading" | "result">("start");
  const [currentResult, setCurrentResult] = useState<SongResult | null>(null);

  const recognize = async () => {
    setView("loading");
    try {
      const result = await runGuess();
      setCurrentResult({
        title: result?.track?.title ?? "Unknown Title",
        artist: result?.track?.subtitle ?? "Unknown Artist",
        year: result?.track?.sections?.[0]?.metadata?.[2]?.text ?? "Unknown Year",
        genre: result?.track?.genres?.primary ?? "Unknown Genre",
        cover: result?.track?.images?.coverart,
      });
      setView("result");
    } catch (err) {
      console.error("Recognition failed:", err);
      setView("start");
    }
  };

  return (
    <div className="max-w-xl mx-auto text-white bg-neutral-900 min-h-[400px] relative overflow-hidden">
      {view === "start" && (
        <div className="flex flex-col items-center justify-center h-full">
          <button onClick={recognize} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Recognize Song
          </button>
        </div>
      )}

      {view === "loading" && (
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-64 bg-neutral-800 rounded w-full"></div>
          <div className="h-6 bg-neutral-800 rounded w-3/4"></div>
          <div className="flex space-x-2">
            <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
            <div className="h-4 bg-neutral-800 rounded w-1/6"></div>
          </div>
          <div className="flex space-x-3 mt-4">
            <div className="h-10 w-24 bg-neutral-800 rounded"></div>
            <div className="h-10 w-24 bg-neutral-800 rounded"></div>
          </div>
        </div>
      )}

      {view === "result" && currentResult && (
        <div className="relative rounded overflow-hidden">
          <div
            className="absolute inset-0 blur-lg opacity-30 z-0"
            style={{
              backgroundImage: `url(${currentResult.cover ?? "https://via.placeholder.com/300"})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>

          <div className="relative z-10 p-4 bg-opacity-30 backdrop-blur-sm">
            <img
              src={currentResult.cover ?? "https://via.placeholder.com/300"}
              alt="Cover"
              className="w-48 h-48 rounded mb-4"
            />
            <h2 className="text-2xl font-bold">{currentResult.title}</h2>
            <h3 className="text-xl text-gray-300">{currentResult.artist}</h3>
            <p className="inline-block mt-2 px-3 py-1 bg-neutral-800 rounded-full text-sm">{currentResult.genre}</p>
            <div className="flex space-x-4 mt-4">
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center space-x-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
                  className="w-5 h-5"
                />
                <span>Spotify</span>
              </button>
              <button className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded flex items-center space-x-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg"
                  className="w-6 h-4"
                />
                <span>YouTube</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
