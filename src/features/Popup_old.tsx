import { useState } from "react";
import { runGuess } from "./guess.js";
import "./Popup.css";

type SongResult = {
  title: string;
  artist: string;
  year: string;
};

export default function Popup() {
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<SongResult | null>(null);

  const recognize = async () => {
    setLoading(true);
    try {
      const result = await runGuess();
      console.log("Recognition result:", result);
      setCurrentResult({
        title: result?.track?.title ?? "Unknown Title",
        artist: result?.track?.subtitle ?? "Unknown Artist",
        year: result?.track?.sections?.[0]?.metadata?.[2]?.text ?? "Unknown Year",
      });
    } catch (err) {
      console.error("Recognition failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 text-white bg-neutral-900 min-h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Librezam</h1>
        <a href="/popup/settings.html" className="text-gray-400 hover:text-white">
          <i className="material-icons">settings</i>
        </a>
      </div>

      <button
        onClick={recognize}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded mb-6"
      >
        {loading ? "Listening..." : "Recognize Song"}
      </button>

      {currentResult && (
        <div className="mb-4 p-4 bg-neutral-800 rounded">
          <h2 className="text-lg font-semibold">Current Result</h2>
          <p>🎵 {currentResult.title}</p>
          <p>👤 {currentResult.artist}</p>
          <p>📅 {currentResult.year}</p>
        </div>
      )}
    </div>
  );
}
