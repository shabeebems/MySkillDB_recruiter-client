import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getYouTubeVideoId } from '../../../../utils/youtubeUtils';

const YouTubeVideoPlayerPage = ({ videoUrl, videoTitle, onBack, className = '', showSidebarMargin = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;

  const initializePlayer = useCallback(() => {
    if (!videoId || !playerRef.current || !window.YT || !window.YT.Player) return;

    setIsLoading(true);
    setError(null);

    try {
      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0, // Don't autoplay, let user click play
          controls: 1, // Enable YouTube's native controls
          modestbranding: 1, // Minimize YouTube branding
          rel: 0, // Don't show related videos
          showinfo: 0, // Don't show video info overlay
          iv_load_policy: 3, // Hide video annotations
          cc_load_policy: 0, // Captions off by default (user can enable via YouTube controls)
          playsinline: 1, // Play inline on mobile
          enablejsapi: 1, // Enable JavaScript API
        },
        events: {
          onReady: (event) => {
            setIsLoading(false);
          },
          onError: (event) => {
            setIsLoading(false);
            setError('Failed to load video. Please check the video URL.');
            console.error('YouTube player error:', event.data);
          },
        },
      });
    } catch (err) {
      setIsLoading(false);
      setError('Failed to initialize video player.');
      console.error('Error initializing player:', err);
    }
  }, [videoId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer();
      } else if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Store existing callback if any
        const existingCallback = window.onYouTubeIframeAPIReady;
        
        window.onYouTubeIframeAPIReady = () => {
          if (existingCallback) existingCallback();
          initializePlayer();
        };
      } else {
        // YT exists but Player might not be ready yet
        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            initializePlayer();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.YT || !window.YT.Player) {
            setError('Failed to load YouTube player. Please refresh the page.');
            setIsLoading(false);
          }
        }, 10000);
      }
    };

    loadYouTubeAPI();

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
    };
  }, [videoId, initializePlayer]);

  if (!videoId) {
    return (
      <div className={`min-h-screen bg-slate-50 ${showSidebarMargin ? 'lg:ml-72' : ''} ${className}`}>
        <div className="p-2 sm:p-4 lg:p-6 flex flex-col items-center">
          <div className="mb-4 w-full max-w-6xl px-2 sm:px-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
            >
              <i className="fas fa-arrow-left text-sm sm:text-base"></i>
              <span className="font-medium text-sm sm:text-base">Back</span>
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 text-center w-full max-w-6xl">
            <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Invalid Video URL</h3>
            <p className="text-slate-600 mb-4">The provided video URL is not valid.</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${showSidebarMargin ? 'lg:ml-72' : ''} ${className}`}>
      <div className="p-0 sm:p-2 lg:p-6 flex flex-col items-center">
        {/* Header - Compact on Mobile */}
        <div className="mb-2 sm:mb-4 w-full max-w-6xl px-2 sm:px-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
          >
            <i className="fas fa-arrow-left text-sm sm:text-base"></i>
            <span className="font-medium text-sm sm:text-base">Back</span>
          </button>
        </div>

        {/* Player Card - Full Width on Mobile, Centered on Desktop */}
        <div ref={containerRef} className="bg-white rounded-none sm:rounded-2xl shadow-lg overflow-hidden border-0 sm:border border-slate-200 w-full max-w-6xl">
          {/* Title Bar - Compact on Mobile */}
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <i className="fab fa-youtube text-white text-xs sm:text-sm"></i>
              </div>
              <h2 className="font-semibold text-slate-900 line-clamp-1 text-sm sm:text-base">{videoTitle || 'Video'}</h2>
            </div>
          </div>

          {/* Video Player with YouTube Native Controls - Larger on Mobile */}
          <div className="relative w-full aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black z-10">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    <i className="fab fa-youtube text-red-600 text-3xl absolute inset-0 flex items-center justify-center"></i>
                  </div>
                  <p className="text-white text-sm font-medium">Loading video...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900 to-black z-10">
                <div className="text-center p-6">
                  <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                  <h3 className="text-xl font-bold text-white mb-2">Error Loading Video</h3>
                  <p className="text-red-200 mb-4">{error}</p>
                  <button
                    onClick={onBack}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}

            {/* YouTube Player with Native Controls */}
            <div
              ref={playerRef}
              className="w-full h-full"
              style={{ display: error ? 'none' : 'block' }}
            />
          </div>
        </div>

        {/* Info Note - Hidden on Mobile, Shown on Desktop */}
        {!error && !isLoading && (
          <div className="hidden sm:block mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-6xl">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <i className="fas fa-info-circle mt-0.5"></i>
              <span>
                Use the YouTube player controls below the video to play, pause, seek, adjust volume, change playback speed, enable captions, and enter fullscreen mode.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeVideoPlayerPage;
