import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaChange = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" 
        onClick={onCancel}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden transform transition-all scale-100 ring-1 ring-black/5 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-slate-100/50 flex justify-between items-center bg-white z-10 relative">
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Photo</h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wide">Crop & Zoom</p>
            </div>
            <button 
                onClick={onCancel}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
                <i className="fas fa-times text-xs sm:text-sm"></i>
            </button>
        </div>

        {/* Cropper Container */}
        <div className="relative h-[250px] sm:h-[350px] w-full bg-[#18181b] group cursor-move">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
             {/* Optional: Pattern or empty state if image takes time to load */}
             <i className="fas fa-image text-slate-700 text-4xl opacity-20"></i>
          </div>
          
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3.5 / 4}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={onZoomChange}
            showGrid={true}
            objectFit="contain"
            classes={{
                containerClassName: "bg-[#f8fafc]",
                mediaClassName: "", 
                cropAreaClassName: "border border-white/50 \
   shadow-[0_0_0_9999px_rgba(248,250,252,0.88)] \
   ring-1 ring-white/50 \
   backdrop-brightness-110"
            }}
          />
          
          {/* Overlay hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
             <div className="bg-black/60 text-white/90 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
                <i className="fas fa-hand-paper text-[10px]"></i>
                <span>Drag to reposition</span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 sm:px-8 sm:py-6 space-y-5 sm:space-y-8 bg-white">
          
          {/* Zoom Control */}
          <div className="space-y-3 sm:space-y-4">
             <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs sm:text-sm">
                    <i className="fas fa-search-plus text-indigo-500"></i>
                    <span>Zoom Level</span>
                </div>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-bold tracking-wide">
                    {Math.round(zoom * 100)}%
                </span>
             </div>
             
             <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-1.5 sm:p-2 rounded-xl border border-slate-100">
                <button 
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-indigo-600 hover:shadow-sm transition-all border border-slate-100"
                >
                    <i className="fas fa-minus text-[10px] sm:text-xs"></i>
                </button>
                <div className="relative flex-1 h-6 flex items-center px-2">
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 focus:outline-none"
                    />
                </div>
                <button 
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-indigo-600 hover:shadow-sm transition-all border border-slate-100"
                >
                    <i className="fas fa-plus text-[10px] sm:text-xs"></i>
                </button>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1 sm:pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 sm:px-6 sm:py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isCropping}
              className="flex-[1.5] px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 active:scale-95"
            >
              {isCropping ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-indigo-400"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-crop-alt"></i>
                  <span>Crop & Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;