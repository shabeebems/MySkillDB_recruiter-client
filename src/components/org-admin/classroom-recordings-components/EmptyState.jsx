const EmptyState = ({ icon, title, message, variant = 'default' }) => {
  const iconColors = {
    default: 'text-neutral-300',
    topic: 'text-neutral-300',
    skill: 'text-neutral-300',
    recording: 'text-neutral-300',
  };

  const iconSizes = {
    default: 'text-2xl sm:text-3xl',
    topic: 'text-2xl sm:text-3xl',
    skill: 'text-2xl sm:text-3xl',
    recording: 'text-3xl sm:text-4xl',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-neutral-200 px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 ring-1 ring-black/5">
        <i className={`${icon} ${iconSizes[variant]} ${iconColors[variant]}`}></i>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 text-center">{title}</h3>
      <p className="text-neutral-500 text-xs sm:text-sm mb-6 max-w-xs text-center">{message}</p>
    </div>
  );
};

export default EmptyState;
