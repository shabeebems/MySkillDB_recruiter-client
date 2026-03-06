const HeaderSection = () => {
  return (
    <header className="sticky top-14 lg:top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 sm:mb-2 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <i className="fas fa-chalkboard text-white text-base sm:text-xl"></i>
            </div>
            Classroom Setup
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed ml-0 sm:ml-16">
            Follow these 2 simple steps to set up your classrooms
          </p>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;

