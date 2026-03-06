
const ImageViewerModal = ({ isOpen, imageSrc, onClose, altText = 'Image' }) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
        <img 
          src={imageSrc} 
          alt={altText} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
          onClick={(e) => e.stopPropagation()} 
        />
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
        >
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>
    </div>
  );
};

export default ImageViewerModal;

