/**
 * Utility functions for YouTube video operations
 */

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
export const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^#&?]*)/,
    /youtube\.com\/.*[?&]v=([^#&?]*)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Get YouTube thumbnail URL
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @param {string} quality - Thumbnail quality: 'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'
 * @returns {string|null} - Thumbnail URL or null if invalid
 */
export const getYouTubeThumbnail = (videoIdOrUrl, quality = 'hqdefault') => {
  if (!videoIdOrUrl) return null;
  
  const videoId = typeof videoIdOrUrl === 'string' && videoIdOrUrl.length === 11 && !videoIdOrUrl.includes('http')
    ? videoIdOrUrl
    : getYouTubeVideoId(videoIdOrUrl);
  
  if (!videoId) return null;
  
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Get the best available YouTube thumbnail URL
 * Tries maxresdefault first, then falls back to hqdefault
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {string|null} - Best available thumbnail URL
 */
export const getBestYouTubeThumbnail = (videoIdOrUrl) => {
  if (!videoIdOrUrl) return null;
  
  // Check if it's already a video ID (11 characters)
  const videoId = typeof videoIdOrUrl === 'string' && videoIdOrUrl.length === 11 && !videoIdOrUrl.includes('http')
    ? videoIdOrUrl
    : getYouTubeVideoId(videoIdOrUrl);
  
  if (!videoId) return null;
  
  // Use medium-quality thumbnail for faster loading in grids
  // (smaller payload than maxresdefault but still clear enough)
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

/**
 * Check if a URL is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if valid YouTube URL
 */
export const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url);
};

/**
 * Get YouTube embed URL
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {string|null} - Embed URL or null if invalid
 */
export const getYouTubeEmbedUrl = (videoIdOrUrl) => {
  const videoId = typeof videoIdOrUrl === 'string' && videoIdOrUrl.length === 11
    ? videoIdOrUrl
    : getYouTubeVideoId(videoIdOrUrl);
  
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}`;
};

