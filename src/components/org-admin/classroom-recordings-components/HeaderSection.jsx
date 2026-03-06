const HeaderSection = () => {
  return (
    <header className="bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/50 py-3 px-3 sm:px-4 md:py-4 md:px-6 lg:py-5 lg:px-8 sticky top-14 lg:top-0 z-30 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 transition-all duration-200">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-lg sm:text-xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-0.5 sm:mb-1">
          Classroom Recordings
        </h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-neutral-500 font-medium leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">
          Manage and organize educational video content across your organization.
        </p>
      </div>
    </header>
  );
};

export default HeaderSection;
