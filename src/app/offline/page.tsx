'use client';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg 
            className="mx-auto h-24 w-24 text-gray-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        
        <p className="text-gray-400 mb-8">
          No internet connection found. Please check your network settings and try again.
        </p>
        
        <button
          onClick={handleRetry}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
        >
          Retry Connection
        </button>
        
        <p className="mt-6 text-sm text-gray-500">
          Some features may still be available offline through cached content.
        </p>
      </div>
    </div>
  );
}
