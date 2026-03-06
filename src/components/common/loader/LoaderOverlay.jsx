const LoaderOverlay = ({ isVisible = false, title = 'MySkillDB', subtitle = 'Loading, please wait…' }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-slate-700 font-semibold">{title}</p>
          <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default LoaderOverlay;
