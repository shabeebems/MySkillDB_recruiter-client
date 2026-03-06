const TopicSection = ({
  topic,
  recordings,
  searchTerm,
  selectedSubjectId,
  onAddVideo,
}) => {
  const filteredRecordings = recordings.filter(recording => 
    !searchTerm || 
    recording.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="scroll-mt-28 sm:scroll-mt-32 md:scroll-mt-24 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-5 sticky top-[100px] sm:top-[110px] md:top-28 bg-neutral-50/95 backdrop-blur-md py-2.5 sm:py-3 z-20 px-2 sm:px-3 rounded-lg sm:rounded-xl border-b border-neutral-200/50 sm:border-none min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5 text-blue-600 flex-shrink-0">
            <i className="fas fa-hashtag text-[10px] sm:text-xs md:text-sm"></i>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-neutral-900 tracking-tight truncate">{topic.name}</h3>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-neutral-500 font-medium truncate">
              {filteredRecordings.length} {filteredRecordings.length === 1 ? 'Video' : 'Videos'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddVideo({
            type: 'subject',
            subjectId: selectedSubjectId,
            topicId: topic._id,
          })}
          className="group flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200/60 rounded-lg sm:rounded-xl shadow-sm hover:shadow text-[11px] sm:text-xs font-semibold text-neutral-700 transition-all duration-200 w-full sm:w-auto flex-shrink-0 touch-manipulation"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <i className="fas fa-plus text-[9px] sm:text-[10px]"></i>
          </div>
          <span>Add Video</span>
        </button>
      </div>
    </section>
  );
};

export default TopicSection;
