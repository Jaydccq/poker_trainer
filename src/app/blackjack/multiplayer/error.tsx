"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Multiplayer error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-emerald-800/60 to-emerald-900/60 backdrop-blur-md border-2 border-red-600/40 rounded-2xl p-8 text-center">
        <div className="mb-4 flex justify-center">
          <svg
            aria-hidden="true"
            className="h-16 w-16 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold text-red-400 mb-4">Something went wrong</h2>
        <p className="text-yellow-100/60 mb-6">
          We encountered an error loading the multiplayer room.
        </p>
        <button
          onClick={reset}
          className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-900 font-bold rounded-lg transition-all duration-300 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
