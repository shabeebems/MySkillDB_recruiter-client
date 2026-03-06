import { useState, useEffect, useRef } from "react";

const SUCCESS_DISPLAY_MS = 1400;

const ConfirmModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  btnSlateClass,
  btnRoseClass,
  isLoading,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      await onConfirm();
      setShowSuccess(true);
      successTimeoutRef.current = setTimeout(onClose, SUCCESS_DISPLAY_MS);
    } catch {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <style>{`
        @keyframes success-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-fade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .confirm-success-pop { animation: success-pop 0.5s ease-out forwards; }
        .confirm-success-fade { animation: success-fade 0.4s ease-out 0.2s both; }
      `}</style>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 flex flex-col overflow-hidden">
        {showSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center min-h-[200px] bg-emerald-50/80">
            <div
              className="confirm-success-pop w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl shadow-lg"
              aria-hidden
            >
              <i className="fas fa-check" />
            </div>
            <p className="confirm-success-fade mt-4 text-lg font-semibold text-emerald-800">
              Success!
            </p>
            <p className="confirm-success-fade text-sm text-emerald-600">
              Action completed
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600">{message}</p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-4 rounded-b-lg">
              <button
                onClick={onClose}
                className={btnSlateClass}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`${btnRoseClass} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmModal;