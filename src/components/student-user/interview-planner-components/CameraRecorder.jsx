import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const CameraRecorder = ({ isOpen, onClose, skillName, videoScript, onVideoSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scriptBackgroundOpacity, setScriptBackgroundOpacity] = useState(75); // solid black behind script (0–100)
  const [scrollSpeed, setScrollSpeed] = useState(1); // pixels per 100ms
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const [maxScrollHeight, setMaxScrollHeight] = useState(1000);
  const [isConverting, setIsConverting] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollTimerRef = useRef(null);
  const scriptContentRef = useRef(null);
  const scriptInnerRef = useRef(null);
  const ffmpegRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      // Stop camera as soon as modal is closed (e.g. parent set isOpen to false)
      stopCamera();
    }
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Calculate max scroll height when script loads
  useEffect(() => {
    // Use setTimeout to ensure DOM has fully rendered
    const timer = setTimeout(() => {
      if (scriptContentRef.current && scriptInnerRef.current) {
        const containerHeight = scriptContentRef.current.clientHeight;
        const contentHeight = scriptInnerRef.current.scrollHeight;
        // Add extra buffer (200px) to ensure we can scroll past the last line
        const calculatedMax = Math.max(0, contentHeight - containerHeight + 200);
        setMaxScrollHeight(calculatedMax);
        console.log('Scroll calculation:', {
          containerHeight,
          contentHeight,
          buffer: 200,
          maxScrollHeight: calculatedMax,
          note: 'Added 200px buffer to ensure full script visibility'
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [videoScript, showOverlay]);

  // Auto-scroll effect when recording
  useEffect(() => {
    if (isRecording && showOverlay && !isScrollPaused) {
      scrollTimerRef.current = setInterval(() => {
        setScrollPosition((prev) => {
          const newPosition = prev + scrollSpeed;
          return Math.min(newPosition, maxScrollHeight);
        });
      }, 100); // Every 100ms
    } else {
      if (scrollTimerRef.current) {
        clearInterval(scrollTimerRef.current);
      }
    }
    return () => {
      if (scrollTimerRef.current) {
        clearInterval(scrollTimerRef.current);
      }
    };
  }, [isRecording, showOverlay, isScrollPaused, scrollSpeed, maxScrollHeight]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    // Stop MediaRecorder first so it releases the stream
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
      mediaRecorderRef.current = null;
    }
    // Capture stream reference then clear ref so we always stop the correct stream
    const stream = streamRef.current;
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    // Check for MP4 support first (especially for iOS Safari)
    let options = null;
    const mp4Types = [
      'video/mp4;codecs=h264',
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
    ];
    
    // Try MP4 first (for iOS Safari and modern browsers)
    for (const mimeType of mp4Types) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
        setRecordedMimeType(mimeType);
        break;
      }
    }
    
    // Fallback to WebM if MP4 not supported
    if (!options) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9' };
        setRecordedMimeType('video/webm;codecs=vp9');
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
        setRecordedMimeType('video/webm');
      } else {
        // Last resort - use default
        options = {};
        setRecordedMimeType('video/webm');
      }
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: options.mimeType || 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setIsPreviewing(true);
      stopCamera();
    };

    mediaRecorder.start(100); // Collect data every 100ms
    setIsRecording(true);
    setRecordingTime(0);
    setScrollPosition(0); // Reset scroll position

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    toast.success('Recording started');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.success('Recording stopped');
    }
  };

  // Load FFmpeg.wasm
  const loadFFmpeg = async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    try {
      const ffmpeg = new FFmpeg();
      
      // Set log callback
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      if (!ffmpeg.loaded) {
        toast.loading('Loading video converter...', { id: 'ffmpeg-loading' });
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        });
        toast.dismiss('ffmpeg-loading');
      }

      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      toast.error('Failed to load video converter. Please refresh and try again.');
      throw error;
    }
  };

  // Convert video to MP4 using FFmpeg.wasm
  const convertToMP4 = async (blob) => {
    try {
      const ffmpeg = await loadFFmpeg();
      
      // Determine input file name based on mime type
      const inputFileName = recordedMimeType?.includes('webm') ? 'input.webm' : 'input.mp4';
      const outputFileName = 'output.mp4';
      
      // Write input file
      await ffmpeg.writeFile(inputFileName, await fetchFile(blob));

      // Convert to MP4 with H.264 codec (YouTube compatible)
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputFileName
      ]);

      // Read output file
      const data = await ffmpeg.readFile(outputFileName);

      // Clean up
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
      } catch (cleanupError) {
        console.warn('Cleanup error (non-critical):', cleanupError);
      }

      // Create blob from converted data
      // Handle both Uint8Array and File types
      let mp4Blob;
      if (data instanceof Uint8Array) {
        mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
      } else if (data instanceof File) {
        mp4Blob = data;
      } else {
        // Fallback: try to create blob from data
        mp4Blob = new Blob([data], { type: 'video/mp4' });
      }
      return mp4Blob;
    } catch (error) {
      console.error('Error converting video:', error);
      throw error;
    }
  };

  const handleSaveVideo = async () => {
    if (!recordedBlob) {
      toast.error('No video to save');
      return;
    }

    try {
      setIsConverting(true);
      let finalBlob = recordedBlob;
      let fileName = `${skillName.replace(/\s+/g, '_')}_${new Date().getTime()}.mp4`;

      // Check if already MP4
      const isMP4 = recordedMimeType && (
        recordedMimeType.includes('mp4') || 
        recordedMimeType.includes('h264') ||
        recordedMimeType.includes('avc1')
      );

      if (!isMP4) {
        toast.loading('Converting to MP4... This may take a moment.', { id: 'converting' });
        try {
          finalBlob = await convertToMP4(recordedBlob);
          toast.dismiss('converting');
          toast.success('Video converted to MP4!');
        } catch (conversionError) {
          toast.dismiss('converting');
          console.error('Conversion error:', conversionError);
          toast.error('Conversion failed. Saving original format. You may need to convert manually for YouTube.', { duration: 5000 });
          fileName = fileName.replace('.mp4', '.webm');
        }
      }

      if (typeof onVideoSaved === 'function') {
        try {
          await onVideoSaved(finalBlob, { fileName, skillName: skillName || 'Video' });
          handleClose();
        } catch (uploadError) {
          console.error('Upload/save error:', uploadError);
          toast.error(uploadError?.message || 'Failed to save video.');
        }
        return;
      }

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Video saved as MP4 to your device!');
      setTimeout(() => handleClose(), 500);
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Failed to save video. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleRetake = () => {
    // Clean up previous recording
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setIsPreviewing(false);
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordedMimeType(null);
    chunksRef.current = [];
    setRecordingTime(0);
    setScrollPosition(0);
    setIsScrollPaused(false);
    setIsConverting(false);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    if (timerRef.current) clearInterval(timerRef.current);
    if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    
    // Clean up blob URL
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    
    setIsRecording(false);
    setIsPreviewing(false);
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordedMimeType(null);
    chunksRef.current = [];
    setRecordingTime(0);
    setScrollPosition(0);
    setIsScrollPaused(false);
    setScrollSpeed(1);
    setIsConverting(false);
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const recalculateScrollHeight = () => {
    if (scriptContentRef.current && scriptInnerRef.current) {
      const containerHeight = scriptContentRef.current.clientHeight;
      const contentHeight = scriptInnerRef.current.scrollHeight;
      // Add extra buffer (200px) to ensure we can scroll past the last line
      const calculatedMax = Math.max(0, contentHeight - containerHeight + 200);
      setMaxScrollHeight(calculatedMax);
      toast.success(`Scroll range recalculated: ${Math.round(calculatedMax)}px (with 200px buffer)`);
      console.log('Manual scroll recalculation:', {
        containerHeight,
        contentHeight,
        buffer: 200,
        maxScrollHeight: calculatedMax,
        note: 'Added 200px buffer to ensure full script visibility'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-pink-600 shadow-lg z-20">
        <div className="px-4 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-video"></i>
              Video Recorder
            </h2>
            <p className="text-xs sm:text-sm text-white opacity-90 mt-1">{skillName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
          >
            <i className="fas fa-times text-white text-xl"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-900">
          <div className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center">
            <div className="absolute inset-0 w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {showOverlay && videoScript && !isPreviewing && (
                <div
                  className="absolute inset-0 flex justify-center z-10 pointer-events-none"
                >
                  <div
                    ref={scriptContentRef}
                    className="w-full max-w-xl overflow-hidden pointer-events-auto"
                    style={{ 
                      height: '45%',
                      background: `linear-gradient(to bottom, rgba(0,0,0,${(scriptBackgroundOpacity / 100)}) 0%, rgba(0,0,0,${(scriptBackgroundOpacity / 100)}) 70%, rgba(0,0,0,0) 100%)`,
                      borderBottomLeftRadius: '1rem',
                      borderBottomRightRadius: '1rem',
                    }}
                  >
                    <div 
                      ref={scriptInnerRef}
                      className="px-8 pt-6 pb-64 text-white text-center transition-transform duration-100 ease-linear"
                      style={{ transform: `translateY(-${scrollPosition}px)` }}
                    >
                      {videoScript.sections?.map((section, index) => (
                        <div key={index} className="mb-8">
                          {section.title !== 'Your Video Script' ? (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="px-2.5 py-1 bg-purple-500 bg-opacity-80 rounded-full text-[11px] font-bold tracking-wide">
                                  {section.time}
                                </span>
                                <h4 className="text-base font-bold drop-shadow-sm">{section.title}</h4>
                              </div>
                              <p className="text-[15px] leading-[1.8] whitespace-pre-wrap drop-shadow-sm">{section.content}</p>
                            </>
                          ) : (
                            <>
                              <h4 className="text-base font-bold mb-3 drop-shadow-sm">{section.title}</h4>
                              <p className="text-[15px] leading-[1.8] whitespace-pre-wrap drop-shadow-sm">{section.content}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recording Timer - Bottom Right */}
              {isRecording && (
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse shadow-lg z-10">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="font-bold">{formatTime(recordingTime)}</span>
                </div>
              )}

              {/* Toggle Overlay Button - Bottom Left */}
              {!isPreviewing && (
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="absolute bottom-6 left-6 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all z-10"
                  title={showOverlay ? 'Hide Script' : 'Show Script'}
                >
                  <i className={`fas ${showOverlay ? 'fa-eye-slash' : 'fa-eye'} text-white`}></i>
                </button>
              )}
              
              {isPreviewing && !isRecording && (
                <div className="absolute inset-0 z-20 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-8 text-center max-w-md">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-check-circle text-green-600 text-4xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Recording Complete!</h3>
                    <p className="text-slate-600 mb-4">
                      Your video has been recorded successfully.
                    </p>
                    <p className="text-sm text-slate-500">
                      Duration: {formatTime(recordingTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 p-4 bg-slate-800 space-y-4">
            {/* Main Recording Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isPreviewing ? (
                <>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <i className="fas fa-circle text-xl"></i>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 border-2 border-white"
                    >
                      <i className="fas fa-stop text-xl"></i>
                      Stop Recording
                    </button>
                  )}
                </>
              ) : (
              <>
                <button
                  onClick={handleRetake}
                  className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <i className="fas fa-redo"></i>
                  Retake
                </button>
                <button
                  onClick={handleSaveVideo}
                  disabled={isConverting}
                  className={`px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-3 text-base ${
                    isConverting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isConverting ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xl"></i>
                      Converting to MP4...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download text-xl"></i>
                      Save to Device (MP4)
                    </>
                  )}
                </button>
              </>
              )}
            </div>

            {/* Info text for preview state */}
            {isPreviewing && (
              <div className="text-center">
                <p className="text-white text-xs opacity-75">
                  <i className="fas fa-info-circle mr-1"></i>
                  Video will be downloaded to your device
                </p>
              </div>
            )}

            {/* Teleprompter Controls */}
            {!isPreviewing && showOverlay && (
              <div className="max-w-5xl mx-auto bg-slate-700 rounded-lg p-3 space-y-3">
                {/* All Controls in One Compact Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Script Position Seekbar */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white text-[10px] font-semibold flex items-center gap-1">
                        <i className="fas fa-scroll"></i>
                        Position
                        <button
                          onClick={recalculateScrollHeight}
                          className="ml-1 w-4 h-4 bg-slate-600 hover:bg-slate-500 text-white rounded text-[8px] transition-all flex items-center justify-center"
                          title="Recalculate scroll range (use if script seems incomplete)"
                        >
                          <i className="fas fa-sync-alt"></i>
                        </button>
                      </label>
                      <span className={`text-[10px] font-bold ${
                        scrollPosition >= maxScrollHeight ? 'text-green-400' : 'text-white'
                      }`}>
                        {maxScrollHeight > 0 ? Math.round((scrollPosition / maxScrollHeight) * 100) : 0}%
                        {scrollPosition >= maxScrollHeight && ' ✓'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(maxScrollHeight, 100)}
                      value={scrollPosition}
                      onChange={(e) => setScrollPosition(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Speed Control Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScrollSpeed(Math.max(0.25, scrollSpeed - 0.25))}
                      className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                      disabled={scrollSpeed <= 0.25}
                      title="Slower"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <div className="px-2 py-1 bg-slate-800 rounded text-white text-xs font-bold min-w-[40px] text-center">
                      {scrollSpeed}x
                    </div>
                    <button
                      onClick={() => setScrollSpeed(Math.min(5, scrollSpeed + 0.25))}
                      className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                      disabled={scrollSpeed >= 5}
                      title="Faster"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  {/* Pause/Play Button */}
                  <button
                    onClick={() => setIsScrollPaused(!isScrollPaused)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      isScrollPaused
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                    title={isScrollPaused ? 'Resume Scroll' : 'Pause Scroll'}
                  >
                    <i className={`fas ${isScrollPaused ? 'fa-play' : 'fa-pause'}`}></i>
                    {isScrollPaused ? 'Resume' : 'Pause'}
                  </button>

                  {/* Reset Buttons */}
                  <button
                    onClick={() => setScrollPosition(0)}
                    className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs transition-all flex items-center justify-center"
                    title="Reset to Top"
                  >
                    <i className="fas fa-fast-backward"></i>
                  </button>
                  <button
                    onClick={() => setScrollSpeed(1)}
                    className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs transition-all flex items-center justify-center"
                    title="Reset Speed to 1x"
                  >
                    <i className="fas fa-redo"></i>
                  </button>

                  {/* Script background (black behind text) - increase/decrease black */}
                  <div className="flex items-center gap-2">
                    <label className="text-white text-[10px] font-semibold flex items-center gap-1">
                      <i className="fas fa-square"></i>
                      Background
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.min(100, Math.max(0, scriptBackgroundOpacity))}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v)) setScriptBackgroundOpacity(Math.min(100, Math.max(0, v)));
                      }}
                      className="w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      disabled={isRecording}
                    />
                    <span className="text-white text-[10px] font-bold min-w-[28px]">{scriptBackgroundOpacity}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default CameraRecorder;

